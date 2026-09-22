import { Link, createFileRoute } from '@tanstack/react-router'
import {
  BookOpen,
  CalendarDays,
  Image,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Star,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_HOMEPAGE, parseHomepageContent, type HomepageContent } from '~/lib/homepage-content'
import { updateSiteSettingsFn } from '~/server/admin/functions'
import { getSiteSettingsFn } from '~/server/content/functions'

export const Route = createFileRoute('/admin/homepage')({
  loader: async () => {
    const settings = await getSiteSettingsFn()
    return { settings }
  },
  component: AdminHomepagePage,
})

const SECTIONS = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'trips', label: 'Trips' },
  { id: 'team', label: 'Team' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'blog', label: 'Blog' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'contact', label: 'Contact' },
] as const

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}

function SectionCard({
  id,
  icon: Icon,
  title,
  hint,
  children,
}: {
  id: string
  icon: typeof MapPin
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-xl bg-emerald-50 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold normal-case tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{hint}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function AdminHomepagePage() {
  const { settings } = Route.useLoaderData()
  const [form, setForm] = useState<HomepageContent>(parseHomepageContent(settings?.homepageJson))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof HomepageContent, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const setFeature = (i: number, key: 'title' | 'desc', value: string) => {
    setForm((prev) => {
      const features = [...prev.features]
      features[i] = { ...features[i], [key]: value }
      return { ...prev, features }
    })
    setSaved(false)
  }

  const setService = (i: number, key: 'kicker' | 'title' | 'desc', value: string) => {
    setForm((prev) => {
      const services = [...prev.services]
      services[i] = { ...services[i], [key]: value }
      return { ...prev, services }
    })
    setSaved(false)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await updateSiteSettingsFn({ data: { homepageJson: JSON.stringify(form) } })
      setSaved(true)
    } catch {
      setError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Website</p>
          <h1 className="mt-1 font-display text-2xl font-bold normal-case tracking-tight">Homepage</h1>
          <p className="mt-1 text-sm text-muted">Headings and paragraphs visitors see on the public home page.</p>
        </div>
        <Link to="/" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
          View site
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SECTIONS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            {item.label}
          </a>
        ))}
      </div>

      <form onSubmit={save} className="mt-6 space-y-4 pb-24">
        <SectionCard id="hero" icon={Megaphone} title="Hero" hint="The line above the main video on the first screen.">
          <Field label="Kicker" hint="Short line above the big title.">
            <input className="input" value={form.heroKicker} onChange={(e) => set('heroKicker', e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard id="about" icon={MapPin} title="About" hint="Story block and three feature tiles.">
          <Field label="Kicker">
            <input className="input" value={form.aboutKicker} onChange={(e) => set('aboutKicker', e.target.value)} />
          </Field>
          <Field label="Title">
            <input className="input" value={form.aboutTitle} onChange={(e) => set('aboutTitle', e.target.value)} />
          </Field>
          <Field label="Fallback paragraph" hint="Used if Settings → About is empty.">
            <textarea className="input" rows={3} value={form.aboutFallback} onChange={(e) => set('aboutFallback', e.target.value)} />
          </Field>
          <div className="grid gap-3 md:grid-cols-3">
            {form.features.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Feature {i + 1}</p>
                <input
                  className="input mb-2"
                  placeholder="Title"
                  value={item.title}
                  onChange={(e) => setFeature(i, 'title', e.target.value)}
                />
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Description"
                  value={item.desc}
                  onChange={(e) => setFeature(i, 'desc', e.target.value)}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard id="services" icon={Star} title="Services" hint="Four offer cards: day trips, overnight, groups, international.">
          <Field label="Kicker">
            <input className="input" value={form.servicesKicker} onChange={(e) => set('servicesKicker', e.target.value)} />
          </Field>
          <Field label="Title">
            <input className="input" value={form.servicesTitle} onChange={(e) => set('servicesTitle', e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea className="input" rows={2} value={form.servicesDesc} onChange={(e) => set('servicesDesc', e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {form.services.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Card {i + 1}</p>
                <input
                  className="input mb-2"
                  placeholder="Small label"
                  value={item.kicker}
                  onChange={(e) => setService(i, 'kicker', e.target.value)}
                />
                <input
                  className="input mb-2"
                  placeholder="Title"
                  value={item.title}
                  onChange={(e) => setService(i, 'title', e.target.value)}
                />
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Description"
                  value={item.desc}
                  onChange={(e) => setService(i, 'desc', e.target.value)}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard id="trips" icon={CalendarDays} title="Trip lists" hint="Titles above upcoming and popular trips.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Future trips kicker">
              <input className="input" value={form.futureKicker} onChange={(e) => set('futureKicker', e.target.value)} />
            </Field>
            <Field label="Future trips title">
              <input className="input" value={form.futureTitle} onChange={(e) => set('futureTitle', e.target.value)} />
            </Field>
            <Field label="Popular kicker">
              <input className="input" value={form.popularKicker} onChange={(e) => set('popularKicker', e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard id="team" icon={Users} title="Team" hint="Heading above the guides.">
            <Field label="Kicker">
              <input className="input" value={form.teamKicker} onChange={(e) => set('teamKicker', e.target.value)} />
            </Field>
            <Field label="Title">
              <input className="input" value={form.teamTitle} onChange={(e) => set('teamTitle', e.target.value)} />
            </Field>
          </SectionCard>
          <SectionCard id="gallery" icon={Image} title="Gallery" hint="Heading above the photo strip.">
            <Field label="Kicker">
              <input className="input" value={form.galleryKicker} onChange={(e) => set('galleryKicker', e.target.value)} />
            </Field>
            <Field label="Title">
              <input className="input" value={form.galleryTitle} onChange={(e) => set('galleryTitle', e.target.value)} />
            </Field>
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard id="blog" icon={BookOpen} title="Blog" hint="Small label above latest posts.">
            <Field label="Kicker">
              <input className="input" value={form.blogKicker} onChange={(e) => set('blogKicker', e.target.value)} />
            </Field>
            <Field label="Testimonials kicker">
              <input
                className="input"
                value={form.testimonialsKicker}
                onChange={(e) => set('testimonialsKicker', e.target.value)}
              />
            </Field>
          </SectionCard>
          <SectionCard id="newsletter" icon={Mail} title="Newsletter" hint="Signup box at the bottom of the page.">
            <Field label="Title">
              <input className="input" value={form.newsletterTitle} onChange={(e) => set('newsletterTitle', e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea className="input" rows={3} value={form.newsletterDesc} onChange={(e) => set('newsletterDesc', e.target.value)} />
            </Field>
          </SectionCard>
        </div>

        <SectionCard id="contact" icon={MessageCircle} title="Contact" hint="Contact block and form heading.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kicker">
              <input className="input" value={form.contactKicker} onChange={(e) => set('contactKicker', e.target.value)} />
            </Field>
            <Field label="Title">
              <input className="input" value={form.contactTitle} onChange={(e) => set('contactTitle', e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className="input" rows={2} value={form.contactDesc} onChange={(e) => set('contactDesc', e.target.value)} />
          </Field>
          <Field label="Form title">
            <input className="input" value={form.contactFormTitle} onChange={(e) => set('contactFormTitle', e.target.value)} />
          </Field>
        </SectionCard>

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-card/95 px-4 py-3 shadow-md backdrop-blur">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save homepage'}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setForm(DEFAULT_HOMEPAGE)
              setSaved(false)
            }}
          >
            Reset to default
          </button>
          {saved && <p className="text-sm font-medium text-primary">Saved.</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </form>
    </div>
  )
}
