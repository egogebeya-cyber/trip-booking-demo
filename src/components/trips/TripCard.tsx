import { Link } from '@tanstack/react-router'
import { Clock, MapPin } from 'lucide-react'
import { useState } from 'react'
import { InlineImage } from '~/components/inline-image'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit } from '~/components/site-edit-context'
import { PriceTag } from '~/components/price-tag'
import { TripAdminControls } from '~/components/trips/TripAdminControls'
import { WishlistButton } from '~/components/wishlist-button'
import { saveTripFn } from '~/server/admin/functions'

type TripCardProps = {
  trip: {
    id: string
    slug: string
    title: string
    titleAm?: string | null
    destination: string
    price: number
    priceUsd?: number | null
    durationDays: number
    coverImageUrl: string
    isFeatured?: boolean
    isPopular?: boolean
    isLastMinuteDeal?: boolean
    [key: string]: unknown
  }
  locale?: 'en' | 'am' | 'om'
  onCompare?: (id: string) => void
  isWishlisted?: boolean
  loggedIn?: boolean
}

export function TripCard({ trip, locale = 'en', onCompare, isWishlisted, loggedIn = false }: TripCardProps) {
  const { t } = useLocale()
  const edit = useOptionalSiteEdit()
  const title = locale === 'am' && trip.titleAm ? trip.titleAm : trip.title
  const [cover, setCover] = useState(trip.coverImageUrl)

  return (
    <article className="card group overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden">
        <InlineImage
          src={cover || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600'}
          alt={title}
          className="h-full w-full"
          imgClassName="h-full w-full object-cover transition group-hover:scale-105"
          onChange={async (url) => {
            setCover(url)
            const { category: _category, itinerary: _itinerary, faqs: _faqs, reviews: _reviews, availability: _availability, addons: _addons, ...rest } = trip as typeof trip & Record<string, unknown>
            await saveTripFn({
              data: {
                id: trip.id,
                trip: { ...rest, coverImageUrl: url },
              },
            })
          }}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {trip.durationDays === 1 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs uppercase tracking-wide text-white">1 Day Trip</span>
          )}
          {trip.durationDays > 2 && (trip.category as { slug?: string } | undefined)?.slug === 'international' && (
            <span className="rounded-full bg-sky-700 px-2 py-0.5 text-xs uppercase tracking-wide text-white">International</span>
          )}
          {trip.isFeatured && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">Featured</span>}
          {trip.isLastMinuteDeal && <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-white">Deal</span>}
          {trip.isPopular && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">Popular</span>}
        </div>
        <div className="absolute right-3 top-3">
          <WishlistButton tripId={trip.id} loggedIn={loggedIn} initial={isWishlisted} className="bg-white/90 !px-2 !py-1" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">{title}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5" />{trip.destination}
            </p>
          </div>
          <div className="text-right">
            <PriceTag etb={trip.price} usd={trip.priceUsd} size="sm" />
            <p className="text-xs text-muted">{t('perPerson')}</p>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          <Clock className="h-3.5 w-3.5" />
          {trip.durationDays === 1
            ? '1 Day Trip'
            : trip.durationDays === 2
              ? '2 Days Trip'
              : `${trip.durationDays} ${t('days')}`}
        </p>
        <div className="mt-4 flex gap-2">
          <Link to="/trips/$slug" params={{ slug: trip.slug }} className="btn-primary flex-1 text-center text-sm">
            {t('viewDetails')}
          </Link>
          {onCompare && (
            <button type="button" onClick={() => onCompare(trip.id)} className="btn-outline text-sm">
              {t('compare')}
            </button>
          )}
        </div>
        {edit?.isAdmin && (
          <div className="mt-3 border-t border-border pt-3">
            <TripAdminControls tripId={trip.id} />
          </div>
        )}
      </div>
    </article>
  )
}

export function TripCardCompact({ trip }: { trip: TripCardProps['trip'] }) {
  return (
    <Link to="/trips/$slug" params={{ slug: trip.slug }} className="card flex gap-3 overflow-hidden p-3 hover:shadow-md">
      <img src={trip.coverImageUrl} alt={trip.title} className="h-20 w-20 rounded-xl object-cover" />
      <div>
        <h4 className="font-medium">{trip.title}</h4>
        <PriceTag etb={trip.price} usd={trip.priceUsd} size="sm" />
      </div>
    </Link>
  )
}
