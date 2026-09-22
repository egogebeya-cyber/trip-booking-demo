import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getSessionUser } from '../auth/service'
import {
  getBlogPost,
  getLegalPage,
  getSiteSettings,
  getWishlistTripIds,
  listBlogPosts,
  listSiteFaqs,
  listTeamMembers,
  listTestimonials,
  listWishlist,
  submitContact,
  submitPublicTestimonial,
  submitReview,
  subscribeNewsletter,
  toggleWishlist,
} from './service'
import { logChannelClick } from '../support/channels'

export const getSiteSettingsFn = createServerFn({ method: 'GET' }).handler(async () =>
  getSiteSettings(),
)

export const logChannelClickFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { channel: 'whatsapp' | 'telegram' }) => data)
  .handler(async ({ data }) => logChannelClick(data.channel))

export const submitContactFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { name: string; email: string; subject: string; message: string; type?: string }) =>
      data,
  )
  .handler(async ({ data }) => submitContact(data))

export const subscribeNewsletterFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => subscribeNewsletter(data.email))

export const listBlogPostsFn = createServerFn({ method: 'GET' }).handler(async () => listBlogPosts())

export const getBlogPostFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => getBlogPost(data.slug))

export const listSiteFaqsFn = createServerFn({ method: 'GET' }).handler(async () => listSiteFaqs())

export const getLegalPageFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => getLegalPage(data.slug))

export const listTestimonialsFn = createServerFn({ method: 'GET' }).handler(async () =>
  listTestimonials(),
)

export const submitTestimonialFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      customerName: string
      tripName?: string
      quote: string
      rating: number
      photoDataUrl?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    await submitPublicTestimonial(data)
    return { ok: true }
  })

export const listTeamMembersFn = createServerFn({ method: 'GET' }).handler(async () =>
  listTeamMembers(),
)

export const toggleWishlistFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { tripId: string }) => data)
  .handler(async ({ data }) => {
    const user = await getSessionUser((name) => getCookie(name))
    if (!user) return { ok: false, error: 'UNAUTHORIZED' }
    const result = await toggleWishlist(user.id, data.tripId)
    return { ok: true, ...result }
  })

export const getWishlistIdsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getSessionUser((name) => getCookie(name))
  if (!user) return []
  return getWishlistTripIds(user.id)
})

export const listWishlistFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getSessionUser((name) => getCookie(name))
  if (!user) return []
  return listWishlist(user.id)
})

export const submitReviewFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { tripId: string; bookingId?: string; rating: number; comment: string }) => data,
  )
  .handler(async ({ data }) => {
    const user = await getSessionUser((name) => getCookie(name))
    if (!user) return { ok: false, error: 'UNAUTHORIZED' }
    return submitReview({ ...data, userId: user.id })
  })
