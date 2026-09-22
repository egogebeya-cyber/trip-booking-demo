import dns from 'node:dns/promises'
import { emailDomain, isDisposableEmail, isValidEmailFormat, normalizeEmail } from '~/lib/email'

async function domainCanReceiveMail(domain: string) {
  try {
    const mx = await dns.resolveMx(domain)
    if (mx.length > 0) return true
  } catch {
    // try A record next
  }
  try {
    const a = await dns.resolve4(domain)
    return a.length > 0
  } catch {
    return false
  }
}

export async function checkEmailAddress(email: string) {
  const value = normalizeEmail(email)
  if (!isValidEmailFormat(value) || isDisposableEmail(value)) {
    return { ok: false as const, error: 'INVALID_EMAIL' as const }
  }
  const domain = emailDomain(value)
  if (!domain || !(await domainCanReceiveMail(domain))) {
    return { ok: false as const, error: 'INVALID_EMAIL_DOMAIN' as const }
  }
  return { ok: true as const, email: value }
}
