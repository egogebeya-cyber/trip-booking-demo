import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { PasswordInput } from '~/components/password-input'
import { forgotPasswordFn, resetPasswordFn } from '~/server/auth/functions'

export const Route = createFileRoute('/forgot-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { token } = Route.useSearch()
  const { t } = useLocale()
  const navigate = useNavigate()

  if (token) {
    return <ResetPasswordForm token={token} t={t} navigate={navigate} />
  }

  return <ForgotPasswordForm t={t} />
}

function ForgotPasswordForm({ t }: { t: ReturnType<typeof useLocale>['t'] }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPasswordFn({ data: { email } })
      setSent(true)
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <BackButton fallbackTo="/login" label={t('login')} className="mb-4" />
        <h1 className="font-display text-2xl font-bold">{t('forgotPassword')}</h1>
        {sent ? (
          <p className="mt-4 text-muted">
            If an account exists for that email, you will receive reset instructions shortly.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? t('loading') : t('sendMessage')}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="text-primary hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}

function ResetPasswordForm({
  token,
  t,
  navigate,
}: {
  token: string
  t: ReturnType<typeof useLocale>['t']
  navigate: ReturnType<typeof useNavigate>
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError(t('error'))
      return
    }
    setLoading(true)
    try {
      const result = await resetPasswordFn({ data: { token, password } })
      if (!result.ok) {
        setError(t('error'))
        return
      }
      navigate({ to: '/login' })
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <BackButton fallbackTo="/login" label={t('login')} className="mb-4" />
        <h1 className="font-display text-2xl font-bold">{t('resetPassword')}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              {t('password')}
            </label>
            <PasswordInput
              id="password"
              required
              minLength={8}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
              {t('password')}
            </label>
            <PasswordInput
              id="confirmPassword"
              required
              minLength={8}
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t('loading') : t('resetPassword')}
          </button>
        </form>
      </div>
    </div>
  )
}
