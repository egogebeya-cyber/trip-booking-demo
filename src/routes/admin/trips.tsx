import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TripAdminControls } from '~/components/trips/TripAdminControls'
import { getTripKind, tripKindClass, tripKindLabel, type TripKind } from '~/lib/trip-type'
import { listAllTripsFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/trips')({
  loader: async () => {
    const trips = await listAllTripsFn()
    return { trips }
  },
  component: AdminTripsPage,
})

type StatusFilter = 'all' | 'published' | 'draft'
type KindFilter = 'all' | TripKind

function AdminTripsPage() {
  const { trips } = Route.useLoaderData()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<KindFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const rows = useMemo(
    () =>
      trips.map((row) => {
        const tripKind = getTripKind({
          durationDays: row.trip.durationDays,
          categorySlug: row.category?.slug,
        })
        return { ...row, kind: tripKind }
      }),
    [trips],
  )

  const visible = rows.filter((row) => {
    const hay = `${row.trip.title} ${row.trip.destination}`.toLowerCase()
    if (query.trim() && !hay.includes(query.trim().toLowerCase())) return false
    if (kind !== 'all' && row.kind !== kind) return false
    if (status === 'published' && !row.trip.isPublished) return false
    if (status === 'draft' && row.trip.isPublished) return false
    return true
  })

  const published = rows.filter((row) => row.trip.isPublished).length
  const drafts = rows.length - published

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Catalog</p>
          <h1 className="mt-1 font-display text-2xl font-bold normal-case tracking-tight">All trips</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} trips · {published} live · {drafts} draft
          </p>
        </div>
        <Link
          to="/admin/trips/$id"
          params={{ id: 'new' }}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add trip
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setStatus('all')}
          className={`rounded-2xl border p-3 text-left ${status === 'all' ? 'border-primary bg-card' : 'border-border bg-card/70'}`}
        >
          <p className="text-xs uppercase tracking-wide text-muted">Total</p>
          <p className="mt-1 text-xl font-semibold">{rows.length}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatus('published')}
          className={`rounded-2xl border p-3 text-left ${status === 'published' ? 'border-primary bg-card' : 'border-border bg-card/70'}`}
        >
          <p className="text-xs uppercase tracking-wide text-muted">Published</p>
          <p className="mt-1 text-xl font-semibold text-primary">{published}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatus('draft')}
          className={`rounded-2xl border p-3 text-left ${status === 'draft' ? 'border-primary bg-card' : 'border-border bg-card/70'}`}
        >
          <p className="text-xs uppercase tracking-wide text-muted">Drafts</p>
          <p className="mt-1 text-xl font-semibold">{drafts}</p>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="input py-2 pl-9"
            placeholder="Search title or destination"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {(
          [
            ['all', 'All types'],
            ['1-day', '1 Day'],
            ['2-day', '2 Days'],
            ['international', 'International'],
            ['multi-day', 'Multi-day'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              kind === id ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted">
          {rows.length === 0 ? (
            <>
              No trips yet.{' '}
              <Link to="/admin/trips/$id" params={{ id: 'new' }} className="text-primary hover:underline">
                Add your first trip
              </Link>
            </>
          ) : (
            'No trips match these filters.'
          )}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ trip, kind }) => (
            <article key={trip.id} className="overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm">
              <div className="relative aspect-[16/9] bg-accent">
                <img
                  src={trip.coverImageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tripKindClass(kind)}`}>
                    {tripKindLabel(kind, trip.durationDays)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      trip.isPublished ? 'bg-primary text-white' : 'bg-white/90 text-muted'
                    }`}
                  >
                    {trip.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h2 className="font-display text-lg font-semibold leading-tight normal-case tracking-normal">
                  {trip.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{trip.destination}</p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold">{trip.price.toLocaleString()} ETB</span>
                  <span className="text-muted">
                    {' '}
                    · {trip.durationDays === 1 ? '1 day' : `${trip.durationDays} days`}
                  </span>
                  {trip.bookingCount > 0 && <span className="text-muted"> · {trip.bookingCount} bookings</span>}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link to="/trips/$slug" params={{ slug: trip.slug }} className="text-sm text-primary hover:underline">
                    View site
                  </Link>
                  <TripAdminControls tripId={trip.id} afterDeleteTo="/admin/trips" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
