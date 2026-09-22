import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { AuthBackground } from '~/components/auth-background'
import { useLocale } from '~/components/locale-context'
import { PasswordInput } from '~/components/password-input'
import { PhoneInput } from '~/components/phone-input'
import { VerifyEmailForm } from '~/components/verify-email-form'
import { isValidEmailFormat } from '~/lib/email'
import { isValidEthiopianPhone } from '~/lib/phone'
import { registerFn } from '~/server/auth/functions'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidEmailFormat(email)) {
      setError(t('invalidEmail'))
      return
    }
    if (!isValidEthiopianPhone(phone)) {
      setError(t('invalidPhone'))
      return
    }
    setLoading(true)
    try {
      const result = await registerFn({
        data: { email, password, fullName, phone },
      })
      if (!result.ok) {
        setError(
          result.error === 'EMAIL_EXISTS'
            ? t('emailExists')
            : result.error === 'PHONE_EXISTS'
              ? t('phoneExists')
              : result.error === 'INVALID_PHONE'
                ? t('invalidPhone')
                : result.error === 'INVALID_EMAIL_DOMAIN'
                  ? t('invalidEmailDomain')
                  : result.error === 'INVALID_EMAIL'
                    ? t('invalidEmail')
                    : result.error === 'EMAIL_SEND_FAILED'
                      ? t('emailSendFailed')
                    : t('error'),
        )
        return
      }
      setPendingEmail(result.email)
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthBackground>
      <div className="card w-full p-8">
        <h1 className="font-display text-2xl font-bold">{pendingEmail ? t('verifyEmail') : t('createAccount')}</h1>
        {pendingEmail ? (
          <VerifyEmailForm
            email={pendingEmail}
            onVerified={async () => {
              await router.invalidate()
              navigate({ to: '/' })
            }}
          />
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
                  {t('fullName')}
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">
                  {t('email')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium">
                  {t('phone')}
                </label>
                <PhoneInput
                  id="phone"
                  required
                  value={phone}
                  onChange={setPhone}
                  autoComplete="tel"
                />
              </div>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? t('loading') : t('createAccount')}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              {t('alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('login')}
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthBackground>
  )
}
