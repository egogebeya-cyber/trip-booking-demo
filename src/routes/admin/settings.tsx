import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Banknote,
  Building2,
  ChartLine,
  Mail,
  MessageCircle,
  Percent,
  Share2,
  Smartphone,
  Video,
} from 'lucide-react'
import { useState } from 'react'
import { uploadImageFile } from '~/components/inline-image'
import { sanitizePhoneInput } from '~/lib/phone'
import { getEmailSettingsFn, runTripRemindersFn, sendTestEmailFn, sendTestSmsFn, updateSiteSettingsFn } from '~/server/admin/functions'
import { getSiteSettingsFn } from '~/server/content/functions'

export const Route = createFileRoute('/admin/settings')({
  loader: async () => {
    const [settings, email] = await Promise.all([getSiteSettingsFn(), getEmailSettingsFn()])
    return { settings, email }
  },
  component: AdminSettingsPage,
})

const SECTIONS = [
  { id: 'business', label: 'Business' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'chat', label: 'Chat' },
  { id: 'homepage', label: 'Hero' },
  { id: 'social', label: 'Social' },
  { id: 'payments', label: 'Payments' },
  { id: 'booking', label: 'Booking' },
  { id: 'analytics', label: 'Analytics' },
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
  extra,
  children,
}: {
  id: string
  icon: typeof Building2
  title: string
  hint: string
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-emerald-50 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold normal-case tracking-tight">{title}</h2>
            <p className="mt-0.5 text-sm text-muted">{hint}</p>
          </div>
        </div>
        {extra}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function QrUpload({
  label,
  url,
  alt,
  onChange,
  onClear,
}: {
  label: string
  url: string
  alt: string
  onChange: (url: string) => void
  onClear: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {url ? (
        <img src={url} alt={alt} className="mb-3 h-32 w-32 rounded-xl border border-border bg-white object-contain p-1" />
      ) : (
        <div className="mb-3 flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-border bg-accent/40 text-xs text-muted">
          No QR yet
        </div>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="input"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const next = await uploadImageFile(file)
          onChange(next)
        }}
      />
      {url ? (
        <button type="button" className="mt-2 text-xs font-medium text-muted hover:text-destructive" onClick={onClear}>
          Remove image
        </button>
      ) : null}
    </div>
  )
}

function AdminSettingsPage() {
  const { settings, email } = Route.useLoaderData()
  const [form, setForm] = useState({
    businessName: settings?.businessName ?? '',
    email: settings?.email ?? '',
    phone: settings?.phone ?? '',
    address: settings?.address ?? '',
    whatsappNumber: settings?.whatsappNumber ?? '',
    telegramUsername: settings?.telegramUsername ?? '',
    telegramBotToken: '',
    heroTitle: settings?.heroTitle ?? '',
    heroSubtitle: settings?.heroSubtitle ?? '',
    heroVideoUrl: settings?.heroVideoUrl ?? '',
    aboutText: settings?.aboutText ?? '',
    facebookUrl: settings?.facebookUrl ?? '',
    instagramUrl: settings?.instagramUrl ?? '',
    tiktokUrl: settings?.tiktokUrl ?? '',
    telebirrNumber: settings?.telebirrNumber ?? '',
    bankName: settings?.bankName ?? '',
    bankAccount: settings?.bankAccount ?? '',
    telebirrQrUrl: settings?.telebirrQrUrl ?? '',
    bankQrUrl: settings?.bankQrUrl ?? '',
    analyticsId: settings?.analyticsId ?? '',
    groupDiscountSmallMinGuests: String(settings?.groupDiscountSmallMinGuests ?? 5),
    groupDiscountSmallPercent: String(settings?.groupDiscountSmallPercent ?? 5),
    groupDiscountMinGuests: String(settings?.groupDiscountMinGuests ?? 10),
    groupDiscountPercent: String(settings?.groupDiscountPercent ?? 10),
    privatePackageGuests: String(settings?.privatePackageGuests ?? 15),
    familyMaxGuests: String(settings?.familyMaxGuests ?? 8),
    defaultDepositPercent: String(settings?.defaultDepositPercent ?? 30),
    smtpHost: email.smtpHost || 'smtp.gmail.com',
    smtpPort: email.smtpPort || '587',
    smtpUser: email.smtpUser ?? '',
    smtpPass: '',
    smtpFrom: email.smtpFrom ?? '',
    smsEnabled: Boolean(email.smsEnabled),
    smsApiToken: '',
    smsSenderName: email.smsSenderName ?? '',
    smsIdentifier: email.smsIdentifier ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [emailMode, setEmailMode] = useState(email.mode)
  const [testStatus, setTestStatus] = useState('')
  const [testing, setTesting] = useState(false)
  const [smsStatus, setSmsStatus] = useState('')
  const [smsBusy, setSmsBusy] = useState(false)

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const emailLabel =
    emailMode === 'smtp'
      ? 'Connected (SMTP)'
      : emailMode === 'resend'
        ? 'Connected (Resend)'
        : emailMode === 'disabled'
          ? 'Turned off'
          : 'Not connected'

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await updateSiteSettingsFn({
        data: {
          ...form,
          smtpHost: form.smtpHost || 'smtp.gmail.com',
          smtpPort: Number(form.smtpPort) || 587,
          smtpUser: form.smtpUser,
          smtpFrom: form.smtpFrom || form.smtpUser,
          groupDiscountSmallMinGuests: Number(form.groupDiscountSmallMinGuests) || 5,
          groupDiscountSmallPercent: Number(form.groupDiscountSmallPercent) || 0,
          groupDiscountMinGuests: Number(form.groupDiscountMinGuests) || 10,
          groupDiscountPercent: Number(form.groupDiscountPercent) || 0,
          privatePackageGuests: Number(form.privatePackageGuests) || 15,
          familyMaxGuests: Number(form.familyMaxGuests) || 8,
          defaultDepositPercent: Number(form.defaultDepositPercent) || 30,
          smsEnabled: form.smsEnabled,
        },
      })
      setSaved(true)
      const next = await getEmailSettingsFn()
      setEmailMode(next.mode)
    } catch {
      setError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    setTesting(true)
    setTestStatus('')
    try {
      if (!form.smtpUser.includes('@gmail.com') && !form.smtpUser.includes('@googlemail.com')) {
        setTestStatus('Enter your real Gmail address (example: yourname@gmail.com).')
        return
      }
      if (!form.smtpPass && !email.hasPassword) {
        setTestStatus('Paste a Google App Password, not your normal Gmail password.')
        return
      }
      await updateSiteSettingsFn({
        data: {
          smtpHost: form.smtpHost || 'smtp.gmail.com',
          smtpPort: Number(form.smtpPort) || 587,
          smtpUser: form.smtpUser,
          smtpPass: form.smtpPass,
          smtpFrom: form.smtpFrom || form.smtpUser,
          email: form.email,
        },
      })
      const result = await sendTestEmailFn({ data: { to: form.smtpUser } })
      const next = await getEmailSettingsFn()
      setEmailMode(next.mode)
      setTestStatus(
        result.ok
          ? `Test email sent to ${form.smtpUser}`
          : result.error || 'Could not send. Check SMTP details.',
      )
    } catch {
      setTestStatus('Could not send. Check SMTP details.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Website</p>
          <h1 className="mt-1 font-display text-2xl font-bold normal-case tracking-tight">Site settings</h1>
          <p className="mt-1 text-sm text-muted">
            Contact, chat, payments, and booking rules used across the site.
          </p>
        </div>
        <Link to="/admin/homepage" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
          Homepage text
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
        <SectionCard id="business" icon={Building2} title="Business" hint="Name and how customers reach you.">
          <Field label="Business name">
            <input className="input" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email">
              <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </Field>
            <Field label="Phone" hint="Example: 09XXXXXXXX">
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                maxLength={13}
                placeholder="09XXXXXXXX"
                value={form.phone}
                onChange={(e) => update('phone', sanitizePhoneInput(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Address">
            <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard
          id="email"
          icon={Mail}
          title="Outgoing email"
          hint="Gmail SMTP for booking and contact emails."
          extra={
            <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-medium">{emailLabel}</span>
          }
        >
          <p className="text-sm text-muted">
            Use your real Gmail, not info@tripexplorer.com, and a 16-character App Password — not your normal Gmail
            password.
          </p>
          <Field label="Your Gmail address">
            <input
              className="input"
              type="email"
              placeholder="you@gmail.com"
              value={form.smtpUser}
              onChange={(e) => update('smtpUser', e.target.value)}
            />
          </Field>
          <Field
            label="Gmail app password"
            hint={email.hasPassword ? 'A password is already saved. Leave blank to keep it.' : '16-character app password'}
          >
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder={email.hasPassword ? 'Saved — leave blank to keep' : '16-character app password'}
              value={form.smtpPass}
              onChange={(e) => update('smtpPass', e.target.value)}
            />
          </Field>
          <button type="button" className="btn-outline" disabled={testing} onClick={() => void sendTest()}>
            {testing ? 'Sending test…' : 'Connect and send a test to this Gmail'}
          </button>
          {testStatus ? <p className="text-sm text-muted">{testStatus}</p> : null}
        </SectionCard>

        <SectionCard
          id="sms"
          icon={Smartphone}
          title="Trip-day SMS reminder"
          hint="SMS is only used the day before a trip. Booking confirmation still uses email."
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.smsEnabled}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, smsEnabled: e.target.checked }))
                setSaved(false)
              }}
            />
            Send an SMS the day before the trip
          </label>
          <Field
            label="AfroMessage API token"
            hint={
              email.hasSmsToken
                ? 'A token is already saved. Leave blank to keep it. Get a token at afromessage.com.'
                : 'Create an account at afromessage.com and paste the API token. Without this, only the email reminder is sent.'
            }
          >
            <input
              className="input"
              type="password"
              autoComplete="off"
              placeholder={email.hasSmsToken ? 'Saved — paste a new token to replace' : 'AfroMessage token'}
              value={form.smsApiToken}
              onChange={(e) => update('smsApiToken', e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sender name" hint="Short name on the SMS, up to 11 characters.">
              <input
                className="input"
                maxLength={11}
                value={form.smsSenderName}
                onChange={(e) => update('smsSenderName', e.target.value)}
              />
            </Field>
            <Field label="Identifier ID" hint="Optional. AfroMessage identifier if they gave you one.">
              <input
                className="input"
                value={form.smsIdentifier}
                onChange={(e) => update('smsIdentifier', e.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-outline"
              disabled={smsBusy}
              onClick={async () => {
                setSmsBusy(true)
                setSmsStatus('')
                try {
                  await updateSiteSettingsFn({
                    data: {
                      smsEnabled: true,
                      smsApiToken: form.smsApiToken,
                      smsSenderName: form.smsSenderName,
                      smsIdentifier: form.smsIdentifier,
                    },
                  })
                  const result = await sendTestSmsFn({ data: { phone: form.phone } })
                  setSmsStatus(
                    result.ok
                      ? `Test SMS sent to ${form.phone}`
                      : result.error || 'Could not send SMS. Check the token and phone.',
                  )
                } catch {
                  setSmsStatus('Could not send SMS.')
                } finally {
                  setSmsBusy(false)
                }
              }}
            >
              {smsBusy ? 'Sending…' : 'Send a test SMS to the business phone'}
            </button>
            <button
              type="button"
              className="btn-outline"
              disabled={smsBusy}
              onClick={async () => {
                setSmsBusy(true)
                setSmsStatus('')
                try {
                  const result = await runTripRemindersFn()
                  setSmsStatus(
                    `Checked trips on ${result.tomorrow}: ${result.sent} reminder(s) sent` +
                      (result.failed ? `, ${result.failed} failed` : '') +
                      (result.due === 0 ? '. None due today.' : ''),
                  )
                } catch {
                  setSmsStatus('Could not run reminders.')
                } finally {
                  setSmsBusy(false)
                }
              }}
            >
              Send due reminders now
            </button>
          </div>
          {smsStatus ? <p className="text-sm text-muted">{smsStatus}</p> : null}
        </SectionCard>

        <SectionCard id="chat" icon={MessageCircle} title="Chat" hint="WhatsApp, Telegram, and the Messages inbox bot.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="WhatsApp number" hint="Digits only, with country code if needed.">
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                maxLength={13}
                placeholder="251974332069"
                value={form.whatsappNumber}
                onChange={(e) => update('whatsappNumber', sanitizePhoneInput(e.target.value))}
              />
            </Field>
            <Field label="Telegram username" hint="Personal or channel username for the chat button.">
              <input
                className="input"
                placeholder="TripExplorerSupport"
                value={form.telegramUsername}
                onChange={(e) => update('telegramUsername', e.target.value)}
              />
            </Field>
          </div>
          <Field
            label="Telegram bot token"
            hint={
              email.telegramBotUsername
                ? `Connected: @${email.telegramBotUsername}. Guests message that bot; replies show in Messages.`
                : 'Create a bot with Telegram @BotFather. Paste the token here. WhatsApp chats stay in WhatsApp.'
            }
          >
            <input
              className="input"
              type="password"
              autoComplete="off"
              placeholder={email.hasTelegramBot ? 'Saved — paste a new token to replace' : '123456:AA... from @BotFather'}
              value={form.telegramBotToken}
              onChange={(e) => update('telegramBotToken', e.target.value)}
            />
          </Field>
        </SectionCard>

        <SectionCard
          id="homepage"
          icon={Video}
          title="Hero and about"
          hint="Fallback title, video, and about paragraph. Section headings live on Homepage text."
        >
          <Field label="Hero title">
            <input className="input" value={form.heroTitle} onChange={(e) => update('heroTitle', e.target.value)} />
          </Field>
          <Field label="Hero subtitle">
            <input className="input" value={form.heroSubtitle} onChange={(e) => update('heroSubtitle', e.target.value)} />
          </Field>
          <Field label="Home page trip video URL" hint="YouTube link or .mp4 URL">
            <input
              className="input"
              placeholder="YouTube link or .mp4 URL"
              value={form.heroVideoUrl}
              onChange={(e) => update('heroVideoUrl', e.target.value)}
            />
          </Field>
          <Field label="About text">
            <textarea rows={4} className="input" value={form.aboutText} onChange={(e) => update('aboutText', e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard id="social" icon={Share2} title="Social" hint="Links shown on the homepage and footer.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Facebook URL">
              <input className="input" value={form.facebookUrl} onChange={(e) => update('facebookUrl', e.target.value)} />
            </Field>
            <Field label="Instagram URL">
              <input className="input" value={form.instagramUrl} onChange={(e) => update('instagramUrl', e.target.value)} />
            </Field>
            <Field label="TikTok URL">
              <input className="input" value={form.tiktokUrl} onChange={(e) => update('tiktokUrl', e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard id="payments" icon={Banknote} title="Payments" hint="Telebirr and bank details shown to customers.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Telebirr number">
              <input className="input" value={form.telebirrNumber} onChange={(e) => update('telebirrNumber', e.target.value)} />
            </Field>
            <Field label="Bank name">
              <input className="input" value={form.bankName} onChange={(e) => update('bankName', e.target.value)} />
            </Field>
            <Field label="Bank account">
              <input className="input" value={form.bankAccount} onChange={(e) => update('bankAccount', e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <QrUpload
              label="Telebirr QR"
              url={form.telebirrQrUrl}
              alt="Telebirr QR"
              onChange={(url) => update('telebirrQrUrl', url)}
              onClear={() => update('telebirrQrUrl', '')}
            />
            <QrUpload
              label="Bank QR (optional)"
              url={form.bankQrUrl}
              alt="Bank QR"
              onChange={(url) => update('bankQrUrl', url)}
              onClear={() => update('bankQrUrl', '')}
            />
          </div>
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            id="booking"
            icon={Percent}
            title="Booking rules"
            hint="Two automatic discounts: a smaller group (5) and a larger group (10)."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Type 1 — 5 guests</p>
                <Field label="Min guests">
                  <input
                    type="number"
                    min={2}
                    className="input"
                    value={form.groupDiscountSmallMinGuests}
                    onChange={(e) => update('groupDiscountSmallMinGuests', e.target.value)}
                  />
                </Field>
                <Field label="Discount percent (%)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="input mt-2"
                    value={form.groupDiscountSmallPercent}
                    onChange={(e) => update('groupDiscountSmallPercent', e.target.value)}
                  />
                </Field>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Type 2 — 10 guests</p>
                <Field label="Min guests">
                  <input
                    type="number"
                    min={2}
                    className="input"
                    value={form.groupDiscountMinGuests}
                    onChange={(e) => update('groupDiscountMinGuests', e.target.value)}
                  />
                </Field>
                <Field label="Discount percent (%)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="input mt-2"
                    value={form.groupDiscountPercent}
                    onChange={(e) => update('groupDiscountPercent', e.target.value)}
                  />
                </Field>
              </div>
            </div>
            <Field label="Default deposit percent (%)">
              <input
                type="number"
                min={0}
                max={100}
                className="input"
                value={form.defaultDepositPercent}
                onChange={(e) => update('defaultDepositPercent', e.target.value)}
              />
            </Field>
            <p className="text-sm text-muted">
              Booking 5+ guests uses the first discount. Booking 10+ guests uses the second (better) discount.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Private package size" hint="Full buyout. Nobody else joins that date.">
                <input
                  type="number"
                  min={2}
                  className="input"
                  value={form.privatePackageGuests}
                  onChange={(e) => update('privatePackageGuests', e.target.value)}
                />
              </Field>
              <Field label="Family trip max guests" hint="Exclusive family booking size.">
                <input
                  type="number"
                  min={2}
                  className="input"
                  value={form.familyMaxGuests}
                  onChange={(e) => update('familyMaxGuests', e.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard id="analytics" icon={ChartLine} title="Analytics" hint="Optional tracking ID for the public site.">
            <Field label="Analytics ID">
              <input className="input" value={form.analyticsId} onChange={(e) => update('analyticsId', e.target.value)} />
            </Field>
          </SectionCard>
        </div>

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-card/95 px-4 py-3 shadow-md backdrop-blur">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save settings'}
          </button>
          {saved ? <p className="text-sm font-medium text-primary">Settings saved.</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </form>
    </div>
  )
}
