import { createFileRoute } from '@tanstack/react-router'
import { listWaitingListFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/waiting-list')({
  loader: async () => {
    const entries = await listWaitingListFn()
    return { entries }
  },
  component: AdminWaitingListPage,
})

function AdminWaitingListPage() {
  const { entries } = Route.useLoaderData()

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Waiting List</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2 pr-4">Trip</th>
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Guests</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ entry, trip }) => (
              <tr key={entry.id} className="border-b border-border">
                <td className="py-3 pr-4">{trip.title}</td>
                <td className="py-3 pr-4">{entry.name}</td>
                <td className="py-3 pr-4">{entry.email}</td>
                <td className="py-3 pr-4">{entry.guestCount}</td>
                <td className="py-3">{entry.travelDate || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="mt-4 text-muted">No waiting list entries.</p>}
      </div>
    </div>
  )
}
