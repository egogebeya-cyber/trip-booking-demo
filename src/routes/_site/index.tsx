import { Link, createFileRoute, useLoaderData } from '@tanstack/react-router'
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { TikTokIcon } from '~/components/icons/TikTokIcon'
import { useCallback, useState } from 'react'
import { NewsletterSignup } from '~/components/contact/NewsletterSignup'
import { HeroSlideshow } from '~/components/home/HeroSlideshow'
import { SectionHeading } from '~/components/home/SectionHeading'
import { InlineImage } from '~/components/inline-image'
import { InlineText } from '~/components/inline-text'
import { StarRating } from '~/components/star-rating'
import { useRegisterPageSave, useSiteEdit } from '~/components/site-edit-context'
import { useLocale } from '~/components/locale-context'
import { TripCard } from '~/components/trips/TripCard'
import { PriceTag } from '~/components/price-tag'
import { formatDate } from '~/lib/utils'
import { tripsSearch } from '~/lib/trips-search'
import {
  getSiteSettingsFn,
  getWishlistIdsFn,
  listBlogPostsFn,
  listTeamMembersFn,
  listTestimonialsFn,
  submitContactFn,
} from '~/server/content/functions'
import { saveTeamMemberFn, saveTestimonialFn } from '~/server/admin/functions'
import { listUpcomingDeparturesFn, listTripsFn } from '~/server/trips/functions'

export const Route = createFileRoute('/_site/')({
  loader: async () => {
    const [featured, popular, deals, testimonials, blogPosts, settings, upcoming, team, wishlistIds] = await Promise.all([
      listTripsFn({ data: { featured: true } }),
      listTripsFn({ data: { sort: 'popular' } }),
      listTripsFn({ data: { lastMinute: true } }),
      listTestimonialsFn(),
      listBlogPostsFn(),
      getSiteSettingsFn(),
      listUpcomingDeparturesFn(),
      listTeamMembersFn(),
      getWishlistIdsFn(),
    ])
    return {
      featured: featured.slice(0, 3),
      popular: popular.slice(0, 4),
      deals: deals.slice(0, 3),
      testimonials,
      blogPosts: blogPosts.slice(0, 2),
      settings,
      upcoming,
      team,
      wishlistIds,
    }
  },
  component: HomePage,
})

function HomeContactForm() {
  const { t } = useLocale()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await submitContactFn({ data: form })
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        required
        className="input"
        placeholder={t('fullName')}
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <input
        required
        type="email"
        className="input"
        placeholder={t('email')}
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <input
        required
        className="input"
        placeholder={t('subject')}
        value={form.subject}
        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
      />
      <textarea
        required
        rows={4}
        className="input"
        placeholder={t('message')}
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
      />
      <button type="submit" className="btn-primary w-full">{t('sendMessage')}</button>
      {status === 'success' && <p className="text-sm text-primary">{t('contactSuccess')}</p>}
      {status === 'error' && <p className="text-sm text-destructive">{t('error')}</p>}
    </form>
  )
}

