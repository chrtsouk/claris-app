import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, signUp, signIn, signInWithGoogle, signInWithApple, signOut, getProfile, getFavourites, addFavourite, removeFavourite, isSubscribed } from '../lib/supabase'

const AuthContext = createContext(null)

// Global language state — updated without reload
export let globalLang = localStorage.getItem('claris-lang') || 'en'
export const setGlobalLang = (lang) => {
  globalLang = lang
  localStorage.setItem('claris-lang', lang)
}

// Dev mode: set to true to skip auth and use guest account
const DEV_MODE = false
const GUEST_USER = {
  id: 'guest-001',
  email: 'guest@claris.app',
  user_metadata: { full_name: 'Guest User', first_name: 'Guest' }
}
const GUEST_PROFILE = {
  id: 'guest-001',
  first_name: 'Guest',
  last_name: 'User',
  full_name: 'Guest User',
  email: 'guest@claris.app',
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favourites, setFavourites] = useState([])
  const [subscribed, setSubscribed] = useState(false)

  // Load session on mount
  useEffect(() => {
    // DEV MODE: skip Supabase auth, use guest account
    if (DEV_MODE) {
      setSession({ user: GUEST_USER })
      setUser(GUEST_USER)
      setProfile(GUEST_PROFILE)
      setSubscribed(true)
      setFavourites([])
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadUserData(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) loadUserData(session.user)
      else {
        setUser(null); setProfile(null); setFavourites([]); setSubscribed(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (authUser) => {
    setUser(authUser)
    try {
      const [{ data: prof }, { data: favs }, sub] = await Promise.all([
        getProfile(authUser.id),
        getFavourites(authUser.id),
        isSubscribed(authUser.id),
      ])
      if (prof) setProfile(prof)
      if (favs) setFavourites(favs.map(f => f.tool_id))
      setSubscribed(sub)
    } catch (e) {
      // Profile may not exist yet (first login) — not an error
      console.warn('User data loading:', e.message)
    } finally {
      setLoading(false)
    }
  }

  // Auth actions
  const handleSignUp = useCallback(async (data) => {
    const result = await signUp(data)
    return result
  }, [])

  const handleSignIn = useCallback(async (data) => {
    const result = await signIn(data)
    return result
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
  }, [])

  const handleGoogleSignIn = useCallback(async () => {
    return await signInWithGoogle()
  }, [])

  const handleAppleSignIn = useCallback(async () => {
    return await signInWithApple()
  }, [])

  // Favourites
  const toggleFavourite = useCallback(async (toolId) => {
    if (!user) return
    const isFav = favourites.includes(toolId)
    setFavourites(prev => isFav ? prev.filter(id => id !== toolId) : [...prev, toolId])

    // Skip DB calls in dev mode
    if (DEV_MODE) return

    if (isFav) {
      const { error } = await removeFavourite(user.id, toolId)
      if (error) setFavourites(prev => [...prev, toolId])
    } else {
      const { error } = await addFavourite(user.id, toolId)
      if (error) setFavourites(prev => prev.filter(id => id !== toolId))
    }
  }, [user, favourites])

  const isFavourite = useCallback((toolId) => favourites.includes(toolId), [favourites])

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      favourites, subscribed,
      isLoggedIn: !!session,
      signUp: handleSignUp,
      signIn: handleSignIn,
      signOut: handleSignOut,
      signInWithGoogle: handleGoogleSignIn,
      signInWithApple: handleAppleSignIn,
      toggleFavourite, isFavourite,
      setProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
