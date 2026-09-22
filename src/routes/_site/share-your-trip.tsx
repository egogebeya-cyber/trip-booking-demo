import { createFileRoute } from '@tanstack/react-router'
import { TestimonialSubmitForm } from '~/components/testimonial-submit-form'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'

export const Route = createFileRoute('/_site/share-your-trip')({
  component: ShareYourTripPage,
})

function ShareYourTripPage() {
  const { t } = useLocale()

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <BackButton fallbackTo="/" label={t('testimonials')} />
      <h1 className="mt-4 font-display text-3xl font-bold">{t('shareYourStory')}</h1>
      <p className="mt-2 text-sm text-muted">{t('shareYourStoryHint')}</p>
      <TestimonialSubmitForm />
    </div>
  )
}
