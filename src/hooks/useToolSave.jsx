import { useState, useEffect, useCallback, useRef } from 'react'
import { saveToolData, loadToolData, deleteToolData } from '../lib/supabase'

export function useToolSave(toolId) {
  const [savedData,  setSavedData]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [isSaving,   setIsSaving]   = useState(false)
  const [lastSaved,  setLastSaved]  = useState(null)
  const [error,      setError]      = useState(null)
  const debounceRef  = useRef(null)
  const pendingRef   = useRef(null)

  useEffect(() => {
    if (!toolId) { setLoading(false); return }
    setLoading(true)
    loadToolData(toolId).then(({ data, updatedAt, error }) => {
      if (!error && data) { setSavedData(data); if (updatedAt) setLastSaved(new Date(updatedAt)) }
      setLoading(false)
    })
  }, [toolId])

  const save = useCallback((data) => {
    if (!toolId) return
    pendingRef.current = data
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true)
      const { error } = await saveToolData(toolId, pendingRef.current)
      if (!error) { setSavedData(pendingRef.current); setLastSaved(new Date()) }
      else setError(error)
      setIsSaving(false)
    }, 1500)
  }, [toolId])

  const saveNow = useCallback(async (data) => {
    if (!toolId) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIsSaving(true)
    const { error } = await saveToolData(toolId, data)
    if (!error) { setSavedData(data); setLastSaved(new Date()) }
    setIsSaving(false)
  }, [toolId])

  const clearSave = useCallback(async () => {
    if (!toolId) return
    await deleteToolData(toolId)
    setSavedData(null); setLastSaved(null)
  }, [toolId])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return { savedData, loading, isSaving, lastSaved, error, save, saveNow, clearSave }
}

export function SaveIndicator({ isSaving, lastSaved, clearSave }) {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceUpdate(n => n+1), 30000)
    return () => clearInterval(t)
  }, [])

  const timeAgo = lastSaved ? (() => {
    const s = Math.floor((Date.now() - lastSaved) / 1000)
    if (s < 5)  return 'just now'
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s/60)
    if (m < 60) return `${m}m ago`
    return lastSaved.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})
  })() : null

  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      {isSaving ? (
        <span style={{fontSize:10,color:'#ba7517',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-loader-2" style={{fontSize:11,animation:'spin .7s linear infinite'}} aria-hidden="true"/>
          Saving…
        </span>
      ) : lastSaved ? (
        <span style={{fontSize:10,color:'#1d9e75',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-cloud-check" style={{fontSize:11}} aria-hidden="true"/>
          Saved {timeAgo}
        </span>
      ) : (
        <span style={{fontSize:10,color:'var(--txt3)'}}>Unsaved</span>
      )}
      {lastSaved && clearSave && (
        <button onClick={clearSave} title="Clear saved data"
          style={{background:'none',border:'none',cursor:'pointer',padding:2,color:'var(--txt3)'}}>
          <i className="ti ti-trash" style={{fontSize:10}} aria-hidden="true"/>
        </button>
      )}
    </div>
  )
}
