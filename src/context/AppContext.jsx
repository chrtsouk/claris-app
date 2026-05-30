import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [favourites, setFavourites] = useState(['CL-0001', 'CL-0681', 'CL-0422'])
  const [searchQuery, setSearchQuery] = useState('')
  const [user] = useState({ name: 'Alex Smith', plan: 'Pro', avatar: 'AS' })

  const toggleFavourite = useCallback((toolId) => {
    setFavourites(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    )
  }, [])

  const isFavourite = useCallback((toolId) => favourites.includes(toolId), [favourites])

  return (
    <AppContext.Provider value={{ favourites, toggleFavourite, isFavourite, searchQuery, setSearchQuery, user }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
