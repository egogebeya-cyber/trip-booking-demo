import { useState } from 'react'
import { useLocale } from '~/components/locale-context'
import { subscribeNewsletterFn } from '~/server/content/functions'
import { cn } from '~/lib/utils'

export function NewsletterSignup({ dark }: { dark?: boolean }) {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await subscribeNewsletterFn({ data: { email } })
      if (result && 'ok' in result && result.ok === false) {
        setStatus('error')
        return
      }
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div>
      <h4 className={cn('mb-3 text-sm font-semibold uppercase tracking-wide', dark ? 'text-white/60' : 'text-muted')}>
        {t('newsletter')}
      </h4>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={cn('input flex-1', dark && 'border-white/20 bg-white/10 text-white placeholder:text-white/50')}
        />
        <button type="submit" className="btn-primary shrink-0 text-sm">{t('subscribe')}</button>
      </form>
      {status === 'success' && <p className="mt-2 text-xs text-green-400">{t('newsletterSuccess')}</p>}
    </div>
  )
}
