import { useEffect, useState } from 'react'
import { cn, getYouTubeEmbedUrl } from '~/lib/utils'
import { uploadImageFile } from '~/components/inline-image'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
  'https://images.unsplash.com/photo-1548013146-72479768bada?w=1600&q=80',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80',
]

type HeroSlideshowProps = {
  images?: string[]
  videoUrl?: string | null
  intervalMs?: number
  className?: string
  children: React.ReactNode
  onReplaceSlide?: (index: number, url: string) => void
}

export function HeroSlideshow({
  images,
  videoUrl,
  intervalMs = 5000,
  className,
  children,
  onReplaceSlide,
}: HeroSlideshowProps) {
  const slides = (images?.filter(Boolean).length ? images.filter(Boolean) : FALLBACK_IMAGES) as string[]
  const [index, setIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const isDirectVideo = Boolean(videoUrl && /\.(mp4|webm)(\?|$)/i.test(videoUrl))
  const embedUrl =
    videoUrl && !isDirectVideo
      ? getYouTubeEmbedUrl(videoUrl, { autoplay: true, mute: true, loop: true })
      : null

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [slides.length, intervalMs])

  return (
    <section className={cn('relative min-h-[22rem] overflow-hidden px-4 py-16 text-white md:min-h-[34rem] md:py-28', className)}>
      {isDirectVideo && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl!}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      {embedUrl && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <iframe
            src={embedUrl}
            title="Trip video"
            className="absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 border-0"
            allow="autoplay; encrypted-media"
          />
        </div>
      )}
      {slides.map((src, i) => (
        <div
          key={src}
          className={cn(
            'absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out',
            embedUrl ? (i === index ? 'opacity-40' : 'opacity-0') : i === index ? 'opacity-100' : 'opacity-0',
          )}
          style={{ backgroundImage: `url(${src})` }}
          aria-hidden={i !== index}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/55 to-black/75" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">{children}</div>

      {onReplaceSlide && (
        <label className="absolute right-4 top-4 z-20 cursor-pointer rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow">
          {uploading ? 'Uploading...' : 'Change this photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setUploading(true)
              try {
                const url = await uploadImageFile(file)
                onReplaceSlide(index, url)
              } finally {
                setUploading(false)
              }
            }}
          />
        </label>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80',
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
