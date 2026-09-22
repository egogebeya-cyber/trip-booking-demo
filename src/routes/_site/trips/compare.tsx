import { Link, createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { tripsSearch } from '~/lib/trips-search'
import { formatPrice } from '~/lib/utils'
import { getTripsByIdsFn } from '~/server/trips/functions'

export const Route = createFileRoute('/_site/trips/compare')({
  validateSearch: (search: Record<string, unknown>) => ({
    ids: (search.ids as string) || '',
  }),
  loader: async ({ location }) => {
    const params = new URLSearchParams(location.search)
    const ids = (params.get('ids') || '').split(',').filter(Boolean)
    const trips = await getTripsByIdsFn({ data: { ids } })
    return { trips, ids }
  },
  component: CompareTripsPage,
})

function CompareTripsPage() {
  const { trips, ids } = Route.useLoaderData()
  const { t, locale } = useLocale()

  if (ids.length === 0 || trips.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <BackButton fallbackTo="/trips" label={t('trips')} className="mb-6" />
        <h1 className="font-display text-3xl font-bold">{t('compareTrips')}</h1>
        <p className="mt-4 text-muted">{t('noTripsFound')}</p>
        <Link to="/trips" search={tripsSearch()} className="btn-primary mt-6 inline-flex">
          {t('exploreTrips')}
        </Link>
      </div>
    )
  }

  const rows: { label: string; key: (trip: (typeof trips)[0]) => ReactNode }[] = [
    {
      label: t('destination'),
      key: (trip) => trip.destination,
    },
    {
      label: t('price'),
      key: (trip) => formatPrice(trip.price),
    },
    {
      label: t('duration'),
      key: (trip) => `${trip.durationDays} ${t('days')}`,
    },
    {
      label: t('difficulty'),
      key: (trip) => t(trip.difficulty as 'easy' | 'moderate' | 'challenging'),
    },
    {
      label: t('bestSeason'),
      key: (trip) => trip.bestSeason || '—',
    },
    {
      label: t('minAge'),
      key: (trip) => (trip.minAge ? `${trip.minAge} ${t('years')}` : '—'),
    },
    {
      label: t('included'),
      key: (trip) => (
        <ul className="space-y-1 text-left text-sm">
          {trip.includedItems.slice(0, 5).map((item) => (
            <li key={item} className="flex items-start gap-1">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: t('excluded'),
      key: (trip) => (
        <ul className="space-y-1 text-left text-sm">
          {trip.excludedItems.slice(0, 5).map((item) => (
            <li key={item} className="flex items-start gap-1">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
              {item}
            </li>
          ))}
        </ul>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{t('compareTrips')}</h1>
        <BackButton fallbackTo="/trips" label={t('trips')} />
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-medium text-muted" />
              {trips.map((trip) => {
                const title = locale === 'am' && trip.titleAm ? trip.titleAm : trip.title
                return (
                  <th key={trip.id} className="p-3 text-left align-top">
                    <img
                      src={trip.coverImageUrl}
                      alt={title}
                      className="mb-3 aspect-[4/3] w-full max-w-[200px] rounded-xl object-cover"
                    />
                    <h2 className="font-display text-lg font-semibold">{title}</h2>
                    <Link
                      to="/trips/$slug"
                      params={{ slug: trip.slug }}
                      className="btn-primary mt-2 inline-flex text-xs"
                    >
                      {t('viewDetails')}
                    </Link>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <td className="p-3 text-sm font-medium text-muted">{row.label}</td>
                {trips.map((trip) => (
                  <td key={trip.id} className="p-3 text-sm">
                    {row.key(trip)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
