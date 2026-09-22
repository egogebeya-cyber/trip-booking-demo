import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { AuthBackground } from '~/components/auth-background'
import { useLocale } from '~/components/locale-context'
import { VerifyEmailForm } from '~/components/verify-email-form'
import { PasswordInput } from '~/components/password-input'
import { sanitizeLoginIdentifier } from '~/lib/phone'
import { loginFn } from '~/server/auth/functions'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await loginFn({ data: { identifier, password } })
      if (!result.ok) {
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          setPendingEmail(result.email)
          return
        }
        setError(result.error === 'EMAIL_SEND_FAILED' ? t('emailSendFailed') : t('invalidLogin'))
        return
      }
      await router.invalidate()
      navigate({ to: result.user.role === 'admin' ? '/admin' : '/' })
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthBackground>
      <div className="card w-full p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">{pendingEmail ? t('verifyEmail') : t('login')}</h1>
        {pendingEmail ? (
          <VerifyEmailForm
            email={pendingEmail}
            onVerified={async (role) => {
              await router.invalidate()
              navigate({ to: role === 'admin' ? '/admin' : '/' })
            }}
          />
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="identifier" className="mb-1 block text-sm font-medium">
                  {t('emailOrPhone')}
                </label>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(sanitizeLoginIdentifier(e.target.value))}
                  className="input"
                  autoComplete="username"
                  inputMode="email"
                  maxLength={254}
                  placeholder="name@email.com or 09…"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium">
                  {t('password')}
                </label>
                <PasswordInput
                  id="password"
                  required
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                />
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? t('loading') : t('login')}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              {t('dontHaveAccount')}{' '}
              <Link to="/signup" className="text-primary hover:underline">
                {t('signup')}
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthBackground>
  )
}
