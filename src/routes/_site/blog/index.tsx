import { Link, createFileRoute } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit } from '~/components/site-edit-context'
import { getYouTubeThumbnail } from '~/lib/utils'
import { listBlogPostsFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/blog/')({
  loader: async () => {
    const posts = await listBlogPostsFn()
    return { posts }
  },
  component: BlogListPage,
})

function BlogListPage() {
  const { posts } = Route.useLoaderData()
  const { t } = useLocale()
  const edit = useOptionalSiteEdit()

  const photoPost = posts.find((post) => post.coverImageUrl)
  const videoPost = posts.find((post) => post.videoUrl)
  const videoThumb = videoPost?.videoUrl ? getYouTubeThumbnail(videoPost.videoUrl) : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <BackButton fallbackTo="/" className="mb-6" />
      <h1 className="font-display text-3xl font-bold">{t('travelTips')}</h1>
      {edit?.isAdmin && (
        <p className="mt-2 text-sm text-primary">Open a post to edit its title and body on that page.</p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Link to="/blog/photos" className="card block p-4 transition hover:shadow-md">
          <h2 className="mb-3 font-display text-xl font-bold">{t('photo')}</h2>
          {photoPost?.coverImageUrl ? (
            <img
              src={photoPost.coverImageUrl}
              alt={photoPost.title}
              className="aspect-video w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-accent text-sm text-muted">
              Photo
            </div>
          )}
        </Link>

        <Link to="/blog/videos" className="card block p-4 transition hover:shadow-md">
          <h2 className="mb-3 font-display text-xl font-bold">{t('video')}</h2>
          {videoPost?.videoUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              {videoThumb ? (
                <img src={videoThumb} alt="" className="h-full w-full object-cover opacity-80" />
              ) : null}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
                  <Play className="ml-0.5 h-6 w-6 fill-white" />
                </span>
              </span>
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-accent text-sm text-muted">
              Video
            </div>
          )}
        </Link>
      </div>
    </div>
  )
}
