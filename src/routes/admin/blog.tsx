import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Image, Play, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { uploadImageFile } from '~/components/inline-image'
import { getYouTubeThumbnail, slugify } from '~/lib/utils'
import { listAllBlogPostsFn, saveBlogPostFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/blog')({
  loader: async () => {
    const posts = await listAllBlogPostsFn()
    return { posts }
  },
  component: AdminBlogPage,
})

type KindFilter = 'all' | 'photo' | 'video'
type StatusFilter = 'all' | 'published' | 'draft'
type FormKind = 'photo' | 'video'

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  coverImageUrl: '',
  videoUrl: '',
  isPublished: true,
}

function postKind(post: { coverImageUrl?: string | null; videoUrl?: string | null }): FormKind | 'both' {
  const photo = Boolean(post.coverImageUrl)
  const video = Boolean(post.videoUrl)
  if (photo && video) return 'both'
  if (video) return 'video'
  return 'photo'
}

function AdminBlogPage() {
  const { posts } = Route.useLoaderData()
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [formKind, setFormKind] = useState<FormKind>('photo')
  const [form, setForm] = useState(emptyForm)
  const [autoSlug, setAutoSlug] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<KindFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const photoCount = posts.filter((post) => post.coverImageUrl).length
  const videoCount = posts.filter((post) => post.videoUrl).length
  const published = posts.filter((post) => post.isPublished).length

  const visible = useMemo(() => {
    return posts.filter((post) => {
      const hay = `${post.title} ${post.slug} ${post.excerpt ?? ''}`.toLowerCase()
      if (query.trim() && !hay.includes(query.trim().toLowerCase())) return false
      if (status === 'published' && !post.isPublished) return false
      if (status === 'draft' && post.isPublished) return false
      if (kind === 'photo' && !post.coverImageUrl) return false
      if (kind === 'video' && !post.videoUrl) return false
      return true
    })
  }, [posts, query, status, kind])

  const startEdit = (post?: (typeof posts)[0], nextKind: FormKind = 'photo') => {
    setError('')
    if (post) {
      const detected = postKind(post)
      setFormKind(detected === 'both' ? nextKind : detected === 'video' ? 'video' : 'photo')
      setEditing(post.id)
      setAutoSlug(false)
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? '',
        body: post.body,
        coverImageUrl: post.coverImageUrl ?? '',
        videoUrl: post.videoUrl ?? '',
        isPublished: post.isPublished,
      })
    } else {
      setEditing('new')
      setFormKind(nextKind)
      setAutoSlug(true)
      setForm(emptyForm)
    }
  }

  const updateTitle = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: autoSlug ? slugify(title) : prev.slug,
    }))
  }

  const uploadCover = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const url = await uploadImageFile(file)
      setForm((prev) => ({ ...prev, coverImageUrl: url }))
    } catch {
      setError('Could not upload that image.')
    } finally {
      setUploading(false)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formKind === 'photo' && !form.coverImageUrl) {
      setError('Add a photo.')
      return
    }
    if (formKind === 'video' && !form.videoUrl) {
      setError('Add a YouTube link.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const existing = editing !== 'new' ? posts.find((post) => post.id === editing) : null
      await saveBlogPostFn({
        data: {
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt,
          body: form.body || form.excerpt || form.title,
          coverImageUrl: formKind === 'video' && !existing?.coverImageUrl ? '' : form.coverImageUrl,
          videoUrl: formKind === 'photo' && !existing?.videoUrl ? '' : form.videoUrl,
          isPublished: form.isPublished,
          id: editing === 'new' ? undefined : editing!,
        },
      })
      setEditing(null)
      await router.invalidate()
    } catch {
      setError('Could not save. Try a different slug.')
    } finally {
      setSaving(false)
    }
  }

  const videoThumb = form.videoUrl ? getYouTubeThumbnail(form.videoUrl) : null

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Website</p>
          <h1 className="mt-1 font-display text-2xl font-bold normal-case tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted">
            The public blog has two pages: Photos and Videos. Add items to each one here.
          </p>
        </div>
        <Link to="/blog" className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent">
          View blog
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setKind('photo')}
          className={`rounded-2xl border p-4 text-left ${kind === 'photo' ? 'border-primary bg-card' : 'border-border bg-card/70'}`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
            <Image className="h-4 w-4" />
            Photos
          </span>
          <p className="mt-2 text-2xl font-semibold">{photoCount}</p>
          <p className="mt-1 text-xs text-muted">Shown on the Photos page</p>
        </button>
        <button
          type="button"
          onClick={() => setKind('video')}
          className={`rounded-2xl border p-4 text-left ${kind === 'video' ? 'border-primary bg-card' : 'border-border bg-card/70'}`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
            <Play className="h-4 w-4" />
            Videos
          </span>
          <p className="mt-2 text-2xl font-semibold">{videoCount}</p>
          <p className="mt-1 text-xs text-muted">Shown on the Videos page</p>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setKind('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${kind === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}
        >
          All ({posts.length})
        </button>
        <button
          type="button"
          onClick={() => setStatus('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${status === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}
        >
          Live & drafts
        </button>
        <button
          type="button"
          onClick={() => setStatus('published')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${status === 'published' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}
        >
          Published ({published})
        </button>
        <button
          type="button"
          onClick={() => setStatus('draft')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${status === 'draft' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}
        >
          Drafts
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => startEdit(undefined, 'photo')}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New photo
          </button>
          <button
            type="button"
            onClick={() => startEdit(undefined, 'video')}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-card px-4 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            New video
          </button>
        </div>
      </div>

      <label className="relative mt-4 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="input py-2 pl-9"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {editing && (
        <form onSubmit={save} className="mt-6 space-y-3 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold normal-case tracking-tight">
              {editing === 'new' ? (formKind === 'photo' ? 'New photo' : 'New video') : 'Edit'}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormKind('photo')}
                className={`rounded-full px-3 py-1 text-xs font-medium ${formKind === 'photo' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}
              >
                Photo
              </button>
              <button
                type="button"
                onClick={() => setFormKind('video')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${formKind === 'video' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}
              >
                Video
              </button>
            </div>
          </div>
          <label className="block">
            <span className="label">Title</span>
            <input required className="input" value={form.title} onChange={(e) => updateTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Slug</span>
            <input
              required
              className="input"
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false)
                setForm({ ...form, slug: e.target.value })
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Published
          </label>

          {formKind === 'photo' ? (
            <div>
              <span className="label">Photo</span>
              {form.coverImageUrl ? (
                <img src={form.coverImageUrl} alt="" className="mb-2 h-44 w-full rounded-xl object-cover" />
              ) : null}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadCover(file)
                }}
              />
              {uploading && <p className="mt-1 text-sm text-muted">Uploading...</p>}
              <input
                className="input mt-2"
                placeholder="Or paste an image URL"
                value={form.coverImageUrl}
                onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              />
            </div>
          ) : (
            <div>
              <span className="label">YouTube link</span>
              <input
                className="input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              />
              {videoThumb ? (
                <div className="relative mt-2 overflow-hidden rounded-xl bg-black">
                  <img src={videoThumb} alt="" className="aspect-video w-full object-cover opacity-80" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-10 w-10 fill-white text-white" />
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <label className="block">
            <span className="label">Caption (optional)</span>
            <input className="input" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
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
      )}

      {visible.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted">
          {kind === 'photo'
            ? 'No photos yet. Add a photo for the Photos page.'
            : kind === 'video'
              ? 'No videos yet. Add a YouTube link for the Videos page.'
              : 'Nothing matches these filters.'}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((post) => {
            const kindLabel = postKind(post)
            const thumb = post.coverImageUrl || (post.videoUrl ? getYouTubeThumbnail(post.videoUrl) : null)
            return (
              <article key={post.id} className="overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm">
                <div className="relative aspect-[16/9] bg-accent">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">No media</div>
                  )}
                  {post.videoUrl ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
                        <Play className="ml-0.5 h-5 w-5 fill-white" />
                      </span>
                    </span>
                  ) : null}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                    {kindLabel !== 'video' && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Photo
                      </span>
                    )}
                    {kindLabel !== 'photo' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                        Video
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        post.isPublished ? 'bg-primary text-white' : 'bg-white/90 text-muted'
                      }`}
                    >
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="font-display text-lg font-semibold leading-tight normal-case tracking-normal">{post.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{post.excerpt || 'No caption'}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {post.coverImageUrl && (
                      <Link to="/blog/photos" className="text-sm text-primary hover:underline">
                        Photos page
                      </Link>
                    )}
                    {post.videoUrl && (
                      <Link to="/blog/videos" className="text-sm text-primary hover:underline">
                        Videos page
                      </Link>
                    )}
                    <button type="button" onClick={() => startEdit(post)} className="btn-outline px-3 py-1.5 text-xs">
                      Edit
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
