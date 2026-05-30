import { useState, useEffect, Suspense } from 'react'
import pfRegistry from './personal-finance/registry.js'

// Combined registry for all categories
const REGISTRY = {
  ...pfRegistry,
  // business registry will go here: ...bizRegistry,
}

function LoadingState({ tool }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--bdr)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--bg4)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{tool?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Loading tool...</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--txt3)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--bdr)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12 }}>Loading {tool?.name}...</div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ tool, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <i className="ti ti-tool" style={{ fontSize: 36, color: 'var(--txt3)', display: 'block', marginBottom: 14 }} aria-hidden="true" />
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 6 }}>
        {tool?.name}
      </div>
      <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 4 }}>This tool is being built.</div>
      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>Check back soon!</div>
    </div>
  )
}

/**
 * ToolLoader — dynamically loads the correct tool component from the registry.
 * Usage: <ToolLoader toolId="CL-0001" tool={toolObject} />
 */
export default function ToolLoader({ toolId, tool }) {
  const [Component, setComponent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setComponent(null)

    const loader = REGISTRY[toolId]
    if (!loader) {
      setError('No loader found')
      setLoading(false)
      return
    }

    loader()
      .then(comp => {
        setComponent(() => comp)
        setLoading(false)
      })
      .catch(err => {
        console.error(`Failed to load tool ${toolId}:`, err)
        setError(err.message)
        setLoading(false)
      })
  }, [toolId])

  if (loading) return <LoadingState tool={tool} />
  if (error || !Component) return <ErrorState tool={tool} error={error} />

  return <Component tool={tool} />
}

/**
 * hasToolFile — check if a tool has a dedicated file in the registry
 */
export function hasToolFile(toolId) {
  return toolId in REGISTRY
}
