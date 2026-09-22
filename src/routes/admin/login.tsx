import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { AuthBackground } from '~/components/auth-background'
import { PasswordInput } from '~/components/password-input'
import { sanitizeLoginIdentifier } from '~/lib/phone'
import { loginFn } from '~/server/auth/functions'

export const Route = createFileRoute('/admin/login')({
  component: AdminLoginPage,
})

function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await loginFn({ data: { identifier: email, password } })
      if (!result.ok) {
        setError('Email, phone, or password is incorrect.')
        return
      }
      if (result.user.role !== 'admin') {
        setError('Admin access required')
        return
      }
      await router.invalidate()
      await router.navigate({ to: '/admin' })
    } catch {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthBackground>
      <form onSubmit={submit} className="card w-full p-6">
        <h1 className="font-display text-2xl font-bold">Admin Login</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage your trip booking site.</p>
        <p className="mt-2 text-xs text-muted">Demo: admin@tripexplorer.com / admin123</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label">Email or phone</label>
            <input
              type="text"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(sanitizeLoginIdentifier(e.target.value))}
              placeholder="admin@tripexplorer.com or 09…"
              autoComplete="username"
              maxLength={254}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <PasswordInput
              required
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>
    </AuthBackground>
  )
}
