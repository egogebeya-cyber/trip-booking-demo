import { Link, Outlet, createFileRoute, redirect, useRouter, useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { BackButton } from '~/components/back-button'
import { getCurrentUser, logoutFn } from '~/server/auth/functions'
import type { PublicUser } from '~/lib/auth-types'

type AdminContextValue = { admin: PublicUser | null }

const AdminContext = createContext<AdminContextValue>({ admin: null })

export function useAdmin() {
  return useContext(AdminContext)
}

function AdminProvider({ admin, children }: { admin: PublicUser | null; children: ReactNode }) {
  return <AdminContext.Provider value={{ admin }}>{children}</AdminContext.Provider>
}

const NAV_GROUPS = [
  {
    label: 'Work',
    items: [
      { to: '/admin', label: 'Dashboard', exact: true },
      { to: '/admin/bookings', label: 'Bookings' },
      { to: '/admin/departures', label: 'Calendar' },
      { to: '/admin/messages', label: 'Messages' },
      { to: '/admin/chat', label: 'Live chat' },
      { to: '/admin/waiting-list', label: 'Waitlist' },
      { to: '/admin/reviews', label: 'Reviews' },
    ],
  },
  {
    label: 'Trips',
    items: [
      { to: '/admin/trips', label: 'All trips' },
      { to: '/admin/categories', label: 'Categories' },
      { to: '/admin/promos', label: 'Promo codes' },
      { to: '/admin/newsletter', label: 'Notify' },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/admin/homepage', label: 'Homepage' },
      { to: '/admin/team', label: 'Team' },
      { to: '/admin/blog', label: 'Blog' },
      { to: '/admin/faq', label: 'FAQ' },
      { to: '/admin/testimonials', label: 'Testimonials' },
      { to: '/admin/legal', label: 'Legal' },
    ],
  },
] as const

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    if (location.pathname === '/admin/login') {
      return { admin: null }
    }
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      throw redirect({ to: '/admin/login' })
    }
    return { admin: user }
  },
  component: AdminLayout,
})

function AdminNav({
  admin,
  onNavigate,
  onLogout,
}: {
  admin: PublicUser | null
  onNavigate?: () => void
  onLogout: () => void
}) {
  return (
    <>
      <div className="mb-6">
        <Link to="/admin" className="font-display text-lg font-semibold text-white" onClick={onNavigate}>
          Admin
        </Link>
        {admin && <p className="mt-1 truncate text-xs text-white/60">{admin.email}</p>}
      </div>
      <nav className="space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/45">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="admin-link"
                  activeOptions={'exact' in item && item.exact ? { exact: true } : undefined}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-6 space-y-1 border-t border-white/15 pt-4">
        <Link to="/admin/settings" className="admin-link" onClick={onNavigate}>
          Settings
        </Link>
        <Link to="/" className="admin-link text-white/70" onClick={onNavigate}>
          View Site
        </Link>
        <button type="button" onClick={onLogout} className="admin-link w-full text-left text-white/70">
          Logout
        </button>
      </div>
    </>
  )
}

function AdminLayout() {
  const { admin } = Route.useRouteContext()
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isLogin = pathname === '/admin/login'
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  if (isLogin) {
    return (
      <AdminProvider admin={null}>
        <Outlet />
      </AdminProvider>
    )
  }

  const handleLogout = async () => {
    await logoutFn()
    router.invalidate()
    router.navigate({ to: '/admin/login' })
  }

  return (
    <AdminProvider admin={admin}>
      <div className="flex min-h-dvh bg-background">
        {navOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-[#1e3d28] p-4 text-white shadow-lg transition-transform md:static md:z-0 md:w-60 md:translate-x-0 ${
            navOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <AdminNav admin={admin} onNavigate={() => setNavOpen(false)} onLogout={() => void handleLogout()} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex items-center gap-3 border-b border-border bg-[#1e3d28] px-4 py-3 text-white md:hidden">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"
              aria-label="Open menu"
              onClick={() => setNavOpen(true)}
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="font-display font-semibold">Admin</span>
          </div>
          <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
            {pathname !== '/admin' && (
              <div className="mb-4">
                <BackButton fallbackTo="/admin" />
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </AdminProvider>
  )
}
