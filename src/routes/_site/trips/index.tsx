import { Link, createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useState } from 'react'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit } from '~/components/site-edit-context'
import { TripCard } from '~/components/trips/TripCard'
import { parseTripsSearch, tripsSearch } from '~/lib/trips-search'
import { listTripsFn } from '~/server/trips/functions'
import { getWishlistIdsFn } from '~/server/content/functions'

const COMPARE_KEY = 'trip-compare-ids'

export const Route = createFileRoute('/_site/trips/')({
  validateSearch: parseTripsSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const days = deps.days === '1' || deps.days === '2' ? Number(deps.days) : undefined
    const sort = (deps.sort as 'price_asc' | 'price_desc' | 'popular' | 'newest') || 'newest'
    const [tripsRaw, wishlistIds] = await Promise.all([
      listTripsFn({
        data: {
          search: deps.q || undefined,
          category: deps.category || undefined,
          sort,
          minPrice: deps.minPrice,
          maxPrice: deps.maxPrice,
          minDuration: days,
          maxDuration: days,
        },
      }),
      getWishlistIdsFn(),
    ])
    const trips = sort === 'popular' ? tripsRaw.slice(0, 4) : tripsRaw
    return { trips, wishlistIds }
  },
  component: TripsPage,
})

function durationPillClass(active: boolean, activeClass: string) {
  return `inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium ${active ? activeClass : 'bg-accent text-foreground'}`
}

function TripsPage() {
  const { trips, wishlistIds } = Route.useLoaderData()
  const search = Route.useSearch()
  const { user } = useLoaderData({ from: '/_site' })
  const { t, locale } = useLocale()
  const edit = useOptionalSiteEdit()
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]') } catch { return [] }
  })

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <BackButton fallbackTo="/" className="mb-6" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('trips')}</h1>
          {edit?.isAdmin && (
            <p className="mt-2 text-sm text-primary">Use Add trip to create one, or Edit / Delete on a card.</p>
          )}
        </div>
        {edit?.isAdmin && (
          <Link to="/admin/trips/$id" params={{ id: 'new' }} className="btn-primary">
            Add trip
          </Link>
        )}
      </div>
      <p className="mt-2 max-w-3xl text-muted">
        Ethiopia <strong>1 Day</strong> and <strong>2 Days</strong> trips from Addis, plus{' '}
        <strong>International</strong> packages to Dubai, Kenya, and Tanzania.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/trips"
          search={tripsSearch({ ...search, days: '', category: '', sort: 'newest' })}
          className={durationPillClass(
            !search.days && search.category !== 'international' && search.sort !== 'popular',
            'bg-primary text-white',
          )}
        >
          All trips
        </Link>
        <Link
          to="/trips"
          search={tripsSearch({ ...search, days: '', category: '', sort: 'popular' })}
          className={durationPillClass(
            search.sort === 'popular' && !search.days && search.category !== 'international',
            'bg-accent text-foreground',
          )}
        >
          Popular
        </Link>
        <Link
          to="/trips"
          search={tripsSearch({ ...search, days: '1', category: '' })}
          className={durationPillClass(search.days === '1', 'bg-emerald-600 text-white')}
        >
          1 Day Trips
        </Link>
        <Link
          to="/trips"
          search={tripsSearch({ ...search, days: '2', category: '' })}
          className={durationPillClass(search.days === '2', 'bg-sky-600 text-white')}
        >
          2 Days Trips
        </Link>
        <Link
          to="/trips"
          search={tripsSearch({ ...search, days: '', category: 'international' })}
          className={durationPillClass(search.category === 'international', 'bg-violet-700 text-white')}
        >
          International
        </Link>
      </div>

      {compareIds.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-accent px-4 py-2">
          <span className="text-sm">{compareIds.length} selected</span>
          <Link to="/trips/compare" search={{ ids: compareIds.join(',') }} className="btn-primary text-sm">
            {t('compareTrips')}
          </Link>
          <button type="button" className="text-sm text-muted" onClick={() => { setCompareIds([]); localStorage.removeItem(COMPARE_KEY) }}>
            {t('clearCompare')}
          </button>
        </div>
      )}

      {trips.length === 0 ? (
        <p className="mt-12 text-center text-muted">{t('noTripsFound')}</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              locale={locale}
              onCompare={toggleCompare}
              loggedIn={Boolean(user)}
              isWishlisted={wishlistIds.includes(trip.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
