import { useState } from 'react'
import { useLocale } from '~/components/locale-context'
import { submitReviewFn } from '~/server/content/functions'

export function ReviewForm({ tripId, loggedIn }: { tripId: string; loggedIn: boolean }) {
  const { t } = useLocale()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  if (!loggedIn) {
    return (
      <p className="mt-4 text-sm text-muted">
        <a href="/login" className="text-primary hover:underline">
          {t('login')}
        </a>{' '}
        {t('writeReview').toLowerCase()}.
      </p>
    )
  }

  if (status === 'done') {
    return <p className="mt-4 text-sm text-emerald-800">{t('reviewSubmitted')}</p>
  }

  return (
    <form
      className="card mt-4 space-y-3 p-4"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!comment.trim()) return
        setStatus('saving')
        try {
          const result = await submitReviewFn({ data: { tripId, rating, comment: comment.trim() } })
          if (!result.ok) {
            setStatus('error')
            return
          }
          setStatus('done')
        } catch {
          setStatus('error')
        }
      }}
    >
      <h3 className="font-semibold">{t('writeReview')}</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`text-xl ${n <= rating ? 'text-amber-400' : 'text-border'}`}
            onClick={() => setRating(n)}
            aria-label={`${n} star`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        required
        rows={3}
        className="input"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('yourReview')}
      />
      {status === 'error' && <p className="text-sm text-destructive">{t('error')}</p>}
      <button type="submit" className="btn-primary" disabled={status === 'saving'}>
        {status === 'saving' ? t('loading') : t('submitReview')}
      </button>
    </form>
  )
}
