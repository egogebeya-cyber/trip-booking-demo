import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { PublicUser } from '~/lib/auth-types'
import { db, ensureDbSchema } from '../db'
import { chatConversations, chatMessages, siteFaqs, siteSettings } from '../db/schema'

async function publishedFaqs() {
  return db.select().from(siteFaqs).where(eq(siteFaqs.isPublished, true)).orderBy(siteFaqs.sortOrder)
}

export const CHAT_COOKIE = 'trip_chat_id'

const WELCOME =
  'Hi! I can help with basic questions (booking, payment, cancel). Pick a question below or type a message — our team will reply here.'

function normalize(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
}

function matchBasicAnswer(
  text: string,
  faqs: { question: string; answer: string }[],
  settings: { phone?: string | null; whatsappNumber?: string | null; email?: string | null } | null,
) {
  const q = normalize(text)
  if (!q) return null
  const phone = settings?.phone || '0974332069'
  const whatsapp = settings?.whatsappNumber || phone

  if (/\b(hi|hello|hey|selam|selamta)\b/.test(q) && q.split(' ').length <= 3) {
    return 'Hello! Ask about booking, payment, or cancellations, or leave a message for our team.'
  }
  if (/\b(pay|payment|telebirr|bank|deposit|transfer|qr)\b/.test(q)) {
    return `Pay by Telebirr or bank transfer on the booking page, then upload your receipt. We mark it paid after we check it. WhatsApp ${whatsapp} if you need the account details.`
  }
  if (/\b(cancel|refund|change date)\b/.test(q)) {
    return 'Cancellation depends on trip length (1 day, 2 days, or longer). Open Cancellation on the website, or send your TRP- booking reference here and our team will check it.'
  }
  if (/\b(book|booking|reserve|how do i)\b/.test(q)) {
    return 'Open a trip, pick a date, enter guest details, then pay. You can also start from Trips. If a date is full, join the waitlist.'
  }
  if (/\b(whatsapp|phone|call|telegram|contact)\b/.test(q)) {
    return `Phone / WhatsApp: ${phone}. Email: ${settings?.email || 'info@tripexplorer.com'}. You can keep chatting here too.`
  }
  if (/\b(price|cost|how much|etb)\b/.test(q)) {
    return 'Prices are on each trip page in ETB (USD shown too). Groups of 5+ or 10+ may get a discount. You can also book a private package (about 15 people, no other guests) or a family-only trip. Tell us the trip name if you want a quote.'
  }

  const words = q.split(' ').filter((w) => w.length > 3)
  let best: { question: string; answer: string } | null = null
  let score = 0
  for (const faq of faqs) {
    const hay = normalize(`${faq.question} ${faq.answer}`)
    const hits = words.filter((w) => hay.includes(w)).length
    if (hits > score) {
      score = hits
      best = faq
    }
  }
  if (best && (score >= 2 || (score >= 1 && words.length <= 4))) {
    return best.answer
  }
  return null
}

async function getConversation(id: string) {
  const [row] = await db.select().from(chatConversations).where(eq(chatConversations.id, id)).limit(1)
  return row ?? null
}

async function listMessages(conversationId: string) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt)
}

async function addMessage(conversationId: string, sender: 'visitor' | 'agent' | 'bot', body: string) {
  const now = new Date()
  await db.insert(chatMessages).values({
    id: nanoid(),
    conversationId,
    sender,
    body: body.trim().slice(0, 2000),
    createdAt: now,
  })
  await db
    .update(chatConversations)
    .set({ lastMessageAt: now, status: 'open' })
    .where(eq(chatConversations.id, conversationId))
}

export async function getVisitorChat(conversationId: string | undefined) {
  ensureDbSchema()
  const faqs = await publishedFaqs()
  const quick = faqs.slice(0, 6).map((f) => ({ id: f.id, question: f.question, answer: f.answer }))
  if (!conversationId) {
    return { conversation: null, messages: [] as Awaited<ReturnType<typeof listMessages>>, faqs: quick }
  }
  const conversation = await getConversation(conversationId)
  if (!conversation) {
    return { conversation: null, messages: [] as Awaited<ReturnType<typeof listMessages>>, faqs: quick }
  }
  return { conversation, messages: await listMessages(conversationId), faqs: quick }
}

