import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { uploadImageFile } from '~/components/inline-image'
import { StarRating } from '~/components/star-rating'
import { deleteTestimonialFn, listAllTestimonialsFn, saveTestimonialFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/testimonials')({
  loader: async () => {
    const testimonials = await listAllTestimonialsFn()
    return { testimonials }
  },
  component: AdminTestimonialsPage,
})

type Filter = 'all' | 'homepage' | 'hidden'

const emptyForm = {
  customerName: '',
  tripName: '',
  quote: '',
  rating: 5,
  photoUrl: '',
  isFeatured: true,
}

function QuoteCard({
  photoUrl,
  customerName,
  tripName,
  quote,
  rating,
}: {
  photoUrl?: string | null
  customerName: string
  tripName?: string | null
  quote: string
  rating: number
}) {
  return (
    <blockquote className="rounded-2xl border-2 border-primary bg-card p-6">
      {photoUrl ? (
        <img src={photoUrl} alt="" className="mb-4 h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-sm font-medium text-muted">
          {(customerName || '?').slice(0, 1).toUpperCase()}
        </div>
      )}
      <StarRating value={rating} />
      <p className="mt-3 text-muted">“{quote || 'Write the review here.'}”</p>
      <footer className="mt-4 font-medium">
        {customerName || 'Guest name'}
        {tripName ? <span className="block text-sm font-normal text-muted">{tripName}</span> : null}
      </footer>
    </blockquote>
  )
}

function AdminTestimonialsPage() {
  const { testimonials } = Route.useLoaderData()
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const onHomepage = testimonials.filter((item) => item.isFeatured)
  const hidden = testimonials.length - onHomepage.length
  const visible = testimonials.filter((item) => {
    if (filter === 'homepage') return item.isFeatured
    if (filter === 'hidden') return !item.isFeatured
    return true
  })

  const startEdit = (item?: (typeof testimonials)[0]) => {
    setError('')
    setConfirmId(null)
    if (item) {
      setEditing(item.id)
      setForm({
        customerName: item.customerName,
        tripName: item.tripName ?? '',
        quote: item.quote,
        rating: item.rating,
        photoUrl: item.photoUrl ?? '',
        isFeatured: item.isFeatured,
      })
    } else {
      setEditing('new')
      setForm(emptyForm)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveTestimonialFn({
        data: {
          ...form,
          id: editing === 'new' ? undefined : editing!,
        },
      })
      setEditing(null)
      await router.invalidate()
    } catch {
      setError('Could not save this testimonial.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteTestimonialFn({ data: { id } })
      if (editing === id) setEditing(null)
      setConfirmId(null)
      await router.invalidate()
    } finally {
      setDeletingId(null)
    }
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const url = await uploadImageFile(file)
      setForm((prev) => ({ ...prev, photoUrl: url }))
    } catch {
      setError('Could not upload that photo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Website</p>
          <h1 className="mt-1 font-display text-2xl font-bold normal-case tracking-tight">Testimonials</h1>
          <p className="mt-1 text-sm text-muted">
            Same cards as the homepage. Customer submissions wait here until you show them on the site.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            hash="testimonials"
            className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            View on homepage
          </Link>
          <button
            type="button"
            onClick={() => startEdit()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New testimonial
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(
          [
            ['all', 'Total', testimonials.length],
            ['homepage', 'On homepage', onHomepage.length],
            ['hidden', 'Waiting', hidden],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-2xl border p-3 text-left ${filter === id ? 'border-primary bg-card' : 'border-border bg-card/70'}`}
          >
            <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 text-xl font-semibold">{count}</p>
          </button>
        ))}
      </div>

      {editing && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <form onSubmit={save} className="space-y-3 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold normal-case tracking-tight">
              {editing === 'new' ? 'New testimonial' : 'Edit testimonial'}
            </h2>
            <label className="block">
              <span className="label">Photo</span>
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="" className="mb-2 h-16 w-16 rounded-full object-cover" />
              ) : null}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadPhoto(file)
                }}
              />
              {uploading && <p className="mt-1 text-sm text-muted">Uploading...</p>}
            </label>
            <label className="block">
              <span className="label">Customer name</span>
              <input
                required
                className="input"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">Trip name</span>
              <input
                className="input"
                placeholder="Shown under the name"
                value={form.tripName}
                onChange={(e) => setForm({ ...form, tripName: e.target.value })}
              />
            </label>
            <div>
              <span className="label">Stars</span>
              <StarRating
                editable
                value={form.rating}
                onChange={(rating) => setForm({ ...form, rating })}
              />
            </div>
            <label className="block">
              <span className="label">Quote</span>
              <textarea
                required
                rows={4}
                className="input"
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              Show on homepage
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving || uploading} className="btn-primary">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Homepage preview</p>
            <QuoteCard
              photoUrl={form.photoUrl}
              customerName={form.customerName}
              tripName={form.tripName}
              quote={form.quote}
              rating={form.rating}
            />
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted">
          {testimonials.length === 0 ? 'No testimonials yet.' : 'Nothing in this filter.'}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {visible.map((item) => (
            <div key={item.id}>
              <QuoteCard
                photoUrl={item.photoUrl}
                customerName={item.customerName}
                tripName={item.tripName}
                quote={item.quote}
                rating={item.rating}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {item.isFeatured ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    On homepage
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                    Waiting
                  </span>
                )}
                {!item.isFeatured && (
                  <button
                    type="button"
                    className="btn-outline px-3 py-1.5 text-xs"
                    onClick={() =>
                      void saveTestimonialFn({
                        data: {
                          id: item.id,
                          customerName: item.customerName,
                          tripName: item.tripName ?? '',
                          quote: item.quote,
                          rating: item.rating,
                          photoUrl: item.photoUrl ?? '',
                          isFeatured: true,
                        },
                      }).then(() => router.invalidate())
                    }
                  >
                    Show on homepage
                  </button>
                )}
                <button type="button" onClick={() => startEdit(item)} className="btn-outline px-3 py-1.5 text-xs">
                  Edit
                </button>
                {confirmId === item.id ? (
                  <>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => void remove(item.id)}
                      className="btn-outline px-3 py-1.5 text-xs text-destructive"
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Confirm delete'}
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className="text-xs text-muted hover:underline">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(item.id)}
                    className="btn-outline px-3 py-1.5 text-xs text-destructive"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
