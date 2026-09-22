import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useOptionalSiteEdit } from '~/components/site-edit-context'

export function AdminEditBar() {
  const edit = useOptionalSiteEdit()
  const [error, setError] = useState('')
  if (!edit?.isAdmin) return null

  const onSave = async () => {
    setError('')
    try {
      await edit.save()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed. Stay signed in as admin and try again.')
    }
  }

  return (
    <div className="sticky top-0 z-[60] bg-primary px-4 py-2 text-sm text-white">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="font-semibold">Edit mode</span>
        <span className="hidden text-center sm:inline">Orange boxes are text. Add, edit, or delete trips from Trips or the dashboard.</span>
        <button
          type="button"
          disabled={edit.saving}
          onClick={() => void onSave()}
          className="rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary disabled:opacity-50"
        >
          {edit.saving ? 'Saving...' : edit.saved ? 'Saved' : 'Save changes'}
        </button>
        <Link to="/admin" className="underline">
          Full dashboard
        </Link>
      </div>
      {error && <p className="mt-1 text-center text-xs text-white">{error}</p>}
    </div>
  )
}
