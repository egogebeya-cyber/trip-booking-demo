import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Mail,
  Map,
  MessageCircle,
  Plus,
  Star,
  Users,
  Wallet,
} from 'lucide-react'
import { getTripKind, tripKindClass, tripKindLabel } from '~/lib/trip-type'
import { getDashboardStatsFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    const stats = await getDashboardStatsFn()
    return { stats }
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const { stats } = Route.useLoaderData()
  const byKind = stats.byKind ?? []
  const recentBookings = stats.recentBookings ?? []
  const lowSpots = stats.lowSpots ?? []
  const today = new Date().toLocaleDateString('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const metrics = [
    {
      label: 'Paid revenue',
      value: `${Number(stats.revenue || 0).toLocaleString()} ETB`,
      hint: `${stats.paidBookings ?? 0} paid booking${stats.paidBookings === 1 ? '' : 's'}`,
      to: '/admin/bookings',
      icon: Wallet,
      tone: 'bg-emerald-50 text-emerald-800',
    },
    {
      label: 'Pending bookings',
      value: String(stats.pendingBookings),
      hint: 'Need confirmation',
      to: '/admin/bookings',
      icon: Clock,
      tone: 'bg-amber-50 text-amber-800',
    },
    {
      label: 'Unpaid',
      value: String(stats.unpaidBookings ?? 0),
      hint: 'Waiting for payment',
      to: '/admin/bookings',
      icon: AlertTriangle,
      tone: 'bg-orange-50 text-orange-800',
    },
    {
      label: 'Low spots',
      value: String(lowSpots.length),
      hint: '3 or fewer seats left',
      to: '/admin/departures',
      icon: CalendarDays,
      tone: 'bg-sky-50 text-sky-800',
    },
  ]

  const quickLinks = [
    { to: '/admin/bookings', label: 'Bookings' },
    { to: '/admin/departures', label: 'Calendar' },
    { to: '/admin/messages', label: 'Messages', count: stats.messageCount ?? 0 },
    { to: '/admin/chat', label: 'Live chat', count: stats.openChats ?? 0 },
    { to: '/admin/waiting-list', label: 'Waitlist', count: stats.waitlistCount ?? 0 },
    { to: '/admin/reviews', label: 'Reviews', count: stats.pendingReviews },
    { to: '/admin/newsletter', label: 'Notify' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">{today}</p>
          <h1 className="mt-1 font-display text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {stats.totalBookings} bookings · {stats.tripCount} trips
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/bookings" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
            All bookings
          </Link>
          <Link
            to="/admin/trips/$id"
            params={{ id: 'new' }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add trip
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="rounded-2xl border border-primary/20 bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</p>
              <span className={`rounded-lg p-1.5 ${item.tone}`}>
                <item.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-1 text-xs text-muted">{item.hint}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Paid by trip type</h2>
          <Link to="/admin/bookings" className="text-xs font-medium text-primary hover:underline">
            Open bookings
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {byKind.map((item) => (
            <Link
              key={item.kind}
              to="/admin/bookings"
              className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition hover:border-primary/40"
            >
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tripKindClass(item.kind)}`}>
                {tripKindLabel(item.kind)}
              </span>
              <p className="mt-2 text-xl font-semibold">{item.paid}</p>
              <p className="text-xs text-muted">
                {item.paidTotal.toLocaleString()} ETB · {item.count} total
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent bookings</h2>
            <Link to="/admin/bookings" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="pb-2 pr-3 font-medium">Guest</th>
                    <th className="pb-2 pr-3 font-medium">Trip</th>
                    <th className="pb-2 pr-3 font-medium">Pay</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((row) => {
                    const kind = getTripKind({
                      durationDays: row.durationDays,
                      categorySlug: row.categorySlug,
                    })
                    return (
                      <tr key={row.id} className="border-b border-border/70 last:border-0">
                        <td className="py-2.5 pr-3">
                          <div className="font-medium">{row.customerName}</div>
                          <div className="font-mono text-[11px] text-muted">{row.referenceNumber}</div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`mb-0.5 inline-flex rounded-full px-1.5 py-px text-[10px] font-semibold ${tripKindClass(kind)}`}>
                            {tripKindLabel(kind, row.durationDays)}
                          </span>
                          <div className="max-w-[180px] truncate">{row.tripTitle}</div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div>{row.totalPrice.toLocaleString()} ETB</div>
                          <div className="text-[11px] capitalize text-muted">{row.paymentStatus}</div>
                        </td>
                        <td className="py-2.5 capitalize text-muted">{row.status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-display text-lg font-semibold">Needs attention</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <AttentionLink
                to="/admin/reviews"
                icon={Star}
                label="Pending reviews"
                value={stats.pendingReviews}
              />
              <AttentionLink to="/admin/messages" icon={Mail} label="Messages" value={stats.messageCount} />
              <AttentionLink to="/admin/chat" icon={MessageCircle} label="Open live chats" value={stats.openChats ?? 0} />
              <AttentionLink to="/admin/waiting-list" icon={Users} label="Waitlist" value={stats.waitlistCount} />
              <AttentionLink to="/admin/trips" icon={Map} label="Published trips" value={stats.tripCount} />
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Low spots</h2>
              <Link to="/admin/departures" className="text-xs font-medium text-primary hover:underline">
                Calendar
              </Link>
            </div>
            {lowSpots.length === 0 ? (
              <p className="text-sm text-muted">No trips with 3 or fewer seats left.</p>
            ) : (
              <ul className="space-y-2">
                {lowSpots.map((row) => (
                  <li key={`${row.slug}-${row.date}`} className="flex items-start justify-between gap-3 rounded-xl bg-accent/70 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{row.title}</p>
                      <p className="text-xs text-muted">{row.date}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                      {row.spotsRemaining} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {link.label}
            {'count' in link && link.count > 0 ? (
              <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{link.count}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}

function AttentionLink({
  to,
  icon: Icon,
  label,
  value,
}: {
  to: '/admin/reviews' | '/admin/messages' | '/admin/waiting-list' | '/admin/trips' | '/admin/chat'
  icon: typeof Star
  label: string
  value: number
}) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-accent">
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted" />
          {label}
        </span>
        <span className="font-semibold">{value}</span>
      </Link>
    </li>
  )
}