export async function startOrContinueChat(data: {
  conversationId?: string
  name?: string
  email?: string
  user?: PublicUser | null
}) {
  ensureDbSchema()
  const existing = data.conversationId ? await getConversation(data.conversationId) : null
  if (existing) {
    const updates: Partial<typeof existing> = {}
    if (data.name?.trim()) updates.visitorName = data.name.trim().slice(0, 80)
    if (data.email?.trim()) updates.visitorEmail = data.email.trim().slice(0, 120)
    if (data.user?.id) updates.userId = data.user.id
    if (Object.keys(updates).length) {
      await db.update(chatConversations).set(updates).where(eq(chatConversations.id, existing.id))
    }
    return existing.id
  }

  const id = nanoid()
  const name = data.name?.trim() || data.user?.fullName || 'Guest'
  await db.insert(chatConversations).values({
    id,
    visitorName: name,
    visitorEmail: data.email?.trim() || data.user?.email || null,
    userId: data.user?.id || null,
    status: 'open',
    lastMessageAt: new Date(),
  })
  await addMessage(id, 'bot', WELCOME)
  return id
}

export async function sendVisitorMessage(data: {
  conversationId?: string
  body: string
  name?: string
  email?: string
  user?: PublicUser | null
}) {
  const text = data.body.trim()
  if (!text) return { ok: false as const, error: 'EMPTY' }
  const id = await startOrContinueChat(data)
  const recent = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatMessages)
    .where(and(eq(chatMessages.conversationId, id), eq(chatMessages.sender, 'visitor')))
  if (Number(recent[0]?.count || 0) > 80) {
    return { ok: false as const, error: 'LIMIT', conversationId: id }
  }

  await addMessage(id, 'visitor', text)

  const faqs = await publishedFaqs()
  const [settings] = await db.select().from(siteSettings).limit(1)
  const auto = matchBasicAnswer(text, faqs, settings)
  if (auto) {
    await addMessage(id, 'bot', auto)
  } else {
    const thread = await listMessages(id)
    const lastBot = [...thread].reverse().find((m) => m.sender === 'bot')
    if (!lastBot?.body.startsWith('Thanks —')) {
      await addMessage(
        id,
        'bot',
        'Thanks — our team will reply here. You can also use WhatsApp if it is urgent.',
      )
      const { sendChannelAlertToAdmin } = await import('../email/notifications')
      if (settings?.email) {
        void sendChannelAlertToAdmin({
          adminEmail: settings.email,
          channel: 'Live chat',
          name: data.name || data.user?.fullName || 'Guest',
          from: data.email || data.user?.email || 'live-chat',
          message: text,
        }).catch(() => null)
      }
    }
  }

  const result = await getVisitorChat(id)
  return { ok: true as const, conversationId: id, ...result }
}

export async function listAdminChats() {
  ensureDbSchema()
  const rows = await db.select().from(chatConversations).orderBy(desc(chatConversations.lastMessageAt))
  const lastMessages = await Promise.all(
    rows.map(async (row) => {
      const [last] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, row.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1)
      const unread = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.conversationId, row.id),
            eq(chatMessages.sender, 'visitor'),
            row.agentReadAt ? gt(chatMessages.createdAt, row.agentReadAt) : sql`1=1`,
          ),
        )
      return {
        ...row,
        lastBody: last?.body ?? '',
        lastSender: last?.sender ?? '',
        unread: Number(unread[0]?.count || 0),
      }
    }),
  )
  return lastMessages
}

export async function countOpenChats() {
  try {
    ensureDbSchema()
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatConversations)
      .where(eq(chatConversations.status, 'open'))
    return Number(row?.count || 0)
  } catch {
    return 0
  }
}

export async function getAdminChat(id: string) {
  const conversation = await getConversation(id)
  if (!conversation) return null
  await db.update(chatConversations).set({ agentReadAt: new Date() }).where(eq(chatConversations.id, id))
  return { conversation, messages: await listMessages(id) }
}

export async function sendAgentMessage(id: string, body: string) {
  const text = body.trim()
  if (!text) return { ok: false as const, error: 'EMPTY' }
  const conversation = await getConversation(id)
  if (!conversation) return { ok: false as const, error: 'NOT_FOUND' }
  await addMessage(id, 'agent', text)
  await db.update(chatConversations).set({ agentReadAt: new Date() }).where(eq(chatConversations.id, id))
  return { ok: true as const, ...(await getAdminChat(id)) }
}

export async function setChatStatus(id: string, status: 'open' | 'closed') {
  await db.update(chatConversations).set({ status }).where(eq(chatConversations.id, id))
  return { ok: true as const }
}
