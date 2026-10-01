import { Link, createFileRoute } from '@tanstack/react-router'
import {
  CalendarDays,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Heart,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { NewsletterSignup } from '~/components/contact/NewsletterSignup'
import { AngledGalleryCarousel } from '~/components/home/AngledGalleryCarousel'
import { HeroSlideshow } from '~/components/home/HeroSlideshow'
import { HomePromoVideo } from '~/components/home/HomePromoVideo'
import { HomeTestimonialCard } from '~/components/home/HomeTestimonialCard'
import { SectionHeading } from '~/components/home/SectionHeading'
import { TestimonialsCarousel } from '~/components/home/TestimonialsCarousel'
import { InlineImage } from '~/components/inline-image'
import { InlineText } from '~/components/inline-text'
import { useRegisterPageSave, useSiteEdit } from '~/components/site-edit-context'
import { useLocale } from '~/components/locale-context'
import { PriceTag } from '~/components/price-tag'
import { BrandLogoMark } from '~/components/brand/BrandLogoMark'
import { formatDate } from '~/lib/utils'
import { tripsSearch } from '~/lib/trips-search'
import {
  getSiteSettingsFn,
  listTeamMembersFn,
  listTestimonialsFn,
  submitContactFn,
} from '~/server/content/functions'
import { saveTeamMemberFn, saveTestimonialFn } from '~/server/admin/functions'
import { listUpcomingDeparturesFn, listTripsFn } from '~/server/trips/functions'

export const Route = createFileRoute('/_site/')({
  loader: async () => {
    const [featured, popular, deals, testimonials, settings, upcoming, team] = await Promise.all([
      listTripsFn({ data: { featured: true } }),
      listTripsFn({ data: { sort: 'popular' } }),
      listTripsFn({ data: { lastMinute: true } }),
      listTestimonialsFn(),
      getSiteSettingsFn(),
      listUpcomingDeparturesFn(),
      listTeamMembersFn(),
    ])
    return {
      featured: featured.slice(0, 3),
      popular: popular.slice(0, 4),
      deals: deals.slice(0, 3),
      testimonials,
      settings,
      upcoming,
      team,
    }
  },
  component: HomePage,
})

const HOME_SERVICE_ICONS: LucideIcon[] = [CalendarDays, Zap, MessageCircle, Globe2]

const HOME_OFFER_PAIR_CARD_CLASS =
  'home-offer-card card flex h-full min-h-0 min-w-0 flex-col p-2 md:p-6'

const HOME_FUTURE_TRIP_CARD_CLASS =
  'home-future-trip card flex flex-col overflow-hidden p-0 transition hover:shadow-md max-md:rounded-xl md:min-h-0 md:flex-row md:items-stretch md:gap-4 md:p-3'

type HomeFutureTrip = {
  id: string
  slug: string
  title: string
  coverImageUrl: string
  nextDate: string
  price: number
  priceUsd?: number | null
  spotsRemaining: number
}

function HomeFutureTripCard({ trip }: { trip: HomeFutureTrip }) {
  return (
    <Link
      to="/trips/$slug"
      params={{ slug: trip.slug }}
      data-reveal=""
      className={HOME_FUTURE_TRIP_CARD_CLASS}
    >
      <div className="home-future-trip-media relative aspect-[5/4] w-full shrink-0 overflow-hidden md:aspect-auto md:h-24 md:w-24">
        <img
          src={trip.coverImageUrl}
          alt=""
          className="h-full w-full object-cover md:rounded-xl md:border md:border-primary/35"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2.5 md:justify-center md:gap-0.5 md:p-0">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-primary md:text-xs md:tracking-wide">
          {formatDate(trip.nextDate)}
        </p>
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug md:mt-1 md:line-clamp-none md:truncate md:text-base">
          {trip.title}
        </h3>
        <div className="mt-auto flex min-w-0 flex-col gap-0.5 pt-1 md:mt-0 md:flex-row md:flex-wrap md:items-baseline md:gap-x-1.5 md:gap-y-0 md:pt-0">
          <PriceTag
            etb={trip.price}
            usd={trip.priceUsd}
            size="sm"
            className="inline-flex flex-wrap items-baseline text-[0.6875rem] md:text-sm"
          />
          <span className="hidden text-muted/70 md:inline" aria-hidden>
            {'\u00B7'}
          </span>
          <span className="text-[0.625rem] leading-tight text-muted/85 md:text-xs md:text-muted md:whitespace-nowrap">
            {trip.spotsRemaining} spots left
          </span>
        </div>
      </div>
    </Link>
  )
}

function HomeOfferCardBody({
  icon: Icon,
  kicker,
  title,
  desc,
  cta,
  compactMobile,
  compactNarrow,
}: {
  icon: LucideIcon
  kicker: React.ReactNode
  title: React.ReactNode
  desc: React.ReactNode
  cta: string
  compactMobile?: boolean
  compactNarrow?: boolean
}) {
  const narrow = Boolean(compactMobile && compactNarrow)
  return (
    <>
      <div
        className={`flex flex-1 flex-col ${compactMobile ? (narrow ? 'gap-1.5 md:gap-3' : 'gap-2 md:gap-3') : 'gap-3'} md:block`}
      >
        <div
          className={
            narrow
              ? 'flex flex-col items-center gap-1.5 text-center md:block md:text-left'
              : 'flex items-start gap-2 md:gap-3 md:block'
          }
        >
          <div
            className={`home-offer-card-icon flex shrink-0 items-center justify-center rounded-xl border border-primary/50 bg-primary/10 text-primary md:hidden ${
              narrow ? 'h-8 w-8' : compactMobile ? 'h-9 w-9' : 'h-11 w-11'
            }`}
            aria-hidden
          >
            <Icon
              className={narrow ? 'h-3.5 w-3.5' : compactMobile ? 'h-4 w-4' : 'h-5 w-5'}
              strokeWidth={1.75}
            />
          </div>
          <div className={narrow ? 'min-w-0 w-full md:flex-1' : 'min-w-0 flex-1'}>
            <p
              className={`font-semibold uppercase text-primary ${
                narrow
                  ? 'text-[0.5625rem] tracking-[0.12em] md:text-sm md:tracking-widest'
                  : compactMobile
                    ? 'text-[0.625rem] tracking-[0.15em] md:text-sm md:tracking-widest'
                    : 'text-xs tracking-[0.2em] md:text-sm md:tracking-widest'
              }`}
            >
              {kicker}
            </p>
            <h3
              className={`md:mt-2 md:text-xl ${
                narrow
                  ? 'mt-0.5 text-[0.6875rem] font-semibold leading-tight md:text-xl md:font-normal'
                  : compactMobile
                    ? 'mt-0.5 text-sm font-semibold leading-snug md:text-xl md:font-normal'
                    : 'mt-1 text-lg'
              }`}
            >
              {title}
            </h3>
          </div>
        </div>
        <p
          className={`text-muted md:mt-2 ${
            narrow
              ? 'text-[0.625rem] leading-tight md:text-sm md:leading-relaxed'
              : compactMobile
                ? 'text-xs leading-snug md:text-sm md:leading-relaxed'
                : 'text-sm leading-relaxed'
          }`}
        >
          {desc}
        </p>
      </div>
      <span
        className={`home-offer-cta mt-auto md:pt-0 ${
          narrow
            ? 'home-offer-cta--compact home-offer-cta--narrow pt-1.5 md:mt-4 md:text-sm'
            : compactMobile
              ? 'home-offer-cta--compact pt-2 text-xs md:mt-4 md:text-sm'
              : 'pt-3 md:mt-4'
        }`}
      >
        {cta}
      </span>
    </>
  )
}

type HomeOfferLink =
  | { to: '/trips'; search?: ReturnType<typeof tripsSearch> }
  | { to: '/contact' }

function homeServiceOfferLink(i: number): HomeOfferLink {
  if (i === 0) return { to: '/trips', search: tripsSearch({ days: '1' }) }
  if (i === 1) return { to: '/trips', search: tripsSearch({ days: '2' }) }
  if (i === 2) return { to: '/contact' }
  return { to: '/trips', search: tripsSearch({ category: 'international' }) }
}

function HomeOfferShell({
  className,
  isAdmin,
  link,
  children,
}: {
  className: string
  isAdmin: boolean
  link?: HomeOfferLink
  children: React.ReactNode
}) {
  if (isAdmin) {
    return (
      <div data-reveal="" className={className}>
        {children}
      </div>
    )
  }
  if (link?.to === '/contact') {
    return (
      <Link to="/contact" data-reveal="" className={className}>
        {children}
      </Link>
    )
  }
  return (
    <Link to="/trips" search={link?.search ?? tripsSearch()} data-reveal="" className={className}>
      {children}
    </Link>
  )
}

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
  const { featured, popular, deals, testimonials, settings, upcoming, team } = Route.useLoaderData()
  const { t } = useLocale()
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

  const renderServiceOffer = (i: number, cardClass: string) => {
    const item = home.services[i]
    if (!item) return null
    const Icon = HOME_SERVICE_ICONS[i] ?? Globe2
    return (
      <HomeOfferShell
        key={`service-${i}`}
        className={cardClass}
        isAdmin={isAdmin}
        link={homeServiceOfferLink(i)}
      >
        <HomeOfferCardBody
          compactMobile
          icon={Icon}
          kicker={<InlineText value={item.kicker} onChange={(v) => setService(i, { kicker: v })} />}
          title={<InlineText value={item.title} onChange={(v) => setService(i, { title: v })} />}
          desc={<InlineText value={item.desc} onChange={(v) => setService(i, { desc: v })} multiline />}
          cta={'Learn more \u2192'}
        />
      </HomeOfferShell>
    )
  }

  const renderPrivateOffer = (cardClass: string) => (
    <HomeOfferShell
      key="private"
      className={cardClass}
      isAdmin={isAdmin}
      link={{ to: '/trips' }}
    >
      <HomeOfferCardBody
        compactMobile
        icon={Users}
        kicker="Private"
        title="Full package"
        desc={'About 15 people together. The date is yours \u2014 other travelers cannot join.'}
        cta={'Book a trip \u2192'}
      />
    </HomeOfferShell>
  )

  const renderFamilyOffer = (cardClass: string) => (
    <HomeOfferShell
      key="family"
      className={cardClass}
      isAdmin={isAdmin}
      link={{ to: '/trips' }}
    >
      <HomeOfferCardBody
        compactMobile
        icon={Heart}
        kicker="Family"
        title="Family trip"
        desc="Travel with your family only. We close the date so strangers do not join."
        cta={'Book a trip \u2192'}
      />
    </HomeOfferShell>
  )

  const offerCardIndices = [0, 1, 2, 3] as const

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
        <BrandLogoMark size="hero" alt="Negus Events" className="mx-auto mb-4 sm:mb-5" />
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
        <div data-reveal-stagger="" className="grid gap-4 sm:grid-cols-3">
          {home.features.map((item, i) => (
            <div key={i} data-reveal="" className="card p-5">
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

      <HomePromoVideo
        videoUrl={home.homeVideoUrl || settings?.heroVideoUrl || ''}
        posterUrl={home.homeVideoPosterUrl || null}
        title={<InlineText value={home.homeVideoTitle} onChange={(v) => setHome({ homeVideoTitle: v })} />}
        desc={<InlineText value={home.homeVideoDesc} onChange={(v) => setHome({ homeVideoDesc: v })} multiline />}
        isAdmin={isAdmin}
        onVideoUrlChange={isAdmin ? (url) => setHome({ homeVideoUrl: url }) : undefined}
      />

      <section
        id="offers"
        className="bg-accent px-4 py-8 md:py-24 max-md:section-band-mobile max-md:border-y max-md:border-primary/15 max-md:[&_.section-heading]:mb-6 max-md:[&_.section-heading]:text-[1.35rem] max-md:[&_.section-heading]:after:bottom-[-10px] max-md:[&_.section-kicker]:mb-2 max-md:[&_.section-kicker]:text-xs max-md:[&_.section-kicker]:tracking-[0.2em] max-md:[&_.text-muted]:text-sm max-md:[&_.text-muted]:leading-6 max-md:[&_div.text-center]:mb-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            kicker={<InlineText value={home.servicesKicker} onChange={(v) => setHome({ servicesKicker: v })} />}
            title={<InlineText value={home.servicesTitle} onChange={(v) => setHome({ servicesTitle: v })} />}
            desc={<InlineText value={home.servicesDesc} onChange={(v) => setHome({ servicesDesc: v })} multiline />}
          />
          <div>
            <div data-reveal-stagger="" className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
              {offerCardIndices.map((i) => renderServiceOffer(i, HOME_OFFER_PAIR_CARD_CLASS))}
              {renderPrivateOffer(HOME_OFFER_PAIR_CARD_CLASS)}
              {renderFamilyOffer(HOME_OFFER_PAIR_CARD_CLASS)}
            </div>
            <div data-reveal-stagger="" className="hidden md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
              {offerCardIndices.map((i) => renderServiceOffer(i, HOME_OFFER_PAIR_CARD_CLASS))}
              {renderPrivateOffer(HOME_OFFER_PAIR_CARD_CLASS)}
              {renderFamilyOffer(HOME_OFFER_PAIR_CARD_CLASS)}
            </div>
          </div>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section
          id="future"
          className="mx-auto max-w-7xl px-4 py-8 md:py-24 max-md:section-band-mobile max-md:border-y max-md:border-primary/15 max-md:[&>div:first-child]:mb-6 max-md:[&_.section-heading]:mb-8 max-md:[&_.section-heading]:text-[1.35rem] max-md:[&_.section-heading]:after:bottom-[-10px] max-md:[&_.section-kicker]:mb-2 max-md:[&_.section-kicker]:text-xs max-md:[&_.section-kicker]:tracking-[0.2em]"
        >
          <SectionHeading
            kicker={<InlineText value={home.futureKicker} onChange={(v) => setHome({ futureKicker: v })} />}
            title={<InlineText value={home.futureTitle} onChange={(v) => setHome({ futureTitle: v })} />}
          />
          <div data-reveal-stagger="" className="home-future-grid grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {upcoming.map((trip) => (
              <HomeFutureTripCard key={`${trip.id}-${trip.nextDate}`} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {(gallery.length > 0 || isAdmin) && (
        <section className="overflow-x-clip bg-accent px-4 py-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              kicker={<InlineText value={home.galleryKicker} onChange={(v) => setHome({ galleryKicker: v })} />}
              title={<InlineText value={home.galleryTitle} onChange={(v) => setHome({ galleryTitle: v })} />}
            />
            <AngledGalleryCarousel
              images={gallery}
              isAdmin={isAdmin}
              onReplace={
                isAdmin
                  ? (index, url) => {
                      const next = [...gallery]
                      next[index] = url
                      setHome({ galleryImages: next })
                    }
                  : undefined
              }
              onAdd={isAdmin ? (url) => setHome({ galleryImages: [...gallery, url] }) : undefined}
            />
          </div>
        </section>
      )}

      {members.length > 0 && (
        <section
          id="team"
          className="mx-auto max-w-7xl px-4 py-8 md:py-24 max-md:[&>div:first-child]:mb-6 max-md:[&_.section-heading]:mb-8 max-md:[&_.section-heading]:text-[1.35rem] max-md:[&_.section-heading]:after:bottom-[-10px] max-md:[&_.section-kicker]:mb-2 max-md:[&_.section-kicker]:text-xs max-md:[&_.section-kicker]:tracking-[0.2em]"
        >
          <SectionHeading
            kicker={<InlineText value={home.teamKicker} onChange={(v) => setHome({ teamKicker: v })} />}
            title={<InlineText value={home.teamTitle} onChange={(v) => setHome({ teamTitle: v })} />}
          />
          <div data-reveal-stagger="" className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {members.map((member) => (
              <div
                key={member.id}
                data-reveal=""
                className="home-team-card card w-full p-4 text-center md:p-6"
              >
                {isAdmin || member.photoUrl ? (
                  <InlineImage
                    src={member.photoUrl}
                    alt={member.name}
                    className="mx-auto w-16 md:w-24"
                    imgClassName="mx-auto h-16 w-16 rounded-full object-cover ring-2 ring-primary/30 md:h-24 md:w-24"
                    onChange={(url) => {
                      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, photoUrl: url } : m)))
                      setTeamDirty(true)
                    }}
                  />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-lg font-semibold text-primary ring-2 ring-primary/30 md:h-24 md:w-24 md:text-xl">
                    {member.name.slice(0, 1)}
                  </div>
                )}
                <h3 className="mt-3 text-base font-semibold md:mt-4 md:text-lg">{member.name}</h3>
                <p className="text-sm font-medium text-primary">{member.role}</p>
                {member.bio && (
                  <p className="mt-2 text-base leading-relaxed text-muted md:text-sm md:leading-normal">{member.bio}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section data-reveal="" className="bg-primary px-4 py-12 text-primary-foreground">
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
            <>
              <TestimonialsCarousel slideCount={reviews.length} className="-mx-4 px-4 md:hidden">
                {reviews.map((item) => (
                  <div key={item.id} className="w-[88%] shrink-0">
                    <HomeTestimonialCard item={item} isAdmin={isAdmin} onUpdate={updateReview} />
                  </div>
                ))}
              </TestimonialsCarousel>
              <div data-reveal-stagger="" className="hidden gap-6 md:grid md:grid-cols-3">
                {reviews.map((item) => (
                  <div key={item.id} data-reveal="">
                    <HomeTestimonialCard
                      item={item}
                      isAdmin={isAdmin}
                      onUpdate={updateReview}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="mt-8">
            <Link to="/share-your-trip" className="btn-primary px-10 py-4 text-lg">
              {t('shareYourStory')} {'\u2192'}
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
            <div data-reveal="" className="mt-6 space-y-3 text-sm">
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
            <div data-reveal="" className="mt-6 flex flex-wrap gap-2">
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
            </div>
            <div data-reveal="" className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="font-semibold">Payment methods</p>
              <p className="mt-2 text-muted">
                Telebirr{settings?.telebirrNumber ? ` \u2014 ${settings.telebirrNumber}` : ''}
              </p>
              <p className="text-muted">
                Bank transfer{settings?.bankName ? ` \u2014 ${settings.bankName}` : ''}
              </p>
              <p className="text-muted">Pay on arrival</p>
            </div>
          </div>
          <div data-reveal="" className="card p-6">
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
