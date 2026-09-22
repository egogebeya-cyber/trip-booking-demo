import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '../db'
import { getEmailConfig, publicEmailStatus, sendTestEmail } from '../email/transport'
import { sendAnnouncementEmail, sendPaymentReceivedToCustomer } from '../email/notifications'
import {
  blogPosts,
  bookings,
  contactMessages,
  legalPages,
  newsletterSubscribers,
  promoCodes,
  reviews,
  siteFaqs,
  siteSettings,
  teamMembers,
  testimonials,
  tripAddons,
  tripAvailability,
  tripCategories,
  tripFaqs,
  tripItineraryDays,
  trips,
  waitingList,
  wishlist,
  users,
} from '../db/schema'
import { slugify } from '~/lib/utils'
import { getTripKind, type TripKind } from '~/lib/trip-type'
import { countOpenChats } from '../chat/service'

function num(value: number | string | null | undefined) {
  return Number(value) || 0
}

const TRIP_KINDS: TripKind[] = ['1-day', '2-day', 'international', 'multi-day']

export async function getDashboardStats() {
  const today = new Date().toISOString().slice(0, 10)

  const [bookingStats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`sum(case when ${bookings.status} = 'pending' then 1 else 0 end)`,
      paid: sql<number>`sum(case when ${bookings.paymentStatus} = 'paid' then 1 else 0 end)`,
      unpaid: sql<number>`sum(case when ${bookings.paymentStatus} != 'paid' then 1 else 0 end)`,
      revenue: sql<number>`coalesce(sum(case when ${bookings.paymentStatus} = 'paid' then ${bookings.totalPrice} else 0 end), 0)`,
    })
    .from(bookings)

  const [pendingReviews] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(eq(reviews.status, 'pending'))

  const [tripCount] = await db.select({ count: sql<number>`count(*)` }).from(trips)
  const [messageCount] = await db.select({ count: sql<number>`count(*)` }).from(contactMessages)
  const [waitlistCount] = await db.select({ count: sql<number>`count(*)` }).from(waitingList)
  const openChats = await countOpenChats()

  const [lowSpots, recentBookings, typeRows] = await Promise.all([
    db
      .select({
        title: trips.title,
        slug: trips.slug,
        date: tripAvailability.date,
        spotsRemaining: tripAvailability.spotsRemaining,
      })
      .from(tripAvailability)
      .innerJoin(trips, eq(tripAvailability.tripId, trips.id))
      .where(
        and(
          eq(tripAvailability.isBlocked, false),
          gte(tripAvailability.date, today),
          lte(tripAvailability.spotsRemaining, 3),
          sql`${tripAvailability.spotsRemaining} > 0`,
        ),
      )
      .orderBy(asc(tripAvailability.spotsRemaining), asc(tripAvailability.date))
      .limit(8),
    db
      .select({
        id: bookings.id,
        referenceNumber: bookings.referenceNumber,
        customerName: bookings.customerName,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        paymentType: bookings.paymentType,
        totalPrice: bookings.totalPrice,
        travelDate: bookings.travelDate,
        tripTitle: trips.title,
        durationDays: trips.durationDays,
        categorySlug: tripCategories.slug,
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id))
      .orderBy(desc(bookings.createdAt))
      .limit(8),
    db
      .select({
        durationDays: trips.durationDays,
        categorySlug: tripCategories.slug,
        paymentStatus: bookings.paymentStatus,
        totalPrice: bookings.totalPrice,
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id)),
  ])

  const byKind = Object.fromEntries(
    TRIP_KINDS.map((kind) => [kind, { kind, count: 0, paid: 0, paidTotal: 0 }]),
  ) as Record<TripKind, { kind: TripKind; count: number; paid: number; paidTotal: number }>

  for (const row of typeRows) {
    const kind = getTripKind({ durationDays: row.durationDays, categorySlug: row.categorySlug })
    byKind[kind].count += 1
    if (row.paymentStatus === 'paid') {
      byKind[kind].paid += 1
      byKind[kind].paidTotal += row.totalPrice
    }
  }

  return {
    totalBookings: num(bookingStats?.total),
    pendingBookings: num(bookingStats?.pending),
    paidBookings: num(bookingStats?.paid),
    unpaidBookings: num(bookingStats?.unpaid),
    revenue: num(bookingStats?.revenue),
    pendingReviews: num(pendingReviews?.count),
    tripCount: num(tripCount?.count),
    messageCount: num(messageCount?.count),
    waitlistCount: num(waitlistCount?.count),
    openChats,
    lowSpots,
    recentBookings,
    byKind: TRIP_KINDS.map((kind) => byKind[kind]),
  }
}

