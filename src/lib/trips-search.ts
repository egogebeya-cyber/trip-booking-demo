export type TripsSearch = {
  q: string
  category: string
  days: string
  sort: string
  minPrice: number | undefined
  maxPrice: number | undefined
}

export function tripsSearch(overrides: Partial<TripsSearch> = {}): TripsSearch {
  return {
    q: '',
    category: '',
    days: '',
    sort: 'newest',
    minPrice: undefined,
    maxPrice: undefined,
    ...overrides,
  }
}

function asDays(value: unknown): string {
  if (value === 1 || value === 2) return String(value)
  const s = String(value ?? '').replace(/"/g, '').trim()
  return s === '1' || s === '2' ? s : ''
}

export function parseTripsSearch(search: Record<string, unknown>): TripsSearch {
  const rawCategory = typeof search.category === 'string' ? search.category.replace(/"/g, '') : ''
  let days = asDays(search.days)
  let category = rawCategory
  if (!days && (rawCategory === 'one-day-trip' || rawCategory === 'two-day-trip')) {
    days = rawCategory === 'one-day-trip' ? '1' : '2'
    category = ''
  }
  return tripsSearch({
    q: typeof search.q === 'string' ? search.q : '',
    category,
    days,
    sort: typeof search.sort === 'string' && search.sort ? search.sort : 'newest',
    minPrice: search.minPrice ? Number(search.minPrice) : undefined,
    maxPrice: search.maxPrice ? Number(search.maxPrice) : undefined,
  })
}
