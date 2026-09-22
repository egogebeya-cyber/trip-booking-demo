import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { getCurrentUser } from '~/server/auth/functions'

export const Route = createFileRoute('/account')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
    return { user }
  },
  component: AccountLayout,
})

function AccountLayout() {
  const { user } = Route.useRouteContext()
  const { t } = useLocale()

  const nav = [
    { to: '/account' as const, label: t('profile') },
    { to: '/account/bookings' as const, label: t('myBookings') },
    { to: '/account/wishlist' as const, label: t('wishlist') },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <BackButton fallbackTo="/" className="mb-4" />
      <h1 className="font-display text-3xl font-bold">{user.fullName ?? user.email}</h1>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-border pb-4">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="btn-outline text-sm"
            activeProps={{ className: 'btn-primary text-sm' }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  )
}
