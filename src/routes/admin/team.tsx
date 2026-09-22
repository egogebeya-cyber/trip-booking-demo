import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { deleteTeamMemberFn, listTeamMembersAdminFn, saveTeamMemberFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/team')({
  loader: async () => {
    const team = await listTeamMembersAdminFn()
    return { team }
  },
  component: AdminTeamPage,
})

function AdminTeamPage() {
  const { team } = Route.useLoaderData()
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', role: '', bio: '', photoUrl: '', sortOrder: 0 })
  const [saving, setSaving] = useState(false)

  const startEdit = (member?: (typeof team)[0]) => {
    if (member) {
      setEditing(member.id)
      setForm({
        name: member.name,
        role: member.role,
        bio: member.bio ?? '',
        photoUrl: member.photoUrl ?? '',
        sortOrder: member.sortOrder,
      })
    } else {
      setEditing('new')
      setForm({ name: '', role: '', bio: '', photoUrl: '', sortOrder: team.length })
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await saveTeamMemberFn({
        data: { ...form, id: editing === 'new' ? undefined : editing! },
      })
      setEditing(null)
      router.invalidate()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this team member?')) return
    await deleteTeamMemberFn({ data: { id } })
    router.invalidate()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Team</h1>
        <button type="button" onClick={() => startEdit()} className="btn-primary">
          New member
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="card mt-6 max-w-2xl space-y-3 p-4">
          <input required className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required className="input" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <textarea className="input" rows={3} placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <input className="input" placeholder="Photo URL" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
          <input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {team.map((member) => (
          <div key={member.id} className="card flex items-start justify-between gap-4 p-4">
            <div className="flex gap-3">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-semibold text-primary">
                  {member.name.slice(0, 1)}
                </div>
              )}
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-primary">{member.role}</p>
                {member.bio && <p className="mt-1 text-sm text-muted">{member.bio}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => startEdit(member)} className="text-sm text-primary hover:underline">
                Edit
              </button>
              <button type="button" onClick={() => remove(member.id)} className="text-sm text-destructive hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
        {team.length === 0 && <p className="text-muted">No team members yet.</p>}
      </div>
    </div>
  )
}