export async function listDepartures() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Addis_Ababa' })
  const [year, month, day] = today.split('-').map(Number)
  const pastFrom = new Date(Date.UTC(year, month - 1, day - 180)).toISOString().slice(0, 10)

  return db
    .select({
      date: tripAvailability.date,
      spotsRemaining: tripAvailability.spotsRemaining,
      isBlocked: tripAvailability.isBlocked,
      tripTitle: trips.title,
      tripSlug: trips.slug,
      durationDays: trips.durationDays,
      categorySlug: tripCategories.slug,
    })
    .from(tripAvailability)
    .innerJoin(trips, eq(tripAvailability.tripId, trips.id))
    .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id))
    .where(gte(tripAvailability.date, pastFrom))
    .orderBy(asc(tripAvailability.date), asc(trips.title))
}

export async function listAllBookings() {
  return db
    .select({ booking: bookings, trip: trips, category: tripCategories })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id))
    .orderBy(desc(bookings.createdAt))
}

export async function updateBookingStatus(
  id: string,
  status: string,
  paymentStatus?: string,
  options?: { sendEmail?: boolean },
) {
  const updates: Record<string, unknown> = { status }
  if (paymentStatus) updates.paymentStatus = paymentStatus
  await db.update(bookings).set(updates).where(eq(bookings.id, id))

  if (!options?.sendEmail) return { emailSent: false as const }

  const [row] = await db
    .select({ booking: bookings, trip: trips })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(bookings.id, id))
    .limit(1)

  if (!row?.booking.email) return { emailSent: false as const, emailError: 'No customer email' }

  const result = await sendPaymentReceivedToCustomer({
    email: row.booking.email,
    customerName: row.booking.customerName,
    referenceNumber: row.booking.referenceNumber,
    tripTitle: row.trip.title,
    travelDate: row.booking.travelDate,
    totalPrice: row.booking.totalPrice,
  })

  return {
    emailSent: result.ok,
    emailError: result.ok ? undefined : result.error,
  }
}

export async function listAllTrips() {
  return db
    .select({ trip: trips, category: tripCategories })
    .from(trips)
    .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id))
    .orderBy(desc(trips.createdAt))
}

export async function getTripForAdmin(id: string) {
  const [trip] = await db.select().from(trips).where(eq(trips.id, id)).limit(1)
  if (!trip) return null
  const [itinerary, addons, faqs, availability] = await Promise.all([
    db.select().from(tripItineraryDays).where(eq(tripItineraryDays.tripId, id)),
    db.select().from(tripAddons).where(eq(tripAddons.tripId, id)),
    db.select().from(tripFaqs).where(eq(tripFaqs.tripId, id)),
    db.select().from(tripAvailability).where(eq(tripAvailability.tripId, id)),
  ])
  return { trip, itinerary, addons, faqs, availability }
}

