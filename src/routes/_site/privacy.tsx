import { createFileRoute } from '@tanstack/react-router'
import { LegalInlinePage } from '~/components/legal-inline-page'
import { useLocale } from '~/components/locale-context'
import { getLegalPageFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/privacy')({
  loader: async () => {
    const page = await getLegalPageFn({ data: { slug: 'privacy' } })
    return { page }
  },
  component: PrivacyPage,
})

function PrivacyPage() {
  const { page } = Route.useLoaderData()
  const { t } = useLocale()
  return <LegalInlinePage slug="privacy" fallbackTitle={t('privacyPolicy')} page={page} />
}
