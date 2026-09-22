import { twMerge } from 'tailwind-merge'

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(inputs.filter(Boolean).join(' '))
}

export function parseJsonArray<T = string>(value: string | null | undefined): T[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function formatPrice(amount: number, currency = 'ETB') {
  return `${currency} ${amount.toLocaleString()}`
}

export function usdFromEtb(etb: number, usd?: number | null) {
  if (usd && usd > 0) return usd
  return Math.round(etb / 55)
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getYouTubeVideoId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)
  return match?.[1] ?? null
}

export function getYouTubeThumbnail(url: string) {
  const id = getYouTubeVideoId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

export function getYouTubeEmbedUrl(url: string, options?: { autoplay?: boolean; mute?: boolean; loop?: boolean }) {
  const id = getYouTubeVideoId(url)
  if (!id) return url
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
  })
  if (options?.autoplay) params.set('autoplay', '1')
  if (options?.mute ?? options?.autoplay) params.set('mute', '1')
  if (options?.loop) {
    params.set('loop', '1')
    params.set('playlist', id)
  }
  if (options?.autoplay) params.set('controls', '0')
  return `https://www.youtube.com/embed/${id}?${params.toString()}`
}
