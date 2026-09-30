import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  NEGUS_THEME_KEY,
  applyNegusTheme,
  resolveNegusTheme,
  type NegusTheme,
} from '~/lib/theme'

type ThemeContextValue = {
  theme: NegusTheme
  setTheme: (theme: NegusTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readThemeFromDom(): NegusTheme {
  if (typeof document === 'undefined') return 'dark'
  if (document.documentElement.classList.contains('light')) return 'light'
  return 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<NegusTheme>(() => readThemeFromDom())

  const setTheme = useCallback((next: NegusTheme) => {
    setThemeState(next)
    applyNegusTheme(next)
    localStorage.setItem(NEGUS_THEME_KEY, next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: NegusTheme = current === 'dark' ? 'light' : 'dark'
      applyNegusTheme(next)
      localStorage.setItem(NEGUS_THEME_KEY, next)
      return next
    })
  }, [])

  useEffect(() => {
    const stored = resolveNegusTheme(localStorage.getItem(NEGUS_THEME_KEY))
    if (stored !== readThemeFromDom()) applyNegusTheme(stored)
    setThemeState(stored)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
