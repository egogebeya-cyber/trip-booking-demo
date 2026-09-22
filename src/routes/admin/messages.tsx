import { createFileRoute, Link } from '@tanstack/react-router'
import { listContactMessagesFn } from '~/server/admin/functions'
import { listAdminChatsFn } from '~/server/chat/functions'
import { getSiteSettingsFn } from '~/server/content/functions'

export const Route = createFileRoute('/admin/messages')({
  loader: async () => {
    const [messages, chats, settings] = await Promise.all([
      listContactMessagesFn(),
      listAdminChatsFn(),
      getSiteSettingsFn(),
    ])
    return { messages, chats, settings }
  },
  component: AdminMessagesPage,
})

function typeLabel(type: string) {
  if (type === 'telegram') return 'Telegram'
  if (type === 'whatsapp_click') return 'WhatsApp (site)'
  if (type === 'telegram_click') return 'Telegram (site)'
  if (type === 'group') return 'Group inquiry'
  return 'Contact form'
}

function AdminMessagesPage() {
  const { messages, chats, settings } = Route.useLoaderData()
  const whatsapp = settings?.whatsappNumber?.replace(/\D/g, '') || ''
  const telegram = (settings?.telegramBotUsername || settings?.telegramUsername || '').replace(/^@/, '')
  const openChats = (chats ?? []).filter((c) => c.status === 'open' && c.unread > 0)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Messages</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Website forms land here. WhatsApp chats stay on your phone — we email you when a guest taps WhatsApp.
        Telegram texts appear here only if a Telegram bot token is saved in Settings.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Open WhatsApp
          </a>
        )}
        {telegram && (
          <a
            href={`https://t.me/${telegram}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Open Telegram
          </a>
        )}
        <Link to="/admin/chat" className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
          Live chat inbox
        </Link>
        <Link to="/admin/settings" className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
          Connect Telegram bot
        </Link>
      </div>

      {openChats.length > 0 && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-card p-4">
          <h2 className="font-display text-lg font-semibold">Live chat waiting</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {openChats.map((chat) => (
              <li key={chat.id} className="flex items-center justify-between gap-2">
                <span>
                  <strong>{chat.visitorName || 'Guest'}</strong>
                  <span className="text-muted"> — {chat.lastBody}</span>
                </span>
                <Link to="/admin/chat" className="text-xs font-medium text-primary hover:underline">
                  Reply
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {messages.map((msg) => (
          <article key={msg.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{msg.subject}</p>
              <p className="text-xs text-muted">
                {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''} · {typeLabel(msg.type)}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted">
              {msg.name} · {msg.email}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm">{msg.message}</p>
          </article>
        ))}
        {messages.length === 0 && <p className="text-muted">No messages yet.</p>}
      </div>
    </div>
  )
}
