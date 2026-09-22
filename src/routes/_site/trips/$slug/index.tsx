import { Link, createFileRoute, notFound, useLoaderData } from '@tanstack/react-router'
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Facebook,
  MapPin,
  Share2,
  Star,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { InlineImage, uploadImageFile } from '~/components/inline-image'
import { InlineText } from '~/components/inline-text'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit, useRegisterPageSave } from '~/components/site-edit-context'
import { TripCard } from '~/components/trips/TripCard'
import { PriceTag } from '~/components/price-tag'
import { ReviewForm } from '~/components/review-form'
import { WaitlistForm } from '~/components/waitlist-form'
import { TripAdminControls } from '~/components/trips/TripAdminControls'
import { WishlistButton } from '~/components/wishlist-button'
import { BackButton } from '~/components/back-button'
import { formatGroupDiscountSummary } from '~/lib/group-discount'
import { saveTripDetailsFn, saveTripFn } from '~/server/admin/functions'
import { getSiteSettingsFn, getWishlistIdsFn } from '~/server/content/functions'
import { getRelatedTripsFn, getTripFn } from '~/server/trips/functions'

export const Route = createFileRoute('/_site/trips/$slug/')({
  loader: async ({ params }) => {
    const [trip, settings, wishlistIds] = await Promise.all([
      getTripFn({ data: { slug: params.slug } }),
      getSiteSettingsFn(),
      getWishlistIdsFn(),
    ])
    if (!trip) throw notFound()
    const relatedTrips = await getRelatedTripsFn({
      data: { tripId: trip.id, categoryId: trip.categoryId },
    })
    return { trip, relatedTrips, settings, wishlistIds }
  },
  component: TripDetailPage,
})

