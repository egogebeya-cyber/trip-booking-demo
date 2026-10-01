import { Link, createFileRoute } from '@tanstack/react-router'
import { BackButton } from '~/components/back-button'
import { JourneyFilm } from '~/components/blog/story'
import { useLocale } from '~/components/locale-context'
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
    <div className="mx-auto min-w-0 max-w-3xl overflow-x-clip px-4 pb-24 pt-6 sm:pb-16 sm:pt-10">
      <BackButton fallbackTo="/blog" label={t('blog')} />
      <header data-reveal="" className="mt-6 min-w-0 max-w-2xl">
        <p className="section-kicker">{t('blogKicker')}</p>
        <h1 className="font-display text-3xl leading-tight sm:text-5xl">{t('fromTheJourney')}</h1>
      </header>
      <div className="mt-8 min-w-0 space-y-10">
        {videos.map((post) => (
          <article key={post.id} className="min-w-0">
            <JourneyFilm
              url={post.videoUrl!}
              title={post.title}
              kicker={t('fromTheJourney')}
              playLabel={t('playFilm')}
            />
            <Link
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="mt-3 inline-flex max-w-full break-words text-xs font-semibold uppercase tracking-[0.16em] text-primary"
            >
              {t('readStory')}
            </Link>
          </article>
        ))}
      </div>
      {videos.length === 0 && <p className="mt-8 text-muted">{t('noVideos')}</p>}
    </div>
  )
}
