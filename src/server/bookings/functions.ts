import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getSessionUser } from '../auth/service'
import {
  createBooking,
  getBookingByReference,
  joinWaitingList,
  listUserBookings,
  requestCancellation,
  requestModification,
  uploadPaymentProof,
  validatePromoCode,
} from './service'

export const createBookingFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      tripId: string
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
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await getSessionUser((name) => getCookie(name))
    return createBooking({ ...data, userId: user?.id })
  })

export const getBookingFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { referenceNumber: string }) => data)
  .handler(async ({ data }) => getBookingByReference(data.referenceNumber))

export const uploadPaymentProofFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { referenceNumber: string; dataUrl: string }) => data)
  .handler(async ({ data }) => uploadPaymentProof(data.referenceNumber, data.dataUrl))

export const listUserBookingsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getSessionUser((name) => getCookie(name))
  if (!user) return []
  return listUserBookings(user.id)
})

export const requestCancellationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { bookingId: string }) => data)
  .handler(async ({ data }) => {
    const user = await getSessionUser((name) => getCookie(name))
    if (!user) return { ok: false, error: 'UNAUTHORIZED' }
    return requestCancellation(data.bookingId, user.id)
  })

export const requestModificationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { bookingId: string; notes: string }) => data)
  .handler(async ({ data }) => {
    const user = await getSessionUser((name) => getCookie(name))
    if (!user) return { ok: false, error: 'UNAUTHORIZED' }
    return requestModification(data.bookingId, user.id, data.notes)
  })

export const joinWaitingListFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      tripId: string
      travelDate: string
      name: string
      email: string
      phone?: string
      guestCount: number
    }) => data,
  )
  .handler(async ({ data }) => joinWaitingList(data))

export const validatePromoCodeFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => validatePromoCode(data.code))
