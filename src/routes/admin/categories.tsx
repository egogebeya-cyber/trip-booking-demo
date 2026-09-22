import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { deleteCategoryFn, listCategoriesAdminFn, saveCategoryFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/categories')({
  loader: async () => {
    const categories = await listCategoriesAdminFn()
    return { categories }
  },
  component: AdminCategoriesPage,
})

function AdminCategoriesPage() {
  const { categories } = Route.useLoaderData()
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', icon: 'map', sortOrder: 0 })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const startEdit = (cat?: (typeof categories)[0]) => {
    if (cat) {
      setEditing(cat.id)
      setForm({ name: cat.name, slug: cat.slug, icon: cat.icon ?? 'map', sortOrder: cat.sortOrder })
    } else {
      setEditing('new')
      setForm({ name: '', slug: '', icon: 'map', sortOrder: categories.length })
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveCategoryFn({
        data: { ...form, id: editing === 'new' ? undefined : editing! },
      })
      setEditing(null)
      await router.invalidate()
    } catch {
      setError('Could not save this category. Try a different slug.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (cat: (typeof categories)[0]) => {
    setDeletingId(cat.id)
    setError('')
    try {
      await deleteCategoryFn({ data: { id: cat.id } })
      if (editing === cat.id) setEditing(null)
      setConfirmId(null)
      await router.invalidate()
    } catch {
      setError('Could not delete this category.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-muted">Groups you assign to trips. Used for filters on the public trips page.</p>
        </div>
        <button type="button" onClick={() => startEdit()} className="btn-primary">
          New Category
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="mt-6 card max-w-lg space-y-3 p-4">
          <div>
            <label className="label">Name</label>
            <input
              required
              placeholder="e.g. Safari"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input
              required
              placeholder="e.g. safari"
              className="input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Icon</label>
            <input
              placeholder="map"
              className="input"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input
              type="number"
              className="input"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-outline">
              Cancel
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}

      <div className="mt-8 space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{cat.name}</p>
              <p className="text-sm text-muted">
                {cat.slug} · order {cat.sortOrder} · {cat.tripCount === 1 ? '1 trip' : `${cat.tripCount} trips`}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {confirmId === cat.id ? (
                <>
                  <p className="text-xs text-muted">
                    {cat.tripCount > 0
                      ? `${cat.tripCount === 1 ? '1 trip' : `${cat.tripCount} trips`} will keep running with no group.`
                      : 'Delete this group?'}
                  </p>
                  <button
                    type="button"
                    disabled={deletingId === cat.id}
                    onClick={() => void remove(cat)}
                    className="btn-outline px-3 py-1.5 text-xs text-destructive"
                  >
                    {deletingId === cat.id ? 'Deleting...' : 'Confirm delete'}
                  </button>
                  <button type="button" onClick={() => setConfirmId(null)} className="btn-outline px-3 py-1.5 text-xs">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => startEdit(cat)} className="btn-outline px-3 py-1.5 text-xs">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(cat.id)}
                    className="btn-outline px-3 py-1.5 text-xs text-destructive"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="text-muted">No categories yet.</p>}
      </div>
    </div>
  )
}
