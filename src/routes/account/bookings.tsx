import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { PaymentProofUpload } from '~/components/bookings/payment-proof-upload'
import { useLocale } from '~/components/locale-context'
import { downloadInvoicePdf } from '~/lib/invoice-pdf'
import { formatPrice } from '~/lib/utils'
import { tripsSearch } from '~/lib/trips-search'
import {
  listUserBookingsFn,
  requestCancellationFn,
  requestModificationFn,
} from '~/server/bookings/functions'
import { getSiteSettingsFn } from '~/server/content/functions'

export const Route = createFileRoute('/account/bookings')({
  loader: async () => {
    const [bookings, settings] = await Promise.all([listUserBookingsFn(), getSiteSettingsFn()])
    return { bookings, settings }
  },
  component: BookingsPage,
})

const statusKeys = {
  pending: 'pending',
  confirmed: 'confirmed',
  completed: 'completed',
  cancelled: 'cancelled',
} as const

function BookingsPage() {
  const { bookings, settings } = Route.useLoaderData()
  const { t } = useLocale()
  const router = useRouter()
  const [modifyingId, setModifyingId] = useState<string | null>(null)
  const [modificationNotes, setModificationNotes] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const refresh = () => router.invalidate()

  const handleCancel = async (bookingId: string) => {
    if (!confirm(t('requestCancellation'))) return
    setLoadingId(bookingId)
    try {
      await requestCancellationFn({ data: { bookingId } })
      await refresh()
    } finally {
      setLoadingId(null)
    }
  }

  const handleModify = async (bookingId: string) => {
    if (!modificationNotes.trim()) return
    setLoadingId(bookingId)
    try {
      await requestModificationFn({ data: { bookingId, notes: modificationNotes } })
      setModifyingId(null)
      setModificationNotes('')
      await refresh()
    } finally {
      setLoadingId(null)
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-muted">{t('myBookings')}</p>
        <Link to="/trips" search={tripsSearch()} className="btn-primary mt-4 inline-flex">
          {t('exploreTrips')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold">{t('myBookings')}</h2>
      {bookings.map((booking) => {
        const statusKey = statusKeys[booking.status as keyof typeof statusKeys] ?? 'pending'
        const isModifying = modifyingId === booking.id

        return (
          <div key={booking.id} className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{booking.trip.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {t('referenceNumber')}: {booking.referenceNumber}
                </p>
                <p className="text-sm text-muted">
                  {booking.travelDate} · {booking.guestCount} {t('guests')}
                </p>
                <p className="mt-1 font-medium">{formatPrice(booking.totalPrice)}</p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium">
                {t(statusKey)}
              </span>
            </div>

            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-outline text-sm"
                  onClick={() =>
                    downloadInvoicePdf({
                      businessName: settings?.businessName || 'Trip Explorer',
                      referenceNumber: booking.referenceNumber,
                      tripTitle: booking.trip.title,
                      customerName: booking.customerName,
                      email: booking.email,
                      phone: booking.phone,
                      travelDate: booking.travelDate,
                      guestCount: booking.guestCount,
                      totalPrice: booking.totalPrice,
                      depositAmount: booking.paymentType === 'deposit' ? booking.depositAmount : undefined,
                      remainingAmount: booking.paymentType === 'deposit' ? booking.remainingAmount : undefined,
                      paymentMethod: booking.paymentMethod,
                      paymentStatus: booking.paymentStatus,
                    })
                  }
                >
                  {t('downloadInvoice')}
                </button>
                <button
                  type="button"
                  className="btn-outline text-sm"
                  disabled={loadingId === booking.id}
                  onClick={() => handleCancel(booking.id)}
                >
                  {t('requestCancellation')}
                </button>
                <button
                  type="button"
                  className="btn-outline text-sm"
                  disabled={loadingId === booking.id}
                  onClick={() => {
                    setModifyingId(isModifying ? null : booking.id)
                    setModificationNotes('')
                  }}
                >
                  {t('requestModification')}
                </button>
              </div>
            )}

            {isModifying && (
              <div className="mt-4 space-y-2">
                <label htmlFor={`notes-${booking.id}`} className="block text-sm font-medium">
                  {t('modificationNotes')}
                </label>
                <textarea
                  id={`notes-${booking.id}`}
                  value={modificationNotes}
                  onChange={(e) => setModificationNotes(e.target.value)}
                  className="input min-h-24"
                  rows={3}
                />
                <button
                  type="button"
                  className="btn-primary text-sm"
                  disabled={loadingId === booking.id || !modificationNotes.trim()}
                  onClick={() => handleModify(booking.id)}
                >
                  {t('save')}
                </button>
              </div>
            )}

            <PaymentProofUpload
              referenceNumber={booking.referenceNumber}
              paymentMethod={booking.paymentMethod}
              paymentStatus={booking.paymentStatus}
              paymentProofUrl={booking.paymentProofUrl}
              payAmount={booking.paymentType === 'deposit' ? booking.depositAmount : booking.totalPrice}
              telebirrNumber={settings?.telebirrNumber}
              telebirrQrUrl={settings?.telebirrQrUrl}
              bankName={settings?.bankName}
              bankAccount={settings?.bankAccount}
              bankQrUrl={settings?.bankQrUrl}
              className="mt-4 border-t border-border pt-4"
            />
          </div>
        )
      })}
    </div>
  )
}
