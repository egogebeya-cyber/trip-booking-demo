import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn, getYouTubeEmbedUrl, getYouTubeThumbnail, getYouTubeVideoId } from '~/lib/utils'

/** Drop your MP4 at `public/videos/hero-travel.mp4` (served as `/videos/hero-travel.mp4`). */
export const DEFAULT_HOME_PROMO_VIDEO = '/videos/hero-travel.mp4?v=2'

type HomePromoVideoProps = {
  videoUrl: string
  /** Site settings hero video (YouTube or MP4) when local `/videos/hero-travel.mp4` fails. */
  fallbackVideoUrl?: string | null
  posterUrl?: string | null
  title: ReactNode
  desc?: ReactNode
  isAdmin?: boolean
  onVideoUrlChange?: (url: string) => void
  className?: string
}

function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm)(\?|$)/i.test(url.trim())
}

function pickInitialSrc(videoUrl: string) {
  const trimmed = videoUrl.trim()
  return trimmed || DEFAULT_HOME_PROMO_VIDEO
}

export function HomePromoVideo({
  videoUrl,
  fallbackVideoUrl,
  posterUrl,
  title,
  desc,
  isAdmin,
  onVideoUrlChange,
  className,
}: HomePromoVideoProps) {
  const initialSrc = pickInitialSrc(videoUrl)
  const [activeSrc, setActiveSrc] = useState(initialSrc)
  const [useIframe, setUseIframe] = useState(() => {
    const src = pickInitialSrc(videoUrl)
    return !isDirectVideoUrl(src) && Boolean(getYouTubeVideoId(src))
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const errorStageRef = useRef(0)

  useEffect(() => {
    const next = pickInitialSrc(videoUrl)
    errorStageRef.current = 0
    if (!isDirectVideoUrl(next) && getYouTubeVideoId(next)) {
      setUseIframe(true)
      setActiveSrc(next)
      return
    }
    setUseIframe(false)
    setActiveSrc(next)
  }, [videoUrl])

  useEffect(() => {
    if (useIframe) return
    const el = videoRef.current
    if (!el) return
    const play = () => {
      void el.play().catch(() => {})
    }
    if (el.readyState >= 2) play()
    else el.addEventListener('loadeddata', play, { once: true })
    return () => el.removeEventListener('loadeddata', play)
  }, [activeSrc, useIframe])

  const handleVideoError = useCallback(() => {
    if (errorStageRef.current > 0) return
    errorStageRef.current = 1

    const fallback = fallbackVideoUrl?.trim() ?? ''
    if (!fallback || fallback === activeSrc) return

    if (isDirectVideoUrl(fallback)) {
      setUseIframe(false)
      setActiveSrc(fallback)
      return
    }

    const embed = getYouTubeEmbedUrl(fallback, { autoplay: true, mute: true, loop: true })
    if (embed && embed.includes('youtube.com/embed/')) {
      setUseIframe(true)
      setActiveSrc(fallback)
    }
  }, [activeSrc, fallbackVideoUrl])

  const embedUrl = useIframe
    ? getYouTubeEmbedUrl(activeSrc, { autoplay: true, mute: true, loop: true })
    : null
  const poster =
    posterUrl?.trim() || (embedUrl ? getYouTubeThumbnail(activeSrc) : undefined)

  return (
    <section data-reveal="" className={cn('mx-auto max-w-7xl px-4 py-12 md:py-24', className)}>
      <div className="mb-10 text-center">
        <h2 className="section-heading">{title}</h2>
        {desc ? (
          <div className="mx-auto mt-2 max-w-2xl text-[1.05rem] leading-8 text-muted">{desc}</div>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-primary/45 bg-card shadow-[0_0_48px_rgb(212_175_55/0.12)] ring-1 ring-primary/25">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_0%,rgb(212_175_55/0.14),transparent_55%)]" />
        <div className="aspect-video w-full bg-black">
          {useIframe && embedUrl ? (
            <iframe
              src={embedUrl}
              title="Negus Events travel video"
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              key={activeSrc}
              className="h-full w-full object-cover"
              src={activeSrc}
              poster={poster ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={handleVideoError}
            />
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      {isAdmin && onVideoUrlChange ? (
        <label className="mt-4 block text-sm">
          <span className="label">Homepage video URL</span>
          <input
            className="input mt-1"
            placeholder="YouTube link or /videos/hero-travel.mp4"
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value)}
          />
          <span className="mt-1 block text-xs text-muted">
            Self-hosted: add an MP4 to <code className="text-primary">public/videos/hero-travel.mp4</code>
          </span>
        </label>
      ) : null}
    </section>
  )
}
