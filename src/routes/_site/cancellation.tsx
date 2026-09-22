import { createFileRoute } from '@tanstack/react-router'
import { LegalInlinePage } from '~/components/legal-inline-page'
import { useLocale } from '~/components/locale-context'
import { getLegalPageFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/cancellation')({
  loader: async () => {
    const page = await getLegalPageFn({ data: { slug: 'cancellation' } })
    return { page }
  },
  component: CancellationPage,
})

function CancellationPage() {
  const { page } = Route.useLoaderData()
  const { t } = useLocale()
  return <LegalInlinePage slug="cancellation" fallbackTitle={t('cancellationPolicy')} page={page} />
}
