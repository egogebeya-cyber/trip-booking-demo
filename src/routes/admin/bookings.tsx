import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { exportCsv, whatsappHref } from '~/lib/export'
import { getTripKind, tripKindClass, tripKindLabel, type TripKind } from '~/lib/trip-type'
import { listAllBookingsFn, updateBookingStatusFn } from '~/server/admin/functions'

const TRIP_FILTERS: { id: 'all' | TripKind; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: '1-day', label: '1 Day' },
  { id: '2-day', label: '2 Days' },
  { id: 'international', label: 'International' },
  { id: 'multi-day', label: 'Multi-day' },
]

export const Route = createFileRoute('/admin/bookings')({
  loader: async () => {
    const bookings = await listAllBookingsFn()
    return { bookings }
  },
  component: AdminBookingsPage,
})

function AdminBookingsPage() {
  const { bookings } = Route.useLoaderData()
  const router = useRouter()
  const [tripFilter, setTripFilter] = useState<'all' | TripKind>('all')
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'unpaid'>('all')

  const rows = useMemo(
    () =>
      bookings.map((row) => {
        const kind = getTripKind({
          durationDays: row.trip.durationDays,
          categorySlug: row.category?.slug,
        })
        return { ...row, kind }
      }),
    [bookings],
  )

  const visible = rows.filter((row) => {
    if (tripFilter !== 'all' && row.kind !== tripFilter) return false
    if (paidFilter === 'paid' && row.booking.paymentStatus !== 'paid') return false
    if (paidFilter === 'unpaid' && row.booking.paymentStatus === 'paid') return false
    return true
  })

  const paidByType = useMemo(() => {
    const paid = rows.filter((row) => row.booking.paymentStatus === 'paid')
    return TRIP_FILTERS.filter((f) => f.id !== 'all').map((filter) => {
      const items = paid.filter((row) => row.kind === filter.id)
      return {
        id: filter.id,
        label: filter.label,
        count: items.length,
        total: items.reduce((sum, row) => sum + (row.booking.depositAmount || row.booking.totalPrice), 0),
      }
    })
  }, [rows])

  const updateStatus = async (id: string, status: string, paymentStatus?: string, sendEmail?: boolean) => {
    const result = await updateBookingStatusFn({ data: { id, status, paymentStatus, sendEmail } })
    router.invalidate()
    return result
  }

  const markPaidAndNotify = async (data: {
    id: string
    status: string
    phone: string
    name: string
    reference: string
    tripTitle: string
    date: string
    sendEmail: boolean
  }) => {
    const result = await updateStatus(
      data.id,
      data.status === 'pending' ? 'confirmed' : data.status,
      'paid',
      data.sendEmail,
    )
    if (data.sendEmail && result && 'emailSent' in result && !result.emailSent) {
      window.alert(result.emailError || 'Marked paid, but the confirmation email did not send.')
    }
    const href = whatsappHref(
      data.phone,
      `Hi ${data.name}, your booking ${data.reference} for ${data.tripTitle} on ${data.date} is confirmed. Payment received. See you on the trip!`,
    )
    window.open(href, '_blank', 'noopener')
  }

  const exportExcel = () => {
    exportCsv(
      'bookings.csv',
      ['Reference', 'Trip type', 'Trip', 'Guest', 'Email', 'Phone', 'Date', 'Guests', 'Total ETB', 'Paid type', 'Payment', 'Proof', 'Status'],
      visible.map(({ booking, trip, kind }) => [
        booking.referenceNumber,
        tripKindLabel(kind, trip.durationDays),
        trip.title,
        booking.customerName,
        booking.email,
        booking.phone,
        booking.travelDate,
        booking.guestCount,
        booking.totalPrice,
        booking.paymentType === 'deposit' ? 'Deposit' : 'Full',
        `${booking.paymentMethod || ''} / ${booking.paymentStatus}`,
        booking.paymentProofUrl ? 'Yes' : 'No',
        booking.status,
      ]),
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Bookings</h1>
        <button type="button" className="btn-outline text-sm" onClick={exportExcel}>
          Export Excel
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {paidByType.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTripFilter(item.id)
              setPaidFilter('paid')
            }}
            className={`rounded-2xl border p-3 text-left ${
              tripFilter === item.id && paidFilter === 'paid' ? 'border-primary bg-accent' : 'border-border bg-card'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Paid · {item.label}</p>
            <p className="mt-1 text-lg font-semibold">{item.count}</p>
            <p className="text-xs text-muted">{item.total.toLocaleString()} ETB received</p>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TRIP_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setTripFilter(filter.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              tripFilter === filter.id ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'
            }`}
          >
            {filter.label}
          </button>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-border sm:inline-block" />
        {(['all', 'paid', 'unpaid'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setPaidFilter(filter)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              paidFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'
            }`}
          >
            {filter === 'all' ? 'All payments' : filter === 'paid' ? 'Paid only' : 'Unpaid'}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2 pr-4">Reference</th>
              <th className="pb-2 pr-4">Trip</th>
              <th className="pb-2 pr-4">Guest</th>
              <th className="pb-2 pr-4">Total</th>
              <th className="pb-2 pr-4">Payment</th>
              <th className="pb-2 pr-4">Proof</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="w-52 pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ booking, trip, kind }) => (
              <tr key={booking.id} className="border-b border-border align-top">
                <td className="py-3 pr-4 font-mono text-xs">{booking.referenceNumber}</td>
                <td className="py-3 pr-4">
                  <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tripKindClass(kind)}`}>
                    {tripKindLabel(kind, trip.durationDays)}
                  </span>
                  <div className="font-medium">{trip.title}</div>
                  <div className="text-xs text-muted">{trip.destination}</div>
                </td>
                <td className="py-3 pr-4">
                  <div>{booking.customerName}</div>
                  <div className="text-xs text-muted">{booking.email}</div>
                  <div className="text-xs text-muted">{booking.phone}</div>
                  {booking.partyType && booking.partyType !== 'shared' ? (
                    <div className="mt-1 text-xs font-medium text-primary">
                      {booking.partyType === 'private' ? 'Private package' : 'Family trip'}
                    </div>
                  ) : null}
                </td>
                <td className="py-3 pr-4">
                  <div>{booking.totalPrice.toLocaleString()} ETB</div>
                  <div className="text-xs text-muted">
                    {booking.paymentType === 'deposit'
                      ? `Deposit ${booking.depositAmount.toLocaleString()} · remain ${booking.remainingAmount.toLocaleString()}`
                      : 'Full payment'}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="capitalize">{booking.paymentMethod?.replace('_', ' ')}</div>
                  <div className="text-xs text-muted">{booking.paymentStatus}</div>
                </td>
                <td className="py-3 pr-4">
                  {booking.paymentProofUrl ? (
                    <a href={booking.paymentProofUrl} target="_blank" rel="noreferrer">
                      <img
                        src={booking.paymentProofUrl}
                        alt="Payment proof"
                        className="h-16 w-16 rounded-lg border border-border object-cover"
                      />
                    </a>
                  ) : (
                    <span className="text-xs text-muted">No screenshot</span>
                  )}
                </td>
                <td className="py-3 pr-4">{booking.status}</td>
                <td className="py-3">
                  <BookingRowActions
                    booking={booking}
                    tripTitle={trip.title}
                    onStatusChange={(status) => void updateStatus(booking.id, status)}
                    onMarkPaid={markPaidAndNotify}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="mt-4 text-muted">{bookings.length === 0 ? 'No bookings yet.' : 'No bookings match these filters.'}</p>
        )}
      </div>
    </div>
  )
}

