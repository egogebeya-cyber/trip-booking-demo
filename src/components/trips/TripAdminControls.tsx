import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { tripsSearch } from '~/lib/trips-search'
import { deleteTripFn } from '~/server/admin/functions'

export function TripAdminControls({
  tripId,
  afterDeleteTo,
}: {
  tripId: string
  afterDeleteTo?: '/trips' | '/admin/trips'
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    if (!confirm('Delete this trip? Bookings for it will also be removed. This cannot be undone.')) return
    setBusy(true)
    try {
      await deleteTripFn({ data: { id: tripId } })
      await router.invalidate()
      if (afterDeleteTo === '/trips') {
        await router.navigate({ to: '/trips', search: tripsSearch() })
      } else if (afterDeleteTo === '/admin/trips') {
        await router.navigate({ to: '/admin/trips' })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/admin/trips/$id" params={{ id: tripId }} className="btn-outline px-3 py-1.5 text-xs">
        Edit
      </Link>
      <button type="button" disabled={busy} onClick={() => void remove()} className="btn-outline px-3 py-1.5 text-xs text-destructive">
        {busy ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
