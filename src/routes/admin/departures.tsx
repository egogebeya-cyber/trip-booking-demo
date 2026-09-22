import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { getTripKind, tripKindClass, tripKindLabel } from '~/lib/trip-type'
import { listDeparturesFn } from '~/server/admin/functions'

type When = 'completed' | 'new' | 'future'

export const Route = createFileRoute('/admin/departures')({
  loader: async () => {
    const departures = await listDeparturesFn()
    return { departures }
  },
  component: AdminDeparturesPage,
})

function ethiopiaToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Addis_Ababa' })
}

function whenForDate(date: string, today: string): When {
  if (date < today) return 'completed'
  if (date === today) return 'new'
  return 'future'
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const SECTIONS: { id: When | 'all'; label: string; hint: string }[] = [
  { id: 'all', label: 'All', hint: 'Past, today, and upcoming' },
  { id: 'new', label: 'New', hint: 'Departing today' },
  { id: 'future', label: 'Future', hint: 'Upcoming dates' },
  { id: 'completed', label: 'Completed', hint: 'Already ran' },
]

function AdminDeparturesPage() {
  const { departures } = Route.useLoaderData()
  const today = ethiopiaToday()
  const [filter, setFilter] = useState<When | 'all'>('all')

  const buckets = useMemo(() => {
    const empty = { completed: [] as typeof departures, new: [] as typeof departures, future: [] as typeof departures }
    for (const row of departures) {
      empty[whenForDate(row.date, today)].push(row)
    }
    return empty
  }, [departures, today])

  const counts = {
    completed: buckets.completed.length,
    new: buckets.new.length,
    future: buckets.future.length,
  }

  const visibleKeys: When[] =
    filter === 'all' ? ['new', 'future', 'completed'] : [filter]

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Departure calendar</h1>
          <p className="mt-1 text-sm text-muted">
            Today in Ethiopia: <span className="font-medium text-foreground">{formatDate(today)}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SECTIONS.map((section) => {
          const count = section.id === 'all' ? departures.length : counts[section.id]
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setFilter(section.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === section.id ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'
              }`}
            >
              {section.label}
              <span className="ml-1.5 opacity-80">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 space-y-8">
        {visibleKeys.map((key) => (
          <DepartureSection
            key={key}
            when={key}
            today={today}
            rows={buckets[key]}
          />
        ))}
      </div>
    </div>
  )
}

function DepartureSection({
  when,
  today,
  rows,
}: {
  when: When
  today: string
  rows: Awaited<ReturnType<typeof listDeparturesFn>>
}) {
  const title = when === 'new' ? 'New · today' : when === 'future' ? 'Future' : 'Completed'
  const empty =
    when === 'new'
      ? 'No trips departing today.'
      : when === 'future'
        ? 'No upcoming dates.'
        : 'No completed trips in the last 6 months.'

  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const list = grouped.get(row.date) ?? []
    list.push(row)
    grouped.set(row.date, list)
  }

  const dates = [...grouped.keys()].sort((a, b) => (when === 'completed' ? b.localeCompare(a) : a.localeCompare(b)))

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="text-xs text-muted">{rows.length} departure{rows.length === 1 ? '' : 's'}</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-sm text-muted">{empty}</p>
      ) : (
        <div className="space-y-3">
          {dates.map((date) => (
            <div
              key={`${when}-${date}`}
              className={`rounded-2xl border bg-card p-4 shadow-sm ${
                when === 'new' ? 'border-primary' : when === 'completed' ? 'border-border opacity-80' : 'border-border'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{formatDate(date)}</h3>
                {date === today ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    Today
                  </span>
                ) : when === 'completed' ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    Completed
                  </span>
                ) : null}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {(grouped.get(date) ?? []).map((row) => {
                  const kind = getTripKind({ durationDays: row.durationDays, categorySlug: row.categorySlug })
                  return (
                    <li key={`${row.tripSlug}-${row.date}`} className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tripKindClass(kind)}`}>
                          {tripKindLabel(kind, row.durationDays)}
                        </span>
                        <Link to="/trips/$slug" params={{ slug: row.tripSlug }} className="text-primary hover:underline">
                          {row.tripTitle}
                        </Link>
                      </div>
                      <span
                        className={
                          row.isBlocked
                            ? 'text-muted'
                            : row.spotsRemaining <= 3 && when !== 'completed'
                              ? 'font-medium text-destructive'
                              : 'text-muted'
                        }
                      >
                        {row.isBlocked ? 'Blocked' : when === 'completed' ? 'Completed' : `${row.spotsRemaining} seats left`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
