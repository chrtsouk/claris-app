import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const THEME_VARS = {
  'dark-gold': {
    '--gold': '#c9a96e', '--gold2': '#a07840',
    '--gold3': 'rgba(201,169,110,0.10)', '--gold4': 'rgba(201,169,110,0.18)',
    '--bdr': 'rgba(201,169,110,0.09)', '--bdr2': 'rgba(201,169,110,0.24)',
    '--bg': '#0c0c12', '--bg2': '#13131c', '--bg3': '#1a1a26',
    '--bg4': '#20202e', '--bg5': '#262633',
    '--txt': '#edeae2', '--txt2': '#9b9585', '--txt3': '#4e4b44',
  },
  'dark-slate': {
    '--gold': '#94a3c4', '--gold2': '#6478a0',
    '--gold3': 'rgba(148,163,196,0.10)', '--gold4': 'rgba(148,163,196,0.18)',
    '--bdr': 'rgba(148,163,196,0.09)', '--bdr2': 'rgba(148,163,196,0.28)',
    '--bg': '#0b0d14', '--bg2': '#111420', '--bg3': '#17192a',
    '--bg4': '#1d2034', '--bg5': '#23273e',
    '--txt': '#e8eaf2', '--txt2': '#8890a8', '--txt3': '#404660',
  },
  'dark-copper': {
    '--gold': '#c47b4a', '--gold2': '#9a5a2e',
    '--gold3': 'rgba(196,123,74,0.10)', '--gold4': 'rgba(196,123,74,0.18)',
    '--bdr': 'rgba(196,123,74,0.09)', '--bdr2': 'rgba(196,123,74,0.28)',
    '--bg': '#100c0a', '--bg2': '#181210', '--bg3': '#201a17',
    '--bg4': '#28221e', '--bg5': '#302a25',
    '--txt': '#f0ebe6', '--txt2': '#9c8e86', '--txt3': '#504540',
  },
  'dark-platinum': {
    '--gold': '#b0b8c8', '--gold2': '#808898',
    '--gold3': 'rgba(176,184,200,0.10)', '--gold4': 'rgba(176,184,200,0.16)',
    '--bdr': 'rgba(176,184,200,0.08)', '--bdr2': 'rgba(176,184,200,0.22)',
    '--bg': '#080808', '--bg2': '#111111', '--bg3': '#181818',
    '--bg4': '#202020', '--bg5': '#282828',
    '--txt': '#f0f0f2', '--txt2': '#888890', '--txt3': '#404044',
  },
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('claris-theme') || 'dark-gold')

  const setTheme = (id) => {
    setThemeState(id)
    localStorage.setItem('claris-theme', id)
    applyTheme(id)
  }

  useEffect(() => { applyTheme(theme) }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function applyTheme(id) {
  const vars = THEME_VARS[id] ?? THEME_VARS['dark-gold']
  const root = document.documentElement
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val))
  // Reset body color
  document.body.style.color = vars['--txt'] ?? '#edeae2'
}

export const useTheme = () => useContext(ThemeContext)
