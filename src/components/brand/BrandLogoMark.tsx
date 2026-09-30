import { BRAND_LOGO_PATH } from '~/lib/brand'
import { cn } from '~/lib/utils'

const sizeClasses = {
  compact: 'h-10 w-10',
  header: 'h-12 w-12 sm:h-14 sm:w-14',
  hero: 'h-40 w-40 sm:h-48 sm:w-48',
} as const

const frameClasses = {
  compact: 'ring-2 ring-primary',
  header: 'ring-2 ring-primary',
  hero: 'ring-2 ring-primary shadow-[0_0_40px_rgb(212_175_55/0.35)]',
} as const

const intrinsicSize = {
  compact: 40,
  header: 56,
  hero: 192,
} as const

type BrandLogoMarkProps = {
  size?: keyof typeof sizeClasses
  className?: string
  alt?: string
}

export function BrandLogoMark({ size = 'header', className, alt = '' }: BrandLogoMarkProps) {
  const px = intrinsicSize[size]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        sizeClasses[size],
        frameClasses[size],
        className,
      )}
    >
      <img
        src={BRAND_LOGO_PATH}
        alt={alt}
        className="h-full w-full object-contain"
        width={px}
        height={px}
        decoding="async"
      />
    </span>
  )
}
