import { Link, createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { BackButton } from '~/components/back-button'
import { JourneyFilm, formatStoryDate, storyPlainText } from '~/components/blog/story'
import { InlineImage } from '~/components/inline-image'
import { InlineText } from '~/components/inline-text'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit, useRegisterPageSave } from '~/components/site-edit-context'
import { getYouTubeVideoId } from '~/lib/utils'
import { saveBlogPostFn } from '~/server/admin/functions'
import { getBlogPostFn, listBlogPostsFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/blog/$slug')({
  loader: async ({ params }) => {
    const [post, posts] = await Promise.all([
      getBlogPostFn({ data: { slug: params.slug } }),
      listBlogPostsFn(),
    ])
    if (!post) throw new Error('NOT_FOUND')
    return {
      post,
      related: posts.filter((item) => item.slug !== post.slug).slice(0, 3),
    }
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const { post, related } = Route.useLoaderData()
  const { t, locale } = useLocale()
  const edit = useOptionalSiteEdit()
  const [title, setTitle] = useState(post.title)
  const [excerpt, setExcerpt] = useState(post.excerpt ?? '')
  const [body, setBody] = useState(post.body)
  const [coverImageUrl, setCoverImageUrl] = useState(post.coverImageUrl ?? '')
  const [videoUrl, setVideoUrl] = useState(post.videoUrl ?? '')
  const [dirty, setDirty] = useState(false)

  const save = useCallback(async () => {
    await saveBlogPostFn({
      data: {
        id: post.id,
        title,
        slug: post.slug,
        excerpt,
        body,
        coverImageUrl,
        videoUrl,
        isPublished: post.isPublished,
      },
    })
  }, [post, title, excerpt, body, coverImageUrl, videoUrl])

  useRegisterPageSave(edit?.isAdmin ? save : null, dirty)

  const dateLabel = formatStoryDate(post.publishedAt, locale)
  const prose = storyPlainText(body)
  const hasFilm = Boolean(videoUrl && getYouTubeVideoId(videoUrl))

  return (
    <article className="min-w-0 max-w-full overflow-x-clip pb-24 sm:pb-16">
      <header className="relative isolate h-[min(46svh,22rem)] min-h-64 w-full overflow-hidden bg-[#121212] sm:h-[min(62svh,34rem)] sm:min-h-80">
        {coverImageUrl || edit?.isAdmin ? (
          <InlineImage
            src={coverImageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full"
            imgClassName="h-full w-full object-cover"
            onChange={(url) => {
              setCoverImageUrl(url)
              setDirty(true)
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3a2e12,#121212_62%)]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35" />
        <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
          <BackButton
            fallbackTo="/blog"
            className="border-[#f6e39f]/80 bg-black/45 text-[#f6e39f] backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
          />
        </div>
        <div className="hero-copy absolute inset-x-0 bottom-0 z-10 min-w-0 px-4 pb-6 sm:px-8 sm:pb-10">
          <div className="mx-auto min-w-0 max-w-3xl">
            {dateLabel ? (
              <time className="inline-flex max-w-full rounded-full border border-[#d4af37]/80 bg-black/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f6e39f]">
                {dateLabel}
              </time>
            ) : null}
            <h1 className="mt-3 max-w-full break-words font-display text-[1.7rem] leading-tight text-[#f6e39f] sm:text-5xl">
              <InlineText
                value={title}
                onChange={(v) => {
                  setTitle(v)
                  setDirty(true)
                }}
              />
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto min-w-0 max-w-2xl px-4 py-10 sm:py-14">
        {(excerpt || edit?.isAdmin) && (
          <blockquote data-reveal="" className="min-w-0 border-l-2 border-primary pl-4 text-left sm:pl-6">
            <p className="break-words font-sans text-lg font-medium leading-relaxed text-foreground sm:text-xl">
              <InlineText
                value={excerpt}
                onChange={(v) => {
                  setExcerpt(v)
                  setDirty(true)
                }}
                multiline
              />
            </p>
          </blockquote>
        )}

        <div
          data-reveal=""
          className="mx-auto my-8 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-primary to-transparent"
          aria-hidden
        />

        {(prose || edit?.isAdmin) && (
          <div
            data-reveal=""
            className="min-w-0 break-words text-base leading-8 text-foreground/90 sm:text-[1.05rem] sm:leading-8"
          >
            {edit?.isAdmin ? (
              <InlineText
                value={body}
                onChange={(v) => {
                  setBody(v)
                  setDirty(true)
                }}
                multiline
              />
            ) : (
              <div className="whitespace-pre-wrap">{prose}</div>
            )}
          </div>
        )}

        {(hasFilm || edit?.isAdmin) && (
          <div className="mt-12 min-w-0">
            {edit?.isAdmin && (
              <input
                className="input mb-3"
                value={videoUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                onChange={(e) => {
                  setVideoUrl(e.target.value)
                  setDirty(true)
                }}
              />
            )}
            {hasFilm ? (
              <JourneyFilm url={videoUrl} title={title} kicker={t('fromTheJourney')} playLabel={t('playFilm')} />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-3xl border border-dashed border-primary/40 bg-accent px-4 text-center text-sm text-muted">
                Paste a YouTube link for the film
              </div>
            )}
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-14 min-w-0">
            <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" aria-hidden />
            <h2 data-reveal="" className="font-display text-xl sm:text-2xl">
              {t('relatedStories')}
            </h2>
            <ul data-reveal-stagger="" className="mt-5 grid min-w-0 grid-cols-1 gap-3">
              {related.map((item) => (
                <li key={item.id} data-reveal="" className="min-w-0">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: item.slug }}
                    className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-2xl border border-primary/35 bg-card p-2"
                  >
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt=""
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                    ) : (
                      <span className="aspect-square w-full rounded-xl bg-[radial-gradient(circle_at_top,#3a2e12,#121212_62%)]" />
                    )}
                    <span className="min-w-0 py-1 pr-2">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        {formatStoryDate(item.publishedAt, locale)}
                      </span>
                      <span className="mt-1 block break-words font-display text-base leading-snug">{item.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  )
}
