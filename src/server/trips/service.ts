import { and, asc, desc, eq, gte, like, lte, or, sql } from 'drizzle-orm'
import { db, ensureDbSchema } from '../db'
import {
  bookings,
  reviews,
  tripAddons,
  tripAvailability,
  tripCategories,
  tripFaqs,
  tripItineraryDays,
  trips,
} from '../db/schema'
import { parseJsonArray } from '~/lib/utils'

export type TripFilters = {
  search?: string
  category?: string
  destination?: string
  minPrice?: number
  maxPrice?: number
  minDuration?: number
  maxDuration?: number
  featured?: boolean
  lastMinute?: boolean
  sort?: 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc' | 'popular' | 'newest'
}

export function serializeTrip(trip: typeof trips.$inferSelect, category?: typeof tripCategories.$inferSelect | null) {
  return {
    ...trip,
    galleryUrls: parseJsonArray<string>(trip.galleryUrls),
    highlights: parseJsonArray<string>(trip.highlights),
    includedItems: parseJsonArray<string>(trip.includedItems),
    excludedItems: parseJsonArray<string>(trip.excludedItems),
    packingList: parseJsonArray<string>(trip.packingList),
    category,
  }
}

export async function listTrips(filters: TripFilters = {}) {
  const conditions = [eq(trips.isPublished, true)]

  if (filters.search) {
    const q = `%${filters.search}%`
    conditions.push(or(like(trips.title, q), like(trips.destination, q), like(trips.description, q))!)
  }
  if (filters.category) {
    const [cat] = await db.select().from(tripCategories).where(eq(tripCategories.slug, filters.category)).limit(1)
    if (cat) conditions.push(eq(trips.categoryId, cat.id))
  }
  if (filters.destination) conditions.push(like(trips.destination, `%${filters.destination}%`))
  if (filters.minPrice) conditions.push(gte(trips.price, filters.minPrice))
  if (filters.maxPrice) conditions.push(lte(trips.price, filters.maxPrice))
  if (filters.minDuration) conditions.push(gte(trips.durationDays, filters.minDuration))
  if (filters.maxDuration) conditions.push(lte(trips.durationDays, filters.maxDuration))
  if (filters.featured) conditions.push(eq(trips.isFeatured, true))
  if (filters.lastMinute) conditions.push(eq(trips.isLastMinuteDeal, true))

  let orderBy = desc(trips.createdAt)
  if (filters.sort === 'price_asc') orderBy = asc(trips.price)
  if (filters.sort === 'price_desc') orderBy = desc(trips.price)
  if (filters.sort === 'duration_asc') orderBy = asc(trips.durationDays)
  if (filters.sort === 'duration_desc') orderBy = desc(trips.durationDays)
  if (filters.sort === 'popular') orderBy = desc(trips.bookingCount)
  if (filters.sort === 'newest') orderBy = desc(trips.createdAt)

  const rows = await db
    .select({ trip: trips, category: tripCategories })
    .from(trips)
    .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id))
    .where(and(...conditions))
    .orderBy(orderBy)

  return rows.map((r) => serializeTrip(r.trip, r.category))
}

export async function getTripBySlug(slug: string) {
  ensureDbSchema()
  const [row] = await db
    .select({ trip: trips, category: tripCategories })
    .from(trips)
    .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id))
    .where(eq(trips.slug, slug))
    .limit(1)

  if (!row) return null

  const [itinerary, addons, faqs, availability, tripReviews, activeBookings] = await Promise.all([
    db.select().from(tripItineraryDays).where(eq(tripItineraryDays.tripId, row.trip.id)).orderBy(asc(tripItineraryDays.dayNumber)),
    db.select().from(tripAddons).where(and(eq(tripAddons.tripId, row.trip.id), eq(tripAddons.isActive, true))),
    db.select().from(tripFaqs).where(eq(tripFaqs.tripId, row.trip.id)).orderBy(asc(tripFaqs.sortOrder)),
    db.select().from(tripAvailability).where(and(eq(tripAvailability.tripId, row.trip.id), eq(tripAvailability.isBlocked, false))),
    db.select().from(reviews).where(and(eq(reviews.tripId, row.trip.id), eq(reviews.status, 'approved'))).orderBy(desc(reviews.createdAt)),
    db
      .select({ travelDate: bookings.travelDate })
      .from(bookings)
      .where(and(eq(bookings.tripId, row.trip.id), sql`${bookings.status} != 'cancelled'`)),
  ])

  const takenDates = new Set(activeBookings.map((item) => item.travelDate))
  const avgRating = tripReviews.length
    ? tripReviews.reduce((s, r) => s + r.rating, 0) / tripReviews.length
    : 0

  return {
    ...serializeTrip(row.trip, row.category),
    itinerary,
    addons,
    faqs,
    availability: availability.map((item) => ({
      ...item,
      exclusiveOpen: !takenDates.has(item.date) && item.spotsRemaining > 0,
    })),
    reviews: tripReviews,
    avgRating,
  }
}

export async function getRelatedTrips(tripId: string, categoryId: string | null, limit = 3) {
  const conditions = [eq(trips.isPublished, true), sql`${trips.id} != ${tripId}`]
  if (categoryId) conditions.push(eq(trips.categoryId, categoryId))

  const rows = await db
    .select({ trip: trips, category: tripCategories })
    .from(trips)
    .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id))
    .where(and(...conditions))
    .limit(limit)

  return rows.map((r) => serializeTrip(r.trip, r.category))
}

export async function listCategories() {
  return db.select().from(tripCategories).orderBy(asc(tripCategories.sortOrder))
}

export async function listUpcomingDepartures(limit = 6) {
  const today = new Date().toISOString().slice(0, 10)
  const rows = await db
    .select({
      trip: trips,
      category: tripCategories,
      date: tripAvailability.date,
      spotsRemaining: tripAvailability.spotsRemaining,
    })
    .from(tripAvailability)
    .innerJoin(trips, eq(tripAvailability.tripId, trips.id))
    .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id))
    .where(
      and(
        eq(trips.isPublished, true),
        eq(tripAvailability.isBlocked, false),
        gte(tripAvailability.date, today),
        sql`${tripAvailability.spotsRemaining} > 0`,
      ),
    )
    .orderBy(asc(tripAvailability.date))
    .limit(limit)

  return rows.map((row) => ({
    ...serializeTrip(row.trip, row.category),
    nextDate: row.date,
    spotsRemaining: row.spotsRemaining,
  }))
}

export async function getTripsByIds(ids: string[]) {
  if (ids.length === 0) return []
  const rows = await db
    .select({ trip: trips, category: tripCategories })
    .from(trips)
    .leftJoin(tripCategories, eq(trips.categoryId, tripCategories.id))
    .where(sql`${trips.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`)

  return rows.map((r) => serializeTrip(r.trip, r.category))
}
