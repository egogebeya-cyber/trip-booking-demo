import { and, desc, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db, ensureDbSchema } from '../db'
import {
  bookings,
  promoCodes,
  siteSettings,
  tripAddons,
  tripAvailability,
  trips,
} from '../db/schema'
import {
  sendBookingConfirmationToCustomer,
  sendBookingNotificationToAdmin,
} from '../email/notifications'
import { getGroupDiscount } from '~/lib/group-discount'
import { parsePartyType, quoteParty } from '~/lib/party-package'
import { parseEthiopianPhone } from '~/lib/phone'
import { parseJsonArray } from '~/lib/utils'
import { checkEmailAddress } from '../email/validate-address'

let bookingCounter = 0

function generateReference() {
  bookingCounter++
  const year = new Date().getFullYear()
  const num = String(Date.now()).slice(-4) + String(bookingCounter).padStart(2, '0')
  return `TRP-${year}-${num}`
}

export async function createBooking(data: {
  tripId: string
  userId?: string | null
  customerName: string
  email: string
  phone: string
  travelDate: string
  guestCount: number
  partyType?: string
  notes?: string
  addonIds?: string[]
  promoCode?: string
  paymentType: 'full' | 'deposit'
  paymentMethod: string
  acceptPolicy: boolean
}) {
  if (!data.acceptPolicy) return { ok: false as const, error: 'POLICY_REQUIRED' }

  const phone = parseEthiopianPhone(data.phone)
  if (!phone) return { ok: false as const, error: 'INVALID_PHONE' }
  const emailCheck = await checkEmailAddress(data.email)
  if (!emailCheck.ok) return { ok: false as const, error: emailCheck.error }

  try {
    ensureDbSchema()
    const [trip] = await db.select().from(trips).where(eq(trips.id, data.tripId)).limit(1)
    if (!trip) return { ok: false as const, error: 'TRIP_NOT_FOUND' }

  const [avail] = await db
    .select()
    .from(tripAvailability)
    .where(
      and(
        eq(tripAvailability.tripId, data.tripId),
        eq(tripAvailability.date, data.travelDate),
        eq(tripAvailability.isBlocked, false),
      ),
    )
    .limit(1)

  if (!avail || avail.spotsRemaining < data.guestCount) {
    return { ok: false as const, error: 'NO_AVAILABILITY' }
  }

  const partyType = parsePartyType(data.partyType)
  if (partyType !== 'shared') {
    if (partyType === 'private' && trip.offersPrivatePackage === false) {
      return { ok: false as const, error: 'PACKAGE_UNAVAILABLE' }
    }
    if (partyType === 'family' && trip.offersFamilyTrip === false) {
      return { ok: false as const, error: 'PACKAGE_UNAVAILABLE' }
    }
    const [existing] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.tripId, data.tripId),
          eq(bookings.travelDate, data.travelDate),
          sql`${bookings.status} != 'cancelled'`,
        ),
      )
      .limit(1)
    if (existing) return { ok: false as const, error: 'EXCLUSIVE_UNAVAILABLE' }
  }

  let addonTotal = 0
  const selectedAddons: (typeof tripAddons.$inferSelect)[] = []
  if (data.addonIds?.length) {
    for (const id of data.addonIds) {
      const [addon] = await db.select().from(tripAddons).where(eq(tripAddons.id, id)).limit(1)
      if (addon) {
        selectedAddons.push(addon)
        addonTotal += addon.price
      }
    }
  }

  const [settings] = await db.select().from(siteSettings).limit(1)
  const quote = quoteParty({
    partyType,
    guestCount: data.guestCount,
    unitPrice: avail.priceOverride ?? trip.price,
    addonTotal,
    trip,
    settings,
  })
  if (data.guestCount > quote.maxGuests) {
    return { ok: false as const, error: partyType === 'family' ? 'FAMILY_TOO_LARGE' : 'TOO_MANY_GUESTS' }
  }
  const subtotal = quote.subtotal
  const groupDiscount = quote.applyGroupDiscount
    ? getGroupDiscount(subtotal, data.guestCount, settings)
    : { amount: 0, eligible: false, percent: 0, minGuests: 0 }

  let promoDiscount = 0
  let promoCodeId: string | null = null

  if (data.promoCode) {
    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(and(eq(promoCodes.code, data.promoCode.toUpperCase()), eq(promoCodes.isActive, true)))
      .limit(1)

    if (promo && (!promo.maxUses || promo.usedCount < promo.maxUses)) {
      promoCodeId = promo.id
      const afterGroup = Math.max(0, subtotal - groupDiscount.amount)
      promoDiscount =
        promo.discountType === 'percent'
          ? Math.round(afterGroup * (promo.discountValue / 100))
          : promo.discountValue
      await db
        .update(promoCodes)
        .set({ usedCount: promo.usedCount + 1 })
        .where(eq(promoCodes.id, promo.id))
    }
  }

  const discountAmount = groupDiscount.amount + promoDiscount
  const totalPrice = Math.max(0, subtotal - discountAmount)
  const depositPercent = trip.depositPercent ?? 30
  const depositAmount = data.paymentType === 'deposit' ? Math.round(totalPrice * (depositPercent / 100)) : totalPrice
  const remainingAmount = totalPrice - depositAmount

  const referenceNumber = generateReference()
  const bookingId = nanoid()

  await db.insert(bookings).values({
    id: bookingId,
    referenceNumber,
    tripId: data.tripId,
    userId: data.userId ?? null,
    customerName: data.customerName,
    email: emailCheck.email,
    phone,
    travelDate: data.travelDate,
    guestCount: data.guestCount,
    partyType,
    notes: data.notes ?? null,
    addonIds: JSON.stringify(data.addonIds ?? []),
    promoCodeId,
    discountAmount,
    totalPrice,
    depositAmount,
    remainingAmount,
    paymentType: data.paymentType,
    paymentMethod: data.paymentMethod,
    paymentStatus: 'pending',
    status: 'pending',
  })

  await db
    .update(tripAvailability)
    .set({ spotsRemaining: quote.exclusive ? 0 : avail.spotsRemaining - data.guestCount })
    .where(eq(tripAvailability.id, avail.id))

  await db
    .update(trips)
    .set({ bookingCount: sql`${trips.bookingCount} + 1` })
    .where(eq(trips.id, data.tripId))

  try {
    if (settings) {
      await sendBookingNotificationToAdmin({
        adminEmail: settings.email,
        referenceNumber,
        tripTitle: trip.title,
        customerName: data.customerName,
      email: emailCheck.email,
        travelDate: data.travelDate,
        guestCount: data.guestCount,
        partyType,
        totalPrice,
      })
    }

    await sendBookingConfirmationToCustomer({
      email: emailCheck.email,
      referenceNumber,
      tripTitle: trip.title,
      travelDate: data.travelDate,
      totalPrice,
    })
  } catch (notifyError) {
    console.error('booking notifications failed', notifyError)
  }

  return {
    ok: true as const,
    booking: { id: bookingId, referenceNumber, totalPrice, depositAmount, remainingAmount },
  }
  } catch (error) {
    console.error('createBooking failed', error)
    return { ok: false as const, error: 'BOOKING_FAILED' }
  }
}

