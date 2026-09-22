import { useLocale } from '~/components/locale-context'
import {
  ETHIOPIAN_PHONE_PATTERN,
  phoneInputMaxLength,
  sanitizePhoneInput,
} from '~/lib/phone'

type PhoneInputProps = {
  id?: string
  name?: string
  required?: boolean
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
  autoComplete?: string
  showHint?: boolean
}

export function PhoneInput({
  id,
  name,
  required,
  value,
  defaultValue,
  onChange,
  className = 'input',
  autoComplete = 'tel',
  showHint = true,
}: PhoneInputProps) {
  const { t } = useLocale()
  const current = value ?? defaultValue ?? ''

  return (
    <>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        required={required}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        maxLength={phoneInputMaxLength(current)}
        pattern={ETHIOPIAN_PHONE_PATTERN}
        title={t('invalidPhone')}
        placeholder="09XXXXXXXX"
        className={className}
        onChange={(e) => {
          const next = sanitizePhoneInput(e.target.value)
          e.target.value = next
          onChange?.(next)
        }}
      />
      {showHint && <p className="mt-1 text-xs text-muted">{t('phoneHint')}</p>}
    </>
  )
}
