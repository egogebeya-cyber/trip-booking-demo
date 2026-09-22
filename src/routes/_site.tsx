import { Outlet, createFileRoute } from '@tanstack/react-router'
import { CookieConsent } from '~/components/layout/CookieConsent'
import { Footer } from '~/components/layout/Footer'
import { Header } from '~/components/layout/Header'
import { AdminEditBar } from '~/components/layout/AdminEditBar'
import { TrustBadges } from '~/components/layout/TrustBadges'
import { SupportChat } from '~/components/layout/SupportChat'
import { SiteEditProvider } from '~/components/site-edit-context'
import { getCurrentUser } from '~/server/auth/functions'
import { getSiteSettingsFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site')({
  loader: async () => {
    const [user, settings] = await Promise.all([getCurrentUser(), getSiteSettingsFn()])
    return { user, settings }
  },
  component: SiteLayout,
})

function SiteLayout() {
  const { user, settings } = Route.useLoaderData()

  return (
    <SiteEditProvider user={user} settings={settings}>
      <div className="flex min-h-dvh flex-col">
        <AdminEditBar />
        <Header user={user} settings={settings} />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
        <TrustBadges />
        <Footer settings={settings} user={user} />
        <SupportChat
          whatsappNumber={settings?.whatsappNumber}
          telegramUsername={settings?.telegramUsername}
          telegramBotUsername={settings?.telegramBotUsername}
          phone={settings?.phone}
          businessName={settings?.businessName}
          user={user}
        />
        <CookieConsent />
        {settings?.analyticsId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.analyticsId}');`,
            }}
          />
        )}
      </div>
    </SiteEditProvider>
  )
}
