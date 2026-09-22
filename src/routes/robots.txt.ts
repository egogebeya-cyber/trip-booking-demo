import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/robots/txt')({
  server: {
    handlers: {
      GET: async () => {
        const { appPublicUrl } = await import('~/lib/app-url')
        const base = appPublicUrl()
        const body = `User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml
`
        return new Response(body, { headers: { 'Content-Type': 'text/plain' } })
      },
    },
  },
})
