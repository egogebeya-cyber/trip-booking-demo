import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { CheckCircle, Download, Printer } from 'lucide-react'
import { BackButton } from '~/components/back-button'
import { PaymentProofUpload } from '~/components/bookings/payment-proof-upload'
import { PriceTag } from '~/components/price-tag'
import { useLocale } from '~/components/locale-context'
import { downloadInvoicePdf } from '~/lib/invoice-pdf'
import { tripsSearch } from '~/lib/trips-search'
import { needsPaymentProof } from '~/lib/payments'
import { formatDate, formatPrice } from '~/lib/utils'
import { getBookingFn } from '~/server/bookings/functions'
import { getSiteSettingsFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/trips/$slug/book/confirm')({
  validateSearch: (search: Record<string, unknown> = {}) => ({
    ref: String(search?.ref ?? ''),
  }),
  loaderDeps: ({ search }) => ({ ref: search?.ref ?? '' }),
  loader: async (ctx) => {
    const depsRef = ctx.deps?.ref ?? ''
    const searchRef =
      typeof ctx.location?.search === 'string'
        ? new URLSearchParams(ctx.location.search).get('ref') || ''
        : String((ctx.location?.search as { ref?: string } | undefined)?.ref ?? '')
    const ref = depsRef || searchRef
    if (!ref) throw notFound()
    const [booking, settings] = await Promise.all([
      getBookingFn({ data: { referenceNumber: ref } }),
      getSiteSettingsFn(),
    ])
    if (!booking) throw notFound()
    return { booking, settings }
  },
  component: BookingConfirmPage,
})

function BookingConfirmPage() {
  const { booking, settings } = Route.useLoaderData()
  const { t } = useLocale()

  const handleInvoice = () =>
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
  const needsProof = needsPaymentProof(booking.paymentMethod)
  const hasProof = Boolean(booking.paymentProofUrl)
  const paid = booking.paymentStatus === 'paid'
  const payAmount = booking.paymentType === 'deposit' ? booking.depositAmount : booking.totalPrice
  const bookingDone = !needsProof || hasProof || paid
  const heading = bookingDone ? t('bookingComplete') : t('bookingReceived')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 print:py-4">
      <BackButton fallbackTo={`/trips/${booking.trip.slug}`} label={booking.trip.title} className="print:hidden" />
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-bold">{heading}</h1>
        <p className="mt-2 text-muted">{t('referenceNumber')}</p>
        <p className="mt-1 font-mono text-2xl font-bold">{booking.referenceNumber}</p>
        {needsProof && !hasProof && (
          <p className="mt-3 text-sm font-medium text-destructive">{t('awaitingProof')}</p>
        )}
      </div>

      <div className="card mt-8 p-6">
        <h2 className="font-display text-xl font-semibold">{booking.trip.title}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t('selectDate')}</dt>
            <dd className="font-medium">{formatDate(booking.travelDate)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t('guests')}</dt>
            <dd className="font-medium">{booking.guestCount}</dd>
          </div>
          {booking.partyType && booking.partyType !== 'shared' ? (
            <div className="flex justify-between">
              <dt className="text-muted">Package</dt>
              <dd className="font-medium">
                {booking.partyType === 'private' ? t('privatePackage') : t('familyTrip')}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted">{t('fullName')}</dt>
            <dd className="font-medium">{booking.customerName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t('email')}</dt>
            <dd className="font-medium">{booking.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t('paymentMethod')}</dt>
            <dd className="font-medium capitalize">{booking.paymentMethod?.replace('_', ' ')}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <dt className="text-muted">{t('price')}</dt>
            <dd className="text-lg font-bold text-price">
              <PriceTag etb={booking.totalPrice} size="sm" />
            </dd>
          </div>
          {booking.paymentType === 'deposit' && (
            <>
              <div className="flex justify-between">
                <dt className="text-muted">{t('payDeposit')}</dt>
                <dd className="font-medium">{formatPrice(booking.depositAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Remaining</dt>
                <dd className="font-medium">{formatPrice(booking.remainingAmount)}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <PaymentProofUpload
        referenceNumber={booking.referenceNumber}
        paymentMethod={booking.paymentMethod}
        paymentStatus={booking.paymentStatus}
        paymentProofUrl={booking.paymentProofUrl}
        payAmount={payAmount}
        telebirrNumber={settings?.telebirrNumber}
        telebirrQrUrl={settings?.telebirrQrUrl}
        bankName={settings?.bankName}
        bankAccount={settings?.bankAccount}
        bankQrUrl={settings?.bankQrUrl}
        variant="checkout"
      />

        <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
          {bookingDone && (
            <Link
              to="/trips"
              search={tripsSearch()}
              className="btn-primary"
            >
              {t('exploreTrips')}
            </Link>
          )}
          <Link to="/account/bookings" className="btn-outline">
            {t('myBookings')}
          </Link>
          <button type="button" onClick={handleInvoice} className="btn-outline">
            <Download className="mr-2 h-4 w-4" />
            {t('downloadInvoice')}
          </button>
          <button type="button" onClick={() => window.print()} className="btn-outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </button>
        </div>
    </div>
  )
}
