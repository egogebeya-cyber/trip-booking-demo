import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import {
  createSession,
  destroySession,
  getSessionUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resendEmailVerification,
  resetPassword,
  SESSION_COOKIE,
  updateProfile,
  verifyEmailCode,
} from './service'
import type { PublicUser } from '~/lib/auth-types'
import { sendEmailVerificationCode, sendLoginSuccessEmail, sendPasswordResetEmail } from '../email/notifications'

function bindSetCookie() {
  return (name: string, value: string, options: Parameters<typeof setCookie>[2]) => {
    setCookie(name, value, options)
  }
}

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PublicUser | null> => {
    return getSessionUser((name) => getCookie(name))
  },
)

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { identifier: string; password: string }) => data)
  .handler(async ({ data }) => {
    const result = await loginUser(data.identifier, data.password)
    if (!result.ok) {
      if (result.error === 'EMAIL_NOT_VERIFIED') {
        const sent = await sendEmailVerificationCode({ to: result.email, code: result.code })
        if (!sent.ok) return { ok: false as const, error: 'EMAIL_SEND_FAILED' as const }
        return { ok: false as const, error: 'EMAIL_NOT_VERIFIED' as const, email: result.email }
      }
      return result
    }
    await createSession(result.user.id, bindSetCookie())
    void sendLoginSuccessEmail({ to: result.user.email, fullName: result.user.fullName }).catch((error) => {
      console.error('login email failed', error)
    })
    return result
  })

export const registerFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { email: string; password: string; fullName: string; phone?: string }) => data,
  )
  .handler(async ({ data }) => {
    const result = await registerUser(data)
    if (!result.ok) return result
    const sent = await sendEmailVerificationCode({ to: result.email, code: result.code })
    if (!sent.ok) return { ok: false as const, error: 'EMAIL_SEND_FAILED' as const }
    return { ok: true as const, needsVerification: true as const, email: result.email }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  await destroySession((name) => getCookie(name), bindSetCookie())
  return { ok: true }
})

export const updateProfileFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { fullName?: string; phone?: string }) => data)
  .handler(async ({ data }) => {
    const user = await getSessionUser((name) => getCookie(name))
    if (!user) return { ok: false as const, error: 'UNAUTHORIZED' }
    return updateProfile(user.id, data)
  })

export const forgotPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const result = await requestPasswordReset(data.email)
    if (result.token && result.email) {
      const { appPublicUrl } = await import('~/lib/app-url')
      const baseUrl = appPublicUrl()
      await sendPasswordResetEmail({
        to: result.email,
        resetUrl: `${baseUrl}/forgot-password?token=${result.token}`,
      })
    }
    return { ok: true }
  })

export const verifyEmailFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; code: string }) => data)
  .handler(async ({ data }) => {
    const result = await verifyEmailCode(data.email, data.code)
    if (!result.ok) return result
    await createSession(result.user.id, bindSetCookie())
    void sendLoginSuccessEmail({ to: result.user.email, fullName: result.user.fullName }).catch((error) => {
      console.error('login email failed', error)
    })
    return result
  })

export const resendVerificationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const result = await resendEmailVerification(data.email)
    if (result.sent && result.code && result.email) {
      await sendEmailVerificationCode({ to: result.email, code: result.code })
    }
    return { ok: true as const }
  })

export const resetPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string; password: string }) => data)
  .handler(async ({ data }) => resetPassword(data.token, data.password))
