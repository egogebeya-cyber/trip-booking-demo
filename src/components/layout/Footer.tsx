import { Link } from '@tanstack/react-router'
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { TikTokIcon } from '~/components/icons/TikTokIcon'
import { useLocale } from '~/components/locale-context'
import { NewsletterSignup } from '~/components/contact/NewsletterSignup'
import type { PublicUser } from '~/lib/auth-types'
import { BrandLogoMark } from '~/components/brand/BrandLogoMark'
import { BRAND_NAME } from '~/lib/brand'
import type { SiteSettings } from '~/server/db/schema'

type FooterProps = {
  settings: SiteSettings | null
  user?: PublicUser | null
}

export function Footer({ settings, user }: FooterProps) {
  const { t } = useLocale()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t-[3px] border-primary bg-header text-header-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:py-12">
        <div>
          <div className="flex items-center gap-3">
            <BrandLogoMark size="header" alt="" />
            <h3 className="font-display text-lg font-semibold text-primary">{settings?.businessName ?? BRAND_NAME}</h3>
          </div>
          <p className="mt-2 text-sm text-header-muted">{settings?.heroSubtitle}</p>
          <div className="mt-4 flex gap-3">
            {settings?.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="rounded-full bg-header-foreground/10 p-2 hover:bg-header-foreground/20">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {settings?.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="rounded-full bg-header-foreground/10 p-2 hover:bg-header-foreground/20">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {settings?.tiktokUrl && (
              <a href={settings.tiktokUrl} target="_blank" rel="noreferrer" className="rounded-full bg-header-foreground/10 p-2 hover:bg-header-foreground/20" aria-label="TikTok">
                <TikTokIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-header-muted">{t('contact')}</h4>
          {settings?.phone && (
            <p className="flex items-center gap-2 text-sm text-header-foreground/80"><Phone className="h-4 w-4" />{settings.phone}</p>
          )}
          {settings?.email && (
            <p className="mt-2 flex items-center gap-2 text-sm text-header-foreground/80"><Mail className="h-4 w-4" />{settings.email}</p>
          )}
          {settings?.address && (
            <p className="mt-2 flex items-start gap-2 text-sm text-header-foreground/80"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{settings.address}</p>
          )}
          {settings?.whatsappNumber && (
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-2 text-sm text-header-foreground/80 hover:text-header-foreground"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          {settings?.telegramUsername && (
            <a
              href={`https://t.me/${settings.telegramUsername.replace(/^@/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-2 text-sm text-header-foreground/80 hover:text-header-foreground"
            >
              <Send className="h-4 w-4" /> Telegram @{settings.telegramUsername.replace(/^@/, '')}
            </a>
          )}
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-header-muted">Links</h4>
          <div className="flex flex-col gap-2 text-sm text-header-foreground/80">
            <Link to="/share-your-trip">{t('shareYourStory')}</Link>
            <Link to="/about">{t('aboutUs')}</Link>
            <Link to="/faq">{t('faq')}</Link>
            <Link to="/privacy">{t('privacyPolicy')}</Link>
            <Link to="/terms">{t('termsOfService')}</Link>
            <Link to="/cancellation">{t('cancellationPolicy')}</Link>
          </div>
        </div>

        <div>
          <NewsletterSignup dark />
        </div>
      </div>

      <div className="border-t border-header-foreground/10 px-4 py-4 text-center text-xs text-header-muted">
        © {year} {settings?.businessName ?? 'Trip Explorer'}. All rights reserved.
        <Link to={user?.role === 'admin' ? '/admin' : '/admin/login'} className="ml-3 text-header-foreground/70 hover:text-header-foreground">
          Admin
        </Link>
      </div>
    </footer>
  )
}
