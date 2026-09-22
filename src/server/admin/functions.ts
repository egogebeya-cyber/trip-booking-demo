import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '../auth/guard.server'
import { saveUploadedImageDataUrl } from '../uploads/save-image'
import {
  deleteCategory,
  deleteTestimonial,
  deleteTrip,
  getDashboardStats,
  getEmailSettings,
  getTripForAdmin,
  listAllBlogPosts,
  listAllBookings,
  listAllLegalPages,
  listAllTestimonials,
  listAllTrips,
  listCategoriesAdmin,
  listAllSiteFaqs,
  listContactMessages,
  listDepartures,
  listNewsletterSubscribers,
  listPendingReviews,
  listPromoCodes,
  listTeamMembersAdmin,
  listWaitingList,
  saveAddons,
  saveAvailability,
  saveBlogPost,
  saveCategory,
  saveItinerary,
  saveLegalPage,
  savePromoCode,
  deleteTeamMember,
  saveSiteFaq,
  saveTeamMember,
  saveTestimonial,
  saveTrip,
  saveTripFaqs,
  sendAdminTestEmail,
  sendAdminTestSms,
  runTripRemindersNow,
  sendAnnouncement,
  updateBookingStatus,
  updateReviewStatus,
  updateSiteSettings,
} from './service'

async function adminGuard() {
  await requireAdmin()
}

export const getDashboardStatsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return getDashboardStats()
}) // dashboard stats include trip-type totals



export const listAllBookingsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listAllBookings()
})

export const listDeparturesFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listDepartures()
}) // includes old, today, and future dates

export const updateBookingStatusFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; status: string; paymentStatus?: string; sendEmail?: boolean }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    const result = await updateBookingStatus(data.id, data.status, data.paymentStatus, {
      sendEmail: data.sendEmail,
    })
    return { ok: true, ...result }
  })

export const listAllTripsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listAllTrips()
})

export const getTripForAdminFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    return getTripForAdmin(data.id)
  })

export const saveTripFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { trip: Record<string, unknown>; id?: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    return saveTrip(data.trip, data.id)
  })

export const deleteTripFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    await deleteTrip(data.id)
    return { ok: true }
  })

export const updateSiteSettingsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    await updateSiteSettings(data as never)
    return { ok: true }
  })

export const getEmailSettingsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return getEmailSettings()
})

export const sendTestEmailFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { to?: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    return sendAdminTestEmail(data.to)
  })

export const sendTestSmsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { phone?: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    return sendAdminTestSms(data.phone)
  })

export const runTripRemindersFn = createServerFn({ method: 'POST' }).handler(async () => {
  await adminGuard()
  return runTripRemindersNow()
})

export const listPromoCodesFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listPromoCodes()
})

export const savePromoCodeFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id?: string
      code: string
      discountType: string
      discountValue: number
      maxUses?: number
      isActive: boolean
    }) => data,
  )
  .handler(async ({ data }) => {
    await adminGuard()
    return savePromoCode(data)
  })

export const listPendingReviewsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listPendingReviews()
})

export const updateReviewStatusFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; status: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    await updateReviewStatus(data.id, data.status)
    return { ok: true }
  })

export const listWaitingListFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listWaitingList()
})

export const listNewsletterSubscribersFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listNewsletterSubscribers()
})

export const sendAnnouncementFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      subject: string
      message: string
      includeAccounts?: boolean
      linkUrl?: string
      linkLabel?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    await adminGuard()
    return sendAnnouncement(data)
  })

export const listContactMessagesFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listContactMessages()
})

export const listCategoriesAdminFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listCategoriesAdmin()
})

export const saveCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id?: string; name: string; slug: string; icon?: string; sortOrder?: number }) => data,
  )
  .handler(async ({ data }) => {
    await adminGuard()
    return saveCategory(data)
  })

export const deleteCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    await deleteCategory(data.id)
    return { ok: true }
  })

export const listAllBlogPostsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listAllBlogPosts()
})

export const saveBlogPostFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id?: string
      title: string
      slug: string
      excerpt?: string
      body?: string
      coverImageUrl?: string
      videoUrl?: string
      isPublished: boolean
    }) => data,
  )
  .handler(async ({ data }) => {
    await adminGuard()
    return saveBlogPost(data)
  })

export const saveSiteFaqFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id?: string; question: string; answer: string; sortOrder?: number; isPublished?: boolean }) =>
      data,
  )
  .handler(async ({ data }) => {
    await adminGuard()
    return saveSiteFaq(data)
  })

export const saveLegalPageFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { slug: string; title: string; body: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    await saveLegalPage(data.slug, data.title, data.body)
    return { ok: true }
  })

export const listAllLegalPagesFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listAllLegalPages()
})

export const saveTestimonialFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id?: string
      customerName: string
      tripName?: string
      quote: string
      rating: number
      photoUrl?: string
      isFeatured: boolean
    }) => data,
  )
  .handler(async ({ data }) => {
    await adminGuard()
    return saveTestimonial(data)
  })

export const listAllTestimonialsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listAllTestimonials()
})

export const deleteTestimonialFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    await deleteTestimonial(data.id)
    return { ok: true }
  })

export const listAllSiteFaqsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listAllSiteFaqs()
})

export const listTeamMembersAdminFn = createServerFn({ method: 'GET' }).handler(async () => {
  await adminGuard()
  return listTeamMembersAdmin()
})

export const saveTeamMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id?: string
      name: string
      role: string
      bio?: string
      photoUrl?: string
      sortOrder?: number
    }) => data,
  )
  .handler(async ({ data }) => {
    await adminGuard()
    return saveTeamMember(data)
  })

export const deleteTeamMemberFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    await deleteTeamMember(data.id)
    return { ok: true }
  })

export const saveTripDetailsFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      tripId: string
      itinerary?: { dayNumber: number; title: string; description: string }[]
      addons?: { name: string; description?: string; price: number; isActive?: boolean }[]
      faqs?: { question: string; answer: string; sortOrder?: number }[]
      availability?: { date: string; spotsRemaining: number; priceOverride?: number }[]
    }) => data,
  )
  .handler(async ({ data }) => {
    await adminGuard()
    if (data.itinerary) await saveItinerary(data.tripId, data.itinerary)
    if (data.addons) await saveAddons(data.tripId, data.addons)
    if (data.faqs) await saveTripFaqs(data.tripId, data.faqs)
    if (data.availability) await saveAvailability(data.tripId, data.availability)
    return { ok: true }
  })

export const uploadImageFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { dataUrl: string }) => data)
  .handler(async ({ data }) => {
    await adminGuard()
    return saveUploadedImageDataUrl(data.dataUrl, 'trip-')
  })
