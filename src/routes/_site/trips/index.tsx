import { Link, createFileRoute, useLoaderData, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit } from '~/components/site-edit-context'
import { TripCard } from '~/components/trips/TripCard'
import { parseTripsSearch, tripsSearch } from '~/lib/trips-search'
import { listCategoriesFn, listTripsFn } from '~/server/trips/functions'
import { getWishlistIdsFn } from '~/server/content/functions'

const COMPARE_KEY = 'trip-compare-ids'

export const Route = createFileRoute('/_site/trips/')({
  validateSearch: parseTripsSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const days = deps.days === '1' || deps.days === '2' ? Number(deps.days) : undefined
    const [trips, categories, wishlistIds] = await Promise.all([
      listTripsFn({
        data: {
          search: deps.q || undefined,
          category: deps.category || undefined,
          sort: (deps.sort as 'price_asc' | 'price_desc' | 'popular' | 'newest') || 'newest',
          minPrice: deps.minPrice,
          maxPrice: deps.maxPrice,
          minDuration: days,
          maxDuration: days,
        },
      }),
      listCategoriesFn(),
      getWishlistIdsFn(),
    ])
    return { trips, categories, wishlistIds }
  },
  component: TripsPage,
})

function durationPillClass(active: boolean, activeClass: string) {
  return `rounded-full px-4 py-2 text-sm font-medium ${active ? activeClass : 'bg-accent text-foreground'}`
}

function TripsPage() {
  const { trips, categories, wishlistIds } = Route.useLoaderData()
  const search = Route.useSearch()
  const { user } = useLoaderData({ from: '/_site' })
  const { t, locale } = useLocale()
  const edit = useOptionalSiteEdit()
  const navigate = useNavigate()
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
    <div className="mx-auto max-w-7xl px-4 py-8">
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
          search={tripsSearch({ ...search, days: '', category: '' })}
          className={durationPillClass(!search.days && search.category !== 'international', 'bg-primary text-white')}
        >
          All trips
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

      <form
        key={`${search.q}-${search.category}-${search.sort}-${search.days}`}
        className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          navigate({
            to: '/trips',
            search: tripsSearch({
              ...search,
              q: String(fd.get('q') || ''),
              category: String(fd.get('category') || ''),
              sort: String(fd.get('sort') || 'newest'),
            }),
          })
        }}
      >
        <input name="q" defaultValue={search.q} placeholder={t('searchTrips')} className="input md:col-span-2" />
        <select name="category" defaultValue={search.category} className="input">
          <option value="">{t('allCategories')}</option>
          {categories
            .filter((c) => c.slug !== 'one-day-trip' && c.slug !== 'two-day-trip')
            .map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
        </select>
        <select name="sort" defaultValue={search.sort} className="input">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Popular</option>
        </select>
        <button type="submit" className="btn-primary">{t('filterBy')}</button>
      </form>

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
