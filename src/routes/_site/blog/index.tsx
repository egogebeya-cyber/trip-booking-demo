import { Link, createFileRoute } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import { BackButton } from '~/components/back-button'
import { ShiftingCover } from '~/components/blog/shifting-cover'
import { formatStoryDate } from '~/components/blog/story'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit } from '~/components/site-edit-context'
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
  const { t, locale } = useLocale()
  const edit = useOptionalSiteEdit()
  const videoLead = posts.find((post) => post.videoUrl) ?? null
  const photoPosts = videoLead ? posts.filter((post) => post.id !== videoLead.id) : posts.slice(1)
  const textLead = videoLead ? null : (posts[0] ?? null)

  const leadCard = (post: (typeof posts)[number]) => (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      data-reveal=""
      className="group mt-8 mb-32 block min-w-0 max-w-full overflow-hidden rounded-3xl border border-primary/50 bg-[#121212] shadow-[0_16px_40px_rgb(0_0_0/0.18)] sm:mb-0"
    >
      <div className="relative h-[min(34svh,18rem)] w-full min-h-52 overflow-hidden sm:h-[min(46svh,26rem)] sm:min-h-72">
        {post.videoUrl ? (
          post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          ) : null
        ) : (
          <ShiftingCover
            post={post}
            seed={post.id}
            className="transition duration-700 group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
        {post.videoUrl ? (
          <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#f6e39f] bg-black/50 text-[#f6e39f]">
            <Play className="ml-0.5 h-5 w-5 fill-[#f6e39f]" aria-hidden />
          </span>
        ) : null}
        <div className="hero-copy absolute inset-x-0 bottom-0 min-w-0 p-5 sm:p-8">
          <time className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6e39f]">
            {formatStoryDate(post.publishedAt, locale)}
          </time>
          <h2 className="mt-3 max-w-3xl break-words font-display text-2xl leading-tight text-[#f6e39f] sm:text-4xl">
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="mt-3 line-clamp-3 max-w-xl break-words text-sm leading-relaxed text-[#f3ecd8]/90 sm:text-base">
              {post.excerpt}
            </p>
          ) : null}
          <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t('readStory')}
          </span>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-clip px-4 pb-24 pt-6 sm:pb-16 sm:pt-10">
      <BackButton fallbackTo="/" />
      <header data-reveal="" className="mt-6 min-w-0 max-w-2xl">
        <p className="section-kicker">{t('blogKicker')}</p>
        <h1 className="font-display text-3xl leading-tight sm:text-5xl">{t('blogTitle')}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{t('blogIntro')}</p>
      </header>
      {edit?.isAdmin && (
        <p className="mt-4 text-sm text-primary">Open a post to edit its title and body on that page.</p>
      )}

      {textLead ? leadCard(textLead) : null}

      {photoPosts.length > 0 && (
        <div data-reveal-stagger="" className="mt-8 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
          {photoPosts.map((post) => (
            <Link
              key={post.id}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              aria-label={post.title}
              data-reveal=""
              className="group block min-w-0 max-w-full overflow-hidden rounded-2xl border border-primary/40 bg-card"
            >
              <div className="relative h-[min(34svh,18rem)] w-full min-h-52 overflow-hidden bg-[#121212] sm:h-[min(23svh,13rem)] sm:min-h-36">
                <ShiftingCover
                  post={post}
                  seed={post.id}
                  className="transition duration-700 group-hover:scale-[1.03]"
                />
                {post.videoUrl ? (
                  <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#f6e39f] bg-black/50 text-[#f6e39f]">
                    <Play className="ml-0.5 h-4 w-4 fill-[#f6e39f]" aria-hidden />
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}

      {videoLead ? leadCard(videoLead) : null}

      {posts.length === 0 && <p className="mt-10 text-muted">{t('noStories')}</p>}
    </div>
  )
}