export async function saveTrip(data: Record<string, unknown>, id?: string) {
  const tripId = id ?? nanoid()
  let slug = ((data.slug as string) || slugify(String(data.title ?? ''))).trim()
  if (!slug) slug = `trip-${tripId.slice(0, 8)}`

  const [slugOwner] = await db.select({ id: trips.id }).from(trips).where(eq(trips.slug, slug)).limit(1)
  if (slugOwner && slugOwner.id !== tripId) {
    slug = `${slug}-${tripId.slice(0, 6)}`
  }

  const payload = {
    id: tripId,
    categoryId: (data.categoryId as string) || null,
    title: data.title as string,
    titleAm: (data.titleAm as string) || null,
    slug,
    description: (data.description as string) || '',
    descriptionAm: (data.descriptionAm as string) || null,
    destination: data.destination as string,
    price: Number(data.price),
    priceUsd: data.priceUsd ? Number(data.priceUsd) : null,
    durationDays: Number(data.durationDays) || 1,
    maxGuests: Number(data.maxGuests) || 20,
    offersPrivatePackage: data.offersPrivatePackage === undefined ? true : Boolean(data.offersPrivatePackage),
    offersFamilyTrip: data.offersFamilyTrip === undefined ? true : Boolean(data.offersFamilyTrip),
    privatePackageGuests: Number(data.privatePackageGuests) || 15,
    privatePackagePrice: data.privatePackagePrice ? Number(data.privatePackagePrice) : null,
    familyMaxGuests: Number(data.familyMaxGuests) || 8,
    coverImageUrl: (data.coverImageUrl as string) || '',
    galleryUrls: JSON.stringify(data.galleryUrls ?? []),
    highlights: JSON.stringify(data.highlights ?? []),
    includedItems: JSON.stringify(data.includedItems ?? []),
    excludedItems: JSON.stringify(data.excludedItems ?? []),
    difficulty: (data.difficulty as string) || 'easy',
    fitnessLevel: (data.fitnessLevel as string) || null,
    minAge: data.minAge ? Number(data.minAge) : null,
    bestSeason: (data.bestSeason as string) || null,
    packingList: JSON.stringify(data.packingList ?? []),
    videoUrl: (data.videoUrl as string) || null,
    mapEmbedUrl: (data.mapEmbedUrl as string) || null,
    cancellationPolicyText: (data.cancellationPolicyText as string) || null,
    depositPercent: Number(data.depositPercent) || 30,
    isFeatured: Boolean(data.isFeatured),
    isPopular: Boolean(data.isPopular),
    isLastMinuteDeal: Boolean(data.isLastMinuteDeal),
    isPublished: Boolean(data.isPublished),
    updatedAt: new Date(),
  }

  if (id) {
    await db.update(trips).set(payload).where(eq(trips.id, id))
  } else {
    await db.insert(trips).values(payload)
  }
  return { id: tripId, slug, title: payload.title }
}

export async function deleteTrip(id: string) {
  await db.delete(reviews).where(eq(reviews.tripId, id))
  await db.delete(bookings).where(eq(bookings.tripId, id))
  await db.delete(wishlist).where(eq(wishlist.tripId, id))
  await db.delete(waitingList).where(eq(waitingList.tripId, id))
  await db.delete(trips).where(eq(trips.id, id))
}

const SETTINGS_KEYS = [
  'businessName',
  'email',
  'phone',
  'address',
  'facebookUrl',
  'instagramUrl',
  'tiktokUrl',
  'whatsappNumber',
  'telegramUsername',
  'aboutText',
  'heroTitle',
  'heroSubtitle',
  'heroVideoUrl',
  'telebirrNumber',
  'bankName',
  'bankAccount',
  'telebirrQrUrl',
  'bankQrUrl',
  'analyticsId',
  'defaultDepositPercent',
  'groupDiscountSmallMinGuests',
  'groupDiscountSmallPercent',
  'groupDiscountMinGuests',
  'groupDiscountPercent',
  'privatePackageGuests',
  'familyMaxGuests',
  'homepageJson',
  'smtpHost',
  'smtpPort',
  'smtpUser',
  'smtpPass',
  'smtpFrom',
  'telegramBotToken',
  'smsEnabled',
  'smsApiToken',
  'smsSenderName',
  'smsIdentifier',
] as const

