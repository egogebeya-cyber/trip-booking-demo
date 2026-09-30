import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '~/lib/utils'

const AUTO_INTERVAL_MS = 10_000
const RESUME_AFTER_TOUCH_MS = 4_000
const SWIPE_THRESHOLD_PX = 48

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

type TestimonialsCarouselProps = {
  slideCount: number
  children: ReactNode
  className?: string
}

export function TestimonialsCarousel({
  slideCount,
  children,
  className,
}: TestimonialsCarouselProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()
  const pointerActiveRef = useRef(false)
  const resumeTimeoutRef = useRef<number | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const focusWithinRef = useRef(false)

  const clampIndex = useCallback(
    (next: number) => {
      if (slideCount <= 0) return 0
      return ((next % slideCount) + slideCount) % slideCount
    },
    [slideCount],
  )

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((current) => clampIndex(current + dir))
    },
    [clampIndex],
  )

  useEffect(() => {
    if (slideCount === 0) return
    setIndex((current) => Math.min(current, slideCount - 1))
  }, [slideCount])

  const clearResumeTimeout = () => {
    if (resumeTimeoutRef.current != null) {
      window.clearTimeout(resumeTimeoutRef.current)
      resumeTimeoutRef.current = null
    }
  }

  const scheduleResume = useCallback(() => {
    clearResumeTimeout()
    if (pointerActiveRef.current || focusWithinRef.current) return
    resumeTimeoutRef.current = window.setTimeout(() => {
      setPaused(false)
      resumeTimeoutRef.current = null
    }, RESUME_AFTER_TOUCH_MS)
  }, [])

  const pause = useCallback(() => {
    clearResumeTimeout()
    setPaused(true)
  }, [])

  useEffect(() => {
    if (slideCount <= 1 || paused || prefersReducedMotion) return
    const id = window.setInterval(() => {
      setIndex((current) => clampIndex(current + 1))
    }, AUTO_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [slideCount, paused, prefersReducedMotion, clampIndex])

  useEffect(() => () => clearResumeTimeout(), [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    pointerActiveRef.current = true
    touchStartXRef.current = e.clientX
    pause()
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const startX = touchStartXRef.current
    touchStartXRef.current = null
    pointerActiveRef.current = false

    if (startX != null && slideCount > 1) {
      const delta = e.clientX - startX
      if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
        go(delta > 0 ? -1 : 1)
      }
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    scheduleResume()
  }

  const onPointerCancel = () => {
    touchStartXRef.current = null
    pointerActiveRef.current = false
    scheduleResume()
  }

  const onFocusCapture = () => {
    focusWithinRef.current = true
    pause()
  }

  const onBlurCapture = (e: React.FocusEvent) => {
    const next = e.currentTarget.contains(e.relatedTarget as Node | null)
    focusWithinRef.current = next
    if (!next && !pointerActiveRef.current) scheduleResume()
  }

  if (slideCount === 0) return null

  /** Slide width (88%) plus gap-4 (1rem). */
  const stepExpr = 'calc(88% + 1rem)'

  return (
    <div className={cn('relative', className)}>
      <div
        className="overflow-hidden"
        role="region"
        aria-roledescription="carousel"
        aria-label="Testimonials"
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
      >
        <div
          className={cn(
            'flex touch-pan-y gap-4 will-change-transform',
            prefersReducedMotion ? '' : 'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          )}
          style={{ transform: `translateX(calc(-${index} * (${stepExpr})))` }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={(e) => {
            if (pointerActiveRef.current && e.buttons === 0) {
              pointerActiveRef.current = false
              scheduleResume()
            }
          }}
        >
          {children}
        </div>
      </div>
      {slideCount > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: slideCount }, (_, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                i === index ? 'bg-primary' : 'bg-primary/30',
              )}
              onClick={() => {
                setIndex(i)
                pause()
                scheduleResume()
              }}
              aria-label={`Show testimonial ${i + 1}`}
            />
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        Testimonial {index + 1} of {slideCount}
      </p>
    </div>
  )
}
