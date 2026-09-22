import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { BackButton } from '~/components/back-button'
import { InlineText } from '~/components/inline-text'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit, useRegisterPageSave } from '~/components/site-edit-context'
import { saveSiteFaqFn } from '~/server/admin/functions'
import { listSiteFaqsFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/faq')({
  loader: async () => {
    const faqs = await listSiteFaqsFn()
    return { faqs }
  },
  component: FaqPage,
})

function FaqPage() {
  const { faqs: initial } = Route.useLoaderData()
  const { t } = useLocale()
  const edit = useOptionalSiteEdit()
  const [faqs, setFaqs] = useState(initial)
  const [dirty, setDirty] = useState(false)

  const save = useCallback(async () => {
    for (const faq of faqs) {
      await saveSiteFaqFn({
        data: {
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          sortOrder: faq.sortOrder,
          isPublished: faq.isPublished,
        },
      })
    }
  }, [faqs])

  useRegisterPageSave(edit?.isAdmin ? save : null, dirty)

  const update = (id: string, patch: { question?: string; answer?: string }) => {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
    setDirty(true)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <BackButton fallbackTo="/" className="mb-6" />
      <h1 className="font-display text-3xl font-bold">{t('faq')}</h1>
      <div className="mt-8 space-y-4">
        {faqs.map((faq) => (
          <details key={faq.id} className="card p-4" open={edit?.isAdmin}>
            <summary className="cursor-pointer font-medium">
              <InlineText value={faq.question} onChange={(v) => update(faq.id, { question: v })} />
            </summary>
            <div className="mt-3 text-muted">
              <InlineText value={faq.answer} onChange={(v) => update(faq.id, { answer: v })} multiline />
            </div>
          </details>
        ))}
        {faqs.length === 0 && <p className="text-muted">No FAQs yet.</p>}
      </div>
    </div>
  )
}
