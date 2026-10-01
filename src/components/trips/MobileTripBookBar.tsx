import { Link } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from '~/components/locale-context'
import { PriceTag } from '~/components/price-tag'

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

type MobileTripBookBarProps = {
  slug: string
  price: number
  priceUsd?: number | null
}

export function MobileTripBookBar({ slug, price, priceUsd }: MobileTripBookBarProps) {
  const { t } = useLocale()
  const [host, setHost] = useState<HTMLElement | null>(null)

  useIsoLayoutEffect(() => {
    setHost(document.body)
  }, [])

  const bar = (
    <div
      className="fixed inset-x-0 z-40 w-full max-w-full border-t border-primary/50 bg-black/95 px-4 py-3 shadow-[0_-12px_40px_rgb(0_0_0/0.5)] backdrop-blur-md md:hidden"
      style={{ bottom: 'var(--mobile-nav-height, 4.25rem)' }}
    >
      <div className="mx-auto flex w-full min-w-0 max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted">{t('from')}</p>
          <PriceTag etb={price} usd={priceUsd} size="sm" className="block max-w-full break-words" />
        </div>
        <Link
          to="/trips/$slug/book"
          params={{ slug }}
          className="btn-primary shrink-0 px-5 py-3.5 text-sm"
        >
          {t('bookNow')}
        </Link>
      </div>
    </div>
  )

  if (host) return createPortal(bar, host)
  return bar
}
