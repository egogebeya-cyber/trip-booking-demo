/** Ethiopian mobile: 09… / 07… or +251 9… / 7… */
export const ETHIOPIAN_PHONE_PATTERN = '^(?:\\+?251|0)?[79]\\d{8}$'

export function sanitizePhoneInput(raw: string): string {
  const hasPlus = raw.trimStart().startsWith('+')
  const digits = raw.replace(/\D/g, '')
  let limited = digits
  if (digits.startsWith('251')) limited = digits.slice(0, 12)
  else if (digits.startsWith('0')) limited = digits.slice(0, 10)
  else if (digits.startsWith('9') || digits.startsWith('7')) limited = digits.slice(0, 9)
  else limited = digits.slice(0, 10)
  return hasPlus ? `+${limited}` : limited
}

export function phoneInputMaxLength(value: string): number {
  const digits = value.replace(/\D/g, '')
  if (value.startsWith('+') || digits.startsWith('251')) return value.startsWith('+') ? 13 : 12
  if (digits.startsWith('0')) return 10
  if (digits.startsWith('9') || digits.startsWith('7')) return 9
  return 10
}

export function parseEthiopianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  let national = ''
  if (digits.startsWith('251') && digits.length === 12) national = digits.slice(3)
  else if (digits.startsWith('0') && digits.length === 10) national = digits.slice(1)
  else if (digits.length === 9) national = digits
  else return null
  if (!/^[79]\d{8}$/.test(national)) return null
  return `251${national}`
}

export function isValidEthiopianPhone(input: string): boolean {
  return parseEthiopianPhone(input) !== null
}

export function formatLocalEthiopianPhone(phone: string): string {
  const parsed = parseEthiopianPhone(phone)
  if (!parsed) return sanitizePhoneInput(phone)
  return `0${parsed.slice(3)}`
}

export function toWhatsAppNumber(phone: string) {
  return parseEthiopianPhone(phone) ?? ''
}

export function sanitizeLoginIdentifier(raw: string): string {
  if (!raw) return ''
  if (raw.includes('@') || /[A-Za-z]/.test(raw)) return raw.slice(0, 254)
  return sanitizePhoneInput(raw)
}
