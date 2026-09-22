import { Link, createFileRoute } from '@tanstack/react-router'
import { useLocale } from '~/components/locale-context'
import { TripCard } from '~/components/trips/TripCard'
import { tripsSearch } from '~/lib/trips-search'
import { getWishlistIdsFn } from '~/server/content/functions'
import { listTripsFn } from '~/server/trips/functions'

export const Route = createFileRoute('/account/wishlist')({
  loader: async () => {
    const [wishlistIds, allTrips] = await Promise.all([
      getWishlistIdsFn(),
      listTripsFn({ data: {} }),
    ])
    const idSet = new Set(wishlistIds)
    const trips = allTrips.filter((trip) => idSet.has(trip.id))
    return { trips }
  },
  component: WishlistPage,
})

function WishlistPage() {
  const { trips } = Route.useLoaderData()
  const { t, locale } = useLocale()

  if (trips.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-muted">{t('wishlist')}</p>
        <Link to="/trips" search={tripsSearch()} className="btn-primary mt-4 inline-flex">
          {t('exploreTrips')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{t('wishlist')}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} locale={locale} isWishlisted loggedIn />
        ))}
      </div>
    </div>
  )
}
