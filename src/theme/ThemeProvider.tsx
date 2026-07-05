import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { themeStorageKey, type ResolvedThemeName, type ThemeName } from './tokens'

type ThemeContextValue = {
  theme: ThemeName
  resolvedTheme: ResolvedThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
}

const themeCycle: ThemeName[] = ['light', 'dark', 'system']
const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(themeStorageKey)
  if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
    return savedTheme
  }

  return 'system'
}

function getResolvedTheme(theme: ThemeName): ResolvedThemeName {
  if (typeof window === 'undefined') {
    return 'light'
  }

  if (theme === 'light' || theme === 'dark') {
    return theme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ThemeName) {
  const resolvedTheme = getResolvedTheme(theme)
  const root = document.documentElement

  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = theme
  root.classList.toggle('dark', resolvedTheme === 'dark')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedThemeName>(() =>
    getResolvedTheme(getInitialTheme()),
  )

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(themeStorageKey, theme)
    setResolvedTheme(getResolvedTheme(theme))

    if (theme !== 'system') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      applyTheme('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemeState,
      toggleTheme: () =>
        setThemeState((current) => themeCycle[(themeCycle.indexOf(current) + 1) % themeCycle.length]),
    }),
    [theme, resolvedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}
