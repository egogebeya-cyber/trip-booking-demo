import { useState } from 'react'
import { useLocale } from '~/components/locale-context'
import { StarRating } from '~/components/star-rating'
import { submitTestimonialFn } from '~/server/content/functions'

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read'))
    reader.readAsDataURL(file)
  })
}

export function TestimonialSubmitForm() {
  const { t } = useLocale()
  const [name, setName] = useState('')
  const [tripName, setTripName] = useState('')
  const [quote, setQuote] = useState('')
  const [rating, setRating] = useState(5)
  const [preview, setPreview] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  if (status === 'done') {
    return (
      <p className="mt-6 rounded-2xl border border-primary/20 bg-card px-4 py-6 text-sm text-emerald-800">
        {t('testimonialSubmitted')}
      </p>
    )
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setStatus('saving')
        try {
          await submitTestimonialFn({
            data: {
              customerName: name.trim(),
              tripName: tripName.trim(),
              quote: quote.trim(),
              rating,
              photoDataUrl: photoDataUrl || undefined,
            },
          })
          setStatus('done')
        } catch {
          setStatus('error')
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <label className="block cursor-pointer">
          <span className="label">{t('yourPhoto')}</span>
          {preview ? (
            <img src={preview} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-xs text-muted">
              {t('uploadPhoto')}
            </span>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 block w-full text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const dataUrl = await fileToDataUrl(file)
              setPhotoDataUrl(dataUrl)
              setPreview(dataUrl)
            }}
          />
        </label>
        <div className="space-y-3">
          <label className="block">
            <span className="label">{t('fullName')}</span>
            <input required className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </label>
          <label className="block">
            <span className="label">{t('tripYouTook')}</span>
            <input className="input" value={tripName} onChange={(e) => setTripName(e.target.value)} maxLength={80} />
          </label>
          <div>
            <span className="label">{t('reviews')}</span>
            <StarRating editable value={rating} onChange={setRating} />
          </div>
        </div>
      </div>
      <label className="mt-4 block">
        <span className="label">{t('yourQuote')}</span>
        <textarea
          required
          rows={3}
          className="input"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          maxLength={800}
        />
      </label>
      {status === 'error' && <p className="mt-2 text-sm text-destructive">{t('error')}</p>}
      <button type="submit" className="btn-primary mt-4" disabled={status === 'saving'}>
        {status === 'saving' ? t('loading') : t('submitTestimonial')}
      </button>
    </form>
  )
}
