import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { listAllSiteFaqsFn, saveSiteFaqFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/faq')({
  loader: async () => {
    const faqs = await listAllSiteFaqsFn()
    return { faqs }
  },
  component: AdminFaqPage,
})

function AdminFaqPage() {
  const { faqs } = Route.useLoaderData()
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ question: '', answer: '', sortOrder: 0, isPublished: true })
  const [saving, setSaving] = useState(false)

  const startEdit = (faq?: typeof faqs[0]) => {
    if (faq) {
      setEditing(faq.id)
      setForm({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, isPublished: faq.isPublished })
    } else {
      setEditing('new')
      setForm({ question: '', answer: '', sortOrder: faqs.length, isPublished: true })
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await saveSiteFaqFn({
        data: { ...form, id: editing === 'new' ? undefined : editing! },
      })
      setEditing(null)
      router.invalidate()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">FAQ</h1>
        <button type="button" onClick={() => startEdit()} className="btn-primary">New FAQ</button>
      </div>

      {editing && (
        <form onSubmit={save} className="mt-6 card max-w-2xl space-y-3 p-4">
          <input required placeholder="Question" className="input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          <textarea required rows={4} placeholder="Answer" className="input" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
          <input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            Published
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="card flex items-start justify-between p-4">
            <div>
              <p className="font-medium">{faq.question}</p>
              <p className="mt-1 text-sm text-muted">{faq.answer}</p>
            </div>
            <button type="button" onClick={() => startEdit(faq)} className="text-sm text-primary hover:underline">Edit</button>
          </div>
        ))}
        {faqs.length === 0 && <p className="text-muted">No FAQs yet.</p>}
      </div>
    </div>
  )
}
