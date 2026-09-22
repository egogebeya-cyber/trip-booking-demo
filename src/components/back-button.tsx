import { useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useLocale } from '~/components/locale-context'
import { cn } from '~/lib/utils'

type BackButtonProps = {
  fallbackTo?: string
  label?: string
  className?: string
  size?: 'default' | 'sm'
}

function canGoBackInApp() {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin
  } catch {
    return false
  }
}

export function BackButton({ fallbackTo = '/', label, className, size = 'default' }: BackButtonProps) {
  const router = useRouter()
  const { t } = useLocale()

  const goBack = () => {
    if (canGoBackInApp()) {
      router.history.back()
      return
    }
    router.history.push(fallbackTo)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        'btn-outline inline-flex items-center gap-2',
        size === 'sm' && '!px-3 !py-1.5 !text-xs',
        className,
      )}
    >
      <ArrowLeft className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
      {label ?? t('back')}
    </button>
  )
}
