import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { LocaleProvider } from '~/components/locale-context'
import { NotFound } from '~/components/NotFound'
import { ThemeProvider } from '~/components/theme-context'
import { NEGUS_THEME_INIT_SCRIPT } from '~/lib/theme'
import appCss from '~/styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Negus Events — Planner & Organizers' },
      { name: 'description', content: 'Negus events planner & organizers. Let\'s travel — book trips and adventures from Addis Ababa.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.png', type: 'image/png' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: NotFound,
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NEGUS_THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <LocaleProvider>
            <Outlet />
          </LocaleProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
