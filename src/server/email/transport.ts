import nodemailer from 'nodemailer'
import { db } from '../db'
import { siteSettings } from '../db/schema'
import { env } from './env'

export type EmailPayload = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export type EmailMode = 'smtp' | 'resend' | 'disabled' | 'not_configured'

export type EmailConfig = {
  mode: EmailMode
  host: string
  port: number
  user: string
  pass: string
  from: string
  resendKey: string
}

function wrapAddress(from: string, fallbackName: string) {
  if (!from) return ''
  if (from.includes('<')) return from
  if (from.includes('@')) return `${fallbackName} <${from}>`
  return from
}

export async function getEmailConfig(): Promise<EmailConfig> {
  const [settings] = await db.select().from(siteSettings).limit(1)
  const user = env('SMTP_USER') || settings?.smtpUser || ''
  const host = env('SMTP_HOST') || settings?.smtpHost || 'smtp.gmail.com'
  const port = Number(env('SMTP_PORT') || settings?.smtpPort || 587) || 587
  const pass = (env('SMTP_PASS') || settings?.smtpPass || '').replace(/\s/g, '')
  const resendKey = env('RESEND_API_KEY')
  const business = settings?.businessName || 'Trip Explorer'
  const envFrom = env('EMAIL_FROM')
  const fromRaw =
    settings?.smtpFrom ||
    user ||
    (envFrom && !envFrom.includes('you@gmail.com') ? envFrom : '')
  const from = wrapAddress(fromRaw, business) || `${business} <${user}>`

  if (env('EMAIL_ENABLED') === 'false') {
    return { mode: 'disabled', host, port, user, pass, from, resendKey }
  }
  if (host && user && pass) {
    return { mode: 'smtp', host, port, user, pass, from, resendKey }
  }
  if (resendKey) {
    return { mode: 'resend', host, port, user, pass, from, resendKey }
  }
  return { mode: 'not_configured', host, port, user, pass, from, resendKey }
}

export function publicEmailStatus(config: EmailConfig) {
  return {
    mode: config.mode,
    host: config.host,
    port: config.port,
    user: config.user,
    from: config.from,
    hasPassword: Boolean(config.pass),
  }
}

async function sendWithSmtp(config: EmailConfig, payload: EmailPayload) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port === 587,
    auth: { user: config.user, pass: config.pass.replace(/\s/g, '') },
  })
  await transporter.sendMail({
    from: config.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    replyTo: payload.replyTo,
  })
}

async function sendWithResend(config: EmailConfig, payload: EmailPayload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo,
    }),
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export async function sendEmail(payload: EmailPayload) {
  const config = await getEmailConfig()
  if (config.mode === 'disabled') {
    console.info('[email:disabled]', payload.subject, '→', payload.to)
    return { ok: true as const, mode: config.mode }
  }
  if (config.mode === 'not_configured') {
    console.info('[email:dev]', payload.subject, '→', payload.to)
    console.info(payload.text)
    return { ok: false as const, mode: config.mode, error: 'Email is not configured' }
  }

  try {
    if (config.mode === 'smtp') await sendWithSmtp(config, payload)
    else await sendWithResend(config, payload)
    return { ok: true as const, mode: config.mode }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email send failed'
    console.error('[email] failed', message)
    return { ok: false as const, mode: config.mode, error: message }
  }
}

export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    subject: 'Trip Explorer test email',
    text: 'This is a test email from Trip Explorer. Outgoing email is working.',
    html: '<p>This is a test email from <strong>Trip Explorer</strong>. Outgoing email is working.</p>',
  })
}
