import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useLocale } from '~/components/locale-context'

type PasswordInputProps = {
  id?: string
  name?: string
  required?: boolean
  minLength?: number
  value: string
  onChange: (value: string) => void
  className?: string
  autoComplete?: string
  placeholder?: string
}

export function PasswordInput({
  id,
  name,
  required,
  minLength,
  value,
  onChange,
  className = 'input',
  autoComplete,
  placeholder,
}: PasswordInputProps) {
  const { t } = useLocale()
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} pr-11`}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-foreground"
        onClick={() => setVisible((open) => !open)}
        aria-label={visible ? t('hidePassword') : t('showPassword')}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
