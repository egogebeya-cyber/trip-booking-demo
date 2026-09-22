import { createServerFn } from '@tanstack/react-start'
import { getTripBySlug, getRelatedTrips, getTripsByIds, listCategories, listUpcomingDepartures, listTrips, type TripFilters } from './service'

export const listTripsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: TripFilters) => data)
  .handler(async ({ data }) => listTrips(data))

export const getTripFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => getTripBySlug(data.slug))

export const getRelatedTripsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { tripId: string; categoryId: string | null }) => data)
  .handler(async ({ data }) => getRelatedTrips(data.tripId, data.categoryId))

export const listCategoriesFn = createServerFn({ method: 'GET' }).handler(async () => listCategories())

export const listUpcomingDeparturesFn = createServerFn({ method: 'GET' }).handler(async () =>
  listUpcomingDepartures(),
)

export const getTripsByIdsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { ids: string[] }) => data)
  .handler(async ({ data }) => getTripsByIds(data.ids))
