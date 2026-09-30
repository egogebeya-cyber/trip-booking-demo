import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Globe, Menu, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { LOCALES, localeLabels, localeNames, type Locale } from '~/lib/i18n'
import type { PublicUser } from '~/lib/auth-types'
import { BrandLogoMark } from '~/components/brand/BrandLogoMark'
import { BRAND_NAME } from '~/lib/brand'
import { logoutFn } from '~/server/auth/functions'
import { ThemeToggle } from '~/components/layout/ThemeToggle'
import { cn } from '~/lib/utils'

type HeaderProps = {
  user: PublicUser | null
  settings?: { businessName?: string | null } | null
}

function BrandMark({ name, compact, bar }: { name: string; compact?: boolean; bar?: boolean }) {
  const compactLogo = compact || bar
  return (
    <Link to="/" className="brand-mark flex min-w-0 items-center gap-2 sm:gap-2.5">
      <BrandLogoMark size={compactLogo ? 'compact' : 'header'} />
      <span
        className={cn(
          'brand-underline truncate',
          compact && 'max-w-[8.5rem] !text-[0.95rem] sm:max-w-[10rem]',
          bar && 'max-w-[14rem] !text-[1.05rem] sm:max-w-none sm:!text-[1.1rem]',
          !compact && !bar && '!text-[1.05rem] sm:!text-[1.35rem]',
        )}
      >
        {name}
      </span>
    </Link>
  )
}

function HeaderAccountMenu({
  user,
  menuItemClass,
  onLogout,
  variant,
}: {
  user: PublicUser | null
  menuItemClass: string
  onLogout: () => void
  variant: 'mobile' | 'desktop'
}) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={ref} className={cn('relative', variant === 'desktop' && 'hidden md:block')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          variant === 'mobile'
            ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground transition hover:bg-accent'
            : 'nav-link-sb flex items-center !px-3 !py-1.5'
        }
        aria-label={user ? t('profile') : t('login')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserRound className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border-2 border-primary bg-card py-1 shadow-lg"
        >
          {user ? (
            <>
              <Link to="/account/bookings" role="menuitem" className={menuItemClass} onClick={close}>
                {t('myBookings')}
              </Link>
              <Link to="/account/wishlist" role="menuitem" className={menuItemClass} onClick={close}>
                {t('wishlist')}
              </Link>
              <Link to="/account" role="menuitem" className={menuItemClass} onClick={close}>
                {t('profile')}
              </Link>
              <button type="button" role="menuitem" className={menuItemClass} onClick={() => { close(); onLogout() }}>
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" role="menuitem" className={menuItemClass} onClick={close}>
                {t('login')}
              </Link>
              <Link to="/signup" role="menuitem" className={menuItemClass} onClick={close}>
                {t('signup')}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function HeaderLangMenu({
  locale,
  setLocale,
  variant,
}: {
  locale: Locale
  setLocale: (l: Locale) => void
  variant: 'mobile' | 'desktop'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', variant === 'desktop' && 'hidden md:block')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          variant === 'mobile'
            ? 'inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-xs font-semibold text-foreground transition hover:bg-accent'
            : 'nav-link-sb flex items-center gap-1 !px-3 !py-1.5'
        }
        aria-label="Choose language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4 shrink-0" />
        {localeLabels[locale]}
        {variant === 'desktop' && (
          <ChevronDown className={cn('h-3.5 w-3.5 transition', open && 'rotate-180')} />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border-2 border-primary bg-card shadow-lg">
          <ul role="listbox" className="overflow-hidden py-1">
            {LOCALES.map((code) => (
              <li key={code} role="option" aria-selected={code === locale}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm ${
                    code === locale ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-accent'
                  }`}
                  onClick={() => {
                    setLocale(code)
                    setOpen(false)
                  }}
                >
                  <span>{localeNames[code]}</span>
                  <span className="text-xs text-muted">{localeLabels[code]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Header({ user, settings }: HeaderProps) {
  const { t, locale, setLocale } = useLocale()
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showBack = pathname !== '/'
  const brand = settings?.businessName ?? BRAND_NAME
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  const nav = [
    { to: '/', label: t('home') },
    { to: '/trips', label: t('trips') },
    { to: '/blog', label: t('blog') },
    { to: '/contact', label: t('contact') },
  ] as const

  const menuItemClass = 'block w-full px-3 py-2.5 text-left text-sm hover:bg-accent'

  const handleLogout = async () => {
    setMenuOpen(false)
    await logoutFn()
    await router.invalidate()
    router.navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-primary bg-header text-header-foreground shadow-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 md:hidden">
        {showBack ? (
          <BackButton fallbackTo="/" size="sm" className="!min-h-11 !min-w-11 shrink-0 !px-0 [&_svg]:mx-auto" label="" />
        ) : null}
        <BrandMark name={brand} compact />
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <ThemeToggle variant="mobile" />
          <HeaderAccountMenu user={user} menuItemClass={menuItemClass} onLogout={() => void handleLogout()} variant="mobile" />
          <HeaderLangMenu locale={locale} setLocale={setLocale} variant="mobile" />
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-primary transition hover:bg-accent"
            aria-label={menuOpen ? t('closeMenu') : t('menu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 top-14 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-overlay/70"
            aria-label={t('closeMenu')}
            onClick={() => setMenuOpen(false)}
          />
          <nav className="relative border-b border-primary/40 bg-card px-4 py-4 shadow-xl">
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="flex min-h-11 items-center rounded-xl px-4 text-base font-medium uppercase tracking-wide text-foreground hover:bg-accent"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <div className="mx-auto hidden h-16 max-w-7xl items-center gap-3 px-4 md:flex">
        <div className="flex shrink-0 items-center gap-2">
          {showBack ? <BackButton fallbackTo="/" size="sm" /> : null}
          <BrandMark name={brand} bar />
        </div>

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-x-0.5">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="nav-link-sb whitespace-nowrap">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle variant="desktop" />
          <HeaderAccountMenu user={user} menuItemClass={menuItemClass} onLogout={() => void handleLogout()} variant="desktop" />
          <HeaderLangMenu locale={locale} setLocale={setLocale} variant="desktop" />
        </div>
      </div>
    </header>
  )
}
