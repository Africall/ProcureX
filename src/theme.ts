import { create } from 'zustand'

type Theme = 'light' | 'dark'

type ThemeState = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const initial = ((): Theme => {
  const ls = typeof localStorage !== 'undefined' ? (localStorage.getItem('theme') as Theme | null) : null
  if (ls === 'dark' || ls === 'light') return ls
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
})()

export const useTheme = create<ThemeState>((set, get) => ({
  theme: initial,
  setTheme: (t) => {
    set({ theme: t })
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', t === 'dark')
    }
    try { localStorage.setItem('theme', t) } catch {}
  },
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))

// initialize class on load (in case store is imported after DOM is ready)
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', initial === 'dark')
}