function HomePage() {
  const { featured, popular, deals, testimonials, blogPosts, settings, upcoming, team, wishlistIds } = Route.useLoaderData()
  const { user } = useLoaderData({ from: '/_site' })
  const { t, locale } = useLocale()
  const { home, settings: draft, isAdmin, setHome, setFeature, setService, setSetting } = useSiteEdit()
  const [members, setMembers] = useState(team)
  const [teamDirty, setTeamDirty] = useState(false)
  const [reviews, setReviews] = useState(testimonials)
  const [reviewsDirty, setReviewsDirty] = useState(false)

  const updateReview = (id: string, patch: Partial<(typeof reviews)[0]>) => {
    setReviews((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    setReviewsDirty(true)
  }

  const savePage = useCallback(async () => {
    for (const member of members) {
      await saveTeamMemberFn({
        data: {
          id: member.id,
          name: member.name,
          role: member.role,
          bio: member.bio ?? '',
          photoUrl: member.photoUrl ?? '',
          sortOrder: member.sortOrder,
        },
      })
    }
    for (const item of reviews) {
      await saveTestimonialFn({
        data: {
          id: item.id.startsWith('new-') ? undefined : item.id,
          customerName: item.customerName || 'Guest',
          tripName: item.tripName ?? '',
          quote: item.quote || '',
          rating: item.rating || 5,
          photoUrl: item.photoUrl ?? '',
          isFeatured: true,
        },
      })
    }
  }, [members, reviews])

  useRegisterPageSave(isAdmin ? savePage : null, teamDirty || reviewsDirty)

  const tripHeroImages = [...featured, ...popular, ...deals]
    .map((trip) => trip.coverImageUrl)
    .filter((url, i, arr) => Boolean(url) && arr.indexOf(url) === i)
    .slice(0, 6)

  const heroImages = home.heroImages.length ? home.heroImages : tripHeroImages

  const tripGallery = [...featured, ...popular, ...deals]
    .flatMap((trip) => [trip.coverImageUrl, ...trip.galleryUrls])
    .filter((url, i, arr) => Boolean(url) && arr.indexOf(url) === i)
    .slice(0, 6)

  const gallery = (home.galleryImages.length ? home.galleryImages : tripGallery).filter(Boolean)

  return (
    <div>
      <HeroSlideshow
        images={heroImages}
        videoUrl={settings?.heroVideoUrl}
        onReplaceSlide={
          isAdmin
            ? (index, url) => {
                const next = [...heroImages]
                next[index] = url
                setHome({ heroImages: next })
              }
            : undefined
        }
      >
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          <InlineText value={home.heroKicker} onChange={(v) => setHome({ heroKicker: v })} className="text-center uppercase tracking-[0.3em] text-primary" />
        </p>
        <h1 className="text-3xl leading-tight text-white sm:text-4xl md:text-6xl">
          <InlineText value={draft.heroTitle || t('exploreTrips')} onChange={(v) => setSetting('heroTitle', v)} className="text-center text-3xl text-white sm:text-4xl md:text-6xl" />
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
          <InlineText value={draft.heroSubtitle} onChange={(v) => setSetting('heroSubtitle', v)} multiline className="text-center text-base text-white/90 sm:text-lg" />
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <Link to="/trips" search={tripsSearch()} className="btn-primary w-full px-10 py-4 text-base sm:w-auto">
            {t('exploreTrips')}
          </Link>
          <Link to="/about" className="btn-outline w-full border-white text-white hover:border-primary sm:w-auto">
            {t('aboutUs')}
          </Link>
        </div>
      </HeroSlideshow>

      <section id="about" className="mx-auto max-w-7xl px-4 py-12 md:py-24">
        <SectionHeading
          kicker={<InlineText value={home.aboutKicker} onChange={(v) => setHome({ aboutKicker: v })} />}
          title={<InlineText value={home.aboutTitle} onChange={(v) => setHome({ aboutTitle: v })} />}
          desc={<InlineText value={draft.aboutText || home.aboutFallback} onChange={(v) => setSetting('aboutText', v)} multiline />}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {home.features.map((item, i) => (
            <div key={i} className="card p-5">
              <h3 className="font-semibold">
                <InlineText value={item.title} onChange={(v) => setFeature(i, { title: v })} />
              </h3>
              <p className="mt-2 text-sm text-muted">
                <InlineText value={item.desc} onChange={(v) => setFeature(i, { desc: v })} multiline />
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="offers" className="bg-accent px-4 py-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            kicker={<InlineText value={home.servicesKicker} onChange={(v) => setHome({ servicesKicker: v })} />}
            title={<InlineText value={home.servicesTitle} onChange={(v) => setHome({ servicesTitle: v })} />}
            desc={<InlineText value={home.servicesDesc} onChange={(v) => setHome({ servicesDesc: v })} multiline />}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {home.services.map((item, i) => {
              const inner = (
                <>
                  <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                    <InlineText value={item.kicker} onChange={(v) => setService(i, { kicker: v })} />
                  </p>
                  <h3 className="mt-2 text-xl">
                    <InlineText value={item.title} onChange={(v) => setService(i, { title: v })} />
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    <InlineText value={item.desc} onChange={(v) => setService(i, { desc: v })} multiline />
                  </p>
                  <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-wide text-primary">Learn more →</span>
                </>
              )
              if (isAdmin) return <div key={i} className="card block p-6">{inner}</div>
              if (i === 0) return <Link key={i} to="/trips" search={tripsSearch({ days: '1' })} className="card block p-6">{inner}</Link>
              if (i === 1) return <Link key={i} to="/trips" search={tripsSearch({ days: '2' })} className="card block p-6">{inner}</Link>
              if (i === 2) return <Link key={i} to="/contact" className="card block p-6">{inner}</Link>
              return <Link key={i} to="/trips" search={tripsSearch({ category: 'international' })} className="card block p-6">{inner}</Link>
            })}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Link to="/trips" className="card block p-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Private</p>
              <h3 className="mt-2 text-xl">Full package</h3>
              <p className="mt-2 text-sm text-muted">
                About 15 people together. The date is yours — other travelers cannot join.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-wide text-primary">Book a trip →</span>
            </Link>
            <Link to="/trips" className="card block p-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Family</p>
              <h3 className="mt-2 text-xl">Family trip</h3>
              <p className="mt-2 text-sm text-muted">
                Travel with your family only. We close the date so strangers do not join.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-wide text-primary">Book a trip →</span>
            </Link>
          </div>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section id="future" className="mx-auto max-w-7xl px-4 py-12 md:py-24">
          <SectionHeading
            kicker={<InlineText value={home.futureKicker} onChange={(v) => setHome({ futureKicker: v })} />}
            title={<InlineText value={home.futureTitle} onChange={(v) => setHome({ futureTitle: v })} />}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((trip) => (
              <Link
                key={`${trip.id}-${trip.nextDate}`}
                to="/trips/$slug"
                params={{ slug: trip.slug }}
                className="card flex gap-4 overflow-hidden p-3 transition hover:shadow-md"
              >
                <img src={trip.coverImageUrl} alt="" className="h-24 w-24 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{formatDate(trip.nextDate)}</p>
                  <h3 className="mt-1 truncate font-semibold">{trip.title}</h3>
                  <p className="text-sm text-muted">
                    <PriceTag etb={trip.price} usd={trip.priceUsd} size="sm" /> · {trip.spotsRemaining} spots left
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="bg-card px-4 py-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              kicker={<InlineText value={home.popularKicker} onChange={(v) => setHome({ popularKicker: v })} />}
              title={t('popularTrips')}
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  locale={locale}
                  loggedIn={Boolean(user)}
                  isWishlisted={wishlistIds.includes(trip.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {members.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 md:py-24">
          <SectionHeading
            kicker={<InlineText value={home.teamKicker} onChange={(v) => setHome({ teamKicker: v })} />}
            title={<InlineText value={home.teamTitle} onChange={(v) => setHome({ teamTitle: v })} />}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((member) => (
              <div key={member.id} className="card p-6 text-center">
                {isAdmin || member.photoUrl ? (
                  <InlineImage
                    src={member.photoUrl}
                    alt={member.name}
                    className="mx-auto w-24"
                    imgClassName="mx-auto h-24 w-24 rounded-full object-cover"
                    onChange={(url) => {
                      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, photoUrl: url } : m)))
                      setTeamDirty(true)
                    }}
                  />
                ) : (
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent text-xl font-semibold text-primary">
                    {member.name.slice(0, 1)}
                  </div>
                )}
                <h3 className="mt-4 font-semibold">{member.name}</h3>
                <p className="text-sm text-primary">{member.role}</p>
                {member.bio && <p className="mt-2 text-sm text-muted">{member.bio}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {(gallery.length > 0 || isAdmin) && (
        <section className="bg-accent px-4 py-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              kicker={<InlineText value={home.galleryKicker} onChange={(v) => setHome({ galleryKicker: v })} />}
              title={<InlineText value={home.galleryTitle} onChange={(v) => setHome({ galleryTitle: v })} />}
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {gallery.map((src, i) => (
                <div key={`${src}-${i}`} className="overflow-hidden rounded-2xl">
                  <InlineImage
                    src={src}
                    alt=""
                    imgClassName="aspect-[4/3] w-full object-cover"
                    onChange={(url) => {
                      const next = [...gallery]
                      next[i] = url
                      setHome({ galleryImages: next })
                    }}
                  />
                </div>
              ))}
              {isAdmin && (
                <div className="overflow-hidden rounded-2xl">
                  <InlineImage
                    src={undefined}
                    alt=""
                    imgClassName="aspect-[4/3] w-full object-cover"
                    onChange={(url) => setHome({ galleryImages: [...gallery, url] })}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {blogPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 md:py-24">
          <SectionHeading
            kicker={<InlineText value={home.blogKicker} onChange={(v) => setHome({ blogKicker: v })} />}
            title={t('travelTips')}
          />
          <div className="-mt-6 mb-8 text-center">
            <Link to="/blog" className="text-sm font-semibold uppercase tracking-wide text-primary">View all →</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {blogPosts.map((post) => (
              <Link key={post.id} to="/blog/$slug" params={{ slug: post.slug }} className="card overflow-hidden hover:shadow-md">
                {post.coverImageUrl && (
                  <img src={post.coverImageUrl} alt={post.title} className="aspect-video w-full object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="mt-1 text-sm text-muted">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-primary px-4 py-12 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              <InlineText value={home.newsletterTitle} onChange={(v) => setHome({ newsletterTitle: v })} className="text-white" />
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              <InlineText value={home.newsletterDesc} onChange={(v) => setHome({ newsletterDesc: v })} multiline className="text-white/80" />
            </p>
          </div>
          <div className="w-full max-w-md [&_h4]:text-primary-foreground/70 [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-white/60">
            <NewsletterSignup dark />
          </div>
        </div>
      </section>

      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-12 md:py-24">
          <SectionHeading
            kicker={<InlineText value={home.testimonialsKicker} onChange={(v) => setHome({ testimonialsKicker: v })} />}
            title={t('testimonials')}
          />
          {reviews.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((item) => (
              <blockquote key={item.id} className="card p-6">
                {(item.photoUrl || isAdmin) && (
                  <InlineImage
                    src={item.photoUrl}
                    alt={item.customerName}
                    className="mb-4 w-16"
                    imgClassName="h-16 w-16 rounded-full object-cover"
                    onChange={(url) => updateReview(item.id, { photoUrl: url })}
                  />
                )}
                <StarRating value={item.rating} onChange={(rating) => updateReview(item.id, { rating })} />
                <p className="mt-3 text-muted">
                  "
                  <InlineText
                    value={item.quote}
                    onChange={(v) => updateReview(item.id, { quote: v })}
                    multiline
                  />
                  "
                </p>
                <footer className="mt-4 font-medium">
                  <InlineText
                    value={item.customerName}
                    onChange={(v) => updateReview(item.id, { customerName: v })}
                  />
                  {(item.tripName || isAdmin) && (
                    <span className="block text-sm text-muted">
                      <InlineText
                        value={item.tripName ?? ''}
                        onChange={(v) => updateReview(item.id, { tripName: v })}
                      />
                    </span>
                  )}
                </footer>
              </blockquote>
            ))}
          </div>
          )}
          <p className="mt-8">
            <Link to="/share-your-trip" className="btn-primary px-10 py-4 text-lg">
              {t('shareYourStory')} →
            </Link>
          </p>
          {isAdmin && (
            <button
              type="button"
              className="btn-outline mt-6 text-sm"
              onClick={() => {
                setReviews((prev) => [
                  ...prev,
                  {
                    id: `new-${Date.now()}`,
                    customerName: 'Guest name',
                    tripName: 'Trip name',
                    quote: 'Write the review here.',
                    rating: 5,
                    photoUrl: null,
                    isFeatured: true,
                  },
                ])
                setReviewsDirty(true)
              }}
            >
              Add testimonial
            </button>
          )}
        </section>

      <section id="contact" className="bg-accent px-4 py-12 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              kicker={<InlineText value={home.contactKicker} onChange={(v) => setHome({ contactKicker: v })} />}
              title={<InlineText value={home.contactTitle} onChange={(v) => setHome({ contactTitle: v })} />}
              desc={<InlineText value={home.contactDesc} onChange={(v) => setHome({ contactDesc: v })} multiline />}
            />
            <div className="mt-6 space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <InlineText value={draft.phone} onChange={(v) => setSetting('phone', v)} />
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <InlineText value={draft.email} onChange={(v) => setSetting('email', v)} />
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <InlineText value={draft.address} onChange={(v) => setSetting('address', v)} />
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {settings?.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                  <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
                </a>
              )}
              {settings?.telegramUsername && (
                <a href={`https://t.me/${settings.telegramUsername.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="btn-outline text-sm">
                  <Send className="mr-1 h-4 w-4" /> Telegram
                </a>
              )}
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="btn-outline text-sm">
                  <Facebook className="mr-1 h-4 w-4" /> Facebook
                </a>
              )}
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="btn-outline text-sm">
                  <Instagram className="mr-1 h-4 w-4" /> Instagram
                </a>
              )}
              {settings?.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" rel="noreferrer" className="btn-outline text-sm">
                  <TikTokIcon className="mr-1 h-4 w-4" /> TikTok
                </a>
              )}
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="font-semibold">Payment methods</p>
              <p className="mt-2 text-muted">Telebirr{settings?.telebirrNumber ? ` — ${settings.telebirrNumber}` : ''}</p>
              <p className="text-muted">Bank transfer{settings?.bankName ? ` — ${settings.bankName}` : ''}</p>
              <p className="text-muted">Pay on arrival</p>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold">
              <InlineText value={home.contactFormTitle} onChange={(v) => setHome({ contactFormTitle: v })} />
            </h3>
            <div className="mt-4">
              <HomeContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
