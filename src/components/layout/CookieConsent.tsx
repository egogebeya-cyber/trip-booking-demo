'use client'
import { useEffect, useState } from 'react'
import { useLocale } from '~/components/locale-context'

const KEY = 'trip-booking-cookies'

export function CookieConsent() {
  const { t } = useLocale()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true)
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-2xl md:border md:pb-4">
      <p className="text-sm text-muted">{t('cookieMessage')}</p>
      <button
        type="button"
        className="btn-primary mt-3 text-sm"
        onClick={() => {
          localStorage.setItem(KEY, '1')
          setShow(false)
        }}
      >
        {t('acceptCookies')}
      </button>
    </div>
  )
}
