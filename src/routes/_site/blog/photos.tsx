import { Link, createFileRoute } from '@tanstack/react-router'
import { BackButton } from '~/components/back-button'
import { ShiftingCover } from '~/components/blog/shifting-cover'
import { formatStoryDate } from '~/components/blog/story'
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
  const { t, locale } = useLocale()

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-clip px-4 pb-24 pt-6 sm:pb-16 sm:pt-10">
      <BackButton fallbackTo="/blog" label={t('blog')} />
      <header data-reveal="" className="mt-6 min-w-0 max-w-2xl">
        <p className="section-kicker">{t('blogKicker')}</p>
        <h1 className="font-display text-3xl leading-tight sm:text-5xl">{t('inPictures')}</h1>
      </header>
      <div data-reveal-stagger="" className="mt-8 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
        {photos.map((post) => (
          <Link
            key={post.id}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            data-reveal=""
            className="group relative block min-w-0 overflow-hidden rounded-3xl border border-primary/40 bg-[#121212]"
          >
            <div className="relative h-[min(34svh,18rem)] w-full min-h-52 overflow-hidden sm:h-[min(23svh,13rem)] sm:min-h-36">
              <ShiftingCover
                post={post}
                seed={post.id}
                className="transition duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 min-w-0 p-4 sm:p-5">
              <time className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f6e39f]">
                {formatStoryDate(post.publishedAt, locale)}
              </time>
              <span className="mt-2 block break-words font-display text-xl leading-tight text-[#f6e39f]">
                {post.title}
              </span>
            </span>
          </Link>
        ))}
      </div>
      {photos.length === 0 && <p className="mt-8 text-muted">{t('noPhotos')}</p>}
    </div>
  )
}
