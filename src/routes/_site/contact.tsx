import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { BackButton } from '~/components/back-button'
import { InlineText } from '~/components/inline-text'
import { useLocale } from '~/components/locale-context'
import { useSiteEdit } from '~/components/site-edit-context'
import { getSiteSettingsFn, submitContactFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/contact')({
  loader: async () => {
    const settings = await getSiteSettingsFn()
    return { settings }
  },
  component: ContactPage,
})

function ContactPage() {
  const { settings: site } = Route.useLoaderData()
  const { t } = useLocale()
  const { settings, setSetting } = useSiteEdit()
  const [tab, setTab] = useState<'contact' | 'group'>('contact')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('idle')
    try {
      const result = await submitContactFn({
        data: {
          ...form,
          type: tab === 'group' ? 'group' : 'general',
          subject: tab === 'group' ? `Group Inquiry: ${form.subject}` : form.subject,
        },
      })
      if (result && 'ok' in result && result.ok === false) {
        setStatus('error')
        return
      }
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <BackButton fallbackTo="/" className="mb-6" />
      <h1 className="font-display text-3xl font-bold">{t('contactUs')}</h1>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className={tab === 'contact' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setTab('contact')}
        >
          {t('contactUs')}
        </button>
        <button
          type="button"
          className={tab === 'group' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setTab('group')}
        >
          {t('groupInquiry')}
        </button>
      </div>

      <div className="mt-6 space-y-4">
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted">Email</p>
              <p className="font-medium">
                <InlineText value={settings.email} onChange={(v) => setSetting('email', v)} />
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Phone</p>
              <p className="font-medium">
                <InlineText value={settings.phone} onChange={(v) => setSetting('phone', v)} />
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Address</p>
              <p className="font-medium">
                <InlineText value={settings.address} onChange={(v) => setSetting('address', v)} />
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {site?.whatsappNumber && (
              <a
                href={`https://wa.me/${site.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I need help booking a trip.')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-medium text-white hover:opacity-90"
              >
                Chat on WhatsApp
              </a>
            )}
            {site?.telegramUsername && (
              <a
                href={`https://t.me/${site.telegramUsername.replace(/^@/, '')}?text=${encodeURIComponent('Hi, I need help booking a trip.')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-3 font-medium text-white hover:opacity-90"
              >
                Chat on Telegram
              </a>
            )}
            {site?.tiktokUrl && (
              <a
                href={site.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-medium text-white hover:opacity-90"
              >
                Follow on TikTok
              </a>
            )}
          </div>
        </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label">{t('fullName')}</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">{t('email')}</label>
          <input
            type="email"
            required
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">{t('subject')}</label>
          <input
            required
            className="input"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder={tab === 'group' ? 'Trip / destination, dates, group size' : ''}
          />
        </div>
        <div>
          <label className="label">{t('message')}</label>
          <textarea
            required
            rows={5}
            className="input"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <button type="submit" className="btn-primary">{t('sendMessage')}</button>
        {status === 'success' && <p className="text-sm text-primary">{t('contactSuccess')}</p>}
        {status === 'error' && <p className="text-sm text-destructive">{t('error')}</p>}
      </form>
    </div>
  )
}
