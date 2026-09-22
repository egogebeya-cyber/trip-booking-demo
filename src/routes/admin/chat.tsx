import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { getAdminChatFn, listAdminChatsFn, sendAgentChatFn, setChatStatusFn } from '~/server/chat/functions'

export const Route = createFileRoute('/admin/chat')({
  loader: async () => {
    const chats = await listAdminChatsFn()
    return { chats }
  },
  component: AdminLiveChatPage,
})

function AdminLiveChatPage() {
  const { chats: initial } = Route.useLoaderData()
  const [chats, setChats] = useState(initial)
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null)
  const [thread, setThread] = useState<Awaited<ReturnType<typeof getAdminChatFn>> | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const refreshList = async () => {
    setChats(await listAdminChatsFn())
  }

  const loadThread = async (id: string) => {
    const data = await getAdminChatFn({ data: { id } })
    setThread(data)
    await refreshList()
  }

  useEffect(() => {
    if (!activeId) return
    void loadThread(activeId)
    const timer = window.setInterval(() => {
      void loadThread(activeId)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages.length])

  const send = async () => {
    if (!activeId || !draft.trim() || busy) return
    setBusy(true)
    try {
      const result = await sendAgentChatFn({ data: { id: activeId, body: draft } })
      if (result && 'messages' in result) setThread(result)
      setDraft('')
      await refreshList()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Live chat</h1>
          <p className="mt-1 text-sm text-muted">Reply to customers. Quick answers go out automatically for basic questions.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card">
          {chats.length === 0 && <p className="p-4 text-sm text-muted">No chats yet. They appear when a guest uses the site chat button.</p>}
          <ul className="max-h-[70vh] overflow-y-auto">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(chat.id)}
                  className={`w-full border-b border-border px-3 py-3 text-left text-sm hover:bg-accent ${
                    activeId === chat.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{chat.visitorName || 'Guest'}</span>
                    {chat.unread > 0 && (
                      <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{chat.unread}</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{chat.lastBody}</p>
                  <p className="mt-1 text-[10px] uppercase text-muted">{chat.status}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex min-h-[28rem] flex-col rounded-2xl border border-border bg-card">
          {!thread ? (
            <p className="p-6 text-sm text-muted">Select a conversation.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <p className="font-medium">{thread.conversation.visitorName || 'Guest'}</p>
                  <p className="text-xs text-muted">{thread.conversation.visitorEmail || 'No email'}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-xs"
                  onClick={() =>
                    void setChatStatusFn({
                      data: {
                        id: thread.conversation.id,
                        status: thread.conversation.status === 'open' ? 'closed' : 'open',
                      },
                    }).then(() => loadThread(thread.conversation.id))
                  }
                >
                  {thread.conversation.status === 'open' ? 'Mark closed' : 'Reopen'}
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {thread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      msg.sender === 'agent'
                        ? 'ml-auto bg-primary text-primary-foreground'
                        : msg.sender === 'bot'
                          ? 'bg-emerald-50 text-emerald-950'
                          : 'bg-accent'
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                      {msg.sender === 'visitor' ? 'Customer' : msg.sender === 'bot' ? 'Quick answer' : 'You'}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form
                className="flex gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  void send()
                }}
              >
                <input
                  className="input flex-1"
                  placeholder="Reply to the customer…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" disabled={busy} className="rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
