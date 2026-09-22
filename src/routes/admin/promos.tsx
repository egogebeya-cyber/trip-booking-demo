import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { listPromoCodesFn, savePromoCodeFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/promos')({
  loader: async () => {
    const promos = await listPromoCodesFn()
    return { promos }
  },
  component: AdminPromosPage,
})

function AdminPromosPage() {
  const { promos } = Route.useLoaderData()
  const router = useRouter()
  const [form, setForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: 10,
    maxUses: undefined as number | undefined,
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await savePromoCodeFn({ data: form })
      setForm({ code: '', discountType: 'percent', discountValue: 10, maxUses: undefined, isActive: true })
      router.invalidate()
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (promo: typeof promos[0]) => {
    await savePromoCodeFn({
      data: {
        id: promo.id,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        maxUses: promo.maxUses,
        isActive: !promo.isActive,
      },
    })
    router.invalidate()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Promo Codes</h1>

      <form onSubmit={save} className="mt-6 card max-w-lg space-y-3 p-4">
        <h2 className="font-medium">Create Promo Code</h2>
        <input required placeholder="Code" className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
          <input type="number" required className="input" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
        </div>
        <input type="number" placeholder="Max uses (optional)" className="input" value={form.maxUses ?? ''} onChange={(e) => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : undefined })} />
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Create'}</button>
      </form>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2 pr-4">Code</th>
              <th className="pb-2 pr-4">Discount</th>
              <th className="pb-2 pr-4">Uses</th>
              <th className="pb-2 pr-4">Active</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => (
              <tr key={promo.id} className="border-b border-border">
                <td className="py-3 pr-4 font-mono">{promo.code}</td>
                <td className="py-3 pr-4">
                  {promo.discountType === 'percent' ? `${promo.discountValue}%` : `${promo.discountValue} ETB`}
                </td>
                <td className="py-3 pr-4">{promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ''}</td>
                <td className="py-3 pr-4">{promo.isActive ? 'Yes' : 'No'}</td>
                <td className="py-3">
                  <button type="button" onClick={() => toggleActive(promo)} className="text-sm text-primary hover:underline">
                    {promo.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
