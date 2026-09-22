import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { listAllLegalPagesFn, saveLegalPageFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/legal')({
  loader: async () => {
    const pages = await listAllLegalPagesFn()
    return { pages }
  },
  component: AdminLegalPage,
})

const DEFAULT_PAGES = [
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'terms', title: 'Terms of Service' },
  { slug: 'cancellation', title: 'Cancellation Policy' },
]

function AdminLegalPage() {
  const { pages } = Route.useLoaderData()
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ slug: '', title: '', body: '' })
  const [saving, setSaving] = useState(false)

  const startEdit = (slug: string, title: string, body?: string) => {
    setEditing(slug)
    setForm({ slug, title, body: body ?? '' })
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await saveLegalPageFn({ data: form })
      setEditing(null)
      router.invalidate()
    } finally {
      setSaving(false)
    }
  }

  const allPages = DEFAULT_PAGES.map((def) => {
    const existing = pages.find((p) => p.slug === def.slug)
    return { ...def, body: existing?.body ?? '', title: existing?.title ?? def.title }
  })

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Legal Pages</h1>

      {editing && (
        <form onSubmit={save} className="mt-6 card max-w-2xl space-y-3 p-4">
          <input readOnly className="input bg-accent" value={form.slug} />
          <input required placeholder="Title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea required rows={10} placeholder="Body" className="input" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {allPages.map((page) => (
          <div key={page.slug} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{page.title}</p>
              <p className="text-sm text-muted">/{page.slug}</p>
            </div>
            <button type="button" onClick={() => startEdit(page.slug, page.title, page.body)} className="text-sm text-primary hover:underline">
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
