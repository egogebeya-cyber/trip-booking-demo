import { createFileRoute } from '@tanstack/react-router'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { listBlogPostsFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/blog/photos')({
  loader: async () => {
    const posts = await listBlogPostsFn()
    return {
      photos: posts.filter((post) => post.coverImageUrl),
    }
  },
  component: BlogPhotosPage,
})

function BlogPhotosPage() {
  const { photos } = Route.useLoaderData()
  const { t } = useLocale()

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <BackButton fallbackTo="/blog" label={t('blog')} className="mb-4" />
      <h1 className="font-display text-3xl font-bold">{t('photo')}</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {photos.map((post) => (
          <article key={post.id} className="card overflow-hidden p-4">
            <img
              src={post.coverImageUrl!}
              alt={post.title}
              className="aspect-video w-full rounded-xl object-cover"
            />
            <p className="mt-3 font-semibold">{post.title}</p>
          </article>
        ))}
      </div>
      {photos.length === 0 && <p className="mt-8 text-muted">No photos yet.</p>}
    </div>
  )
}
