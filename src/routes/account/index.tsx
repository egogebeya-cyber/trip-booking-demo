import { createFileRoute, useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'
import { useLocale } from '~/components/locale-context'
import { PhoneInput } from '~/components/phone-input'
import { formatLocalEthiopianPhone, isValidEthiopianPhone } from '~/lib/phone'
import { updateProfileFn } from '~/server/auth/functions'

export const Route = createFileRoute('/account/')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user } = useRouteContext({ from: '/account' })
  const { t } = useLocale()
  const [fullName, setFullName] = useState(user.fullName ?? '')
  const [phone, setPhone] = useState(user.phone ? formatLocalEthiopianPhone(user.phone) : '')
  const [message, setMessage] = useState<'success' | 'error' | 'phone' | 'invalid' | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (phone && !isValidEthiopianPhone(phone)) {
      setMessage('invalid')
      return
    }
    setLoading(true)
    try {
      const result = await updateProfileFn({ data: { fullName, phone: phone || undefined } })
      if (!result.ok) {
        setMessage(result.error === 'PHONE_EXISTS' ? 'phone' : result.error === 'INVALID_PHONE' ? 'invalid' : 'error')
        return
      }
      setMessage('success')
    } catch {
      setMessage('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card max-w-lg p-6">
      <h2 className="font-display text-xl font-semibold">{t('profile')}</h2>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {t('email')}
          </label>
          <input id="email" type="email" value={user.email} disabled className="input opacity-60" />
        </div>
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
            {t('fullName')}
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            {t('phone')}
          </label>
          <PhoneInput id="phone" value={phone} onChange={setPhone} />
        </div>
        {message === 'success' && <p className="text-sm text-green-600">{t('save')}</p>}
        {message === 'phone' && <p className="text-sm text-red-600">{t('phoneExists')}</p>}
        {message === 'invalid' && <p className="text-sm text-red-600">{t('invalidPhone')}</p>}
        {message === 'error' && <p className="text-sm text-red-600">{t('error')}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t('loading') : t('save')}
        </button>
      </form>
    </div>
  )
}
