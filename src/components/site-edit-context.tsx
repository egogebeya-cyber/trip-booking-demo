import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { parseHomepageContent, type HomepageContent } from '~/lib/homepage-content'
import type { PublicUser } from '~/lib/auth-types'
import { updateSiteSettingsFn } from '~/server/admin/functions'

type SettingsDraft = {
  heroTitle: string
  heroSubtitle: string
  aboutText: string
  phone: string
  email: string
  address: string
}

type SiteEditValue = {
  isAdmin: boolean
  home: HomepageContent
  settings: SettingsDraft
  dirty: boolean
  saving: boolean
  saved: boolean
  setHome: (patch: Partial<HomepageContent>) => void
  setFeature: (index: number, patch: { title?: string; desc?: string }) => void
  setService: (index: number, patch: { kicker?: string; title?: string; desc?: string }) => void
  setSetting: (key: keyof SettingsDraft, value: string) => void
  registerPageSave: (save: (() => Promise<void>) | null, dirty: boolean) => void
  save: () => Promise<void>
}

const SiteEditContext = createContext<SiteEditValue | null>(null)

export function SiteEditProvider({
  user,
  settings,
  children,
}: {
  user: PublicUser | null
  settings: {
    homepageJson?: string | null
    heroTitle?: string | null
    heroSubtitle?: string | null
    aboutText?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
  } | null
  children: ReactNode
}) {
  const isAdmin = user?.role === 'admin'
  const [home, setHomeState] = useState(() => parseHomepageContent(settings?.homepageJson))
  const [draft, setDraft] = useState<SettingsDraft>({
    heroTitle: settings?.heroTitle ?? '',
    heroSubtitle: settings?.heroSubtitle ?? '',
    aboutText: settings?.aboutText ?? '',
    phone: settings?.phone ?? '',
    email: settings?.email ?? '',
    address: settings?.address ?? '',
  })
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [pageDirty, setPageDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const pageSaveRef = useRef<(() => Promise<void>) | null>(null)

  const setHome = useCallback((patch: Partial<HomepageContent>) => {
    setHomeState((prev) => ({ ...prev, ...patch }))
    setSettingsDirty(true)
    setSaved(false)
  }, [])

  const setFeature = useCallback((index: number, patch: { title?: string; desc?: string }) => {
    setHomeState((prev) => {
      const features = prev.features.map((item, i) => (i === index ? { ...item, ...patch } : item))
      return { ...prev, features }
    })
    setSettingsDirty(true)
    setSaved(false)
  }, [])

  const setService = useCallback((index: number, patch: { kicker?: string; title?: string; desc?: string }) => {
    setHomeState((prev) => {
      const services = prev.services.map((item, i) => (i === index ? { ...item, ...patch } : item))
      return { ...prev, services }
    })
    setSettingsDirty(true)
    setSaved(false)
  }, [])

  const setSetting = useCallback((key: keyof SettingsDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setSettingsDirty(true)
    setSaved(false)
  }, [])

  const registerPageSave = useCallback((saveFn: (() => Promise<void>) | null, dirty: boolean) => {
    pageSaveRef.current = saveFn
    setPageDirty(dirty)
    if (dirty) setSaved(false)
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      await updateSiteSettingsFn({
        data: {
          homepageJson: JSON.stringify(home),
          heroTitle: draft.heroTitle,
          heroSubtitle: draft.heroSubtitle,
          aboutText: draft.aboutText,
          phone: draft.phone,
          email: draft.email,
          address: draft.address,
        },
      })
      setSettingsDirty(false)
      if (pageSaveRef.current) {
        await pageSaveRef.current()
        setPageDirty(false)
      }
      setSaved(true)
    } catch (error) {
      setSaved(false)
      throw error
    } finally {
      setSaving(false)
    }
  }, [home, draft])

  const value = useMemo(
    () => ({
      isAdmin,
      home,
      settings: draft,
      dirty: settingsDirty || pageDirty,
      saving,
      saved,
      setHome,
      setFeature,
      setService,
      setSetting,
      registerPageSave,
      save,
    }),
    [isAdmin, home, draft, settingsDirty, pageDirty, saving, saved, setHome, setFeature, setService, setSetting, registerPageSave, save],
  )

  return <SiteEditContext.Provider value={value}>{children}</SiteEditContext.Provider>
}

export function useSiteEdit() {
  const ctx = useContext(SiteEditContext)
  if (!ctx) throw new Error('useSiteEdit must be used within SiteEditProvider')
  return ctx
}

export function useOptionalSiteEdit() {
  return useContext(SiteEditContext)
}

export function useRegisterPageSave(save: (() => Promise<void>) | null, dirty: boolean) {
  const edit = useOptionalSiteEdit()
  const register = edit?.registerPageSave
  const isAdmin = edit?.isAdmin
  useEffect(() => {
    if (!isAdmin || !register) return
    register(save, dirty)
    return () => register(null, false)
  }, [isAdmin, register, save, dirty])
}
