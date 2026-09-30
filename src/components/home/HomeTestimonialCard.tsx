import { InlineImage } from '~/components/inline-image'
import { InlineText } from '~/components/inline-text'
import { StarRating } from '~/components/star-rating'
import { cn } from '~/lib/utils'

export type HomeTestimonial = {
  id: string
  customerName: string
  tripName?: string | null
  quote: string
  rating: number
  photoUrl?: string | null
  isFeatured?: boolean
}

type HomeTestimonialCardProps = {
  item: HomeTestimonial
  isAdmin: boolean
  onUpdate: (id: string, patch: Partial<HomeTestimonial>) => void
  className?: string
}

export function HomeTestimonialCard({ item, isAdmin, onUpdate, className }: HomeTestimonialCardProps) {
  return (
    <blockquote className={cn('card home-testimonial-card h-full p-6', className)}>
      {(item.photoUrl || isAdmin) && (
        <InlineImage
          src={item.photoUrl}
          alt={item.customerName}
          className="mb-4 w-16"
          imgClassName="h-16 w-16 rounded-full object-cover ring-2 ring-primary/30"
          onChange={(url) => onUpdate(item.id, { photoUrl: url })}
        />
      )}
      <StarRating value={item.rating} onChange={(rating) => onUpdate(item.id, { rating })} />
      <p className="mt-3 text-muted">
        "
        <InlineText
          value={item.quote}
          onChange={(v) => onUpdate(item.id, { quote: v })}
          multiline
        />
        "
      </p>
      <footer className="mt-4 font-medium">
        <InlineText
          value={item.customerName}
          onChange={(v) => onUpdate(item.id, { customerName: v })}
        />
        {(item.tripName || isAdmin) && (
          <span className="block text-sm text-muted">
            <InlineText
              value={item.tripName ?? ''}
              onChange={(v) => onUpdate(item.id, { tripName: v })}
            />
          </span>
        )}
      </footer>
    </blockquote>
  )
}
