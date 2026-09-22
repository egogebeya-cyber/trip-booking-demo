export type TripKind = '1-day' | '2-day' | 'international' | 'multi-day'

export function getTripKind(trip: { durationDays: number; categorySlug?: string | null }): TripKind {
  if (trip.categorySlug === 'international') return 'international'
  if (trip.durationDays === 1) return '1-day'
  if (trip.durationDays === 2) return '2-day'
  return 'multi-day'
}

export function tripKindLabel(kind: TripKind, durationDays?: number) {
  if (kind === '1-day') return '1 Day'
  if (kind === '2-day') return '2 Days'
  if (kind === 'international') return 'International'
  return durationDays && durationDays > 2 ? `${durationDays} Days` : 'Multi-day'
}

export function tripKindClass(kind: TripKind) {
  if (kind === '1-day') return 'bg-emerald-100 text-emerald-800'
  if (kind === '2-day') return 'bg-sky-100 text-sky-800'
  if (kind === 'international') return 'bg-violet-100 text-violet-800'
  return 'bg-amber-100 text-amber-900'
}
