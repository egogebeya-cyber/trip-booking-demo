import { createFileRoute } from '@tanstack/react-router'
import { listBlogPostsFn } from '~/server/content/functions'
import { listTripsFn } from '~/server/trips/functions'

export const Route = createFileRoute('/sitemap/xml')({
  server: {
    handlers: {
      GET: async () => {
        const [trips, posts] = await Promise.all([listTripsFn({ data: {} }), listBlogPostsFn()])
        const { appPublicUrl } = await import('~/lib/app-url')
        const base = appPublicUrl()
        const urls = [
          '',
          '/trips',
          '/about',
          '/faq',
          '/contact',
          '/blog',
          '/privacy',
          '/terms',
          '/cancellation',
          ...trips.map((t) => `/trips/${t.slug}`),
          ...posts.map((p) => `/blog/${p.slug}`),
        ]
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${base}${path}</loc></url>`).join('\n')}
</urlset>`
        return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
      },
    },
  },
})
