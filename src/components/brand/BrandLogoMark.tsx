import { BRAND_LOGO_PATH } from '~/lib/brand'
import { cn } from '~/lib/utils'

const sizeClasses = {
  compact: 'h-10 w-10',
  header: 'h-12 w-12 sm:h-14 sm:w-14',
  hero: 'h-40 w-40 sm:h-48 sm:w-48',
} as const

/** Thin site ring only — crest art already includes its own gold double ring. */
const frameClasses = {
  compact: 'ring-1 ring-primary',
  header: 'ring-1 ring-primary',
  hero: 'ring-1 ring-primary shadow-[0_0_40px_rgb(212_175_55/0.35)]',
} as const

/** 2× CSS box size for crisp downscale from 640px master. */
const intrinsicSize = {
  compact: 80,
  header: 112,
  hero: 384,
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
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-logo-fill',
        sizeClasses[size],
        frameClasses[size],
        className,
      )}
    >
      <img
        src={BRAND_LOGO_PATH}
        alt={alt}
        className={cn(
          'h-full w-full object-contain',
        )}
        width={px}
        height={px}
        decoding="async"
        fetchPriority={size === 'hero' ? 'high' : undefined}
      />
    </span>
  )
}