export async function updateSiteSettings(data: Partial<typeof siteSettings.$inferInsert>) {
  const payload: Record<string, unknown> = {}
  for (const key of SETTINGS_KEYS) {
    if (data[key] === undefined) continue
    if (key === 'smtpPass' && !String(data[key] ?? '').trim()) continue
    if (key === 'telegramBotToken' && !String(data[key] ?? '').trim()) continue
    if (key === 'smsApiToken' && !String(data[key] ?? '').trim()) continue
    if (key === 'smsEnabled') {
      payload[key] = data[key] === true || data[key] === 1 || data[key] === 'true'
      continue
    }
    payload[key] = data[key]
  }
  if (Object.keys(payload).length === 0) return
  await db.update(siteSettings).set(payload).where(eq(siteSettings.id, 'default'))
  if (typeof data.telegramBotToken === 'string' && data.telegramBotToken.trim()) {
    const { syncTelegramBot } = await import('../support/channels')
    await syncTelegramBot(data.telegramBotToken)
  }
}

export async function getEmailSettings() {
  const [settings] = await db.select().from(siteSettings).limit(1)
  const status = publicEmailStatus(await getEmailConfig())
  return {
    ...status,
    smtpHost: settings?.smtpHost || status.host || 'smtp.gmail.com',
    smtpPort: String(settings?.smtpPort || status.port || 587),
    smtpUser: settings?.smtpUser || status.user || '',
    smtpFrom: settings?.smtpFrom || status.from || '',
    testTo: settings?.email ?? '',
    hasTelegramBot: Boolean(settings?.telegramBotToken),
    telegramBotUsername: settings?.telegramBotUsername ?? '',
    smsEnabled: Boolean(settings?.smsEnabled),
    hasSmsToken: Boolean(settings?.smsApiToken || process.env.SMS_API_TOKEN || process.env.AFROMESSAGE_TOKEN),
    smsSenderName: settings?.smsSenderName ?? '',
    smsIdentifier: settings?.smsIdentifier ?? '',
  }
}

export async function sendAdminTestEmail(to?: string) {
  const [settings] = await db.select().from(siteSettings).limit(1)
  const target = to?.trim() || settings?.email
  if (!target) return { ok: false as const, error: 'Add a business email first' }
  return sendTestEmail(target)
}

export async function sendAdminTestSms(phone?: string) {
  const [settings] = await db.select().from(siteSettings).limit(1)
  const target = phone?.trim() || settings?.phone || ''
  const { sendSms, tripReminderText } = await import('../sms/service')
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const date = tomorrow.toISOString().slice(0, 10)
  return sendSms(
    target,
    tripReminderText({
      tripTitle: 'Test trip',
      travelDate: date,
      referenceNumber: 'TEST',
      businessName: settings?.businessName || 'Trip Explorer',
    }),
  )
}

export async function runTripRemindersNow() {
  const { sendDueTripReminders } = await import('../sms/reminders')
  return sendDueTripReminders()
}

export async function listPromoCodes() {
  return db.select().from(promoCodes).orderBy(desc(promoCodes.code))
}

export async function savePromoCode(data: {
  id?: string
  code: string
  discountType: string
  discountValue: number
  maxUses?: number
  isActive: boolean
}) {
  if (data.id) {
    await db.update(promoCodes).set(data).where(eq(promoCodes.id, data.id))
    return data.id
  }
  const id = nanoid()
  await db.insert(promoCodes).values({ id, ...data, usedCount: 0 })
  return id
}

export async function listPendingReviews() {
  return db.select().from(reviews).where(eq(reviews.status, 'pending')).orderBy(desc(reviews.createdAt))
}

export async function updateReviewStatus(id: string, status: string) {
  await db.update(reviews).set({ status }).where(eq(reviews.id, id))
}

export async function listWaitingList() {
  return db
    .select({ entry: waitingList, trip: trips })
    .from(waitingList)
    .innerJoin(trips, eq(waitingList.tripId, trips.id))
    .orderBy(desc(waitingList.createdAt))
}

