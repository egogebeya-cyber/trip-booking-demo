const EMAIL_RE =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/i

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'throwawaymail.com',
  'yopmail.com',
  'trashmail.com',
  'fakeinbox.com',
  'sharklasers.com',
  'getnada.com',
  'mailnesia.com',
  'moakt.com',
  'dispostable.com',
  'maildrop.cc',
  'mailcatch.com',
])

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isValidEmailFormat(email: string) {
  const value = normalizeEmail(email)
  if (value.length > 254 || value.includes('..')) return false
  return EMAIL_RE.test(value)
}

export function emailDomain(email: string) {
  return normalizeEmail(email).split('@')[1] || ''
}

export function isDisposableEmail(email: string) {
  return DISPOSABLE_DOMAINS.has(emailDomain(email))
}
