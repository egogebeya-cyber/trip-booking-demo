import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getTripForAdminFn,
  listCategoriesAdminFn,
  saveTripDetailsFn,
  saveTripFn,
  sendAnnouncementFn,
  uploadImageFn,
} from '~/server/admin/functions'
import { slugify } from '~/lib/utils'
import { TripAdminControls } from '~/components/trips/TripAdminControls'

function parseList(value?: string | null) {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.join('\n') : value
  } catch {
    return value
  }
}

function toList(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const Route = createFileRoute('/admin/trips/$id')({
  loader: async ({ params }) => {
    const categories = await listCategoriesAdminFn()
    if (params.id === 'new') {
      return { trip: null, categories, itinerary: [], addons: [], faqs: [], availability: [] }
    }
    const data = await getTripForAdminFn({ data: { id: params.id } })
    if (!data) throw new Error('NOT_FOUND')
    return { ...data, categories }
  },
  component: AdminTripEditPage,
})

function AdminTripEditPage() {
  const { trip, categories, itinerary, addons, faqs, availability } = Route.useLoaderData()
  const { id } = Route.useParams()
  const router = useRouter()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: trip?.title ?? '',
    titleAm: trip?.titleAm ?? '',
    slug: trip?.slug ?? '',
    destination: trip?.destination ?? '',
    description: trip?.description ?? '',
    descriptionAm: trip?.descriptionAm ?? '',
    price: trip?.price ?? 0,
    priceUsd: trip?.priceUsd ?? 0,
    durationDays: trip?.durationDays ?? 1,
    maxGuests: trip?.maxGuests ?? 20,
    categoryId: trip?.categoryId ?? '',
    coverImageUrl: trip?.coverImageUrl ?? '',
    galleryUrls: parseList(trip?.galleryUrls),
    highlights: parseList(trip?.highlights),
    includedItems: parseList(trip?.includedItems),
    excludedItems: parseList(trip?.excludedItems),
    packingList: parseList(trip?.packingList),
    difficulty: trip?.difficulty ?? 'easy',
    bestSeason: trip?.bestSeason ?? '',
    videoUrl: trip?.videoUrl ?? '',
    mapEmbedUrl: trip?.mapEmbedUrl ?? '',
    cancellationPolicyText: trip?.cancellationPolicyText ?? '',
    depositPercent: trip?.depositPercent ?? 30,
    isPublished: trip?.isPublished ?? false,
    isFeatured: trip?.isFeatured ?? false,
    isPopular: trip?.isPopular ?? false,
    isLastMinuteDeal: trip?.isLastMinuteDeal ?? false,
    offersPrivatePackage: trip?.offersPrivatePackage ?? true,
    offersFamilyTrip: trip?.offersFamilyTrip ?? true,
    privatePackageGuests: trip?.privatePackageGuests ?? 15,
    privatePackagePrice: trip?.privatePackagePrice ?? 0,
    familyMaxGuests: trip?.familyMaxGuests ?? 8,
  })
  const [days, setDays] = useState(itinerary.map((d) => ({ dayNumber: d.dayNumber, title: d.title, description: d.description })))
  const [extras, setExtras] = useState(addons.map((a) => ({ name: a.name, description: a.description ?? '', price: a.price, isActive: a.isActive })))
  const [tripFaqs, setTripFaqs] = useState(faqs.map((f) => ({ question: f.question, answer: f.answer, sortOrder: f.sortOrder })))
  const [dates, setDates] = useState(availability.map((a) => ({ date: a.date, spotsRemaining: a.spotsRemaining, priceOverride: a.priceOverride ?? undefined })))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notify, setNotify] = useState(isNew)
  const [uploading, setUploading] = useState(false)
  const [autoSlug, setAutoSlug] = useState(isNew)

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }))

  const updateTitle = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: autoSlug ? slugify(title) : prev.slug,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const url = await uploadImageFn({ data: { dataUrl } })
        update('coverImageUrl', url)
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await saveTripFn({
        data: {
          trip: {
            ...form,
            priceUsd: form.priceUsd || null,
            galleryUrls: toList(form.galleryUrls),
            highlights: toList(form.highlights),
            includedItems: toList(form.includedItems),
            excludedItems: toList(form.excludedItems),
            packingList: toList(form.packingList),
          },
          id: isNew ? undefined : id,
        },
      })
      const tripId = isNew ? result.id : id
      await saveTripDetailsFn({
        data: {
          tripId,
          itinerary: days.filter((d) => d.title.trim()),
          addons: extras.filter((a) => a.name.trim()),
          faqs: tripFaqs.filter((f) => f.question.trim()),
          availability: dates.filter((d) => d.date),
        },
      })
      if (notify) {
        await sendAnnouncementFn({
          data: {
            subject: `New trip: ${form.title}`,
            message: `We just added ${form.title} (${form.destination}). Book your spot before it fills up.`,
            includeAccounts: true,
            linkUrl: `${window.location.origin}/trips/${result.slug}`,
            linkLabel: 'View trip',
          },
        })
      }
      await router.invalidate()
      if (isNew) {
        router.navigate({ to: '/admin/trips/$id', params: { id: result.id } })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this trip. Check required fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{isNew ? 'Create Trip' : 'Edit Trip'}</h1>
      <form onSubmit={save} className="mt-6 max-w-3xl space-y-4">
        <div>
          <label className="label">Title</label>
          <input required className="input" value={form.title} onChange={(e) => updateTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Amharic title</label>
          <input className="input" value={form.titleAm} onChange={(e) => update('titleAm', e.target.value)} />
        </div>
        <div>
          <label className="label">URL slug</label>
          <input
            className="input"
            value={form.slug}
            onChange={(e) => {
              setAutoSlug(false)
              update('slug', e.target.value)
            }}
            placeholder="dubai-city-desert-5-days"
          />
        </div>
        <div>
          <label className="label">Destination</label>
          <input required className="input" value={form.destination} onChange={(e) => update('destination', e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={4} className="input" value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        <div>
          <label className="label">Amharic description</label>
          <textarea rows={3} className="input" value={form.descriptionAm} onChange={(e) => update('descriptionAm', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Price (ETB)</label>
            <input type="number" required className="input" value={form.price} onChange={(e) => update('price', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Price (USD, optional)</label>
            <input type="number" className="input" value={form.priceUsd || ''} onChange={(e) => update('priceUsd', e.target.value ? Number(e.target.value) : 0)} />
          </div>
          <div>
            <label className="label">Duration (days)</label>
            <input type="number" className="input" value={form.durationDays} onChange={(e) => update('durationDays', Number(e.target.value))} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Max Guests</label>
            <input type="number" className="input" value={form.maxGuests} onChange={(e) => update('maxGuests', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Deposit %</label>
            <input type="number" className="input" value={form.depositPercent} onChange={(e) => update('depositPercent', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select className="input" value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
            </select>
          </div>
          <div>
            <label className="label">Best season</label>
            <input className="input" value={form.bestSeason} onChange={(e) => update('bestSeason', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Cover Image</label>
          {form.coverImageUrl && (
            <img src={form.coverImageUrl} alt="Cover" className="mb-2 h-32 rounded-lg object-cover" />
          )}
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          {uploading && <p className="text-sm text-muted">Uploading...</p>}
        </div>
        <div>
          <label className="label">Gallery image URLs (one per line)</label>
          <textarea rows={3} className="input" value={form.galleryUrls} onChange={(e) => update('galleryUrls', e.target.value)} />
        </div>
        <div>
          <label className="label">Highlights (one per line)</label>
          <textarea rows={3} className="input" value={form.highlights} onChange={(e) => update('highlights', e.target.value)} />
        </div>
        <div>
          <label className="label">Included (one per line)</label>
          <textarea rows={3} className="input" value={form.includedItems} onChange={(e) => update('includedItems', e.target.value)} />
        </div>
        <div>
          <label className="label">Excluded (one per line)</label>
          <textarea rows={3} className="input" value={form.excludedItems} onChange={(e) => update('excludedItems', e.target.value)} />
        </div>
        <div>
          <label className="label">Packing list (one per line)</label>
          <textarea rows={3} className="input" value={form.packingList} onChange={(e) => update('packingList', e.target.value)} />
        </div>
        <div>
          <label className="label">Video URL</label>
          <input className="input" value={form.videoUrl} onChange={(e) => update('videoUrl', e.target.value)} />
        </div>
        <div>
          <label className="label">Map embed URL</label>
          <input className="input" value={form.mapEmbedUrl} onChange={(e) => update('mapEmbedUrl', e.target.value)} />
        </div>
        <div>
          <label className="label">Cancellation policy</label>
          <textarea rows={3} className="input" value={form.cancellationPolicyText} onChange={(e) => update('cancellationPolicyText', e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => update('isPublished', e.target.checked)} />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPopular} onChange={(e) => update('isPopular', e.target.checked)} />
            Popular
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isLastMinuteDeal} onChange={(e) => update('isLastMinuteDeal', e.target.checked)} />
            Last Minute Deal
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.offersPrivatePackage} onChange={(e) => update('offersPrivatePackage', e.target.checked)} />
            Offer private package
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.offersFamilyTrip} onChange={(e) => update('offersFamilyTrip', e.target.checked)} />
            Offer family trip
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Private package guests</label>
            <input type="number" min={2} className="input" value={form.privatePackageGuests} onChange={(e) => update('privatePackageGuests', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Private package price (ETB)</label>
            <input type="number" min={0} className="input" value={form.privatePackagePrice} onChange={(e) => update('privatePackagePrice', Number(e.target.value))} />
            <p className="mt-1 text-xs text-muted">Leave 0 to charge per-person price × package size.</p>
          </div>
          <div>
            <label className="label">Family trip max guests</label>
            <input type="number" min={2} className="input" value={form.familyMaxGuests} onChange={(e) => update('familyMaxGuests', Number(e.target.value))} />
          </div>
        </div>

        <h2 className="pt-4 font-display text-xl">Itinerary</h2>
            {days.map((day, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-6">
                <input type="number" className="input" value={day.dayNumber} onChange={(e) => setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, dayNumber: Number(e.target.value) } : d))} />
                <input className="input sm:col-span-2" placeholder="Title" value={day.title} onChange={(e) => setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, title: e.target.value } : d))} />
                <input className="input sm:col-span-2" placeholder="Description" value={day.description} onChange={(e) => setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, description: e.target.value } : d))} />
                <button type="button" className="btn-outline" onClick={() => setDays((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            ))}
            <button type="button" className="btn-outline" onClick={() => setDays((prev) => [...prev, { dayNumber: prev.length + 1, title: '', description: '' }])}>Add day</button>

            <h2 className="pt-4 font-display text-xl">Add-ons</h2>
            {extras.map((addon, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-6">
                <input className="input sm:col-span-2" placeholder="Name" value={addon.name} onChange={(e) => setExtras((prev) => prev.map((a, idx) => idx === i ? { ...a, name: e.target.value } : a))} />
                <input className="input sm:col-span-2" placeholder="Description" value={addon.description} onChange={(e) => setExtras((prev) => prev.map((a, idx) => idx === i ? { ...a, description: e.target.value } : a))} />
                <input type="number" className="input" placeholder="Price" value={addon.price} onChange={(e) => setExtras((prev) => prev.map((a, idx) => idx === i ? { ...a, price: Number(e.target.value) } : a))} />
                <button type="button" className="btn-outline" onClick={() => setExtras((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            ))}
            <button type="button" className="btn-outline" onClick={() => setExtras((prev) => [...prev, { name: '', description: '', price: 0, isActive: true }])}>Add add-on</button>

            <h2 className="pt-4 font-display text-xl">Trip FAQs</h2>
            {tripFaqs.map((faq, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <input className="input" placeholder="Question" value={faq.question} onChange={(e) => setTripFaqs((prev) => prev.map((f, idx) => idx === i ? { ...f, question: e.target.value } : f))} />
                <div className="flex gap-2">
                  <input className="input" placeholder="Answer" value={faq.answer} onChange={(e) => setTripFaqs((prev) => prev.map((f, idx) => idx === i ? { ...f, answer: e.target.value } : f))} />
                  <button type="button" className="btn-outline" onClick={() => setTripFaqs((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn-outline" onClick={() => setTripFaqs((prev) => [...prev, { question: '', answer: '', sortOrder: prev.length }])}>Add FAQ</button>

            <h2 className="pt-4 font-display text-xl">Availability dates</h2>
            {dates.map((row, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-4">
                <input type="date" className="input" value={row.date} onChange={(e) => setDates((prev) => prev.map((d, idx) => idx === i ? { ...d, date: e.target.value } : d))} />
                <input type="number" className="input" placeholder="Spots" value={row.spotsRemaining} onChange={(e) => setDates((prev) => prev.map((d, idx) => idx === i ? { ...d, spotsRemaining: Number(e.target.value) } : d))} />
                <input type="number" className="input" placeholder="Price override" value={row.priceOverride ?? ''} onChange={(e) => setDates((prev) => prev.map((d, idx) => idx === i ? { ...d, priceOverride: e.target.value ? Number(e.target.value) : undefined } : d))} />
                <button type="button" className="btn-outline" onClick={() => setDates((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            ))}
            <button type="button" className="btn-outline" onClick={() => setDates((prev) => [...prev, { date: '', spotsRemaining: 10 }])}>Add date</button>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Email subscribers and customers about this trip
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isNew ? 'Create trip' : 'Save trip'}
          </button>
          {!isNew && trip && <TripAdminControls tripId={trip.id} afterDeleteTo="/admin/trips" />}
        </div>
      </form>
    </div>
  )
}
