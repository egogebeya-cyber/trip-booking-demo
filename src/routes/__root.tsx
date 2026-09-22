import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { LocaleProvider } from '~/components/locale-context'
import { NotFound } from '~/components/NotFound'
import appCss from '~/styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Trip Explorer — Book Amazing Adventures' },
      { name: 'description', content: 'Discover and book unforgettable trips across Ethiopia and beyond.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: NotFound,
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh antialiased">
        <LocaleProvider>
          <Outlet />
        </LocaleProvider>
        <Scripts />
      </body>
    </html>
  )
}
