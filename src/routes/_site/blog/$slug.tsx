import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { BackButton } from '~/components/back-button'
import { InlineImage } from '~/components/inline-image'
import { InlineText } from '~/components/inline-text'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit, useRegisterPageSave } from '~/components/site-edit-context'
import { getYouTubeEmbedUrl } from '~/lib/utils'
import { saveBlogPostFn } from '~/server/admin/functions'
import { getBlogPostFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/blog/$slug')({
  loader: async ({ params }) => {
    const post = await getBlogPostFn({ data: { slug: params.slug } })
    if (!post) throw new Error('NOT_FOUND')
    return { post }
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const { post } = Route.useLoaderData()
  const { t } = useLocale()
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

  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : ''

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <BackButton fallbackTo="/blog" className="mb-6" />
      <h1 className="font-display text-3xl font-bold">
        <InlineText
          value={title}
          onChange={(v) => {
            setTitle(v)
            setDirty(true)
          }}
        />
      </h1>
      {edit?.isAdmin && (
        <div className="mt-3 text-sm text-muted">
          <InlineText
            value={excerpt}
            onChange={(v) => {
              setExcerpt(v)
              setDirty(true)
            }}
            multiline
          />
        </div>
      )}
      {post.publishedAt && (
        <time className="mt-2 block text-sm text-muted">
          {new Date(post.publishedAt).toLocaleDateString()}
        </time>
      )}

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">{t('photo')}</h2>
          {(coverImageUrl || edit?.isAdmin) && (
            <InlineImage
              src={coverImageUrl}
              alt={title}
              imgClassName="aspect-video w-full rounded-2xl object-cover"
              onChange={(url) => {
                setCoverImageUrl(url)
                setDirty(true)
              }}
            />
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-bold">{t('video')}</h2>
          {edit?.isAdmin && (
            <input
              className="input mb-2"
              value={videoUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(e) => {
                setVideoUrl(e.target.value)
                setDirty(true)
              }}
            />
          )}
          {embedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                src={embedUrl}
                title={`${title} video`}
                className="aspect-video w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : edit?.isAdmin ? (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-accent text-sm text-muted">
              Paste a YouTube link for the video
            </div>
          ) : null}
        </section>
      </div>

      <div className="prose mt-8 max-w-none whitespace-pre-wrap">
        <InlineText
          value={body}
          onChange={(v) => {
            setBody(v)
            setDirty(true)
          }}
          multiline
        />
      </div>
    </article>
  )
}
