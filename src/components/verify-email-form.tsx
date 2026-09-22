import { useState } from 'react'
import { useLocale } from '~/components/locale-context'
import { resendVerificationFn, verifyEmailFn } from '~/server/auth/functions'

export function VerifyEmailForm({
  email,
  onVerified,
}: {
  email: string
  onVerified: (role: string) => void | Promise<void>
}) {
  const { t } = useLocale()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await verifyEmailFn({ data: { email, code } })
      if (!result.ok) {
        setError(t('invalidVerifyCode'))
        return
      }
      await onVerified(result.user.role)
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError('')
    setResent(false)
    try {
      await resendVerificationFn({ data: { email } })
      setResent(true)
    } catch {
      setError(t('error'))
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
      <p className="text-sm text-muted">{t('verifyEmailHint')}</p>
      <p className="text-sm font-medium">{email}</p>
      <div>
        <label htmlFor="verifyCode" className="mb-1 block text-sm font-medium">
          {t('verifyEmailCode')}
        </label>
        <input
          id="verifyCode"
          inputMode="numeric"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="input tracking-[0.3em]"
          autoComplete="one-time-code"
          placeholder="123456"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {resent && <p className="text-sm text-green-700">{t('verifyEmailSent')}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading || code.length !== 6}>
        {loading ? t('loading') : t('verifyEmail')}
      </button>
      <button type="button" className="w-full text-sm text-primary hover:underline" onClick={() => void resend()}>
        {t('resendCode')}
      </button>
    </form>
  )
}
