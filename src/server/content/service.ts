import { asc, desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db, ensureDbSchema } from '../db'
import {
  blogPosts,
  contactMessages,
  legalPages,
  newsletterSubscribers,
  reviews,
  siteFaqs,
  siteSettings,
  teamMembers,
  testimonials,
  wishlist,
} from '../db/schema'
import { sendContactNotification, sendNewsletterSignupToAdmin } from '../email/notifications'
import { checkEmailAddress } from '../email/validate-address'

export async function getSiteSettings() {
  ensureDbSchema()
  const [settings] = await db.select().from(siteSettings).limit(1)
  if (!settings) return null
  const {
    smtpPass: _pass,
    smtpHost: _host,
    smtpPort: _port,
    smtpUser: _user,
    smtpFrom: _from,
    telegramBotToken: _bot,
    telegramUpdateOffset: _offset,
    smsApiToken: _sms,
    ...safe
  } = settings
  return safe
}

export async function submitContact(data: {
  name: string
  email: string
  subject: string
  message: string
  type?: string
}) {
  const emailCheck = await checkEmailAddress(data.email)
  if (!emailCheck.ok) return { ok: false as const, error: emailCheck.error }

  await db.insert(contactMessages).values({
    id: nanoid(),
    ...data,
    email: emailCheck.email,
    type: data.type ?? 'general',
  })

  const settings = await getSiteSettings()
  if (settings) {
    await sendContactNotification({
      adminEmail: settings.email,
      name: data.name,
      email: emailCheck.email,
      subject: data.subject,
      message: data.message,
    })
  }
  return { ok: true }
}

export async function subscribeNewsletter(email: string) {
  const emailCheck = await checkEmailAddress(email)
  if (!emailCheck.ok) return { ok: false as const, error: emailCheck.error }
  try {
    await db.insert(newsletterSubscribers).values({ id: nanoid(), email: emailCheck.email })
  } catch {
    return { ok: true }
  }
  const settings = await db.select().from(siteSettings).limit(1)
  if (settings[0]?.email) {
    await sendNewsletterSignupToAdmin({ adminEmail: settings[0].email, email: emailCheck.email })
  }
  return { ok: true }
}

export async function listBlogPosts() {
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true))
    .orderBy(desc(blogPosts.publishedAt))
}

export async function getBlogPost(slug: string) {
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1)
  return post ?? null
}

export async function listSiteFaqs() {
  return db
    .select()
    .from(siteFaqs)
    .where(eq(siteFaqs.isPublished, true))
    .orderBy(asc(siteFaqs.sortOrder))
}

export async function getLegalPage(slug: string) {
  const [page] = await db.select().from(legalPages).where(eq(legalPages.slug, slug)).limit(1)
  return page ?? null
}

export async function listTestimonials() {
  return db.select().from(testimonials).where(eq(testimonials.isFeatured, true))
}

export async function submitPublicTestimonial(data: {
  customerName: string
  tripName?: string
  quote: string
  rating: number
  photoDataUrl?: string
}) {
  const customerName = data.customerName.trim().slice(0, 80)
  const quote = data.quote.trim().slice(0, 800)
  const tripName = data.tripName?.trim().slice(0, 80) || null
  const rating = Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5)))
  if (!customerName || !quote) throw new Error('INVALID')

  let photoUrl: string | undefined
  if (data.photoDataUrl) {
    const { saveUploadedImageDataUrl } = await import('../uploads/save-image')
    const saved = await saveUploadedImageDataUrl(data.photoDataUrl, 'testimonial-')
    photoUrl = saved.url
  }

  await db.insert(testimonials).values({
    id: nanoid(),
    customerName,
    tripName,
    quote,
    rating,
    photoUrl,
    isFeatured: false,
  })
  return { ok: true as const }
}

export async function listTeamMembers() {
  return db.select().from(teamMembers).orderBy(asc(teamMembers.sortOrder))
}

export async function toggleWishlist(userId: string, tripId: string) {
  const items = await db.select().from(wishlist).where(eq(wishlist.userId, userId))
  const found = items.find((w) => w.tripId === tripId)
  if (found) {
    await db.delete(wishlist).where(eq(wishlist.id, found.id))
    return { added: false }
  }

  await db.insert(wishlist).values({ id: nanoid(), userId, tripId })
  return { added: true }
}

export async function listWishlist(userId: string) {
  return db.select().from(wishlist).where(eq(wishlist.userId, userId))
}

export async function submitReview(data: {
  userId: string
  tripId: string
  bookingId?: string
  rating: number
  comment: string
}) {
  await db.insert(reviews).values({
    id: nanoid(),
    ...data,
    status: 'pending',
  })
  return { ok: true }
}

export async function getWishlistTripIds(userId: string) {
  const items = await db.select().from(wishlist).where(eq(wishlist.userId, userId))
  return items.map((i) => i.tripId)
}