function TripDetailPage() {
  const { trip, relatedTrips, settings, wishlistIds } = Route.useLoaderData()
  const { user } = useLoaderData({ from: '/_site' })
  const { t, locale } = useLocale()
  const edit = useOptionalSiteEdit()
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [title, setTitle] = useState(locale === 'am' && trip.titleAm ? trip.titleAm : trip.title)
  const [destination, setDestination] = useState(trip.destination)
  const [description, setDescription] = useState(
    locale === 'am' && trip.descriptionAm ? trip.descriptionAm : trip.description,
  )
  const [price, setPrice] = useState(String(trip.price))
  const [durationDays, setDurationDays] = useState(String(trip.durationDays))
  const [includedItems, setIncludedItems] = useState(trip.includedItems)
  const [excludedItems, setExcludedItems] = useState(trip.excludedItems)
  const [itinerary, setItinerary] = useState(trip.itinerary)
  const [faqs, setFaqs] = useState(trip.faqs)
  const [coverImageUrl, setCoverImageUrl] = useState(trip.coverImageUrl)
  const [galleryUrls, setGalleryUrls] = useState(trip.galleryUrls)

  const mark = () => setDirty(true)

  const save = useCallback(async () => {
    await saveTripFn({
      data: {
        id: trip.id,
        trip: {
          title,
          titleAm: trip.titleAm,
          slug: trip.slug,
          destination,
          description,
          descriptionAm: trip.descriptionAm,
          price: Number(price) || trip.price,
          priceUsd: trip.priceUsd,
          durationDays: Number(durationDays) || trip.durationDays,
          maxGuests: trip.maxGuests,
          categoryId: trip.categoryId,
          coverImageUrl,
          galleryUrls,
          highlights: trip.highlights,
          includedItems,
          excludedItems,
          packingList: trip.packingList,
          difficulty: trip.difficulty,
          fitnessLevel: trip.fitnessLevel,
          minAge: trip.minAge,
          bestSeason: trip.bestSeason,
          videoUrl: trip.videoUrl,
          mapEmbedUrl: trip.mapEmbedUrl,
          cancellationPolicyText: trip.cancellationPolicyText,
          depositPercent: trip.depositPercent,
          isPublished: trip.isPublished,
          isFeatured: trip.isFeatured,
          isPopular: trip.isPopular,
          isLastMinuteDeal: trip.isLastMinuteDeal,
        },
      },
    })
    await saveTripDetailsFn({
      data: {
        tripId: trip.id,
        itinerary: itinerary.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
        })),
        faqs: faqs.map((faq, i) => ({
          question: faq.question,
          answer: faq.answer,
          sortOrder: i,
        })),
      },
    })
  }, [trip, title, destination, description, price, durationDays, includedItems, excludedItems, itinerary, faqs, coverImageUrl, galleryUrls])

  useRegisterPageSave(edit?.isAdmin ? save : null, dirty)
  const images = [coverImageUrl, ...galleryUrls].filter(Boolean)
  const minSpots = trip.availability.length
    ? Math.min(...trip.availability.map((a) => a.spotsRemaining))
    : null
  const showUrgency = minSpots !== null && minSpots > 0 && minSpots <= 5

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <BackButton fallbackTo="/trips" label={t('trips')} className="mb-6" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/9]">
              <InlineImage
                src={images[galleryIndex] || coverImageUrl}
                alt={title}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
                onChange={(url) => {
                  if (galleryIndex === 0) setCoverImageUrl(url)
                  else {
                    const next = [...galleryUrls]
                    next[galleryIndex - 1] = url
                    setGalleryUrls(next)
                  }
                  mark()
                }}
              />
              {showUrgency && (
                <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-sm font-medium text-white">
                  <AlertTriangle className="h-4 w-4" />
                  {t('onlySpotsLeft', { n: minSpots! })}
                </span>
              )}
            </div>
            {(images.length > 1 || edit?.isAdmin) && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setGalleryIndex(i)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                      galleryIndex === i ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
                {edit?.isAdmin && (
                  <label className="flex h-16 w-24 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-primary text-center text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Add photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (!file) return
                        const url = await uploadImageFile(file)
                        setGalleryUrls((prev) => {
                          const next = [...prev, url]
                          setGalleryIndex(next.length)
                          return next
                        })
                        mark()
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h1 className="font-display text-3xl font-bold">
              <InlineText value={title} onChange={(v) => { setTitle(v); mark() }} />
            </h1>
            {edit?.isAdmin && (
              <div className="mt-3">
                <TripAdminControls tripId={trip.id} afterDeleteTo="/trips" />
              </div>
            )}
            <p className="mt-2 flex items-center gap-1 text-muted">
              <MapPin className="h-4 w-4" />
              <InlineText value={destination} onChange={(v) => { setDestination(v); mark() }} />
              <span className="mx-2">·</span>
              <Clock className="h-4 w-4" />
              <InlineText value={durationDays} onChange={(v) => { setDurationDays(v); mark() }} /> {t('days')}
            </p>
            {trip.avgRating > 0 && (
              <p className="mt-2 flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {trip.avgRating.toFixed(1)} · {trip.reviews.length} {t('reviews')}
              </p>
            )}
            <p className="mt-4 leading-relaxed text-muted">
              <InlineText value={description} onChange={(v) => { setDescription(v); mark() }} multiline />
            </p>
          </div>

          {trip.videoUrl && (
            <section className="mt-8 overflow-hidden rounded-2xl border border-border">
              <iframe
                src={getYouTubeEmbedUrl(trip.videoUrl)}
                title={`${title} video`}
                className="aspect-video w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </section>
          )}

          {itinerary.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold">{t('itinerary')}</h2>
              <ol className="mt-4 space-y-4">
                {itinerary.map((day, i) => (
                  <li key={day.id} className="card p-4">
                    <h3 className="font-semibold">
                      {t('day')} {day.dayNumber}:{' '}
                      <InlineText
                        value={day.title}
                        onChange={(v) => {
                          setItinerary((prev) => prev.map((d, idx) => (idx === i ? { ...d, title: v } : d)))
                          mark()
                        }}
                      />
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      <InlineText
                        value={day.description}
                        onChange={(v) => {
                          setItinerary((prev) => prev.map((d, idx) => (idx === i ? { ...d, description: v } : d)))
                          mark()
                        }}
                        multiline
                      />
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {includedItems.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold">{t('included')}</h2>
                <ul className="mt-3 space-y-2">
                  {includedItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <InlineText
                        value={item}
                        onChange={(v) => {
                          setIncludedItems((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                          mark()
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {excludedItems.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold">{t('excluded')}</h2>
                <ul className="mt-3 space-y-2">
                  {excludedItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <InlineText
                        value={item}
                        onChange={(v) => {
                          setExcludedItems((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                          mark()
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {trip.mapEmbedUrl && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold">{t('destination')}</h2>
              <div className="mt-4 aspect-video overflow-hidden rounded-2xl border border-border">
                <iframe
                  src={trip.mapEmbedUrl}
                  title={trip.destination}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {faqs.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold">{t('faq')}</h2>
              <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
                {faqs.map((faq, i) => (
                  <div key={faq.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left font-medium"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <InlineText
                        value={faq.question}
                        onChange={(v) => {
                          setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, question: v } : f)))
                          mark()
                        }}
                      />
                      <span className="text-muted">{openFaq === i ? '−' : '+'}</span>
                    </button>
                    {(openFaq === i || edit?.isAdmin) && (
                      <p className="px-4 pb-3 text-sm text-muted">
                        <InlineText
                          value={faq.answer}
                          onChange={(v) => {
                            setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, answer: v } : f)))
                            mark()
                          }}
                          multiline
                        />
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold">{t('reviews')}</h2>
            {trip.reviews.length === 0 ? (
              <p className="mt-4 text-muted">{t('noReviews')}</p>
            ) : (
              <div className="mt-4 space-y-4">
                {trip.reviews.map((review) => (
                  <blockquote key={review.id} className="card p-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-border'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-sm">{review.comment}</p>
                  </blockquote>
                ))}
              </div>
            )}
            <ReviewForm tripId={trip.id} loggedIn={Boolean(user)} />
          </section>
        </div>

        <aside className="space-y-6">
          <div className="card p-6 lg:sticky lg:top-4">
            <p className="text-sm text-muted">{t('from')}</p>
            {edit?.isAdmin ? (
              <p className="text-3xl font-bold text-price">
                <InlineText value={price} onChange={(v) => { setPrice(v); mark() }} className="text-price" />
              </p>
            ) : (
              <PriceTag etb={trip.price} usd={trip.priceUsd} size="lg" />
            )}
            <p className="text-sm text-muted">{t('perPerson')}</p>
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <strong>Group discount:</strong> {formatGroupDiscountSummary(settings)}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <strong className="text-foreground">{t('joinGroupTrip')}.</strong> {t('joinGroupTripHint')}
              </li>
              {trip.offersPrivatePackage !== false ? (
                <li>
                  <strong className="text-foreground">{t('privatePackage')}.</strong>{' '}
                  {t('privatePackageHint', { n: trip.privatePackageGuests ?? settings?.privatePackageGuests ?? 15 })}
                </li>
              ) : null}
              {trip.offersFamilyTrip !== false ? (
                <li>
                  <strong className="text-foreground">{t('familyTrip')}.</strong>{' '}
                  {t('familyTripHint', { n: trip.familyMaxGuests ?? settings?.familyMaxGuests ?? 8 })}
                </li>
              ) : null}
            </ul>
            {showUrgency && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {t('onlySpotsLeft', { n: minSpots! })}
              </p>
            )}
            <Link
              to="/trips/$slug/book"
              params={{ slug: trip.slug }}
              className="btn-primary mt-4 w-full text-center"
            >
              {t('bookNow')}
            </Link>
            <WishlistButton
              tripId={trip.id}
              loggedIn={Boolean(user)}
              initial={wishlistIds.includes(trip.id)}
              className="mt-2 w-full justify-center"
            />
            <WaitlistForm tripId={trip.id} dates={trip.availability} />
          </div>

          <div className="card p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Share2 className="h-4 w-4" />
              {t('shareTrip')}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={copyLink} className="btn-outline text-sm">
                <Copy className="mr-1 h-4 w-4" />
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-sm"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-sm"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        </aside>
      </div>

      {relatedTrips.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">{t('relatedTrips')}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTrips.map((related) => (
              <TripCard
                key={related.id}
                trip={related}
                locale={locale}
                loggedIn={Boolean(user)}
                isWishlisted={wishlistIds.includes(related.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
