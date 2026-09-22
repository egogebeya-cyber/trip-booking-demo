import { Star } from 'lucide-react'
import { cn } from '~/lib/utils'
import { useOptionalSiteEdit } from '~/components/site-edit-context'

type StarRatingProps = {
  value: number
  onChange?: (rating: number) => void
  className?: string
  editable?: boolean
}

export function StarRating({ value, onChange, className, editable }: StarRatingProps) {
  const edit = useOptionalSiteEdit()
  const canEdit = Boolean(onChange && (editable || edit?.isAdmin))
  const rating = Math.min(5, Math.max(0, value))

  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rating
        const star = (
          <Star
            className={cn('h-4 w-4', filled ? 'fill-amber-400 text-amber-400' : 'text-border')}
          />
        )
        if (!canEdit) {
          return <span key={i}>{star}</span>
        }
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1} star${i === 0 ? '' : 's'}`}
            className="rounded p-0.5 hover:scale-110"
            onClick={() => onChange!(i + 1)}
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}