function BookingRowActions({
  booking,
  tripTitle,
  onStatusChange,
  onMarkPaid,
}: {
  booking: {
    id: string
    status: string
    paymentStatus: string
    phone: string
    customerName: string
    referenceNumber: string
    travelDate: string
  }
  tripTitle: string
  onStatusChange: (status: string) => void
  onMarkPaid: (data: {
    id: string
    status: string
    phone: string
    name: string
    reference: string
    tripTitle: string
    date: string
    sendEmail: boolean
  }) => Promise<void>
}) {
  const [includeEmail, setIncludeEmail] = useState(true)
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex w-48 flex-col gap-1.5">
      <select
        value={booking.status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="input py-1 text-xs"
      >
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      {booking.paymentStatus !== 'paid' && (
        <>
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <input
              type="checkbox"
              checked={includeEmail}
              onChange={(e) => setIncludeEmail(e.target.checked)}
              className="rounded border-border"
            />
            Email confirmation
          </label>
          <button
            type="button"
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-2 py-1.5 text-[11px] font-semibold leading-tight text-primary-foreground disabled:opacity-60"
            onClick={() => {
              setBusy(true)
              void onMarkPaid({
                id: booking.id,
                status: booking.status,
                phone: booking.phone,
                name: booking.customerName,
                reference: booking.referenceNumber,
                tripTitle,
                date: booking.travelDate,
                sendEmail: includeEmail,
              }).finally(() => setBusy(false))
            }}
          >
            {busy ? 'Saving…' : 'Mark paid + WhatsApp'}
          </button>
        </>
      )}
    </div>
  )
}
