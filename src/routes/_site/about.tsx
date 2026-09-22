import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { BackButton } from '~/components/back-button'
import { InlineImage } from '~/components/inline-image'
import { InlineText } from '~/components/inline-text'
import { useLocale } from '~/components/locale-context'
import { useOptionalSiteEdit, useRegisterPageSave, useSiteEdit } from '~/components/site-edit-context'
import { saveTeamMemberFn } from '~/server/admin/functions'
import { getSiteSettingsFn, listTeamMembersFn } from '~/server/content/functions'

export const Route = createFileRoute('/_site/about')({
  loader: async () => {
    const [team, settings] = await Promise.all([listTeamMembersFn(), getSiteSettingsFn()])
    return { team, settings }
  },
  component: AboutPage,
})

function AboutPage() {
  const { team } = Route.useLoaderData()
  const { t } = useLocale()
  const { settings, setSetting } = useSiteEdit()
  const edit = useOptionalSiteEdit()
  const [members, setMembers] = useState(team)
  const [teamDirty, setTeamDirty] = useState(false)

  const saveTeam = useCallback(async () => {
    for (const member of members) {
      await saveTeamMemberFn({
        data: {
          id: member.id,
          name: member.name,
          role: member.role,
          bio: member.bio ?? '',
          photoUrl: member.photoUrl ?? '',
          sortOrder: member.sortOrder,
        },
      })
    }
  }, [members])

  useRegisterPageSave(edit?.isAdmin ? saveTeam : null, teamDirty)

  const updateMember = (id: string, patch: Partial<(typeof members)[0]>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
    setTeamDirty(true)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <BackButton fallbackTo="/" className="mb-6" />
      <h1 className="font-display text-3xl font-bold">{t('aboutUs')}</h1>
      <div className="mt-6 text-lg leading-relaxed text-muted">
        <InlineText
          value={settings.aboutText}
          onChange={(v) => setSetting('aboutText', v)}
          multiline
        />
      </div>

      {members.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">{t('ourTeam')}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div key={member.id} className="card p-6 text-center">
                <InlineImage
                  src={member.photoUrl}
                  alt={member.name}
                  className="mx-auto w-24"
                  imgClassName="mx-auto h-24 w-24 rounded-full object-cover"
                  onChange={(url) => updateMember(member.id, { photoUrl: url })}
                />
                <h3 className="mt-4 font-semibold">
                  <InlineText value={member.name} onChange={(v) => updateMember(member.id, { name: v })} />
                </h3>
                <p className="text-sm text-primary">
                  <InlineText value={member.role} onChange={(v) => updateMember(member.id, { role: v })} />
                </p>
                <p className="mt-2 text-sm text-muted">
                  <InlineText
                    value={member.bio ?? ''}
                    onChange={(v) => updateMember(member.id, { bio: v })}
                    multiline
                  />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
