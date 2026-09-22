import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db'
import { bookings, siteSettings, trips } from '../db/schema'
import { sendTripDayReminderEmail } from '../email/notifications'
import { getSmsConfig, sendTripDayReminderSms } from './service'

const TZ = 'Africa/Addis_Ababa'

export function ethiopiaDateOffset(days: number) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ })
  const [year, month, day] = today.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return next.toISOString().slice(0, 10)
}

export async function sendDueTripReminders() {
  const tomorrow = ethiopiaDateOffset(1)
  const [settings] = await db.select().from(siteSettings).limit(1)
  const sms = await getSmsConfig()

  const rows = await db
    .select({ booking: bookings, trip: trips })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(
      and(
        eq(bookings.travelDate, tomorrow),
        inArray(bookings.status, ['pending', 'confirmed']),
        isNull(bookings.reminderSentAt),
      ),
    )

  let sent = 0
  let failed = 0

  for (const row of rows) {
    const smsResult = sms.enabled
      ? await sendTripDayReminderSms({
          phone: row.booking.phone,
          tripTitle: row.trip.title,
          travelDate: row.booking.travelDate,
          referenceNumber: row.booking.referenceNumber,
          businessName: settings?.businessName || undefined,
        })
      : { ok: false as const, error: 'SMS off' }

    const emailResult = await sendTripDayReminderEmail({
      email: row.booking.email,
      customerName: row.booking.customerName,
      tripTitle: row.trip.title,
      travelDate: row.booking.travelDate,
      referenceNumber: row.booking.referenceNumber,
    })

    if (smsResult.ok || emailResult.ok) {
      await db.update(bookings).set({ reminderSentAt: new Date() }).where(eq(bookings.id, row.booking.id))
      sent += 1
    } else {
      failed += 1
    }
  }

  return { tomorrow, due: rows.length, sent, failed, smsEnabled: sms.enabled }
}

let started = false

export function startTripReminderScheduler() {
  if (started) return
  started = true
  const hour = 60 * 60 * 1000
  const tick = () => {
    void sendDueTripReminders().catch((error) => console.error('[reminders]', error))
  }
  setTimeout(tick, 15_000)
  setInterval(tick, hour)
}
