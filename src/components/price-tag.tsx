import { formatPrice, usdFromEtb } from '~/lib/utils'

export function PriceTag({
  etb,
  usd,
  className,
  size = 'md',
}: {
  etb: number
  usd?: number | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const etbClass = size === 'lg' ? 'text-3xl font-bold text-price' : size === 'sm' ? 'text-sm font-semibold text-price' : 'text-lg font-semibold text-price'
  return (
    <span className={className}>
      <span className={etbClass}>{formatPrice(etb)}</span>
      <span className="ml-1.5 text-xs text-muted">{formatPrice(usdFromEtb(etb, usd), 'USD')}</span>
    </span>
  )
}
