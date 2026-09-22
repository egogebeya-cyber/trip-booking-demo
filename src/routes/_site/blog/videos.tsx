import { createFileRoute } from '@tanstack/react-router'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { getYouTubeEmbedUrl } from '~/lib/utils'
import { listBlogPostsFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/blog/videos')({
  loader: async () => {
    const posts = await listBlogPostsFn()
    return {
      videos: posts.filter((post) => post.videoUrl),
    }
  },
  component: BlogVideosPage,
})

function BlogVideosPage() {
  const { videos } = Route.useLoaderData()
  const { t } = useLocale()

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <BackButton fallbackTo="/blog" label={t('blog')} className="mb-4" />
      <h1 className="font-display text-3xl font-bold">{t('video')}</h1>
      <div className="mt-8 space-y-8">
        {videos.map((post) => (
          <article key={post.id} className="card p-4">
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                src={getYouTubeEmbedUrl(post.videoUrl!)}
                title={`${post.title} video`}
                className="aspect-video w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="mt-3 font-semibold">{post.title}</p>
          </article>
        ))}
      </div>
      {videos.length === 0 && <p className="mt-8 text-muted">No videos yet.</p>}
    </div>
  )
}
