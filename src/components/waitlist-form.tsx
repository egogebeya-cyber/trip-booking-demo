import { useState, type FormEvent } from 'react'
import { useLocale } from '~/components/locale-context'
import { PhoneInput } from '~/components/phone-input'
import { isValidEthiopianPhone } from '~/lib/phone'
import { joinWaitingListFn } from '~/server/bookings/functions'

export function WaitlistForm({
  tripId,
  dates,
}: {
  tripId: string
  dates: { id: string; date: string; spotsRemaining: number }[]
}) {
  const { t } = useLocale()
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error' | 'phone'>('idle')
  const [phone, setPhone] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const futureDates = dates.filter((d) => d.date >= today)

  if (status === 'done') {
    return <p className="mt-3 text-sm text-emerald-800">{t('waitlistThanks')}</p>
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const phoneValue = phone || String(form.get('phone') || '')
    if (phoneValue && !isValidEthiopianPhone(phoneValue)) {
      setStatus('phone')
      return
    }
    setStatus('saving')
    try {
      await joinWaitingListFn({
        data: {
          tripId,
          travelDate: String(form.get('travelDate') || ''),
          name: String(form.get('name') || ''),
          email: String(form.get('email') || ''),
          phone: phoneValue || undefined,
          guestCount: Number(form.get('guestCount') || 1),
        },
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3 rounded-xl border border-border bg-accent/40 p-4">
      <h3 className="font-semibold">{t('joinWaitlist')}</h3>
      {futureDates.length > 0 ? (
        <select name="travelDate" required className="input" defaultValue={futureDates[0]?.date || ''}>
          {futureDates.map((d) => (
            <option key={d.id} value={d.date}>
              {d.date} ({d.spotsRemaining} {t('spotsLeft')})
            </option>
          ))}
        </select>
      ) : (
        <input name="travelDate" type="date" required min={today} className="input" defaultValue={today} />
      )}
      <input name="name" required className="input" placeholder={t('fullName')} />
      <input name="email" type="email" required className="input" placeholder={t('email')} />
      <div>
        <PhoneInput name="phone" value={phone} onChange={setPhone} />
      </div>
      <input name="guestCount" type="number" min={1} defaultValue={1} className="input" />
      {status === 'error' && <p className="text-sm text-destructive">{t('error')}</p>}
      {status === 'phone' && <p className="text-sm text-destructive">{t('invalidPhone')}</p>}
      <button type="submit" className="btn-primary" disabled={status === 'saving'}>
        {status === 'saving' ? t('loading') : t('joinWaitlist')}
      </button>
    </form>
  )
}
