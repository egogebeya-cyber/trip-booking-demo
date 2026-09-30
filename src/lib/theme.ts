export const NEGUS_THEME_KEY = 'negus-theme'

export type NegusTheme = 'dark' | 'light'

export function resolveNegusTheme(stored: string | null): NegusTheme {
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export function applyNegusTheme(theme: NegusTheme) {
  document.documentElement.classList.remove('dark', 'light')
  document.documentElement.classList.add(theme)
}

/** Inline in `<head>` before paint to avoid theme flash. */
export const NEGUS_THEME_INIT_SCRIPT = `(function(){try{var k='${NEGUS_THEME_KEY}';var t=localStorage.getItem(k);var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t==='light'||t==='dark'?t:'dark');}catch(e){document.documentElement.classList.add('dark');}})();`
