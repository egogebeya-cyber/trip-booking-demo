import { Heart } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useLocale } from '~/components/locale-context'
import { cn } from '~/lib/utils'
import { toggleWishlistFn } from '~/server/content/functions'

export function WishlistButton({
  tripId,
  loggedIn,
  initial,
  className,
}: {
  tripId: string
  loggedIn: boolean
  initial?: boolean
  className?: string
}) {
  const { t } = useLocale()
  const [on, setOn] = useState(Boolean(initial))
  const [busy, setBusy] = useState(false)

  if (!loggedIn) {
    return (
      <Link
        to="/login"
        className={cn('btn-outline text-sm', className)}
        title={t('addToWishlist')}
      >
        <Heart className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">{t('addToWishlist')}</span>
      </Link>
    )
  }

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    try {
      const result = await toggleWishlistFn({ data: { tripId } })
      if (result.ok) setOn(result.added)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      className={cn('btn-outline text-sm', className)}
      aria-pressed={on}
      title={on ? t('removeFromWishlist') : t('addToWishlist')}
    >
      <Heart className={cn('h-4 w-4', on && 'fill-destructive text-destructive')} />
      <span className="ml-1 hidden sm:inline">{on ? t('removeFromWishlist') : t('addToWishlist')}</span>
    </button>
  )
}