export async function getBookingByReference(referenceNumber: string) {
  const [row] = await db
    .select({ booking: bookings, trip: trips })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(bookings.referenceNumber, referenceNumber))
    .limit(1)

  if (!row) return null
  return {
    ...row.booking,
    trip: row.trip,
    addonIds: parseJsonArray<string>(row.booking.addonIds),
  }
}

export async function uploadPaymentProof(referenceNumber: string, dataUrl: string) {
  const booking = await getBookingByReference(referenceNumber)
  if (!booking) return { ok: false as const, error: 'NOT_FOUND' }
  if (booking.paymentMethod !== 'telebirr' && booking.paymentMethod !== 'bank_transfer') {
    return { ok: false as const, error: 'NOT_REQUIRED' }
  }

  const { saveUploadedImageDataUrl } = await import('../uploads/save-image')
  const { url } = await saveUploadedImageDataUrl(dataUrl, 'proof-')

  await db
    .update(bookings)
    .set({ paymentProofUrl: url, paymentStatus: 'proof_submitted' })
    .where(eq(bookings.id, booking.id))

  return { ok: true as const, url }
}

export async function listUserBookings(userId: string) {
  const rows = await db
    .select({ booking: bookings, trip: trips })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt))

  return rows.map((r) => ({ ...r.booking, trip: r.trip }))
}

export async function requestCancellation(bookingId: string, userId: string) {
  await db
    .update(bookings)
    .set({ cancellationRequestedAt: new Date(), status: 'pending' })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
  return { ok: true }
}

export async function requestModification(bookingId: string, userId: string, notes: string) {
  await db
    .update(bookings)
    .set({ modificationNotes: notes })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
  return { ok: true }
}

export async function joinWaitingList(data: {
  tripId: string
  travelDate: string
  name: string
  email: string
  phone?: string
  guestCount: number
}) {
  const emailCheck = await checkEmailAddress(data.email)
  if (!emailCheck.ok) return { ok: false as const, error: emailCheck.error }
  const { waitingList } = await import('../db/schema')
  const phone = data.phone?.trim() ? parseEthiopianPhone(data.phone) : null
  if (data.phone?.trim() && !phone) return { ok: false as const, error: 'INVALID_PHONE' }
  await db.insert(waitingList).values({ id: nanoid(), ...data, email: emailCheck.email, phone })
  return { ok: true }
}

export async function validatePromoCode(code: string) {
  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(and(eq(promoCodes.code, code.toUpperCase()), eq(promoCodes.isActive, true)))
    .limit(1)

  if (!promo) return { ok: false as const, error: 'INVALID_CODE' }
  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return { ok: false as const, error: 'EXPIRED' }
  }
  return { ok: true as const, promo }
}
