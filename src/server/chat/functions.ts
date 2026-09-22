import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { getSessionUser } from '../auth/service'
import { requireAdmin } from '../auth/guard.server'
import {
  CHAT_COOKIE,
  getAdminChat,
  getVisitorChat,
  listAdminChats,
  sendAgentMessage,
  sendVisitorMessage,
  setChatStatus,
} from './service'

function setChatCookie(id: string) {
  setCookie(CHAT_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })
}

export const getMyChatFn = createServerFn({ method: 'GET' }).handler(async () => {
  const id = getCookie(CHAT_COOKIE)
  return getVisitorChat(id)
})

export const sendChatMessageFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { body: string; name?: string; email?: string }) => data)
  .handler(async ({ data }) => {
    const user = await getSessionUser((name) => getCookie(name))
    const result = await sendVisitorMessage({
      conversationId: getCookie(CHAT_COOKIE),
      body: data.body,
      name: data.name,
      email: data.email,
      user,
    })
    if ('conversationId' in result && result.conversationId) {
      setChatCookie(result.conversationId)
    }
    return result
  })

export const listAdminChatsFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()
  return listAdminChats()
})

export const getAdminChatFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    return getAdminChat(data.id)
  })

export const sendAgentChatFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; body: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    return sendAgentMessage(data.id, data.body)
  })

export const setChatStatusFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; status: 'open' | 'closed' }) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    return setChatStatus(data.id, data.status)
  })