export async function listNewsletterSubscribers() {
  return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt))
}

export async function collectAnnouncementEmails(includeAccounts: boolean) {
  const emails = new Set<string>()
  const subscribers = await db.select({ email: newsletterSubscribers.email }).from(newsletterSubscribers)
  for (const row of subscribers) {
    if (row.email) emails.add(row.email.trim().toLowerCase())
  }
  if (includeAccounts) {
    const accounts = await db
      .select({ email: users.email, verified: users.emailVerified })
      .from(users)
      .where(eq(users.role, 'customer'))
    for (const row of accounts) {
      if (row.email && row.verified !== false) emails.add(row.email.trim().toLowerCase())
    }
  }
  return [...emails]
}

export async function sendAnnouncement(data: {
  subject: string
  message: string
  includeAccounts?: boolean
  linkUrl?: string
  linkLabel?: string
}) {
  const subject = data.subject.trim()
  const message = data.message.trim()
  if (!subject || !message) return { ok: false as const, error: 'Write a subject and message' }

  const emails = await collectAnnouncementEmails(Boolean(data.includeAccounts))
  if (emails.length === 0) return { ok: false as const, error: 'No subscribers yet' }

  let sent = 0
  let failed = 0
  for (const to of emails) {
    const result = await sendAnnouncementEmail({
      to,
      subject,
      message,
      linkUrl: data.linkUrl,
      linkLabel: data.linkLabel,
    })
    if (result.ok) sent += 1
    else failed += 1
  }
  return { ok: true as const, sent, failed, total: emails.length }
}

export async function listContactMessages() {
  const { pullTelegramMessages } = await import('../support/channels')
  await pullTelegramMessages().catch(() => null)
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt))
}

export async function saveCategory(data: { id?: string; name: string; slug: string; icon?: string; sortOrder?: number }) {
  const payload = {
    name: data.name,
    slug: data.slug,
    icon: data.icon,
    sortOrder: data.sortOrder ?? 0,
  }
  if (data.id) {
    await db.update(tripCategories).set(payload).where(eq(tripCategories.id, data.id))
    return data.id
  }
  const id = nanoid()
  await db.insert(tripCategories).values({ id, ...payload })
  return id
}

export async function deleteCategory(id: string) {
  await db.update(trips).set({ categoryId: null }).where(eq(trips.categoryId, id))
  await db.delete(tripCategories).where(eq(tripCategories.id, id))
}

export async function listCategoriesAdmin() {
  const categories = await db.select().from(tripCategories).orderBy(tripCategories.sortOrder)
  const tripRows = await db.select({ categoryId: trips.categoryId }).from(trips)
  return categories.map((cat) => ({
    ...cat,
    tripCount: tripRows.filter((row) => row.categoryId === cat.id).length,
  }))
}

export async function saveBlogPost(data: {
  id?: string
  title: string
  slug: string
  excerpt?: string
  body?: string
  coverImageUrl?: string
  videoUrl?: string
  isPublished: boolean
}) {
  const payload = {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    body: data.body ?? '',
    coverImageUrl: data.coverImageUrl,
    videoUrl: data.videoUrl,
    isPublished: data.isPublished,
    publishedAt: data.isPublished ? new Date() : null,
  }
  if (data.id) {
    await db.update(blogPosts).set(payload).where(eq(blogPosts.id, data.id))
    return data.id
  }
  const id = nanoid()
  await db.insert(blogPosts).values({ id, ...payload })
  return id
}

export async function listAllBlogPosts() {
  return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt))
}

export async function saveSiteFaq(data: { id?: string; question: string; answer: string; sortOrder?: number; isPublished?: boolean }) {
  if (data.id) {
    await db.update(siteFaqs).set(data).where(eq(siteFaqs.id, data.id))
    return data.id
  }
  const id = nanoid()
  await db.insert(siteFaqs).values({ id, ...data, sortOrder: data.sortOrder ?? 0, isPublished: data.isPublished ?? true })
  return id
}

