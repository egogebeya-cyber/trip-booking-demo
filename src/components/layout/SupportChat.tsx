import { MessageCircle, Phone, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import type { PublicUser } from '~/lib/auth-types'
import { getMyChatFn, sendChatMessageFn } from '~/server/chat/functions'
import { logChannelClickFn } from '~/server/content/functions'

type Faq = { id: string; question: string; answer: string }
type ChatMessage = { id: string; sender: string; body: string; createdAt: Date | string | null }

type SupportChatProps = {
  whatsappNumber?: string | null
  telegramUsername?: string | null
  telegramBotUsername?: string | null
  phone?: string | null
  businessName?: string | null
  user?: PublicUser | null
}

function buildWhatsAppUrl(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

function buildTelegramUrl(username: string, message: string) {
  const handle = username.replace(/^@/, '').trim()
  return `https://t.me/${handle}?text=${encodeURIComponent(message)}`
}

export function SupportChat({
  whatsappNumber,
  telegramUsername,
  telegramBotUsername,
  phone,
  businessName,
  user,
}: SupportChatProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'chat' | 'call'>('chat')
  const [visitorName, setVisitorName] = useState(user?.fullName || '')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const company = businessName ?? 'Trip Explorer'
  const hasWhatsApp = Boolean(whatsappNumber?.trim())
  const telegramHandle = (telegramBotUsername || telegramUsername || '').replace(/^@/, '')
  const hasTelegram = Boolean(telegramHandle)
  const hasPhone = Boolean(phone?.trim())
  const defaultMessage = 'Hi, I need help booking a trip.'

  const load = async () => {
    const data = await getMyChatFn()
    setFaqs(data.faqs)
    setMessages(data.messages)
    if (data.conversation?.visitorName) setVisitorName((prev) => prev || data.conversation!.visitorName || '')
  }

  useEffect(() => {
    if (!open) return
    void load()
    const timer = window.setInterval(() => void load(), 3000)
    return () => window.clearInterval(timer)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, open])

  const send = async (text: string) => {
    const body = text.trim()
    if (!body || busy) return
    setBusy(true)
    setDraft('')
    try {
      const result = await sendChatMessageFn({
        data: { body, name: visitorName.trim() || user?.fullName || undefined, email: user?.email || undefined },
      })
      if (result && 'messages' in result) setMessages(result.messages)
      if (result && 'faqs' in result) setFaqs(result.faqs)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:right-6">
      {open && (
        <div className="flex h-[min(32rem,70dvh)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border-2 border-primary bg-background shadow-2xl">
          <div className="bg-primary px-4 py-3 text-primary-foreground">
            <p className="font-semibold">Live chat</p>
            <p className="text-xs text-primary-foreground/80">Ask a basic question or chat with {company}</p>
          </div>
          <div className="flex gap-1 border-b border-border p-1">
            <button
              type="button"
              onClick={() => setTab('chat')}
              className={cn('flex-1 rounded-lg px-2 py-1.5 text-xs font-medium', tab === 'chat' ? 'bg-accent' : 'text-muted')}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setTab('call')}
              className={cn('flex-1 rounded-lg px-2 py-1.5 text-xs font-medium', tab === 'call' ? 'bg-accent' : 'text-muted')}
            >
              WhatsApp / call
            </button>
          </div>

          {tab === 'chat' ? (
            <>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {messages.length === 0 && (
                  <p className="text-xs text-muted">Ask about booking, payment, or cancellation. A person can also reply.</p>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'max-w-[90%] rounded-2xl px-3 py-2 text-sm',
                      msg.sender === 'visitor' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-accent',
                    )}
                  >
                    {msg.sender !== 'visitor' && (
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {msg.sender === 'bot' ? 'Quick answer' : 'Support'}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              {faqs.length > 0 && (
                <div className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2">
                  {faqs.slice(0, 4).map((faq) => (
                    <button
                      key={faq.id}
                      type="button"
                      className="shrink-0 rounded-full border border-border px-2 py-1 text-[11px] hover:bg-accent"
                      onClick={() => void send(faq.question)}
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
              )}
              <form
                className="border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  void send(draft)
                }}
              >
                {!user && (
                  <input
                    className="mb-2 w-full rounded-lg border border-border px-2 py-1.5 text-xs"
                    placeholder="Your name"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                  />
                )}
                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                    placeholder="Type a message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button type="submit" disabled={busy} className="rounded-lg bg-primary px-3 text-primary-foreground disabled:opacity-50">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-2 p-3">
              <p className="px-1 text-xs text-muted">Chat here, or open WhatsApp / Telegram.</p>
              {hasWhatsApp && (
                <a
                  href={buildWhatsAppUrl(whatsappNumber!, defaultMessage)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => void logChannelClickFn({ data: { channel: 'whatsapp' } })}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 hover:bg-[#25D366]/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">WhatsApp</span>
                    <span className="block text-xs text-muted">{whatsappNumber}</span>
                  </span>
                </a>
              )}
              {hasTelegram && (
                <a
                  href={buildTelegramUrl(telegramHandle, defaultMessage)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => void logChannelClickFn({ data: { channel: 'telegram' } })}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 hover:bg-[#229ED9]/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#229ED9] text-white">
                    <Send className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Telegram</span>
                    <span className="block text-xs text-muted">@{telegramHandle}</span>
                  </span>
                </a>
              )}
              {hasPhone && (
                <a href={`tel:${phone!.replace(/\s/g, '')}`} className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 hover:bg-accent">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Phone className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Call us</span>
                    <span className="block text-xs text-muted">{phone}</span>
                  </span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105',
          open ? 'bg-foreground' : 'bg-primary',
        )}
        aria-label={open ? 'Close live chat' : 'Open live chat'}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>
    </div>
  )
}
