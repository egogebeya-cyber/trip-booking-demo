import { useState } from 'react'
import { Play } from 'lucide-react'
import type { Locale } from '~/lib/i18n'
import { getYouTubeThumbnail, getYouTubeVideoId } from '~/lib/utils'

export function formatStoryDate(value: Date | number | string | null | undefined, locale: Locale) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Show stored HTML bodies as prose without leaking tags into the story. */
export function storyPlainText(body: string) {
  return body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function JourneyFilm({
  url,
  title,
  kicker,
  playLabel,
}: {
  url: string
  title: string
  kicker: string
  playLabel: string
}) {
  const [playing, setPlaying] = useState(false)
  const videoId = getYouTubeVideoId(url)
  if (!videoId) return null
  const thumb = getYouTubeThumbnail(url)
  const embed = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`

  return (
    <figure data-reveal="" className="min-w-0 max-w-full">
      <div className="overflow-hidden rounded-3xl border border-primary/45 bg-black shadow-[0_18px_40px_rgb(0_0_0/0.28)]">
        {playing ? (
          <iframe
            src={embed}
            title={`${title} video`}
            className="aspect-video w-full max-w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="relative block aspect-video w-full max-w-full"
            aria-label={playLabel}
          >
            {thumb ? (
              <img src={thumb} alt="" className="h-full w-full object-cover opacity-80" />
            ) : (
              <span className="block h-full w-full bg-[#121212]" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/25" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#f6e39f] bg-black/55 text-[#f6e39f] shadow-[0_0_0_8px_rgb(212_175_55/0.18)]">
                <Play className="ml-1 h-7 w-7 fill-[#f6e39f]" aria-hidden />
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 min-w-0 text-sm leading-relaxed text-muted">
        <span className="font-semibold uppercase tracking-[0.16em] text-primary">{kicker}</span>
        <span className="mx-2 text-primary/50" aria-hidden>
          ·
        </span>
        <span className="break-words">{title}</span>
      </figcaption>
    </figure>
  )
}
