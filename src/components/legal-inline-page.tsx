import { useCallback, useState } from 'react'
import { BackButton } from '~/components/back-button'
import { InlineText } from '~/components/inline-text'
import { useOptionalSiteEdit, useRegisterPageSave } from '~/components/site-edit-context'
import { saveLegalPageFn } from '~/server/admin/functions'

function LegalBody({ body }: { body: string }) {
  const blocks = body.trim().split(/\n{2,}/)
  return (
    <div className="mt-8 space-y-5 text-[0.95rem] leading-7 text-muted">
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        const heading = lines[0] ?? ''
        const rest = lines.slice(1).join('\n').trim()
        const isSection = /^\d+\.\s/.test(heading)
        if (isSection) {
          return (
            <section key={i} className="space-y-2">
              <h2 className="font-display text-lg font-semibold text-foreground">{heading}</h2>
              {rest ? <p className="whitespace-pre-wrap">{rest}</p> : null}
            </section>
          )
        }
        if (i === 0 && /^last updated:/i.test(heading) && !rest) {
          return (
            <p key={i} className="text-sm text-muted">
              {heading}
            </p>
          )
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {block}
          </p>
        )
      })}
    </div>
  )
}

export function LegalInlinePage({
  slug,
  fallbackTitle,
  page,
}: {
  slug: string
  fallbackTitle: string
  page: { title: string; body: string } | null
}) {
  const edit = useOptionalSiteEdit()
  const [title, setTitle] = useState(page?.title ?? fallbackTitle)
  const [body, setBody] = useState(page?.body ?? '')
  const [dirty, setDirty] = useState(false)

  const save = useCallback(async () => {
    await saveLegalPageFn({ data: { slug, title, body } })
  }, [slug, title, body])

  useRegisterPageSave(edit?.isAdmin ? save : null, dirty)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <BackButton fallbackTo="/" className="mb-6" />
      <h1 className="font-display text-3xl font-bold">
        <InlineText
          value={title}
          onChange={(v) => {
            setTitle(v)
            setDirty(true)
          }}
        />
      </h1>
      {edit?.isAdmin ? (
        <div className="prose mt-8 max-w-none whitespace-pre-wrap text-muted">
          <InlineText
            value={body}
            multiline
            onChange={(v) => {
              setBody(v)
              setDirty(true)
            }}
          />
        </div>
      ) : (
        <LegalBody body={body} />
      )}
    </div>
  )
}
