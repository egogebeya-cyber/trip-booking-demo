import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { listNewsletterSubscribersFn, sendAnnouncementFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/newsletter')({
  loader: async () => {
    const subscribers = await listNewsletterSubscribersFn()
    return { subscribers }
  },
  component: AdminNewsletterPage,
})

function AdminNewsletterPage() {
  const { subscribers } = Route.useLoaderData()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [includeAccounts, setIncludeAccounts] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setResult('')
    try {
      const response = await sendAnnouncementFn({
        data: { subject, message, includeAccounts },
      })
      if (!response.ok) {
        setResult(response.error)
        return
      }
      setResult(`Sent to ${response.sent} of ${response.total} people.${response.failed ? ` ${response.failed} failed.` : ''}`)
      setSubject('')
      setMessage('')
    } catch {
      setResult('Could not send. Connect outgoing email in Settings first.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Notify by email</h1>
      <p className="mt-1 text-sm text-muted">
        Tell subscribers about a new trip, offer, or other news. People who signed up for the newsletter
        {includeAccounts ? ' and customer accounts' : ''} will get this.
      </p>

      <form onSubmit={(e) => void send(e)} className="card mt-6 max-w-2xl space-y-4 p-6">
        <div>
          <label className="label">Subject</label>
          <input
            className="input"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="New trip: Lalibela 3 days"
          />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea
            className="input"
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write the news you want them to receive…"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includeAccounts} onChange={(e) => setIncludeAccounts(e.target.checked)} />
          Also email people who created an account
        </label>
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? 'Sending…' : 'Send email'}
        </button>
        {result && <p className="text-sm text-muted">{result}</p>}
      </form>

      <h2 className="mt-10 font-display text-xl font-semibold">Subscribers</h2>
      <p className="mt-1 text-sm text-muted">{subscribers.length} newsletter emails</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.id} className="border-b border-border">
                <td className="py-3 pr-4">{sub.email}</td>
                <td className="py-3">
                  {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscribers.length === 0 && <p className="mt-4 text-muted">No subscribers yet.</p>}
      </div>
    </div>
  )
}
