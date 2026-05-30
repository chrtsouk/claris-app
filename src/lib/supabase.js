import { createClient } from '@supabase/supabase-js'

// Replace these with your Supabase project values after setup
// See: SETUP.md for instructions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ljzzcixfbcvnpjlzzfzs.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqenpjaXhmYmN2bnBqbHp6ZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMzgxNDYsImV4cCI6MjA5NDcxNDE0Nn0.SRBIa_qy5CGC0fAxHi6ZsaDGk-sonRiqgmT2bwgFIBU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── AUTH ─────────────────────────────────────────────────────

export const signUp = async ({ email, password, firstName, lastName }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` }
    }
  })
  return { data, error }
}

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  return { data, error }
}

export const signInWithApple = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: window.location.origin }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const onAuthChange = (callback) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}

// ── USER PROFILE ─────────────────────────────────────────────

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ── FAVOURITES ───────────────────────────────────────────────

export const getFavourites = async (userId) => {
  const { data, error } = await supabase
    .from('favourites')
    .select('tool_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const addFavourite = async (userId, toolId) => {
  const { data, error } = await supabase
    .from('favourites')
    .insert({ user_id: userId, tool_id: toolId })
    .select()
    .single()
  return { data, error }
}

export const removeFavourite = async (userId, toolId) => {
  const { error } = await supabase
    .from('favourites')
    .delete()
    .eq('user_id', userId)
    .eq('tool_id', toolId)
  return { error }
}

// ── COLLECTIONS ──────────────────────────────────────────────

export const getCollections = async (userId) => {
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_tools(tool_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const createCollection = async (userId, { name, emoji, description }) => {
  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name, emoji, description })
    .select()
    .single()
  return { data, error }
}

export const addToolToCollection = async (collectionId, toolId) => {
  const { data, error } = await supabase
    .from('collection_tools')
    .insert({ collection_id: collectionId, tool_id: toolId })
    .select()
    .single()
  return { data, error }
}

export const deleteCollection = async (collectionId) => {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
  return { error }
}

// ── SUBSCRIPTION ─────────────────────────────────────────────

export const getSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export const isSubscribed = async (userId) => {
  const { data } = await getSubscription(userId)
  if (!data) return false
  return data.status === 'active' && new Date(data.current_period_end) > new Date()
}

// ── NOTIFICATIONS ────────────────────────────────────────────

export const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return { data, error }
}

export const markNotificationRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  return { error }
}

export const markAllNotificationsRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
  return { error }
}

// ── PREFERENCES ──────────────────────────────────────────────

export const getPreferences = async (userId) => {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export const updatePreferences = async (userId, updates) => {
  const { data, error } = await supabase
    .from('preferences')
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()
  return { data, error }
}

// ── TOOL VIEWS (recently viewed) ─────────────────────────────

export const recordToolView = async (userId, toolId) => {
  const { error } = await supabase
    .from('tool_views')
    .insert({ user_id: userId, tool_id: toolId })
  return { error }
}

export const getRecentlyViewed = async (userId, limit = 10) => {
  const { data, error } = await supabase
    .from('tool_views')
    .select('tool_id, viewed_at')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(limit)
  // Deduplicate by tool_id
  const seen = new Set()
  const unique = (data ?? []).filter(r => {
    if (seen.has(r.tool_id)) return false
    seen.add(r.tool_id); return true
  })
  return { data: unique, error }
}

// ── PROFILE UPDATE ─────────────────────────────────────────────

export const upsertProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()
  return { data, error }
}

// ── TOOL DATA PERSISTENCE ─────────────────────────────────────
// Saves/loads tool state per user per tool_id
// Table: tool_saves (user_id, tool_id, data jsonb, updated_at)

export const saveToolData = async (toolId, data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await supabase
    .from('tool_saves')
    .upsert({ user_id: user.id, tool_id: toolId, data, updated_at: new Date().toISOString() },
             { onConflict: 'user_id,tool_id' })
  return { error }
}

export const loadToolData = async (toolId) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('tool_saves')
    .select('data, updated_at')
    .eq('user_id', user.id)
    .eq('tool_id', toolId)
    .single()
  return { data: data?.data || null, updatedAt: data?.updated_at, error }
}

export const deleteToolData = async (toolId) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await supabase
    .from('tool_saves')
    .delete()
    .eq('user_id', user.id)
    .eq('tool_id', toolId)
  return { error }
}

export const listSavedTools = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('tool_saves')
    .select('tool_id, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
  return { data: data || [], error }
}
