import { Link, useRouterState } from '@tanstack/react-router'
import { BookOpen, Home, Mail, MapPinned } from 'lucide-react'
import { useLocale } from '~/components/locale-context'
import { cn } from '~/lib/utils'

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to || pathname === `${to}/`
  if (to === '/') return false
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function MobileBottomNav() {
  const { t } = useLocale()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const items = [
    { to: '/', label: t('home'), icon: Home, exact: true },
    { to: '/trips', label: t('trips'), icon: MapPinned },
    { to: '/blog', label: t('blog'), icon: BookOpen },
    { to: '/contact', label: t('contact'), icon: Mail },
  ] as const

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-primary bg-header/95 text-header-foreground shadow-[0_-8px_32px_var(--negus-nav-shadow)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = isActive(pathname, to, exact)
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-wide transition',
                  active ? 'text-primary' : 'text-header-muted hover:text-header-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('h-5 w-5 shrink-0', active && 'drop-shadow-[0_0_8px_rgb(212_175_55/0.55)]')} strokeWidth={active ? 2.25 : 2} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
