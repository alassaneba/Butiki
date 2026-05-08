import { useEffect, useState } from 'react'

function getInitialTheme() {
  const stored = localStorage.getItem('butik-theme')
  if (stored) return stored
  // Respecter la préférence système par défaut
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
  // Mettre à jour la meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = theme === 'dark' ? '#0f172a' : '#f8f7f5'
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('butik-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme, isDark: theme === 'dark' }
}

// Initialiser immédiatement au chargement du module (avant React)
if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme())
}
