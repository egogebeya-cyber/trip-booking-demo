import { Moon, Sun } from 'lucide-react'
import { useTheme } from '~/components/theme-context'
import { cn } from '~/lib/utils'

type ThemeToggleProps = {
  variant: 'mobile' | 'desktop'
}

export function ThemeToggle({ variant }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        variant === 'mobile'
          ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground transition hover:bg-accent'
          : 'nav-link-sb inline-flex min-h-11 min-w-11 items-center justify-center !px-3 !py-1.5',
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
    </button>
  )
}
