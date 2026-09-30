import { Shield, Headphones, Award } from 'lucide-react'
import { useLocale } from '~/components/locale-context'

export function TrustBadges() {
  const { t } = useLocale()
  const badges = [
    { icon: Shield, label: t('secureBooking') },
    { icon: Award, label: t('licensedOperator') },
    { icon: Headphones, label: t('support247') },
  ]

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-6 sm:flex-row sm:flex-wrap sm:gap-6">
      {badges.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2 text-sm text-muted">
          <Icon className="h-5 w-5 text-primary" />
          {label}
        </div>
      ))}
    </div>
  )
}
