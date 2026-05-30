import { useState, useRef } from 'react'

/**
 * CL-0059 — Tax Estimate Planner
 * Category: Personal Finance → Tax & Insurance
 * Type: Database | Priority: P3 Expansion | Complexity: Professional
 *
 * PURPOSE: Store and search financial records
 *
 * TODO: Replace the placeholder body below with the real tool UI.
 * Each tool must be unique — do not copy another tool's logic here.
 */

// Shared helpers (copy what you need)
const fmt    = n => `£${Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtInt = n => `£${Math.round(n).toLocaleString('en-GB')}`
const fmtPct = n => `${n.toFixed(1)}%`
const COLOR  = '#ba7517'
const ICON   = 'ti-file-invoice'

export default function Tool_CL_0059({ tool }) {
  // ── STATE ────────────────────────────────────────────────────
  // Add your useState hooks here


  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--bdr)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: `${COLOR}18`, border: `1px solid ${COLOR}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${ICON}`} style={{ fontSize: 18, color: COLOR }} aria-hidden="true" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Tax Estimate Planner</div>
          <div style={{ fontSize: 11, color: 'var(--txt2)' }}>Store and search financial records</div>
        </div>
      </div>

      {/* ── Body — BUILD YOUR TOOL UI HERE ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className={`ti ${ICON}`} style={{ fontSize: 40, color: COLOR, display: 'block', marginBottom: 14 }} aria-hidden="true" />
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 8 }}>
            Tax Estimate Planner
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', maxWidth: 340, lineHeight: 1.6 }}>
            Store and search financial records
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: 'var(--txt3)', fontStyle: 'italic' }}>
            🔧 Tool UI coming soon
          </div>
        </div>
      </div>

    </div>
  )
}
