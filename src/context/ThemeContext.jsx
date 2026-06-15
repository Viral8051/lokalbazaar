import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('lb_theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    localStorage.setItem('lb_theme', theme)
  }, [theme])

  // System preference change sun
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handle(e) {
      const saved = localStorage.getItem('lb_theme')
      if (!saved) setTheme(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handle)
    return () => mq.removeEventListener('change', handle)
  }, [])

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
