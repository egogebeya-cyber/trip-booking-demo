import { getCookie } from '@tanstack/react-start/server'
import { getSessionUser } from './service'

export async function requireUser() {
  const user = await getSessionUser((name) => getCookie(name))
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}
