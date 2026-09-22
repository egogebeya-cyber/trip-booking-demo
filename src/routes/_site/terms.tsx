import { createFileRoute } from '@tanstack/react-router'
import { LegalInlinePage } from '~/components/legal-inline-page'
import { useLocale } from '~/components/locale-context'
import { getLegalPageFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/terms')({
  loader: async () => {
    const page = await getLegalPageFn({ data: { slug: 'terms' } })
    return { page }
  },
  component: TermsPage,
})

function TermsPage() {
  const { page } = Route.useLoaderData()
  const { t } = useLocale()
  return <LegalInlinePage slug="terms" fallbackTitle={t('termsOfService')} page={page} />
}
