import bcrypt from 'bcryptjs'
import { createHash } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '../db'
import { sessions, users } from '../db/schema'
import { parseEthiopianPhone, toWhatsAppNumber } from '~/lib/phone'
import { checkEmailAddress } from '../email/validate-address'

export const SESSION_COOKIE = 'trip_booking_session'
const SESSION_DAYS = 30

import type { PublicUser } from '~/lib/auth-types'

export type { PublicUser }

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function toPublicUser(user: typeof users.$inferSelect): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
  }
}

type CookieSetter = (
  name: string,
  value: string,
  options: {
    httpOnly?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
    path?: string
    maxAge?: number
    secure?: boolean
  },
) => void

type CookieGetter = (name: string) => string | undefined

export async function createSession(userId: string, setCookie: CookieSetter) {
  const token = nanoid(48)
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await db.insert(sessions).values({
    id: nanoid(),
    userId,
    tokenHash,
    expiresAt,
  })

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function destroySession(getCookie: CookieGetter, setCookie: CookieSetter) {
  const token = getCookie(SESSION_COOKIE)
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)))
  }
  setCookie(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export async function getSessionUser(getCookie: CookieGetter): Promise<PublicUser | null> {
  const token = getCookie(SESSION_COOKIE)
  if (!token) return null

  const tokenHash = hashToken(token)
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1)

  if (!session) return null

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
  return user ? toPublicUser(user) : null
}

export async function findUserByPhone(phone: string) {
  const target = toWhatsAppNumber(phone)
  if (!target) return null
  const rows = await db.select().from(users)
  return rows.find((user) => user.phone && toWhatsAppNumber(user.phone) === target) ?? null
}

export async function setEmailVerifyCode(userId: string) {
  const code = String(100000 + Math.floor(Math.random() * 900000))
  await db
    .update(users)
    .set({
      emailVerifyCodeHash: hashToken(code),
      emailVerifyExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })
    .where(eq(users.id, userId))
  return code
}

export async function registerUser(data: {
  email: string
  password: string
  fullName: string
  phone?: string
}) {
  const checked = await checkEmailAddress(data.email)
  if (!checked.ok) return { ok: false as const, error: checked.error }

  const existing = await db.select().from(users).where(eq(users.email, checked.email)).limit(1)
  if (existing.length > 0) {
    if (!existing[0].emailVerified) {
      const code = await setEmailVerifyCode(existing[0].id)
      return { ok: true as const, needsVerification: true as const, email: checked.email, code }
    }
    return { ok: false as const, error: 'EMAIL_EXISTS' }
  }

  const phone = parseEthiopianPhone(data.phone ?? '')
  if (!phone) return { ok: false as const, error: 'INVALID_PHONE' }
  const phoneOwner = await findUserByPhone(phone)
  if (phoneOwner) return { ok: false as const, error: 'PHONE_EXISTS' }

  const [user] = await db
    .insert(users)
    .values({
      id: nanoid(),
      email: checked.email,
      passwordHash: bcrypt.hashSync(data.password, 10),
      fullName: data.fullName,
      phone,
      role: 'customer',
      emailVerified: false,
    })
    .returning()

  const code = await setEmailVerifyCode(user.id)
  return { ok: true as const, needsVerification: true as const, email: checked.email, code }
}

export async function verifyEmailCode(email: string, code: string) {
  const value = email.trim().toLowerCase()
  const [user] = await db.select().from(users).where(eq(users.email, value)).limit(1)
  if (!user) return { ok: false as const, error: 'INVALID_CODE' }
  if (user.emailVerified) return { ok: true as const, user: toPublicUser(user) }
  if (!user.emailVerifyCodeHash || !user.emailVerifyExpiresAt || user.emailVerifyExpiresAt < new Date()) {
    return { ok: false as const, error: 'INVALID_CODE' }
  }
  if (hashToken(code.trim()) !== user.emailVerifyCodeHash) {
    return { ok: false as const, error: 'INVALID_CODE' }
  }
  await db
    .update(users)
    .set({ emailVerified: true, emailVerifyCodeHash: null, emailVerifyExpiresAt: null })
    .where(eq(users.id, user.id))
  return { ok: true as const, user: toPublicUser(user) }
}

export async function resendEmailVerification(email: string) {
  const value = email.trim().toLowerCase()
  const [user] = await db.select().from(users).where(eq(users.email, value)).limit(1)
  if (!user || user.emailVerified) return { ok: true as const, sent: false as const }
  const code = await setEmailVerifyCode(user.id)
  return { ok: true as const, sent: true as const, email: user.email, code }
}

export async function loginUser(identifier: string, password: string) {
  const value = identifier.trim()
  if (!value) return { ok: false as const, error: 'INVALID_CREDENTIALS' }

  const user = value.includes('@')
    ? (await db.select().from(users).where(eq(users.email, value.toLowerCase())).limit(1))[0]
    : await findUserByPhone(value)

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return { ok: false as const, error: 'INVALID_CREDENTIALS' }
  }
  if (!user.emailVerified) {
    const code = await setEmailVerifyCode(user.id)
    return { ok: false as const, error: 'EMAIL_NOT_VERIFIED', email: user.email, code }
  }
  return { ok: true as const, user: toPublicUser(user) }
}

export async function updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
  const raw = data.phone?.trim() ?? ''
  if (raw && !parseEthiopianPhone(raw)) return { ok: false as const, error: 'INVALID_PHONE' }
  const phone = raw ? parseEthiopianPhone(raw) : null
  if (phone) {
    const phoneOwner = await findUserByPhone(phone)
    if (phoneOwner && phoneOwner.id !== userId) return { ok: false as const, error: 'PHONE_EXISTS' }
  }
  await db
    .update(users)
    .set({
      fullName: data.fullName,
      phone,
    })
    .where(eq(users.id, userId))
  return { ok: true as const }
}

export async function requestPasswordReset(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) return { ok: true as const, token: null }

  const token = nanoid(32)
  await db
    .update(users)
    .set({
      resetTokenHash: hashToken(token),
      resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })
    .where(eq(users.id, user.id))

  return { ok: true as const, token, email: user.email }
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token)
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.resetTokenHash, tokenHash), gt(users.resetTokenExpiresAt, new Date())))
    .limit(1)

  if (!user) return { ok: false as const, error: 'INVALID_TOKEN' }

  await db
    .update(users)
    .set({
      passwordHash: bcrypt.hashSync(newPassword, 10),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    })
    .where(eq(users.id, user.id))

  return { ok: true as const }
}
