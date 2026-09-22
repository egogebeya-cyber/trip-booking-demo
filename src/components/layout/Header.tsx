import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Globe, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { LOCALES, localeLabels, localeNames } from '~/lib/i18n'
import type { PublicUser } from '~/lib/auth-types'
import { logoutFn } from '~/server/auth/functions'

type HeaderProps = {
  user: PublicUser | null
  settings?: { businessName?: string | null } | null
}

function BrandName({ name }: { name: string }) {
  const [first, ...rest] = name.split(' ')
  return (
    <Link to="/" className="brand-underline">
      {first}
      {rest.length > 0 && <span> {rest.join(' ')}</span>}
    </Link>
  )
}

export function Header({ user, settings }: HeaderProps) {
  const { t, locale, setLocale } = useLocale()
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showBack = pathname !== '/'
  const brand = settings?.businessName ?? 'Trip Explorer'
  const [langOpen, setLangOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!langOpen && !accountOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!langRef.current?.contains(target)) setLangOpen(false)
      if (!accountRef.current?.contains(target)) setAccountOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [langOpen, accountOpen])

  const nav = [
    { to: '/', label: t('home') },
    { to: '/trips', label: t('trips') },
    { to: '/blog', label: t('blog') },
    { to: '/contact', label: t('contact') },
  ] as const

  const menuItemClass =
    'block w-full px-3 py-2.5 text-left text-sm hover:bg-accent'

  const handleLogout = async () => {
    setAccountOpen(false)
    await logoutFn()
    await router.invalidate()
    router.navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-primary bg-background shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {showBack && <BackButton fallbackTo="/" size="sm" />}
          <BrandName name={brand} />
        </div>

        <nav className="flex w-full flex-wrap items-center gap-x-1 gap-y-2">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="nav-link-sb whitespace-nowrap">
              {item.label}
            </Link>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen((open) => !open)
                  setLangOpen(false)
                }}
                className="nav-link-sb flex items-center !px-3 !py-1.5"
                aria-label={user ? t('profile') : t('login')}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <UserRound className="h-5 w-5" />
              </button>
              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border-2 border-primary bg-card py-1 shadow-lg"
                >
                  {user ? (
                    <>
                      <Link
                        to="/account/bookings"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setAccountOpen(false)}
                      >
                        {t('myBookings')}
                      </Link>
                      <Link
                        to="/account/wishlist"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setAccountOpen(false)}
                      >
                        {t('wishlist')}
                      </Link>
                      <Link
                        to="/account"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setAccountOpen(false)}
                      >
                        {t('profile')}
                      </Link>
                      <button type="button" role="menuitem" className={menuItemClass} onClick={() => void handleLogout()}>
                        {t('logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setAccountOpen(false)}
                      >
                        {t('login')}
                      </Link>
                      <Link
                        to="/signup"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setAccountOpen(false)}
                      >
                        {t('signup')}
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangOpen((open) => !open)
                  setAccountOpen(false)
                }}
                className="nav-link-sb flex items-center gap-1 !px-3 !py-1.5"
                aria-label="Choose language"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <Globe className="h-4 w-4" />
                {localeLabels[locale]}
                <ChevronDown className={`h-3.5 w-3.5 transition ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <ul
                  role="listbox"
                  className="absolute right-0 z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border-2 border-primary bg-card py-1 shadow-lg"
                >
                  {LOCALES.map((code) => (
                    <li key={code} role="option" aria-selected={code === locale}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                          code === locale ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-accent'
                        }`}
                        onClick={() => {
                          setLocale(code)
                          setLangOpen(false)
                        }}
                      >
                        <span>{localeNames[code]}</span>
                        <span className="text-xs text-muted">{localeLabels[code]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
