import { and, eq, gt, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '../db'
import { contactMessages, siteSettings } from '../db/schema'
import { sendChannelAlertToAdmin } from '../email/notifications'

async function notifyAdmin(channel: string, name: string, from: string, message: string) {
  const [settings] = await db.select().from(siteSettings).limit(1)
  if (!settings?.email) return
  await sendChannelAlertToAdmin({
    adminEmail: settings.email,
    channel,
    name,
    from,
    message,
  })
}

export async function logChannelClick(channel: 'whatsapp' | 'telegram') {
  const since = new Date(Date.now() - 3 * 60 * 1000)
  const recent = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactMessages)
    .where(and(eq(contactMessages.type, `${channel}_click`), gt(contactMessages.createdAt, since)))
  if (Number(recent[0]?.count || 0) > 0) return { ok: true as const, skipped: true }

  const label = channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'
  const message =
    channel === 'whatsapp'
      ? 'A guest tapped WhatsApp on the website. The chat itself stays in WhatsApp on your phone — open WhatsApp to reply.'
      : 'A guest tapped Telegram on the website. If a Telegram bot is connected, their messages also appear here. Otherwise reply in Telegram.'

  await db.insert(contactMessages).values({
    id: nanoid(),
    name: 'Website guest',
    email: `${channel}@site`,
    subject: `${label} opened from the site`,
    message,
    type: `${channel}_click`,
  })
  await notifyAdmin(`${label} (site)`, 'Website guest', channel, message)
  return { ok: true as const, skipped: false }
}

export async function pullTelegramMessages() {
  const [settings] = await db.select().from(siteSettings).limit(1)
  const token = settings?.telegramBotToken?.trim()
  if (!token) return { pulled: 0 }

  const offset = (settings.telegramUpdateOffset || 0) + 1
  const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=0`
  const response = await fetch(url)
  if (!response.ok) return { pulled: 0, error: 'Telegram API failed' }
  const data = (await response.json()) as {
    ok: boolean
    result?: {
      update_id: number
      message?: { text?: string; from?: { first_name?: string; username?: string; id: number } }
    }[]
  }
  if (!data.ok || !data.result?.length) return { pulled: 0 }

  let maxId = settings.telegramUpdateOffset || 0
  let pulled = 0
  for (const update of data.result) {
    maxId = Math.max(maxId, update.update_id)
    const text = update.message?.text?.trim()
    if (!text) continue
    const from = update.message?.from
    const name = from?.first_name || 'Telegram guest'
    const handle = from?.username ? `@${from.username}` : `telegram:${from?.id || 'unknown'}`
    await db.insert(contactMessages).values({
      id: nanoid(),
      name,
      email: handle,
      subject: 'Telegram message',
      message: text,
      type: 'telegram',
    })
    await notifyAdmin('Telegram', name, handle, text)
    pulled += 1
  }

  await db.update(siteSettings).set({ telegramUpdateOffset: maxId }).where(eq(siteSettings.id, settings.id))
  return { pulled }
}

export async function syncTelegramBot(token: string) {
  const clean = token.trim()
  if (!clean) {
    await db.update(siteSettings).set({ telegramBotToken: '', telegramBotUsername: null }).where(eq(siteSettings.id, 'default'))
    return { ok: true as const, username: '' }
  }
  const response = await fetch(`https://api.telegram.org/bot${clean}/getMe`)
  const data = (await response.json()) as { ok: boolean; result?: { username?: string } }
  if (!data.ok) return { ok: false as const, error: 'Invalid Telegram bot token' }
  const username = data.result?.username || ''
  await db
    .update(siteSettings)
    .set({ telegramBotToken: clean, telegramBotUsername: username })
    .where(eq(siteSettings.id, 'default'))
  return { ok: true as const, username }
}
