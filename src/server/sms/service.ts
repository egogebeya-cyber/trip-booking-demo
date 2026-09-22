import { env } from '../email/env'
import { db } from '../db'
import { siteSettings } from '../db/schema'
import { parseEthiopianPhone } from '~/lib/phone'

export type SmsSendResult = { ok: true; mode: 'afromessage' | 'console' } | { ok: false; error: string }

type SmsConfig = {
  enabled: boolean
  token: string
  sender: string
  identifier: string
}

export async function getSmsConfig(): Promise<SmsConfig> {
  const [settings] = await db.select().from(siteSettings).limit(1)
  const token = (env('SMS_API_TOKEN') || env('AFROMESSAGE_TOKEN') || settings?.smsApiToken || '').trim()
  const sender = (env('SMS_SENDER') || settings?.smsSenderName || settings?.businessName || 'TripExplorer').trim()
  const identifier = (env('SMS_FROM') || settings?.smsIdentifier || '').trim()
  const envOn = env('SMS_ENABLED') === 'true'
  const enabled = Boolean(token) && (settings?.smsEnabled === true || envOn)
  return { enabled, token, sender, identifier }
}

export function publicSmsStatus(config: SmsConfig) {
  return {
    enabled: config.enabled,
    hasToken: Boolean(config.token),
    sender: config.sender,
    identifier: config.identifier,
  }
}

export function tripReminderText(data: {
  tripTitle: string
  travelDate: string
  referenceNumber: string
  businessName?: string
}) {
  return `Reminder: ${data.tripTitle} is tomorrow (${data.travelDate}). Ref ${data.referenceNumber}. See you then! — ${data.businessName || 'Trip Explorer'}`
}

export async function sendSms(to: string, message: string): Promise<SmsSendResult> {
  const config = await getSmsConfig()
  const phone = parseEthiopianPhone(to)
  if (!phone) return { ok: false, error: 'Invalid phone' }

  if (!config.enabled || !config.token) {
    console.info('[sms:dev]', `+${phone}`, message)
    return { ok: false, error: 'SMS is not connected' }
  }

  const recipient = `+${phone}`
  const body: Record<string, string> = {
    to: recipient,
    message,
    sender: config.sender.slice(0, 11),
  }
  if (config.identifier) body.from = config.identifier

  try {
    const response = await fetch('https://api.afromessage.com/api/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const text = await response.text()
    if (!response.ok) {
      console.error('[sms] AfroMessage failed', response.status, text.slice(0, 300))
      return { ok: false, error: 'SMS provider rejected the message' }
    }
    return { ok: true, mode: 'afromessage' }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'SMS send failed'
    console.error('[sms] failed', messageText)
    return { ok: false, error: messageText }
  }
}

export async function sendTripDayReminderSms(data: {
  phone: string
  tripTitle: string
  travelDate: string
  referenceNumber: string
  businessName?: string
}) {
  return sendSms(
    data.phone,
    tripReminderText(data),
  )
}
