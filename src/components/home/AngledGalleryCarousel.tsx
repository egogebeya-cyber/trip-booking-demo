import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { InlineImage } from '~/components/inline-image'
import { cn } from '~/lib/utils'

type AngledGalleryCarouselProps = {
  images: string[]
  isAdmin?: boolean
  onReplace?: (index: number, url: string) => void
  onAdd?: (url: string) => void
}

/** Shortest signed distance on a circular track so cards fan left and right of center. */
function circularOffset(index: number, active: number, count: number) {
  if (count <= 0) return 0
  let offset = index - active
  const half = count / 2
  if (offset > half) offset -= count
  if (offset < -half) offset += count
  return offset
}

function cardStyle(offset: number) {
  const abs = Math.abs(offset)
  if (abs > 2) {
    return {
      transform: `translateX(${offset * 44}%) rotateY(${offset < 0 ? 42 : -42}deg) translateZ(-200px) scale(0.68)`,
      opacity: 0,
      zIndex: 0,
      pointerEvents: 'none' as const,
    }
  }

  if (offset === 0) {
    return {
      transform: 'translateX(0%) rotateY(0deg) translateZ(48px) scale(1)',
      opacity: 1,
      zIndex: 40,
      pointerEvents: 'auto' as const,
    }
  }

  const rotateY = offset < 0 ? 18 + abs * 12 : -(18 + abs * 12)
  const translateX = offset * (abs === 1 ? 48 : 78)
  const translateZ = abs === 1 ? -100 : -180
  const scale = abs === 1 ? 0.84 : 0.72
  const opacity = abs === 1 ? 0.95 : 0.5

  return {
    transform: `translateX(${translateX}%) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`,
    opacity,
    zIndex: 40 - abs * 10,
    pointerEvents: (abs === 1 ? 'auto' : 'none') as 'auto' | 'none',
  }
}

export function AngledGalleryCarousel({
  images,
  isAdmin = false,
  onReplace,
  onAdd,
}: AngledGalleryCarouselProps) {
  const showAddSlot = Boolean(isAdmin && onAdd)
  const slideCount = images.length + (showAddSlot ? 1 : 0)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (slideCount === 0) return
    setActive((current) => Math.min(current, slideCount - 1))
  }, [slideCount])

  if (slideCount === 0) return null

  const go = (dir: -1 | 1) => {
    setActive((current) => (current + dir + slideCount) % slideCount)
  }

  return (
    <div className="relative mt-2">
      <div
        className="relative mx-auto h-[24rem] w-full max-w-6xl sm:h-[28rem] md:h-[32rem]"
        style={{ perspective: '1600px', perspectiveOrigin: '50% 48%' }}
      >
        <div className="relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
          {Array.from({ length: slideCount }, (_, i) => {
            const isAdd = showAddSlot && i === images.length
            const src = isAdd ? undefined : images[i]
            const offset = circularOffset(i, active, slideCount)
            const style = cardStyle(offset)
            const isCenter = offset === 0

            return (
              <div
                key={isAdd ? 'add-slot' : `${src}-${i}`}
                role={isCenter ? undefined : 'button'}
                tabIndex={isCenter ? undefined : 0}
                aria-label={isAdd ? 'Add gallery photo' : `Gallery photo ${i + 1}`}
                aria-current={isCenter || undefined}
                className={cn(
                  'absolute left-1/2 top-1/2 w-[min(70vw,18rem)] origin-center overflow-hidden rounded-[1.6rem] border bg-[#0c0a07] shadow-[0_24px_60px_rgb(0_0_0/0.55)] transition-[transform,opacity,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[20rem] md:w-[22rem]',
                  isCenter
                    ? 'border-primary/80 shadow-[0_28px_70px_rgb(212_175_55/0.28)]'
                    : 'cursor-pointer border-primary/30',
                )}
                style={{
                  transform: `translate(-50%, -50%) ${style.transform}`,
                  opacity: style.opacity,
                  zIndex: style.zIndex,
                  pointerEvents: style.pointerEvents,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
                onClick={() => {
                  if (!isCenter) setActive(i)
                }}
                onKeyDown={(e) => {
                  if (!isCenter && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    setActive(i)
                  }
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-primary/25 bg-black/55 px-4 py-2 backdrop-blur-[2px]">
                  <span className="font-display text-[0.65rem] tracking-[0.22em] text-primary">Negus</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                  <span className="font-display text-[0.65rem] tracking-[0.22em] text-primary">Events</span>
                </div>

                <div className="relative">
                  <InlineImage
                    src={src}
                    alt=""
                    imgClassName="aspect-[4/5] w-full object-cover"
                    onChange={
                      isAdd
                        ? onAdd
                        : onReplace
                          ? (url) => onReplace(i, url)
                          : undefined
                    }
                  />
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 border-t border-primary/25 bg-gradient-to-t from-black via-black/70 to-transparent px-4 pb-3 pt-12">
                  <p className="font-display text-xs uppercase tracking-[0.22em] text-primary">
                    {isAdd ? 'Add photo' : `Trip frame ${String(i + 1).padStart(2, '0')}`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {slideCount > 1 && (
        <div className="relative z-40 mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Previous gallery photo"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/50 text-primary transition hover:border-primary hover:bg-primary/10"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: slideCount }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to gallery photo ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === active ? 'w-7 bg-primary' : 'w-2 bg-primary/35 hover:bg-primary/60',
                )}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next gallery photo"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/50 text-primary transition hover:border-primary hover:bg-primary/10"
            onClick={() => go(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