export async function saveLegalPage(slug: string, title: string, body: string) {
  const [existing] = await db.select().from(legalPages).where(eq(legalPages.slug, slug)).limit(1)
  if (existing) {
    await db.update(legalPages).set({ title, body, updatedAt: new Date() }).where(eq(legalPages.slug, slug))
  } else {
    await db.insert(legalPages).values({ id: nanoid(), slug, title, body })
  }
}

export async function listAllLegalPages() {
  return db.select().from(legalPages)
}

export async function saveTestimonial(data: {
  id?: string
  customerName: string
  tripName?: string
  quote: string
  rating: number
  photoUrl?: string
  isFeatured: boolean
}) {
  const payload = {
    customerName: data.customerName,
    tripName: data.tripName,
    quote: data.quote,
    rating: data.rating,
    photoUrl: data.photoUrl,
    isFeatured: data.isFeatured,
  }
  if (data.id) {
    await db.update(testimonials).set(payload).where(eq(testimonials.id, data.id))
    return data.id
  }
  const id = nanoid()
  await db.insert(testimonials).values({ id, ...payload })
  return id
}

export async function deleteTestimonial(id: string) {
  await db.delete(testimonials).where(eq(testimonials.id, id))
}

export async function listAllTestimonials() {
  return db.select().from(testimonials)
}

export async function listAllSiteFaqs() {
  return db.select().from(siteFaqs).orderBy(siteFaqs.sortOrder)
}

export async function listTeamMembersAdmin() {
  return db.select().from(teamMembers).orderBy(teamMembers.sortOrder)
}

export async function saveTeamMember(data: {
  id?: string
  name: string
  role: string
  bio?: string
  photoUrl?: string
  sortOrder?: number
}) {
  if (data.id) {
    await db.update(teamMembers).set(data).where(eq(teamMembers.id, data.id))
    return data.id
  }
  const id = nanoid()
  await db.insert(teamMembers).values({
    id,
    name: data.name,
    role: data.role,
    bio: data.bio ?? null,
    photoUrl: data.photoUrl ?? null,
    sortOrder: data.sortOrder ?? 0,
  })
  return id
}

export async function deleteTeamMember(id: string) {
  await db.delete(teamMembers).where(eq(teamMembers.id, id))
}

export async function saveAvailability(tripId: string, dates: { date: string; spotsRemaining: number; priceOverride?: number }[]) {
  await db.delete(tripAvailability).where(eq(tripAvailability.tripId, tripId))
  for (const d of dates) {
    await db.insert(tripAvailability).values({
      id: nanoid(),
      tripId,
      date: d.date,
      spotsRemaining: d.spotsRemaining,
      priceOverride: d.priceOverride ?? null,
    })
  }
}

export async function saveItinerary(tripId: string, days: { dayNumber: number; title: string; description: string }[]) {
  await db.delete(tripItineraryDays).where(eq(tripItineraryDays.tripId, tripId))
  for (const day of days) {
    await db.insert(tripItineraryDays).values({ id: nanoid(), tripId, ...day })
  }
}

export async function saveAddons(tripId: string, addons: { name: string; description?: string; price: number; isActive?: boolean }[]) {
  await db.delete(tripAddons).where(eq(tripAddons.tripId, tripId))
  for (const addon of addons) {
    await db.insert(tripAddons).values({
      id: nanoid(),
      tripId,
      name: addon.name,
      description: addon.description ?? null,
      price: addon.price,
      isActive: addon.isActive ?? true,
    })
  }
}

export async function saveTripFaqs(tripId: string, faqs: { question: string; answer: string; sortOrder?: number }[]) {
  await db.delete(tripFaqs).where(eq(tripFaqs.tripId, tripId))
  for (const faq of faqs) {
    await db.insert(tripFaqs).values({
      id: nanoid(),
      tripId,
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder ?? 0,
    })
  }
}
