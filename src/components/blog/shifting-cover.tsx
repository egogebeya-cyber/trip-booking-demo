import { useEffect, useMemo, useRef, useState } from 'react'
import { cn, parseJsonArray } from '~/lib/utils'

/** Existing trip and blog photos already used in the project. */
export const SAMPLE_COVER_PHOTOS = [
  '/uploads/wenchi-crater-lake.jpg',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
  'https://images.unsplash.com/photo-1548013146-72479768bada?w=1600&q=80',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80',
  'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
  'https://images.unsplash.com/photo-1528702748617-c82ea734d5b5?w=800',
  'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800',
  'https://images.unsplash.com/photo-1534177616071-bef006cf8186?w=800',
  'https://images.unsplash.com/photo-1484318571209-661cf29a69c3?w=800',
  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200',
  'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  'https://images.unsplash.com/photo-1484406566174-9da000314829?w=800',
]

const SHIFT_MS = 500
const FADE_MS = 200

export type CoverPhotoPost = {
  coverImageUrl?: string | null
  /** JSON string or URL list, same shape as trip galleries. */
  galleryUrls?: string | string[] | null
  gallery?: string[] | null
  images?: string[] | null
}

function cleanUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
  }
  if (typeof value === 'string') {
    return parseJsonArray<unknown>(value)
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
  }
  return []
}

function unique(urls: string[]) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const url of urls) {
    if (seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

/** Prefer a post's own gallery. Otherwise cycle the shared sample set. */
export function photosForCover(post: CoverPhotoPost): string[] {
  const own = unique([...cleanUrls(post.images), ...cleanUrls(post.gallery), ...cleanUrls(post.galleryUrls)])
  if (own.length > 0) return own
  return SAMPLE_COVER_PHOTOS
}

function offsetFor(seed: string, count: number) {
  if (count <= 1) return 0
  let n = 0
  for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i) * (i + 3)) % count
  return n
}

export function ShiftingCover({
  post,
  seed,
  className,
}: {
  post: CoverPhotoPost
  seed: string
  className?: string
}) {
  const ownKey = JSON.stringify({
    images: post.images ?? null,
    gallery: post.gallery ?? null,
    galleryUrls: post.galleryUrls ?? null,
  })
  const sources = useMemo(() => photosForCover(post), [ownKey])
  const count = sources.length
  const start = offsetFor(seed, count)
  const still = post.coverImageUrl?.trim() || sources[start] || ''
  const rootRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(start)
  const busyRef = useRef(false)
  const [reduced, setReduced] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const [index, setIndex] = useState(start)
  const [incoming, setIncoming] = useState<number | null>(null)
  const [incomingReady, setIncomingReady] = useState(false)

  useEffect(() => {
    indexRef.current = start
    busyRef.current = false
    setIndex(start)
    setIncoming(null)
    setIncomingReady(false)
  }, [start, ownKey])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const sync = () => setTabVisible(document.visibilityState !== 'hidden')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  useEffect(() => {
    const node = rootRef.current
    if (!node || reduced) return
    const observer = new IntersectionObserver(([entry]) => {
      setOnScreen(entry?.isIntersecting ?? false)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduced])

  useEffect(() => {
    if (reduced || !onScreen || !tabVisible) {
      busyRef.current = false
      setIncoming(null)
      setIncomingReady(false)
    }
  }, [reduced, onScreen, tabVisible])

  useEffect(() => {
    if (reduced || !onScreen || !tabVisible || count < 2) return
    const timer = window.setInterval(() => {
      if (busyRef.current) return
      const next = (indexRef.current + 1) % count
      busyRef.current = true
      setIncoming(next)
      setIncomingReady(false)
    }, SHIFT_MS)
    return () => window.clearInterval(timer)
  }, [reduced, onScreen, tabVisible, count])

  useEffect(() => {
    if (incoming == null) return
    let cancelled = false
    const img = new Image()
    const ready = () => {
      if (!cancelled) setIncomingReady(true)
    }
    img.onload = ready
    img.onerror = () => {
      if (cancelled) return
      indexRef.current = incoming
      busyRef.current = false
      setIncoming(null)
      setIncomingReady(false)
    }
    img.src = sources[incoming]
    if (img.complete && img.naturalWidth > 0) ready()
    return () => {
      cancelled = true
    }
  }, [incoming, sources])

  useEffect(() => {
    if (incoming == null || !incomingReady) return
    const timer = window.setTimeout(() => {
      indexRef.current = incoming
      busyRef.current = false
      setIndex(incoming)
      setIncoming(null)
      setIncomingReady(false)
    }, FADE_MS)
    return () => window.clearTimeout(timer)
  }, [incoming, incomingReady])

  useEffect(() => {
    if (!onScreen || reduced || count < 2) return
    const preload = new Image()
    preload.src = sources[(index + 1) % count]
  }, [onScreen, reduced, index, count, sources])

  const currentSrc = sources[index] || still
  const incomingSrc = incoming == null ? null : sources[incoming]

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-[#121212]', className)}
    >
      {reduced || !currentSrc ? (
        still ? (
          <img src={still} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,#3a2e12,#121212_62%)]" />
        )
      ) : (
        <>
          <img src={currentSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {incomingSrc ? (
            <img
              src={incomingSrc}
              alt=""
              onLoad={() => setIncomingReady(true)}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ease-out',
                incomingReady ? 'opacity-100' : 'opacity-0',
              )}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
