import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useToolSave, SaveIndicator } from '../hooks/useToolSave.jsx'
import { useCurrency } from '../context/CurrencyContext'

// ═══════════════════════════════════════════════════════════════
// SHARED LAYOUT — used by ALL tools for consistent visual
// ═══════════════════════════════════════════════════════════════

const fmt = (n, sym = '£') => `${sym}${Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Shared Section component — always open, with colored header + dynamic rows
function Section({ title, icon, color, rows, setter, readOnly = false }) {
  const { currency } = useCurrency()
  const sym = currency.symbol
  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const upd = (id, key, val) => setter && setter(p => p.map(r => r.id === id ? { ...r, [key]: val } : r))
  const add = () => setter && setter(p => [...p, { id: Date.now(), name: '', amount: 0 }])
  const rem = (id) => setter && setter(p => p.filter(r => r.id !== id))

  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${color}44`, borderRadius: 12, flexShrink: 0 }}>
      {/* Section header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: `${color}08` }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 14, color }} aria-hidden="true" />
        </div>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--txt)', flex: 1 }}>{title}</span>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color }}>{fmt(total)}</span>
      </div>

      {/* Rows — always visible */}
      <div>
          {rows.map(row => (
            <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderTop: '1px solid var(--bdr)' }}>
              {readOnly
                ? <span style={{ flex: 1, fontSize: 12, color: 'var(--txt2)' }}>{row.name}</span>
                : <input value={row.name || ''} onChange={e => upd(row.id, 'name', e.target.value)} placeholder="Item name..."
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--txt2)', fontFamily: 'inherit' }} />
              }
              <div style={{ position: 'relative', width: 140, flexShrink: 0 }}>
                <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--txt3)', pointerEvents: 'none' }}>{sym}</span>
                <input type="text" inputMode="decimal"
                  value={row.amount === 0 ? '' : row.amount} placeholder="0"
                  readOnly={readOnly}
                  onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) upd(row.id, 'amount', parseFloat(e.target.value) || 0) }}
                  onFocus={e => !readOnly && e.target.select()}
                  style={{ width: '100%', background: readOnly ? 'transparent' : 'var(--bg3)', border: readOnly ? 'none' : '1px solid var(--bdr)', borderRadius: 7, padding: '7px 8px 7px 24px', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', textAlign: 'right', cursor: readOnly ? 'default' : 'text' }} />
              </div>
              {!readOnly && setter && (
                <button onClick={() => rem(row.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'var(--txt3)', flexShrink: 0, fontSize: 16, lineHeight: 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e24b4a'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--txt3)'}>×</button>
              )}
            </div>
          ))}
          {!readOnly && setter && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--bdr)' }}>
              <button onClick={add}
                style={{ fontSize: 12, color, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.85 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}>
                <i className="ti ti-plus" style={{ fontSize: 12 }} aria-hidden="true" /> Add line
              </button>
            </div>
          )}
        </div>
    </div>
  )
}

// ToolLayout — standard 2-panel layout: sections left + summary right
function ToolLayout({ tool, color, icon, isSaving, lastSaved, clearSave, sections, summary, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} color={color} icon={icon} isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left — sections */}
        <div className='tool-main' style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sections && sections.map(s => <Section key={s.title} {...s} />)}
          {children}
        </div>
        {/* Right — summary */}
        {summary && (
          <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid var(--bdr)', overflowY: 'auto', padding: 14, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary}
          </div>
        )}
      </div>
    </div>
  )
}

// SummaryRow — single stat row for summary panel
function SummaryRow({ label, value, color = 'var(--txt)', bold = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: bold ? '8px 12px' : '6px 0', background: bold ? 'var(--bg3)' : 'transparent', borderRadius: bold ? 8 : 0, border: bold ? '1px solid var(--bdr)' : 'none', borderBottom: !bold ? '1px solid var(--bdr)' : undefined }}>
      <span style={{ fontSize: 11, color: bold ? 'var(--txt)' : 'var(--txt2)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: bold ? 13 : 11, fontWeight: bold ? 700 : 500, color }}>{value}</span>
    </div>
  )
}

// SummaryCard — highlighted card for summary panel
function SummaryCard({ label, value, color, subtitle }) {
  return (
    <div style={{ background: `${color}12`, border: `2px solid ${color}44`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
      {label && <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>}
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color }}>{value}</div>
      {subtitle && <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 3 }}>{subtitle}</div>}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// TOOL CONFIG — derives unique UI from tool name
// ═══════════════════════════════════════════════════════════════
export const TOOL_TEMPLATE_MAP = {
  'CL-0001': 'budget-planner',
  'CL-0002': 'budget-planner',
  'CL-0003': 'budget-planner',
  'CL-0004': 'budget-planner',
  'CL-0005': 'zero-based-budget',
  'CL-0006': 'envelope-budget',
  'CL-0007': 'budget-planner',
  'CL-0008': 'budget-planner',
  'CL-0009': 'kpi-dashboard',
  'CL-0010': 'cash-flow-planner',
  'CL-0011': 'budget-review',
  'CL-0012': 'budget-variance',
  'CL-0013': 'expense-tracker',
  'CL-0014': 'expense-tracker',
  'CL-0015': 'expense-tracker',
  'CL-0016': 'expense-tracker',
  'CL-0017': 'expense-tracker',
  'CL-0018': 'expense-tracker',
  'CL-0019': 'expense-tracker',
  'CL-0020': 'expense-tracker',
  'CL-0021': 'expense-tracker',
  'CL-0022': 'kpi-dashboard',
  'CL-0023': 'income-tracker',
  'CL-0024': 'income-tracker',
  'CL-0025': 'income-tracker',
  'CL-0026': 'income-tracker',
  'CL-0027': 'income-tracker',
  'CL-0028': 'income-tracker',
  'CL-0029': 'income-tracker',
  'CL-0030': 'cash-flow-planner',
  'CL-0031': 'cash-flow-planner',
  'CL-0032': 'savings-goal',
  'CL-0033': 'savings-goal',
  'CL-0034': 'savings-goal',
  'CL-0035': 'savings-challenge',
  'CL-0036': 'no-spend-challenge',
  'CL-0037': 'savings-goal',
  'CL-0038': 'savings-goal',
  'CL-0039': 'savings-goal',
  'CL-0040': 'savings-goal',
  'CL-0041': 'kpi-dashboard',
  'CL-0042': 'debt-snowball-calc',
  'CL-0043': 'debt-snowball-calc',
  'CL-0044': 'debt-snowball-calc',
  'CL-0045': 'credit-tracker',
  'CL-0046': 'loan-repayment',
  'CL-0047': 'credit-tracker',
  'CL-0048': 'kpi-dashboard',
  'CL-0049': 'interest-calculator',
  'CL-0050': 'debt-snowball-calc',
  'CL-0051': 'budget-planner',
  'CL-0052': 'budget-planner',
  'CL-0053': 'budget-planner',
  'CL-0054': 'expense-tracker',
  'CL-0055': 'expense-tracker',
  'CL-0056': 'expense-tracker',
  'CL-0057': 'inventory-tool',
  'CL-0058': 'cash-flow-planner',
  'CL-0059': 'checklist',
  'CL-0060': 'insurance-comparison',
  'CL-0061': 'expense-tracker',
  'CL-0062': 'checklist',
  'CL-0063': 'checklist',
  'CL-0064': 'insurance-comparison',
  'CL-0065': 'net-worth',
  'CL-0066': 'financial-health',
  'CL-0067': 'net-worth',
  'CL-0068': 'goals-planner',
  'CL-0069': 'budget-planner',
  'CL-0070': 'inflation-calc',
  'CL-0071': 'interest-calculator',
  'CL-0072': 'income-tracker',
  'CL-0073': 'cash-flow-planner',
  'CL-0074': 'debt-snowball-calc',
  'CL-0075': 'savings-goal',
  'CL-0076': 'debt-snowball-calc',
  'CL-0077': 'insurance-comparison',
  'CL-0078': 'expense-tracker',
  'CL-0079': 'expense-tracker',
  'CL-0080': 'budget-planner',
  'CL-0081': 'savings-goal',
  'CL-0082': 'insurance-comparison',
  'CL-0083': 'net-worth',
  'CL-0084': 'credit-tracker',
  'CL-0085': 'expense-tracker',
  'CL-0086': 'budget-planner',
  'CL-0087': 'financial-health',
  'CL-0088': 'cash-flow-planner',
  'CL-0089': 'no-spend-challenge',
  'CL-0090': 'inventory-tool',
  'CL-0091': 'savings-goal',
  'CL-0092': 'envelope-budget',
  'CL-0093': 'net-worth',
  'CL-0094': 'loan-repayment',
  'CL-0095': 'loan-repayment',
  'CL-0096': 'debt-snowball-calc',
  'CL-0097': 'budget-planner',
  'CL-0098': 'budget-planner',
  'CL-0099': 'savings-goal',
  'CL-0100': 'no-spend-challenge',
  'CL-0101': 'debt-snowball-calc',
  'CL-0102': 'income-tracker',
  'CL-0103': 'kpi-dashboard',
  'CL-0104': 'debt-snowball-calc',
  'CL-0105': 'checklist',
  'CL-0106': 'envelope-budget',
  'CL-0107': 'insurance-comparison',
  'CL-0108': 'expense-tracker',
  'CL-0109': 'expense-tracker',
  'CL-0110': 'budget-planner',
  'CL-0111': 'expense-tracker',
  'CL-0112': 'kpi-dashboard',
  'CL-0113': 'kpi-dashboard',
  'CL-0114': 'cash-flow-planner',
  'CL-0115': 'financial-health',
  'CL-0116': 'expense-tracker',
  'CL-0117': 'envelope-budget',
  'CL-0118': 'debt-snowball-calc',
  'CL-0119': 'expense-tracker',
  'CL-0120': 'budget-planner',
  'CL-0121': 'cash-flow-planner',
  'CL-0122': 'expense-tracker',
  'CL-0123': 'envelope-budget',
  'CL-0124': 'debt-snowball-calc',
  'CL-0125': 'checklist',
  'CL-0126': 'expense-tracker',
  'CL-0127': 'cash-flow-planner',
  'CL-0128': 'zero-based-budget',
  'CL-0129': 'envelope-budget',
  'CL-0130': 'inflation-calc',
  'CL-0131': 'expense-tracker',
  'CL-0132': 'income-tracker',
  'CL-0133': 'inventory-tool',
  'CL-0134': 'expense-tracker',
  'CL-0135': 'kpi-dashboard',
  'CL-0136': 'budget-planner',
  'CL-0137': 'budget-planner',
  'CL-0138': 'savings-goal',
  'CL-0139': 'cash-flow-planner',
  'CL-0140': 'expense-tracker',
  'CL-0141': 'cash-flow-planner',
  'CL-0142': 'budget-planner',
  'CL-0143': 'budget-planner',
  'CL-0144': 'budget-planner',
  'CL-0145': 'income-tracker',
  'CL-0146': 'cash-flow-planner',
  'CL-0147': 'expense-tracker',
  'CL-0148': 'loan-repayment',
  'CL-0149': 'savings-challenge',
  'CL-0150': 'expense-tracker',
  'CL-0151': 'expense-tracker',
  'CL-0152': 'income-tracker',
  'CL-0153': 'income-tracker',
  'CL-0154': 'credit-tracker',
  'CL-0155': 'savings-goal',
  'CL-0156': 'kpi-dashboard',
  'CL-0157': 'insurance-comparison',
  'CL-0158': 'budget-planner',
  'CL-0159': 'kpi-dashboard',
  'CL-0160': 'expense-tracker',
  'CL-0161': 'expense-tracker',
  'CL-0162': 'budget-planner',
  'CL-0163': 'expense-tracker',
  'CL-0164': 'savings-goal',
  'CL-0165': 'goals-planner',
  'CL-0166': 'savings-goal',
  'CL-0167': 'budget-planner',
  'CL-0168': 'net-worth',
  'CL-0169': 'expense-tracker',
  'CL-0170': 'budget-planner',
  'CL-0171': 'kpi-dashboard',
  'CL-0172': 'expense-tracker',
  'CL-0173': 'envelope-budget',
  'CL-0174': 'no-spend-challenge',
  'CL-0175': 'debt-snowball-calc',
  'CL-0176': 'kpi-dashboard',
  'CL-0177': 'expense-tracker',
  'CL-0178': 'expense-tracker',
  'CL-0179': 'cash-flow-planner',
  'CL-0180': 'expense-tracker',
  'CL-0181': 'expense-tracker',
  'CL-0182': 'income-tracker',
  'CL-0183': 'income-tracker',
  'CL-0184': 'income-tracker',
  'CL-0185': 'goals-planner',
  'CL-0186': 'debt-snowball-calc',
  'CL-0187': 'kpi-dashboard',
  'CL-0188': 'budget-planner',
  'CL-0189': 'expense-tracker',
  'CL-0190': 'goals-planner',
  'CL-0191': 'expense-tracker',
  'CL-0192': 'debt-snowball-calc',
  'CL-0193': 'insurance-comparison',
  'CL-0194': 'interest-calculator',
  'CL-0195': 'savings-goal',
  'CL-0196': 'savings-goal',
  'CL-0197': 'budget-planner',
  'CL-0198': 'inventory-tool',
  'CL-0199': 'credit-tracker',
  'CL-0200': 'checklist',
  'CL-0201': 'debt-snowball-calc',
  'CL-0202': 'budget-planner',
  'CL-0203': 'budget-planner',
  'CL-0204': 'interest-calculator',
  'CL-0205': 'expense-tracker',
  'CL-0206': 'debt-snowball-calc',
  'CL-0207': 'savings-goal',
  'CL-0208': 'expense-tracker',
  'CL-0209': 'income-tracker',
  'CL-0210': 'kpi-dashboard',
  'CL-0211': 'savings-goal',
  'CL-0212': 'cash-flow-planner',
  'CL-0213': 'expense-tracker',
  'CL-0214': 'expense-tracker',
  'CL-0215': 'kpi-dashboard',
  'CL-0216': 'zero-based-budget',
  'CL-0217': 'kpi-dashboard',
  'CL-0218': 'expense-tracker',
  'CL-0219': 'credit-tracker',
  'CL-0220': 'financial-health',
  'CL-0221': 'budget-planner',
  'CL-0222': 'income-tracker',
  'CL-0223': 'budget-review',
  'CL-0224': 'cash-flow-planner',
  'CL-0225': 'kpi-dashboard',
  'CL-0226': 'credit-tracker',
  'CL-0227': 'budget-planner',
  'CL-0228': 'expense-tracker',
  'CL-0229': 'net-worth',
  'CL-0230': 'budget-planner',
  'CL-0231': 'cash-flow-planner',
  'CL-0232': 'net-worth',
  'CL-0233': 'kpi-dashboard',
  'CL-0234': 'kpi-dashboard',
  'CL-0235': 'debt-snowball-calc',
  'CL-0236': 'cash-flow-planner',
  'CL-0237': 'budget-planner',
  'CL-0238': 'budget-planner',
  'CL-0239': 'checklist',
  'CL-0240': 'budget-planner',
  'CL-0241': 'income-tracker',
  'CL-0242': 'checklist',
  'CL-0243': 'financial-health',
  'CL-0244': 'loan-repayment',
  'CL-0245': 'goals-planner',
  'CL-0246': 'budget-planner',
  'CL-0247': 'expense-tracker',
  'CL-0248': 'expense-tracker',
  'CL-0249': 'interest-calculator',
  'CL-0250': 'budget-planner',
  'CL-0251': 'debt-snowball-calc',
  'CL-0252': 'insurance-comparison',
  'CL-0253': 'expense-tracker',
  'CL-0254': 'loan-repayment',
  'CL-0255': 'budget-planner',
  'CL-0256': 'net-worth',
  'CL-0257': 'cash-flow-planner',
  'CL-0258': 'cash-flow-planner',
  'CL-0259': 'expense-tracker',
  'CL-0260': 'inflation-calc',
  'CL-0261': 'income-tracker',
  'CL-0262': 'budget-planner',
  'CL-0263': 'budget-planner',
  'CL-0264': 'envelope-budget',
  'CL-0265': 'income-tracker',
  'CL-0266': 'budget-planner',
  'CL-0267': 'income-tracker',
  'CL-0268': 'budget-planner',
  'CL-0269': 'income-tracker',
  'CL-0270': 'income-tracker',
  'CL-0271': 'interest-calculator',
  'CL-0272': 'inflation-calc',
  'CL-0273': 'loan-repayment',
  'CL-0274': 'savings-goal',
  'CL-0275': 'savings-goal',
  'CL-0276': 'goals-planner',
  'CL-0277': 'income-tracker',
  'CL-0278': 'kpi-dashboard',
  'CL-0279': 'savings-goal',
  'CL-0280': 'budget-planner',
  'CL-0281': 'financial-health',
  'CL-0282': 'income-tracker',
  'CL-0283': 'budget-planner',
  'CL-0284': 'interest-calculator',
  'CL-0285': 'debt-snowball-calc',
  'CL-0286': 'income-tracker',
  'CL-0287': 'loan-repayment',
  'CL-0288': 'interest-calculator',
  'CL-0289': 'cash-flow-planner',
  'CL-0290': 'net-worth',
  'CL-0291': 'checklist',
  'CL-0292': 'no-spend-challenge',
  'CL-0293': 'cash-flow-planner',
  'CL-0294': 'checklist',
  'CL-0295': 'income-tracker',
  'CL-0296': 'cash-flow-planner',
  'CL-0297': 'expense-tracker',
  'CL-0298': 'kpi-dashboard',
  'CL-0299': 'kpi-dashboard',
  'CL-0300': 'expense-tracker',
  'CL-0301': 'savings-goal',
  'CL-0302': 'savings-goal',
  'CL-0303': 'income-tracker',
  'CL-0304': 'cash-flow-planner',
  'CL-0305': 'savings-goal',
  'CL-0306': 'debt-snowball-calc',
  'CL-0307': 'expense-tracker',
  'CL-0308': 'budget-planner',
  'CL-0309': 'budget-planner',
  'CL-0310': 'budget-variance',
  'CL-0311': 'savings-goal',
  'CL-0312': 'expense-tracker',
  'CL-0313': 'checklist',
  'CL-0314': 'inflation-calc',
  'CL-0315': 'credit-tracker',
  'CL-0316': 'checklist',
  'CL-0317': 'checklist',
  'CL-0318': 'loan-repayment',
  'CL-0319': 'budget-planner',
  'CL-0320': 'expense-tracker',
  'CL-0321': 'income-tracker',
  'CL-0322': 'income-tracker',
  'CL-0323': 'interest-calculator',
  'CL-0324': 'cash-flow-planner',
  'CL-0325': 'savings-goal',
  'CL-0326': 'savings-goal',
  'CL-0327': 'budget-variance',
  'CL-0328': 'savings-goal',
  'CL-0329': 'debt-snowball-calc',
  'CL-0330': 'credit-tracker',
  'CL-0331': 'budget-planner',
  'CL-0332': 'debt-snowball-calc',
  'CL-0333': 'net-worth',
  'CL-0334': 'insurance-comparison',
  'CL-0335': 'envelope-budget',
  'CL-0336': 'expense-tracker',
  'CL-0337': 'kpi-dashboard',
  'CL-0338': 'checklist',
  'CL-0339': 'kpi-dashboard',
  'CL-0340': 'budget-planner',
  'CL-0341': 'expense-tracker',
  'CL-0342': 'savings-goal',
  'CL-0343': 'kpi-dashboard',
  'CL-0344': 'expense-tracker',
  'CL-0345': 'insurance-comparison',
  'CL-0346': 'budget-variance',
  'CL-0347': 'income-tracker',
  'CL-0348': 'kpi-dashboard',
  'CL-0349': 'income-tracker',
  'CL-0350': 'savings-goal',
  'CL-0351': 'savings-goal',
  'CL-0352': 'interest-calculator',
  'CL-0353': 'kpi-dashboard',
  'CL-0354': 'expense-tracker',
  'CL-0355': 'kpi-dashboard',
  'CL-0356': 'kpi-dashboard',
  'CL-0357': 'savings-goal',
  'CL-0358': 'checklist',
  'CL-0359': 'debt-snowball-calc',
  'CL-0360': 'insurance-comparison',
  'CL-0361': 'financial-health',
  'CL-0362': 'inventory-tool',
  'CL-0363': 'expense-tracker',
  'CL-0364': 'debt-snowball-calc',
  'CL-0365': 'budget-planner',
  'CL-0366': 'expense-tracker',
  'CL-0367': 'budget-variance',
  'CL-0368': 'inflation-calc',
  'CL-0369': 'net-worth',
  'CL-0370': 'savings-goal',
  'CL-0371': 'cash-flow-planner',
  'CL-0372': 'cash-flow-planner',
  'CL-0373': 'savings-goal',
  'CL-0374': 'expense-tracker',
  'CL-0375': 'budget-review',
  'CL-0376': 'savings-goal',
  'CL-0377': 'kpi-dashboard',
  'CL-0378': 'checklist',
  'CL-0379': 'kpi-dashboard',
  'CL-0380': 'expense-tracker',
  'CL-0381': 'debt-snowball-calc',
  'CL-0382': 'cash-flow-planner',
  'CL-0383': 'expense-tracker',
  'CL-0384': 'checklist',
  'CL-0385': 'cash-flow-planner',
  'CL-0386': 'expense-tracker',
  'CL-0387': 'expense-tracker',
  'CL-0388': 'expense-tracker',
  'CL-0389': 'expense-tracker',
  'CL-0390': 'savings-goal',
  'CL-0391': 'debt-snowball-calc',
  'CL-0392': 'expense-tracker',
  'CL-0393': 'expense-tracker',
  'CL-0394': 'expense-tracker',
  'CL-0395': 'savings-goal',
  'CL-0396': 'budget-planner',
  'CL-0397': 'budget-planner',
  'CL-0398': 'expense-tracker',
  'CL-0399': 'expense-tracker',
  'CL-0400': 'expense-tracker',
  'CL-0401': 'debt-snowball-calc',
  'CL-0402': 'budget-review',
  'CL-0403': 'budget-planner',
  'CL-0404': 'budget-planner',
  'CL-0405': 'expense-tracker',
  'CL-0406': 'debt-snowball-calc',
  'CL-0407': 'goals-planner',
  'CL-0408': 'savings-challenge',
  'CL-0409': 'net-worth',
  'CL-0410': 'savings-goal',
  'CL-0411': 'savings-goal',
  'CL-0412': 'expense-tracker',
  'CL-0413': 'net-worth',
  'CL-0414': 'kpi-dashboard',
  'CL-0415': 'savings-goal',
  'CL-0416': 'financial-health',
  'CL-0417': 'expense-tracker',
  'CL-0418': 'no-spend-challenge',
  'CL-0419': 'expense-tracker',
  'CL-0420': 'goals-planner',
  'CL-0421': 'stock-portfolio',
  'CL-0422': 'stock-portfolio',
  'CL-0423': 'stock-portfolio',
  'CL-0424': 'tracker-table',
  'CL-0425': 'stock-portfolio',
  'CL-0426': 'investment-analytics',
  'CL-0427': 'tracker-table',
  'CL-0428': 'investment-analytics',
  'CL-0429': 'trading-journal',
  'CL-0430': 'trading-journal',
  'CL-0431': 'trading-journal',
  'CL-0432': 'trading-journal',
  'CL-0433': 'tracker-table',
  'CL-0434': 'tracker-table',
  'CL-0435': 'calculator',
  'CL-0436': 'tracker-table',
  'CL-0437': 'calculator',
  'CL-0438': 'stock-portfolio',
  'CL-0439': 'investment-analytics',
  'CL-0440': 'tracker-table',
  'CL-0441': 'tracker-table',
  'CL-0442': 'crypto-tracker',
  'CL-0443': 'crypto-tracker',
  'CL-0444': 'calculator',
  'CL-0445': 'dividend-tracker',
  'CL-0446': 'dividend-tracker',
  'CL-0447': 'tracker-table',
  'CL-0448': 'investment-analytics',
  'CL-0449': 'tracker-table',
  'CL-0450': 'tracker-table',
  'CL-0451': 'savings-goal',
  'CL-0452': 'retirement-planner',
  'CL-0453': 'retirement-planner',
  'CL-0454': 'retirement-planner',
  'CL-0455': 'retirement-planner',
  'CL-0456': 'retirement-planner',
  'CL-0457': 'planner',
  'CL-0458': 'investment-analytics',
  'CL-0459': 'investment-analytics',
  'CL-0460': 'tracker-table',
  'CL-0461': 'investment-analytics',
  'CL-0462': 'tracker-table',
  'CL-0463': 'investment-analytics',
  'CL-0464': 'planner',
  'CL-0465': 'investment-analytics',
  'CL-0466': 'calculator',
  'CL-0467': 'tracker-table',
  'CL-0468': 'retirement-planner',
  'CL-0469': 'tracker-table',
  'CL-0470': 'planner',
  'CL-0471': 'tracker-table',
  'CL-0472': 'savings-goal',
  'CL-0473': 'tracker-table',
  'CL-0474': 'tracker-table',
  'CL-0475': 'tracker-table',
  'CL-0476': 'stock-portfolio',
  'CL-0477': 'tracker-table',
  'CL-0478': 'calculator',
  'CL-0479': 'tracker-table',
  'CL-0480': 'tracker-table',
  'CL-0481': 'investment-analytics',
  'CL-0482': 'investment-analytics',
  'CL-0483': 'investment-analytics',
  'CL-0484': 'calculator',
  'CL-0485': 'investment-analytics',
  'CL-0486': 'investment-analytics',
  'CL-0487': 'calculator',
  'CL-0488': 'trading-journal',
  'CL-0489': 'investment-analytics',
  'CL-0490': 'tracker-table',
  'CL-0491': 'tracker-table',
  'CL-0492': 'calculator',
  'CL-0493': 'retirement-planner',
  'CL-0494': 'investment-analytics',
  'CL-0495': 'tracker-table',
  'CL-0496': 'retirement-planner',
  'CL-0497': 'crypto-tracker',
  'CL-0498': 'tracker-table',
  'CL-0499': 'tracker-table',
  'CL-0500': 'retirement-planner',
  'CL-0501': 'tracker-table',
  'CL-0502': 'tracker-table',
  'CL-0503': 'tracker-table',
  'CL-0504': 'retirement-planner',
  'CL-0505': 'tracker-table',
  'CL-0506': 'stock-portfolio',
  'CL-0507': 'trading-journal',
  'CL-0508': 'calculator',
  'CL-0509': 'investment-analytics',
  'CL-0510': 'stock-portfolio',
  'CL-0511': 'tracker-table',
  'CL-0512': 'investment-analytics',
  'CL-0513': 'tracker-table',
  'CL-0514': 'retirement-planner',
  'CL-0515': 'planner',
  'CL-0516': 'investment-analytics',
  'CL-0517': 'dividend-tracker',
  'CL-0518': 'investment-analytics',
  'CL-0519': 'trading-journal',
  'CL-0520': 'retirement-planner',
  'CL-0521': 'tracker-table',
  'CL-0522': 'stock-portfolio',
  'CL-0523': 'investment-analytics',
  'CL-0524': 'tracker-table',
  'CL-0525': 'savings-goal',
  'CL-0526': 'tracker-table',
  'CL-0527': 'tracker-table',
  'CL-0528': 'calculator',
  'CL-0529': 'calculator',
  'CL-0530': 'trading-journal',
  'CL-0531': 'retirement-planner',
  'CL-0532': 'calculator',
  'CL-0533': 'calculator',
  'CL-0534': 'tracker-table',
  'CL-0535': 'stock-portfolio',
  'CL-0536': 'calculator',
  'CL-0537': 'investment-analytics',
  'CL-0538': 'trading-journal',
  'CL-0539': 'tracker-table',
  'CL-0540': 'tracker-table',
  'CL-0541': 'tracker-table',
  'CL-0542': 'dividend-tracker',
  'CL-0543': 'trading-journal',
  'CL-0544': 'tracker-table',
  'CL-0545': 'calculator',
  'CL-0546': 'tracker-table',
  'CL-0547': 'retirement-planner',
  'CL-0548': 'investment-analytics',
  'CL-0549': 'investment-analytics',
  'CL-0550': 'trading-journal',
  'CL-0551': 'stock-portfolio',
  'CL-0552': 'investment-analytics',
  'CL-0553': 'savings-goal',
  'CL-0554': 'investment-analytics',
  'CL-0555': 'tracker-table',
  'CL-0556': 'stock-portfolio',
  'CL-0557': 'tracker-table',
  'CL-0558': 'savings-goal',
  'CL-0559': 'tracker-table',
  'CL-0560': 'investment-analytics',
  'CL-0561': 'investment-analytics',
  'CL-0562': 'trading-journal',
  'CL-0563': 'trading-journal',
  'CL-0564': 'stock-portfolio',
  'CL-0565': 'calculator',
  'CL-0566': 'crypto-tracker',
  'CL-0567': 'stock-portfolio',
  'CL-0568': 'stock-portfolio',
  'CL-0569': 'trading-journal',
  'CL-0570': 'crypto-tracker',
  'CL-0571': 'investment-analytics',
  'CL-0572': 'crypto-tracker',
  'CL-0573': 'trading-journal',
  'CL-0574': 'tracker-table',
  'CL-0575': 'stock-portfolio',
  'CL-0576': 'crypto-tracker',
  'CL-0577': 'tracker-table',
  'CL-0578': 'tracker-table',
  'CL-0579': 'tracker-table',
  'CL-0580': 'tracker-table',
  'CL-0581': 'trading-journal',
  'CL-0582': 'tracker-table',
  'CL-0583': 'calculator',
  'CL-0584': 'planner',
  'CL-0585': 'planner',
  'CL-0586': 'tracker-table',
  'CL-0587': 'tracker-table',
  'CL-0588': 'calculator',
  'CL-0589': 'dividend-tracker',
  'CL-0590': 'crypto-tracker',
  'CL-0591': 'investment-analytics',
  'CL-0592': 'retirement-planner',
  'CL-0593': 'stock-portfolio',
  'CL-0594': 'retirement-planner',
  'CL-0595': 'trading-journal',
  'CL-0596': 'investment-analytics',
  'CL-0597': 'investment-analytics',
  'CL-0598': 'crypto-tracker',
  'CL-0599': 'tracker-table',
  'CL-0600': 'stock-portfolio',
  'CL-0601': 'investment-analytics',
  'CL-0602': 'stock-portfolio',
  'CL-0603': 'investment-analytics',
  'CL-0604': 'tracker-table',
  'CL-0605': 'tracker-table',
  'CL-0606': 'stock-portfolio',
  'CL-0607': 'calculator',
  'CL-0608': 'stock-portfolio',
  'CL-0609': 'investment-analytics',
  'CL-0610': 'planner',
  'CL-0611': 'investment-analytics',
  'CL-0612': 'tracker-table',
  'CL-0613': 'tracker-table',
  'CL-0614': 'tracker-table',
  'CL-0615': 'investment-analytics',
  'CL-0616': 'calculator',
  'CL-0617': 'tracker-table',
  'CL-0618': 'stock-portfolio',
  'CL-0619': 'investment-analytics',
  'CL-0620': 'investment-analytics',
  'CL-0621': 'planner',
  'CL-0622': 'retirement-planner',
  'CL-0623': 'investment-analytics',
  'CL-0624': 'tracker-table',
  'CL-0625': 'stock-portfolio',
  'CL-0626': 'retirement-planner',
  'CL-0627': 'stock-portfolio',
  'CL-0628': 'tracker-table',
  'CL-0629': 'retirement-planner',
  'CL-0630': 'tracker-table',
  'CL-0631': 'retirement-planner',
  'CL-0632': 'tracker-table',
  'CL-0633': 'investment-analytics',
  'CL-0634': 'tracker-table',
  'CL-0635': 'tracker-table',
  'CL-0636': 'investment-analytics',
  'CL-0637': 'dividend-tracker',
  'CL-0638': 'trading-journal',
  'CL-0639': 'stock-portfolio',
  'CL-0640': 'stock-portfolio',
  'CL-0641': 'retirement-planner',
  'CL-0642': 'planner',
  'CL-0643': 'dividend-tracker',
  'CL-0644': 'tracker-table',
  'CL-0645': 'retirement-planner',
  'CL-0646': 'retirement-planner',
  'CL-0647': 'crypto-tracker',
  'CL-0648': 'investment-analytics',
  'CL-0649': 'trading-journal',
  'CL-0650': 'investment-analytics',
  'CL-0651': 'tracker-table',
  'CL-0652': 'crypto-tracker',
  'CL-0653': 'retirement-planner',
  'CL-0654': 'retirement-planner',
  'CL-0655': 'retirement-planner',
  'CL-0656': 'trading-journal',
  'CL-0657': 'retirement-planner',
  'CL-0658': 'calculator',
  'CL-0659': 'tracker-table',
  'CL-0660': 'retirement-planner',
  'CL-0661': 'tracker-table',
  'CL-0662': 'calculator',
  'CL-0663': 'investment-analytics',
  'CL-0664': 'calculator',
  'CL-0665': 'crypto-tracker',
  'CL-0666': 'stock-portfolio',
  'CL-0667': 'tracker-table',
  'CL-0668': 'dividend-tracker',
  'CL-0669': 'stock-portfolio',
  'CL-0670': 'tracker-table',
  'CL-0671': 'crypto-tracker',
  'CL-0672': 'stock-portfolio',
  'CL-0673': 'trading-journal',
  'CL-0674': 'stock-portfolio',
  'CL-0675': 'tracker-table',
  'CL-0676': 'calculator',
  'CL-0677': 'savings-goal',
  'CL-0678': 'calculator',
  'CL-0679': 'investment-analytics',
  'CL-0680': 'investment-analytics',
  'CL-0681': 'biz-finance',
  'CL-0682': 'biz-finance',
  'CL-0683': 'tracker-table',
  'CL-0684': 'biz-finance',
  'CL-0685': 'planner',
  'CL-0686': 'biz-finance',
  'CL-0687': 'biz-finance',
  'CL-0688': 'tracker-table',
  'CL-0689': 'tracker-table',
  'CL-0690': 'startup-tool',
  'CL-0691': 'startup-tool',
  'CL-0692': 'tracker-table',
  'CL-0693': 'crm-tool',
  'CL-0694': 'sales-pipeline',
  'CL-0695': 'sales-pipeline',
  'CL-0696': 'biz-finance',
  'CL-0697': 'tracker-table',
  'CL-0698': 'biz-finance',
  'CL-0699': 'biz-finance',
  'CL-0700': 'biz-finance',
  'CL-0701': 'invoice-tool',
  'CL-0702': 'invoice-tool',
  'CL-0703': 'freelance-tool',
  'CL-0704': 'tracker-table',
  'CL-0705': 'tracker-table',
  'CL-0706': 'invoice-tool',
  'CL-0707': 'tracker-table',
  'CL-0708': 'tracker-table',
  'CL-0709': 'biz-finance',
  'CL-0710': 'tracker-table',
  'CL-0711': 'ecommerce-tool',
  'CL-0712': 'tracker-table',
  'CL-0713': 'biz-finance',
  'CL-0714': 'tracker-table',
  'CL-0715': 'inventory-tool',
  'CL-0716': 'inventory-tool',
  'CL-0717': 'calculator',
  'CL-0718': 'calculator',
  'CL-0719': 'tracker-table',
  'CL-0720': 'operations-tool',
  'CL-0721': 'tracker-table',
  'CL-0722': 'invoice-tool',
  'CL-0723': 'freelance-tool',
  'CL-0724': 'invoice-tool',
  'CL-0725': 'invoice-tool',
  'CL-0726': 'tracker-table',
  'CL-0727': 'biz-finance',
  'CL-0728': 'biz-finance',
  'CL-0729': 'tracker-table',
  'CL-0730': 'net-worth',
  'CL-0731': 'tracker-table',
  'CL-0732': 'tracker-table',
  'CL-0733': 'biz-finance',
  'CL-0734': 'biz-finance',
  'CL-0735': 'operations-tool',
  'CL-0736': 'startup-tool',
  'CL-0737': 'calculator',
  'CL-0738': 'biz-finance',
  'CL-0739': 'kpi-dashboard',
  'CL-0740': 'okr-tool',
  'CL-0741': 'planner',
  'CL-0742': 'biz-finance',
  'CL-0743': 'startup-tool',
  'CL-0744': 'tracker-table',
  'CL-0745': 'tracker-table',
  'CL-0746': 'operations-tool',
  'CL-0747': 'tracker-table',
  'CL-0748': 'tracker-table',
  'CL-0749': 'biz-finance',
  'CL-0750': 'tracker-table',
  'CL-0751': 'sales-pipeline',
  'CL-0752': 'kpi-dashboard',
  'CL-0753': 'sales-pipeline',
  'CL-0754': 'kpi-dashboard',
  'CL-0755': 'invoice-tool',
  'CL-0756': 'planner',
  'CL-0757': 'tracker-table',
  'CL-0758': 'invoice-tool',
  'CL-0759': 'planner',
  'CL-0760': 'tracker-table',
  'CL-0761': 'biz-finance',
  'CL-0762': 'biz-finance',
  'CL-0763': 'tracker-table',
  'CL-0764': 'biz-finance',
  'CL-0765': 'tracker-table',
  'CL-0766': 'invoice-tool',
  'CL-0767': 'invoice-tool',
  'CL-0768': 'tracker-table',
  'CL-0769': 'inventory-tool',
  'CL-0770': 'biz-finance',
  'CL-0771': 'tracker-table',
  'CL-0772': 'tracker-table',
  'CL-0773': 'biz-finance',
  'CL-0774': 'tracker-table',
  'CL-0775': 'tracker-table',
  'CL-0776': 'tracker-table',
  'CL-0777': 'biz-finance',
  'CL-0778': 'tracker-table',
  'CL-0779': 'startup-tool',
  'CL-0780': 'calculator',
  'CL-0781': 'biz-finance',
  'CL-0782': 'invoice-tool',
  'CL-0783': 'crm-tool',
  'CL-0784': 'net-worth',
  'CL-0785': 'operations-tool',
  'CL-0786': 'biz-finance',
  'CL-0787': 'freelance-tool',
  'CL-0788': 'invoice-tool',
  'CL-0789': 'net-worth',
  'CL-0790': 'tracker-table',
  'CL-0791': 'planner',
  'CL-0792': 'okr-tool',
  'CL-0793': 'startup-tool',
  'CL-0794': 'biz-finance',
  'CL-0795': 'calculator',
  'CL-0796': 'tracker-table',
  'CL-0797': 'invoice-tool',
  'CL-0798': 'crm-tool',
  'CL-0799': 'kpi-dashboard',
  'CL-0800': 'tracker-table',
  'CL-0801': 'biz-finance',
  'CL-0802': 'tracker-table',
  'CL-0803': 'net-worth',
  'CL-0804': 'invoice-tool',
  'CL-0805': 'tracker-table',
  'CL-0806': 'biz-finance',
  'CL-0807': 'tracker-table',
  'CL-0808': 'tracker-table',
  'CL-0809': 'invoice-tool',
  'CL-0810': 'tracker-table',
  'CL-0811': 'inventory-tool',
  'CL-0812': 'startup-tool',
  'CL-0813': 'planner',
  'CL-0814': 'tracker-table',
  'CL-0815': 'okr-tool',
  'CL-0816': 'tracker-table',
  'CL-0817': 'tracker-table',
  'CL-0818': 'tracker-table',
  'CL-0819': 'tracker-table',
  'CL-0820': 'operations-tool',
  'CL-0821': 'biz-finance',
  'CL-0822': 'startup-tool',
  'CL-0823': 'tracker-table',
  'CL-0824': 'biz-finance',
  'CL-0825': 'tracker-table',
  'CL-0826': 'biz-finance',
  'CL-0827': 'biz-finance',
  'CL-0828': 'tracker-table',
  'CL-0829': 'operations-tool',
  'CL-0830': 'biz-finance',
  'CL-0831': 'planner',
  'CL-0832': 'planner',
  'CL-0833': 'sales-pipeline',
  'CL-0834': 'tracker-table',
  'CL-0835': 'tracker-table',
  'CL-0836': 'crm-tool',
  'CL-0837': 'calculator',
  'CL-0838': 'tracker-table',
  'CL-0839': 'tracker-table',
  'CL-0840': 'sales-pipeline',
  'CL-0841': 'crm-tool',
  'CL-0842': 'tracker-table',
  'CL-0843': 'net-worth',
  'CL-0844': 'biz-finance',
  'CL-0845': 'crm-tool',
  'CL-0846': 'biz-finance',
  'CL-0847': 'tracker-table',
  'CL-0848': 'biz-finance',
  'CL-0849': 'tracker-table',
  'CL-0850': 'calculator',
  'CL-0851': 'ecommerce-tool',
  'CL-0852': 'inventory-tool',
  'CL-0853': 'invoice-tool',
  'CL-0854': 'tracker-table',
  'CL-0855': 'biz-finance',
  'CL-0856': 'operations-tool',
  'CL-0857': 'tracker-table',
  'CL-0858': 'inventory-tool',
  'CL-0859': 'tracker-table',
  'CL-0860': 'inventory-tool',
  'CL-0861': 'tracker-table',
  'CL-0862': 'invoice-tool',
  'CL-0863': 'inventory-tool',
  'CL-0864': 'biz-finance',
  'CL-0865': 'inventory-tool',
  'CL-0866': 'tracker-table',
  'CL-0867': 'biz-finance',
  'CL-0868': 'startup-tool',
  'CL-0869': 'tracker-table',
  'CL-0870': 'tracker-table',
  'CL-0871': 'biz-finance',
  'CL-0872': 'biz-finance',
  'CL-0873': 'crm-tool',
  'CL-0874': 'biz-finance',
  'CL-0875': 'planner',
  'CL-0876': 'ecommerce-tool',
  'CL-0877': 'invoice-tool',
  'CL-0878': 'biz-finance',
  'CL-0879': 'biz-finance',
  'CL-0880': 'tracker-table',
  'CL-0881': 'tracker-table',
  'CL-0882': 'tracker-table',
  'CL-0883': 'okr-tool',
  'CL-0884': 'planner',
  'CL-0885': 'tracker-table',
  'CL-0886': 'invoice-tool',
  'CL-0887': 'biz-finance',
  'CL-0888': 'freelance-tool',
  'CL-0889': 'calculator',
  'CL-0890': 'inventory-tool',
  'CL-0891': 'sales-pipeline',
  'CL-0892': 'startup-tool',
  'CL-0893': 'invoice-tool',
  'CL-0894': 'net-worth',
  'CL-0895': 'biz-finance',
  'CL-0896': 'tracker-table',
  'CL-0897': 'biz-finance',
  'CL-0898': 'biz-finance',
  'CL-0899': 'inventory-tool',
  'CL-0900': 'biz-finance',
  'CL-0901': 'sales-pipeline',
  'CL-0902': 'startup-tool',
  'CL-0903': 'tracker-table',
  'CL-0904': 'tracker-table',
  'CL-0905': 'freelance-tool',
  'CL-0906': 'tracker-table',
  'CL-0907': 'okr-tool',
  'CL-0908': 'tracker-table',
  'CL-0909': 'startup-tool',
  'CL-0910': 'biz-finance',
  'CL-0911': 'inventory-tool',
  'CL-0912': 'tracker-table',
  'CL-0913': 'planner',
  'CL-0914': 'biz-finance',
  'CL-0915': 'okr-tool',
  'CL-0916': 'startup-tool',
  'CL-0917': 'tracker-table',
  'CL-0918': 'tracker-table',
  'CL-0919': 'invoice-tool',
  'CL-0920': 'tracker-table',
  'CL-0921': 'tracker-table',
  'CL-0922': 'biz-finance',
  'CL-0923': 'operations-tool',
  'CL-0924': 'biz-finance',
  'CL-0925': 'calculator',
  'CL-0926': 'invoice-tool',
  'CL-0927': 'biz-finance',
  'CL-0928': 'tracker-table',
  'CL-0929': 'planner',
  'CL-0930': 'tracker-table',
  'CL-0931': 'invoice-tool',
  'CL-0932': 'inventory-tool',
  'CL-0933': 'tracker-table',
  'CL-0934': 'invoice-tool',
  'CL-0935': 'tracker-table',
  'CL-0936': 'biz-finance',
  'CL-0937': 'freelance-tool',
  'CL-0938': 'tracker-table',
  'CL-0939': 'planner',
  'CL-0940': 'startup-tool',
  'CL-0941': 'invoice-tool',
  'CL-0942': 'operations-tool',
  'CL-0943': 'tracker-table',
  'CL-0944': 'tracker-table',
  'CL-0945': 'operations-tool',
  'CL-0946': 'okr-tool',
  'CL-0947': 'biz-finance',
  'CL-0948': 'tracker-table',
  'CL-0949': 'okr-tool',
  'CL-0950': 'tracker-table',
  'CL-0951': 'sales-pipeline',
  'CL-0952': 'ecommerce-tool',
  'CL-0953': 'biz-finance',
  'CL-0954': 'crm-tool',
  'CL-0955': 'biz-finance',
  'CL-0956': 'operations-tool',
  'CL-0957': 'biz-finance',
  'CL-0958': 'biz-finance',
  'CL-0959': 'tracker-table',
  'CL-0960': 'net-worth',
  'CL-0961': 'calculator',
  'CL-0962': 'startup-tool',
  'CL-0963': 'tracker-table',
  'CL-0964': 'invoice-tool',
  'CL-0965': 'biz-finance',
  'CL-0966': 'tracker-table',
  'CL-0967': 'invoice-tool',
  'CL-0968': 'calculator',
  'CL-0969': 'biz-finance',
  'CL-0970': 'startup-tool',
  'CL-0971': 'tracker-table',
  'CL-0972': 'invoice-tool',
  'CL-0973': 'invoice-tool',
  'CL-0974': 'biz-finance',
  'CL-0975': 'tracker-table',
  'CL-0976': 'operations-tool',
  'CL-0977': 'biz-finance',
  'CL-0978': 'freelance-tool',
  'CL-0979': 'biz-finance',
  'CL-0980': 'biz-finance',
  'CL-0981': 'biz-finance',
  'CL-0982': 'tracker-table',
  'CL-0983': 'tracker-table',
  'CL-0984': 'invoice-tool',
  'CL-0985': 'tracker-table',
  'CL-0986': 'startup-tool',
  'CL-0987': 'sales-pipeline',
  'CL-0988': 'tracker-table',
  'CL-0989': 'biz-finance',
  'CL-0990': 'biz-finance',
  'CL-0991': 'biz-finance',
  'CL-0992': 'tracker-table',
  'CL-0993': 'tracker-table',
  'CL-0994': 'tracker-table',
  'CL-0995': 'sales-pipeline',
  'CL-0996': 'tracker-table',
  'CL-0997': 'invoice-tool',
  'CL-0998': 'sales-pipeline',
  'CL-0999': 'biz-finance',
  'CL-1000': 'sales-pipeline',
  'CL-1001': 'net-worth',
  'CL-1002': 'operations-tool',
  'CL-1003': 'biz-finance',
  'CL-1004': 'tracker-table',
  'CL-1005': 'biz-finance',
  'CL-1006': 'inventory-tool',
  'CL-1007': 'tracker-table',
  'CL-1008': 'invoice-tool',
  'CL-1009': 'startup-tool',
  'CL-1010': 'biz-finance',
  'CL-1011': 'biz-finance',
  'CL-1012': 'biz-finance',
  'CL-1013': 'tracker-table',
  'CL-1014': 'biz-finance',
  'CL-1015': 'biz-finance',
  'CL-1016': 'invoice-tool',
  'CL-1017': 'tracker-table',
  'CL-1018': 'tracker-table',
  'CL-1019': 'freelance-tool',
  'CL-1020': 'biz-finance',
  'CL-1021': 'invoice-tool',
  'CL-1022': 'freelance-tool',
  'CL-1023': 'invoice-tool',
  'CL-1024': 'sales-pipeline',
  'CL-1025': 'tracker-table',
  'CL-1026': 'biz-finance',
  'CL-1027': 'okr-tool',
  'CL-1028': 'biz-finance',
  'CL-1029': 'invoice-tool',
  'CL-1030': 'startup-tool',
  'CL-1031': 'biz-finance',
  'CL-1032': 'invoice-tool',
  'CL-1033': 'tracker-table',
  'CL-1034': 'sales-pipeline',
  'CL-1035': 'biz-finance',
  'CL-1036': 'ecommerce-tool',
  'CL-1037': 'tracker-table',
  'CL-1038': 'tracker-table',
  'CL-1039': 'invoice-tool',
  'CL-1040': 'tracker-table',
  'CL-1041': 'biz-finance',
  'CL-1042': 'biz-finance',
  'CL-1043': 'tracker-table',
  'CL-1044': 'tracker-table',
  'CL-1045': 'tracker-table',
  'CL-1046': 'tracker-table',
  'CL-1047': 'inventory-tool',
  'CL-1048': 'tracker-table',
  'CL-1049': 'okr-tool',
  'CL-1050': 'tracker-table',
  'CL-1051': 'tracker-table',
  'CL-1052': 'biz-finance',
  'CL-1053': 'kpi-dashboard',
  'CL-1054': 'calculator',
  'CL-1055': 'tracker-table',
  'CL-1056': 'startup-tool',
  'CL-1057': 'inventory-tool',
  'CL-1058': 'biz-finance',
  'CL-1059': 'crm-tool',
  'CL-1060': 'invoice-tool',
  'CL-1061': 'inventory-tool',
  'CL-1062': 'tracker-table',
  'CL-1063': 'operations-tool',
  'CL-1064': 'sales-pipeline',
  'CL-1065': 'invoice-tool',
  'CL-1066': 'invoice-tool',
  'CL-1067': 'tracker-table',
  'CL-1068': 'operations-tool',
  'CL-1069': 'planner',
  'CL-1070': 'ecommerce-tool',
  'CL-1071': 'tracker-table',
  'CL-1072': 'biz-finance',
  'CL-1073': 'okr-tool',
  'CL-1074': 'tracker-table',
  'CL-1075': 'okr-tool',
  'CL-1076': 'invoice-tool',
  'CL-1077': 'biz-finance',
  'CL-1078': 'tracker-table',
  'CL-1079': 'okr-tool',
  'CL-1080': 'invoice-tool',
  'CL-1081': 'okr-tool',
  'CL-1082': 'tracker-table',
  'CL-1083': 'calculator',
  'CL-1084': 'tracker-table',
  'CL-1085': 'biz-finance',
  'CL-1086': 'tracker-table',
  'CL-1087': 'biz-finance',
  'CL-1088': 'operations-tool',
  'CL-1089': 'freelance-tool',
  'CL-1090': 'biz-finance',
  'CL-1091': 'invoice-tool',
  'CL-1092': 'invoice-tool',
  'CL-1093': 'biz-finance',
  'CL-1094': 'tracker-table',
  'CL-1095': 'calculator',
  'CL-1096': 'tracker-table',
  'CL-1097': 'invoice-tool',
  'CL-1098': 'biz-finance',
  'CL-1099': 'biz-finance',
  'CL-1100': 'tracker-table',
  'CL-1101': 'tracker-table',
  'CL-1102': 'invoice-tool',
  'CL-1103': 'calculator',
  'CL-1104': 'tracker-table',
  'CL-1105': 'sales-pipeline',
  'CL-1106': 'tracker-table',
  'CL-1107': 'net-worth',
  'CL-1108': 'tracker-table',
  'CL-1109': 'tracker-table',
  'CL-1110': 'invoice-tool',
  'CL-1111': 'biz-finance',
  'CL-1112': 'startup-tool',
  'CL-1113': 'biz-finance',
  'CL-1114': 'freelance-tool',
  'CL-1115': 'kpi-dashboard',
  'CL-1116': 'calculator',
  'CL-1117': 'inventory-tool',
  'CL-1118': 'biz-finance',
  'CL-1119': 'tracker-table',
  'CL-1120': 'ecommerce-tool',
  'CL-1121': 'kpi-dashboard',
  'CL-1122': 'inventory-tool',
  'CL-1123': 'tracker-table',
  'CL-1124': 'tracker-table',
  'CL-1125': 'tracker-table',
  'CL-1126': 'biz-finance',
  'CL-1127': 'tracker-table',
  'CL-1128': 'tracker-table',
  'CL-1129': 'crm-tool',
  'CL-1130': 'biz-finance',
  'CL-1131': 'ecommerce-tool',
  'CL-1132': 'biz-finance',
  'CL-1133': 'tracker-table',
  'CL-1134': 'invoice-tool',
  'CL-1135': 'tracker-table',
  'CL-1136': 'tracker-table',
  'CL-1137': 'invoice-tool',
  'CL-1138': 'biz-finance',
  'CL-1139': 'planner',
  'CL-1140': 'tracker-table',
  'CL-1141': 'invoice-tool',
  'CL-1142': 'tracker-table',
  'CL-1143': 'biz-finance',
  'CL-1144': 'invoice-tool',
  'CL-1145': 'net-worth',
  'CL-1146': 'tracker-table',
  'CL-1147': 'tracker-table',
  'CL-1148': 'startup-tool',
  'CL-1149': 'invoice-tool',
  'CL-1150': 'tracker-table',
  'CL-1151': 'net-worth',
  'CL-1152': 'tracker-table',
  'CL-1153': 'biz-finance',
  'CL-1154': 'okr-tool',
  'CL-1155': 'tracker-table',
  'CL-1156': 'tracker-table',
  'CL-1157': 'biz-finance',
  'CL-1158': 'biz-finance',
  'CL-1159': 'tracker-table',
  'CL-1160': 'tracker-table',
  'CL-1161': 'biz-finance',
  'CL-1162': 'tracker-table',
  'CL-1163': 'tracker-table',
  'CL-1164': 'biz-finance',
  'CL-1165': 'biz-finance',
  'CL-1166': 'biz-finance',
  'CL-1167': 'planner',
  'CL-1168': 'biz-finance',
  'CL-1169': 'startup-tool',
  'CL-1170': 'tracker-table',
  'CL-1171': 'biz-finance',
  'CL-1172': 'freelance-tool',
  'CL-1173': 'tracker-table',
  'CL-1174': 'calculator',
  'CL-1175': 'biz-finance',
  'CL-1176': 'invoice-tool',
  'CL-1177': 'ecommerce-tool',
  'CL-1178': 'biz-finance',
  'CL-1179': 'tracker-table',
  'CL-1180': 'startup-tool',
  'CL-1181': 'calculator',
  'CL-1182': 'tracker-table',
  'CL-1183': 'biz-finance',
  'CL-1184': 'biz-finance',
  'CL-1185': 'sales-pipeline',
  'CL-1186': 'invoice-tool',
  'CL-1187': 'okr-tool',
  'CL-1188': 'invoice-tool',
  'CL-1189': 'tracker-table',
  'CL-1190': 'tracker-table',
  'CL-1191': 'biz-finance',
  'CL-1192': 'planner',
  'CL-1193': 'invoice-tool',
  'CL-1194': 'biz-finance',
  'CL-1195': 'invoice-tool',
  'CL-1196': 'net-worth',
  'CL-1197': 'tracker-table',
  'CL-1198': 'biz-finance',
  'CL-1199': 'biz-finance',
  'CL-1200': 'inventory-tool',
  'CL-1201': 'home-buying',
  'CL-1202': 'loan-repayment',
  'CL-1203': 'calculator',
  'CL-1204': 'property-manager',
  'CL-1205': 'home-buying',
  'CL-1206': 'savings-goal',
  'CL-1207': 'calculator',
  'CL-1208': 'property-manager',
  'CL-1209': 'tracker-table',
  'CL-1210': 'property-manager',
  'CL-1211': 'property-manager',
  'CL-1212': 'tracker-table',
  'CL-1213': 'tracker-table',
  'CL-1214': 'real-estate-invest',
  'CL-1215': 'property-manager',
  'CL-1216': 'tracker-table',
  'CL-1217': 'tracker-table',
  'CL-1218': 'property-manager',
  'CL-1219': 'home-manager',
  'CL-1220': 'property-manager',
  'CL-1221': 'airbnb-tracker',
  'CL-1222': 'property-manager',
  'CL-1223': 'operations-tool',
  'CL-1224': 'checklist',
  'CL-1225': 'property-manager',
  'CL-1226': 'tracker-table',
  'CL-1227': 'tracker-table',
  'CL-1228': 'insurance-comparison',
  'CL-1229': 'real-estate-invest',
  'CL-1230': 'home-buying',
  'CL-1231': 'planner',
  'CL-1232': 'real-estate-invest',
  'CL-1233': 'tracker-table',
  'CL-1234': 'property-manager',
  'CL-1235': 'crm-tool',
  'CL-1236': 'tracker-table',
  'CL-1237': 'tracker-table',
  'CL-1238': 'tracker-table',
  'CL-1239': 'renovation-tracker',
  'CL-1240': 'tracker-table',
  'CL-1241': 'property-manager',
  'CL-1242': 'calculator',
  'CL-1243': 'tracker-table',
  'CL-1244': 'real-estate-invest',
  'CL-1245': 'tracker-table',
  'CL-1246': 'real-estate-invest',
  'CL-1247': 'home-buying',
  'CL-1248': 'property-manager',
  'CL-1249': 'crm-tool',
  'CL-1250': 'property-manager',
  'CL-1251': 'loan-repayment',
  'CL-1252': 'calculator',
  'CL-1253': 'calculator',
  'CL-1254': 'real-estate-invest',
  'CL-1255': 'operations-tool',
  'CL-1256': 'property-manager',
  'CL-1257': 'home-buying',
  'CL-1258': 'property-manager',
  'CL-1259': 'property-manager',
  'CL-1260': 'tracker-table',
  'CL-1261': 'home-buying',
  'CL-1262': 'tracker-table',
  'CL-1263': 'calculator',
  'CL-1264': 'home-manager',
  'CL-1265': 'tracker-table',
  'CL-1266': 'tracker-table',
  'CL-1267': 'home-buying',
  'CL-1268': 'calculator',
  'CL-1269': 'tracker-table',
  'CL-1270': 'insurance-comparison',
  'CL-1271': 'tracker-table',
  'CL-1272': 'real-estate-invest',
  'CL-1273': 'property-manager',
  'CL-1274': 'crm-tool',
  'CL-1275': 'property-manager',
  'CL-1276': 'planner',
  'CL-1277': 'tracker-table',
  'CL-1278': 'home-manager',
  'CL-1279': 'tracker-table',
  'CL-1280': 'operations-tool',
  'CL-1281': 'tracker-table',
  'CL-1282': 'tracker-table',
  'CL-1283': 'calculator',
  'CL-1284': 'tracker-table',
  'CL-1285': 'insurance-comparison',
  'CL-1286': 'real-estate-invest',
  'CL-1287': 'calculator',
  'CL-1288': 'operations-tool',
  'CL-1289': 'operations-tool',
  'CL-1290': 'property-manager',
  'CL-1291': 'calculator',
  'CL-1292': 'tracker-table',
  'CL-1293': 'home-manager',
  'CL-1294': 'tracker-table',
  'CL-1295': 'checklist',
  'CL-1296': 'operations-tool',
  'CL-1297': 'real-estate-invest',
  'CL-1298': 'tracker-table',
  'CL-1299': 'home-buying',
  'CL-1300': 'calculator',
  'CL-1301': 'tracker-table',
  'CL-1302': 'crm-tool',
  'CL-1303': 'renovation-tracker',
  'CL-1304': 'tracker-table',
  'CL-1305': 'property-manager',
  'CL-1306': 'real-estate-invest',
  'CL-1307': 'tracker-table',
  'CL-1308': 'operations-tool',
  'CL-1309': 'airbnb-tracker',
  'CL-1310': 'property-manager',
  'CL-1311': 'property-manager',
  'CL-1312': 'home-buying',
  'CL-1313': 'home-buying',
  'CL-1314': 'property-manager',
  'CL-1315': 'renovation-tracker',
  'CL-1316': 'property-manager',
  'CL-1317': 'savings-goal',
  'CL-1318': 'tracker-table',
  'CL-1319': 'savings-goal',
  'CL-1320': 'real-estate-invest',
  'CL-1321': 'tracker-table',
  'CL-1322': 'tracker-table',
  'CL-1323': 'home-buying',
  'CL-1324': 'tracker-table',
  'CL-1325': 'airbnb-tracker',
  'CL-1326': 'property-manager',
  'CL-1327': 'home-buying',
  'CL-1328': 'tracker-table',
  'CL-1329': 'property-manager',
  'CL-1330': 'tracker-table',
  'CL-1331': 'tracker-table',
  'CL-1332': 'tracker-table',
  'CL-1333': 'property-manager',
  'CL-1334': 'calculator',
  'CL-1335': 'checklist',
  'CL-1336': 'renovation-tracker',
  'CL-1337': 'real-estate-invest',
  'CL-1338': 'tracker-table',
  'CL-1339': 'tracker-table',
  'CL-1340': 'tracker-table',
  'CL-1341': 'crm-tool',
  'CL-1342': 'real-estate-invest',
  'CL-1343': 'property-manager',
  'CL-1344': 'operations-tool',
  'CL-1345': 'tracker-table',
  'CL-1346': 'property-manager',
  'CL-1347': 'home-manager',
  'CL-1348': 'calculator',
  'CL-1349': 'property-manager',
  'CL-1350': 'airbnb-tracker',
  'CL-1351': 'home-manager',
  'CL-1352': 'home-buying',
  'CL-1353': 'tracker-table',
  'CL-1354': 'tracker-table',
  'CL-1355': 'tracker-table',
  'CL-1356': 'property-manager',
  'CL-1357': 'renovation-tracker',
  'CL-1358': 'property-manager',
  'CL-1359': 'property-manager',
  'CL-1360': 'home-buying',
  'CL-1361': 'property-manager',
  'CL-1362': 'real-estate-invest',
  'CL-1363': 'property-manager',
  'CL-1364': 'home-buying',
  'CL-1365': 'home-buying',
  'CL-1366': 'tracker-table',
  'CL-1367': 'property-manager',
  'CL-1368': 'airbnb-tracker',
  'CL-1369': 'property-manager',
  'CL-1370': 'checklist',
  'CL-1371': 'tracker-table',
  'CL-1372': 'insurance-comparison',
  'CL-1373': 'property-manager',
  'CL-1374': 'tracker-table',
  'CL-1375': 'property-manager',
  'CL-1376': 'tracker-table',
  'CL-1377': 'property-manager',
  'CL-1378': 'home-buying',
  'CL-1379': 'crm-tool',
  'CL-1380': 'property-manager',
  'CL-1381': 'tracker-table',
  'CL-1382': 'property-manager',
  'CL-1383': 'tracker-table',
  'CL-1384': 'airbnb-tracker',
  'CL-1385': 'calculator',
  'CL-1386': 'property-manager',
  'CL-1387': 'loan-repayment',
  'CL-1388': 'airbnb-tracker',
  'CL-1389': 'home-buying',
  'CL-1390': 'tracker-table',
  'CL-1391': 'property-manager',
  'CL-1392': 'insurance-comparison',
  'CL-1393': 'property-manager',
  'CL-1394': 'checklist',
  'CL-1395': 'crm-tool',
  'CL-1396': 'airbnb-tracker',
  'CL-1397': 'property-manager',
  'CL-1398': 'property-manager',
  'CL-1399': 'tracker-table',
  'CL-1400': 'crm-tool',
  'CL-1401': 'tracker-table',
  'CL-1402': 'home-buying',
  'CL-1403': 'property-manager',
  'CL-1404': 'property-manager',
  'CL-1405': 'loan-repayment',
  'CL-1406': 'tracker-table',
  'CL-1407': 'tracker-table',
  'CL-1408': 'tracker-table',
  'CL-1409': 'home-manager',
  'CL-1410': 'tracker-table',
  'CL-1411': 'tracker-table',
  'CL-1412': 'tracker-table',
  'CL-1413': 'property-manager',
  'CL-1414': 'tracker-table',
  'CL-1415': 'property-manager',
  'CL-1416': 'tracker-table',
  'CL-1417': 'property-manager',
  'CL-1418': 'tracker-table',
  'CL-1419': 'property-manager',
  'CL-1420': 'home-buying',
  'CL-1421': 'property-manager',
  'CL-1422': 'tracker-table',
  'CL-1423': 'property-manager',
  'CL-1424': 'property-manager',
  'CL-1425': 'property-manager',
  'CL-1426': 'tracker-table',
  'CL-1427': 'tracker-table',
  'CL-1428': 'property-manager',
  'CL-1429': 'real-estate-invest',
  'CL-1430': 'tracker-table',
  'CL-1431': 'property-manager',
  'CL-1432': 'tracker-table',
  'CL-1433': 'tracker-table',
  'CL-1434': 'tracker-table',
  'CL-1435': 'home-manager',
  'CL-1436': 'tracker-table',
  'CL-1437': 'tracker-table',
  'CL-1438': 'home-buying',
  'CL-1439': 'tracker-table',
  'CL-1440': 'renovation-tracker',
  'CL-1441': 'hr-tool',
  'CL-1442': 'hr-tool',
  'CL-1443': 'tracker-table',
  'CL-1444': 'hr-tool',
  'CL-1445': 'hr-tool',
  'CL-1446': 'hr-tool',
  'CL-1447': 'planner',
  'CL-1448': 'planner',
  'CL-1449': 'hr-tool',
  'CL-1450': 'hr-tool',
  'CL-1451': 'tracker-table',
  'CL-1452': 'time-tracker',
  'CL-1453': 'calculator',
  'CL-1454': 'tracker-table',
  'CL-1455': 'hr-tool',
  'CL-1456': 'tracker-table',
  'CL-1457': 'hr-tool',
  'CL-1458': 'tracker-table',
  'CL-1459': 'hr-tool',
  'CL-1460': 'hr-tool',
  'CL-1461': 'hr-tool',
  'CL-1462': 'hr-tool',
  'CL-1463': 'hr-tool',
  'CL-1464': 'hr-tool',
  'CL-1465': 'tracker-table',
  'CL-1466': 'tracker-table',
  'CL-1467': 'hr-tool',
  'CL-1468': 'hr-tool',
  'CL-1469': 'kpi-dashboard',
  'CL-1470': 'tracker-table',
  'CL-1471': 'hr-tool',
  'CL-1472': 'hr-tool',
  'CL-1473': 'planner',
  'CL-1474': 'planner',
  'CL-1475': 'tracker-table',
  'CL-1476': 'hr-tool',
  'CL-1477': 'hr-tool',
  'CL-1478': 'planner',
  'CL-1479': 'hr-tool',
  'CL-1480': 'hr-tool',
  'CL-1481': 'hr-tool',
  'CL-1482': 'planner',
  'CL-1483': 'hr-tool',
  'CL-1484': 'hr-tool',
  'CL-1485': 'hr-tool',
  'CL-1486': 'tracker-table',
  'CL-1487': 'tracker-table',
  'CL-1488': 'kpi-dashboard',
  'CL-1489': 'hr-tool',
  'CL-1490': 'hr-tool',
  'CL-1491': 'calculator',
  'CL-1492': 'tracker-table',
  'CL-1493': 'planner',
  'CL-1494': 'planner',
  'CL-1495': 'tracker-table',
  'CL-1496': 'hr-tool',
  'CL-1497': 'hr-tool',
  'CL-1498': 'tracker-table',
  'CL-1499': 'calculator',
  'CL-1500': 'hr-tool',
  'CL-1501': 'tracker-table',
  'CL-1502': 'hr-tool',
  'CL-1503': 'tracker-table',
  'CL-1504': 'tracker-table',
  'CL-1505': 'hr-tool',
  'CL-1506': 'tracker-table',
  'CL-1507': 'hr-tool',
  'CL-1508': 'hr-tool',
  'CL-1509': 'hr-tool',
  'CL-1510': 'hr-tool',
  'CL-1511': 'planner',
  'CL-1512': 'hr-tool',
  'CL-1513': 'hr-tool',
  'CL-1514': 'hr-tool',
  'CL-1515': 'hr-tool',
  'CL-1516': 'hr-tool',
  'CL-1517': 'hr-tool',
  'CL-1518': 'hr-tool',
  'CL-1519': 'hr-tool',
  'CL-1520': 'hr-tool',
  'CL-1521': 'tracker-table',
  'CL-1522': 'hr-tool',
  'CL-1523': 'hr-tool',
  'CL-1524': 'hr-tool',
  'CL-1525': 'hr-tool',
  'CL-1526': 'hr-tool',
  'CL-1527': 'hr-tool',
  'CL-1528': 'tracker-table',
  'CL-1529': 'time-tracker',
  'CL-1530': 'tracker-table',
  'CL-1531': 'hr-tool',
  'CL-1532': 'kpi-dashboard',
  'CL-1533': 'hr-tool',
  'CL-1534': 'hr-tool',
  'CL-1535': 'tracker-table',
  'CL-1536': 'time-tracker',
  'CL-1537': 'hr-tool',
  'CL-1538': 'hr-tool',
  'CL-1539': 'tracker-table',
  'CL-1540': 'hr-tool',
  'CL-1541': 'tracker-table',
  'CL-1542': 'planner',
  'CL-1543': 'tracker-table',
  'CL-1544': 'tracker-table',
  'CL-1545': 'tracker-table',
  'CL-1546': 'hr-tool',
  'CL-1547': 'tracker-table',
  'CL-1548': 'kpi-dashboard',
  'CL-1549': 'hr-tool',
  'CL-1550': 'tracker-table',
  'CL-1551': 'hr-tool',
  'CL-1552': 'tracker-table',
  'CL-1553': 'planner',
  'CL-1554': 'hr-tool',
  'CL-1555': 'hr-tool',
  'CL-1556': 'tracker-table',
  'CL-1557': 'hr-tool',
  'CL-1558': 'hr-tool',
  'CL-1559': 'tracker-table',
  'CL-1560': 'tracker-table',
  'CL-1561': 'hr-tool',
  'CL-1562': 'hr-tool',
  'CL-1563': 'tracker-table',
  'CL-1564': 'planner',
  'CL-1565': 'hr-tool',
  'CL-1566': 'calculator',
  'CL-1567': 'hr-tool',
  'CL-1568': 'hr-tool',
  'CL-1569': 'hr-tool',
  'CL-1570': 'hr-tool',
  'CL-1571': 'tracker-table',
  'CL-1572': 'hr-tool',
  'CL-1573': 'planner',
  'CL-1574': 'tracker-table',
  'CL-1575': 'calculator',
  'CL-1576': 'time-tracker',
  'CL-1577': 'planner',
  'CL-1578': 'calculator',
  'CL-1579': 'tracker-table',
  'CL-1580': 'hr-tool',
  'CL-1581': 'planner',
  'CL-1582': 'hr-tool',
  'CL-1583': 'planner',
  'CL-1584': 'planner',
  'CL-1585': 'hr-tool',
  'CL-1586': 'planner',
  'CL-1587': 'calculator',
  'CL-1588': 'tracker-table',
  'CL-1589': 'planner',
  'CL-1590': 'tracker-table',
  'CL-1591': 'hr-tool',
  'CL-1592': 'tracker-table',
  'CL-1593': 'planner',
  'CL-1594': 'hr-tool',
  'CL-1595': 'hr-tool',
  'CL-1596': 'kpi-dashboard',
  'CL-1597': 'hr-tool',
  'CL-1598': 'hr-tool',
  'CL-1599': 'hr-tool',
  'CL-1600': 'hr-tool',
  'CL-1601': 'tracker-table',
  'CL-1602': 'hr-tool',
  'CL-1603': 'hr-tool',
  'CL-1604': 'hr-tool',
  'CL-1605': 'planner',
  'CL-1606': 'hr-tool',
  'CL-1607': 'hr-tool',
  'CL-1608': 'hr-tool',
  'CL-1609': 'tracker-table',
  'CL-1610': 'kpi-dashboard',
  'CL-1611': 'hr-tool',
  'CL-1612': 'planner',
  'CL-1613': 'planner',
  'CL-1614': 'hr-tool',
  'CL-1615': 'hr-tool',
  'CL-1616': 'hr-tool',
  'CL-1617': 'hr-tool',
  'CL-1618': 'planner',
  'CL-1619': 'hr-tool',
  'CL-1620': 'tracker-table',
  'CL-1621': 'project-dashboard',
  'CL-1622': 'project-dashboard',
  'CL-1623': 'project-dashboard',
  'CL-1624': 'project-dashboard',
  'CL-1625': 'tracker-table',
  'CL-1626': 'planner',
  'CL-1627': 'project-dashboard',
  'CL-1628': 'project-dashboard',
  'CL-1629': 'project-dashboard',
  'CL-1630': 'project-dashboard',
  'CL-1631': 'project-dashboard',
  'CL-1632': 'project-dashboard',
  'CL-1633': 'project-dashboard',
  'CL-1634': 'tracker-table',
  'CL-1635': 'project-dashboard',
  'CL-1636': 'tracker-table',
  'CL-1637': 'tracker-table',
  'CL-1638': 'tracker-table',
  'CL-1639': 'tracker-table',
  'CL-1640': 'planner',
  'CL-1641': 'project-dashboard',
  'CL-1642': 'planner',
  'CL-1643': 'project-dashboard',
  'CL-1644': 'tracker-table',
  'CL-1645': 'tracker-table',
  'CL-1646': 'tracker-table',
  'CL-1647': 'tracker-table',
  'CL-1648': 'project-dashboard',
  'CL-1649': 'kpi-dashboard',
  'CL-1650': 'project-dashboard',
  'CL-1651': 'planner',
  'CL-1652': 'project-dashboard',
  'CL-1653': 'tracker-table',
  'CL-1654': 'project-dashboard',
  'CL-1655': 'tracker-table',
  'CL-1656': 'project-dashboard',
  'CL-1657': 'planner',
  'CL-1658': 'tracker-table',
  'CL-1659': 'planner',
  'CL-1660': 'project-dashboard',
  'CL-1661': 'project-dashboard',
  'CL-1662': 'project-dashboard',
  'CL-1663': 'project-dashboard',
  'CL-1664': 'tracker-table',
  'CL-1665': 'project-dashboard',
  'CL-1666': 'tracker-table',
  'CL-1667': 'project-dashboard',
  'CL-1668': 'project-dashboard',
  'CL-1669': 'tracker-table',
  'CL-1670': 'planner',
  'CL-1671': 'project-dashboard',
  'CL-1672': 'project-dashboard',
  'CL-1673': 'tracker-table',
  'CL-1674': 'project-dashboard',
  'CL-1675': 'project-dashboard',
  'CL-1676': 'project-dashboard',
  'CL-1677': 'project-dashboard',
  'CL-1678': 'tracker-table',
  'CL-1679': 'planner',
  'CL-1680': 'tracker-table',
  'CL-1681': 'tracker-table',
  'CL-1682': 'tracker-table',
  'CL-1683': 'tracker-table',
  'CL-1684': 'project-dashboard',
  'CL-1685': 'tracker-table',
  'CL-1686': 'project-dashboard',
  'CL-1687': 'planner',
  'CL-1688': 'tracker-table',
  'CL-1689': 'project-dashboard',
  'CL-1690': 'tracker-table',
  'CL-1691': 'tracker-table',
  'CL-1692': 'tracker-table',
  'CL-1693': 'tracker-table',
  'CL-1694': 'kpi-dashboard',
  'CL-1695': 'project-dashboard',
  'CL-1696': 'project-dashboard',
  'CL-1697': 'tracker-table',
  'CL-1698': 'planner',
  'CL-1699': 'project-dashboard',
  'CL-1700': 'tracker-table',
  'CL-1701': 'project-dashboard',
  'CL-1702': 'tracker-table',
  'CL-1703': 'tracker-table',
  'CL-1704': 'planner',
  'CL-1705': 'tracker-table',
  'CL-1706': 'tracker-table',
  'CL-1707': 'tracker-table',
  'CL-1708': 'tracker-table',
  'CL-1709': 'project-dashboard',
  'CL-1710': 'tracker-table',
  'CL-1711': 'tracker-table',
  'CL-1712': 'project-dashboard',
  'CL-1713': 'tracker-table',
  'CL-1714': 'project-dashboard',
  'CL-1715': 'project-dashboard',
  'CL-1716': 'project-dashboard',
  'CL-1717': 'project-dashboard',
  'CL-1718': 'project-dashboard',
  'CL-1719': 'project-dashboard',
  'CL-1720': 'planner',
  'CL-1721': 'project-dashboard',
  'CL-1722': 'planner',
  'CL-1723': 'project-dashboard',
  'CL-1724': 'planner',
  'CL-1725': 'project-dashboard',
  'CL-1726': 'project-dashboard',
  'CL-1727': 'project-dashboard',
  'CL-1728': 'project-dashboard',
  'CL-1729': 'project-dashboard',
  'CL-1730': 'project-dashboard',
  'CL-1731': 'tracker-table',
  'CL-1732': 'planner',
  'CL-1733': 'project-dashboard',
  'CL-1734': 'project-dashboard',
  'CL-1735': 'project-dashboard',
  'CL-1736': 'project-dashboard',
  'CL-1737': 'project-dashboard',
  'CL-1738': 'project-dashboard',
  'CL-1739': 'project-dashboard',
  'CL-1740': 'tracker-table',
  'CL-1741': 'tracker-table',
  'CL-1742': 'project-dashboard',
  'CL-1743': 'project-dashboard',
  'CL-1744': 'project-dashboard',
  'CL-1745': 'tracker-table',
  'CL-1746': 'project-dashboard',
  'CL-1747': 'project-dashboard',
  'CL-1748': 'project-dashboard',
  'CL-1749': 'project-dashboard',
  'CL-1750': 'tracker-table',
  'CL-1751': 'kpi-dashboard',
  'CL-1752': 'project-dashboard',
  'CL-1753': 'kpi-dashboard',
  'CL-1754': 'project-dashboard',
  'CL-1755': 'tracker-table',
  'CL-1756': 'tracker-table',
  'CL-1757': 'tracker-table',
  'CL-1758': 'tracker-table',
  'CL-1759': 'project-dashboard',
  'CL-1760': 'planner',
  'CL-1761': 'project-dashboard',
  'CL-1762': 'project-dashboard',
  'CL-1763': 'planner',
  'CL-1764': 'project-dashboard',
  'CL-1765': 'project-dashboard',
  'CL-1766': 'kpi-dashboard',
  'CL-1767': 'tracker-table',
  'CL-1768': 'tracker-table',
  'CL-1769': 'project-dashboard',
  'CL-1770': 'project-dashboard',
  'CL-1771': 'project-dashboard',
  'CL-1772': 'project-dashboard',
  'CL-1773': 'project-dashboard',
  'CL-1774': 'tracker-table',
  'CL-1775': 'project-dashboard',
  'CL-1776': 'project-dashboard',
  'CL-1777': 'tracker-table',
  'CL-1778': 'project-dashboard',
  'CL-1779': 'project-dashboard',
  'CL-1780': 'tracker-table',
  'CL-1781': 'tracker-table',
  'CL-1782': 'kpi-dashboard',
  'CL-1783': 'tracker-table',
  'CL-1784': 'tracker-table',
  'CL-1785': 'tracker-table',
  'CL-1786': 'project-dashboard',
  'CL-1787': 'project-dashboard',
  'CL-1788': 'project-dashboard',
  'CL-1789': 'tracker-table',
  'CL-1790': 'tracker-table',
  'CL-1791': 'project-dashboard',
  'CL-1792': 'tracker-table',
  'CL-1793': 'project-dashboard',
  'CL-1794': 'project-dashboard',
  'CL-1795': 'project-dashboard',
  'CL-1796': 'project-dashboard',
  'CL-1797': 'project-dashboard',
  'CL-1798': 'project-dashboard',
  'CL-1799': 'project-dashboard',
  'CL-1800': 'planner',
  'CL-1801': 'planner',
  'CL-1802': 'kpi-dashboard',
  'CL-1803': 'tracker-table',
  'CL-1804': 'project-dashboard',
  'CL-1805': 'tracker-table',
  'CL-1806': 'project-dashboard',
  'CL-1807': 'project-dashboard',
  'CL-1808': 'project-dashboard',
  'CL-1809': 'project-dashboard',
  'CL-1810': 'project-dashboard',
  'CL-1811': 'project-dashboard',
  'CL-1812': 'project-dashboard',
  'CL-1813': 'project-dashboard',
  'CL-1814': 'planner',
  'CL-1815': 'project-dashboard',
  'CL-1816': 'tracker-table',
  'CL-1817': 'project-dashboard',
  'CL-1818': 'project-dashboard',
  'CL-1819': 'tracker-table',
  'CL-1820': 'project-dashboard',
  'CL-1821': 'tracker-table',
  'CL-1822': 'tracker-table',
  'CL-1823': 'tracker-table',
  'CL-1824': 'tracker-table',
  'CL-1825': 'tracker-table',
  'CL-1826': 'tracker-table',
  'CL-1827': 'tracker-table',
  'CL-1828': 'project-dashboard',
  'CL-1829': 'planner',
  'CL-1830': 'tracker-table',
  'CL-1831': 'tracker-table',
  'CL-1832': 'project-dashboard',
  'CL-1833': 'project-dashboard',
  'CL-1834': 'project-dashboard',
  'CL-1835': 'tracker-table',
  'CL-1836': 'project-dashboard',
  'CL-1837': 'tracker-table',
  'CL-1838': 'tracker-table',
  'CL-1839': 'project-dashboard',
  'CL-1840': 'project-dashboard',
  'CL-1841': 'planner',
  'CL-1842': 'tracker-table',
  'CL-1843': 'project-dashboard',
  'CL-1844': 'project-dashboard',
  'CL-1845': 'project-dashboard',
  'CL-1846': 'project-dashboard',
  'CL-1847': 'project-dashboard',
  'CL-1848': 'project-dashboard',
  'CL-1849': 'tracker-table',
  'CL-1850': 'tracker-table',
  'CL-1851': 'tracker-table',
  'CL-1852': 'project-dashboard',
  'CL-1853': 'tracker-table',
  'CL-1854': 'project-dashboard',
  'CL-1855': 'project-dashboard',
  'CL-1856': 'tracker-table',
  'CL-1857': 'tracker-table',
  'CL-1858': 'project-dashboard',
  'CL-1859': 'project-dashboard',
  'CL-1860': 'planner',
  'CL-1861': 'marketing-tool',
  'CL-1862': 'marketing-tool',
  'CL-1863': 'planner',
  'CL-1864': 'planner',
  'CL-1865': 'checklist',
  'CL-1866': 'marketing-tool',
  'CL-1867': 'marketing-tool',
  'CL-1868': 'planner',
  'CL-1869': 'planner',
  'CL-1870': 'planner',
  'CL-1871': 'planner',
  'CL-1872': 'planner',
  'CL-1873': 'marketing-tool',
  'CL-1874': 'tracker-table',
  'CL-1875': 'tracker-table',
  'CL-1876': 'tracker-table',
  'CL-1877': 'marketing-tool',
  'CL-1878': 'marketing-tool',
  'CL-1879': 'marketing-tool',
  'CL-1880': 'tracker-table',
  'CL-1881': 'tracker-table',
  'CL-1882': 'calculator',
  'CL-1883': 'tracker-table',
  'CL-1884': 'tracker-table',
  'CL-1885': 'tracker-table',
  'CL-1886': 'marketing-tool',
  'CL-1887': 'tracker-table',
  'CL-1888': 'marketing-tool',
  'CL-1889': 'tracker-table',
  'CL-1890': 'tracker-table',
  'CL-1891': 'tracker-table',
  'CL-1892': 'tracker-table',
  'CL-1893': 'marketing-tool',
  'CL-1894': 'marketing-tool',
  'CL-1895': 'tracker-table',
  'CL-1896': 'tracker-table',
  'CL-1897': 'tracker-table',
  'CL-1898': 'marketing-tool',
  'CL-1899': 'planner',
  'CL-1900': 'marketing-tool',
  'CL-1901': 'marketing-tool',
  'CL-1902': 'tracker-table',
  'CL-1903': 'marketing-tool',
  'CL-1904': 'tracker-table',
  'CL-1905': 'tracker-table',
  'CL-1906': 'tracker-table',
  'CL-1907': 'marketing-tool',
  'CL-1908': 'marketing-tool',
  'CL-1909': 'marketing-tool',
  'CL-1910': 'tracker-table',
  'CL-1911': 'marketing-tool',
  'CL-1912': 'marketing-tool',
  'CL-1913': 'tracker-table',
  'CL-1914': 'tracker-table',
  'CL-1915': 'planner',
  'CL-1916': 'planner',
  'CL-1917': 'planner',
  'CL-1918': 'tracker-table',
  'CL-1919': 'planner',
  'CL-1920': 'marketing-tool',
  'CL-1921': 'marketing-tool',
  'CL-1922': 'marketing-tool',
  'CL-1923': 'marketing-tool',
  'CL-1924': 'tracker-table',
  'CL-1925': 'tracker-table',
  'CL-1926': 'marketing-tool',
  'CL-1927': 'marketing-tool',
  'CL-1928': 'tracker-table',
  'CL-1929': 'marketing-tool',
  'CL-1930': 'planner',
  'CL-1931': 'calculator',
  'CL-1932': 'marketing-tool',
  'CL-1933': 'tracker-table',
  'CL-1934': 'marketing-tool',
  'CL-1935': 'tracker-table',
  'CL-1936': 'marketing-tool',
  'CL-1937': 'tracker-table',
  'CL-1938': 'planner',
  'CL-1939': 'tracker-table',
  'CL-1940': 'marketing-tool',
  'CL-1941': 'marketing-tool',
  'CL-1942': 'marketing-tool',
  'CL-1943': 'tracker-table',
  'CL-1944': 'marketing-tool',
  'CL-1945': 'tracker-table',
  'CL-1946': 'marketing-tool',
  'CL-1947': 'marketing-tool',
  'CL-1948': 'tracker-table',
  'CL-1949': 'tracker-table',
  'CL-1950': 'planner',
  'CL-1951': 'marketing-tool',
  'CL-1952': 'marketing-tool',
  'CL-1953': 'marketing-tool',
  'CL-1954': 'tracker-table',
  'CL-1955': 'calculator',
  'CL-1956': 'tracker-table',
  'CL-1957': 'tracker-table',
  'CL-1958': 'tracker-table',
  'CL-1959': 'calculator',
  'CL-1960': 'marketing-tool',
  'CL-1961': 'marketing-tool',
  'CL-1962': 'planner',
  'CL-1963': 'tracker-table',
  'CL-1964': 'marketing-tool',
  'CL-1965': 'tracker-table',
  'CL-1966': 'marketing-tool',
  'CL-1967': 'marketing-tool',
  'CL-1968': 'planner',
  'CL-1969': 'tracker-table',
  'CL-1970': 'tracker-table',
  'CL-1971': 'tracker-table',
  'CL-1972': 'tracker-table',
  'CL-1973': 'tracker-table',
  'CL-1974': 'marketing-tool',
  'CL-1975': 'marketing-tool',
  'CL-1976': 'tracker-table',
  'CL-1977': 'calculator',
  'CL-1978': 'tracker-table',
  'CL-1979': 'tracker-table',
  'CL-1980': 'marketing-tool',
  'CL-1981': 'tracker-table',
  'CL-1982': 'tracker-table',
  'CL-1983': 'tracker-table',
  'CL-1984': 'marketing-tool',
  'CL-1985': 'marketing-tool',
  'CL-1986': 'tracker-table',
  'CL-1987': 'checklist',
  'CL-1988': 'calculator',
  'CL-1989': 'checklist',
  'CL-1990': 'tracker-table',
  'CL-1991': 'planner',
  'CL-1992': 'planner',
  'CL-1993': 'tracker-table',
  'CL-1994': 'tracker-table',
  'CL-1995': 'planner',
  'CL-1996': 'tracker-table',
  'CL-1997': 'marketing-tool',
  'CL-1998': 'marketing-tool',
  'CL-1999': 'tracker-table',
  'CL-2000': 'marketing-tool',
  'CL-2001': 'marketing-tool',
  'CL-2002': 'marketing-tool',
  'CL-2003': 'marketing-tool',
  'CL-2004': 'calculator',
  'CL-2005': 'tracker-table',
  'CL-2006': 'marketing-tool',
  'CL-2007': 'tracker-table',
  'CL-2008': 'marketing-tool',
  'CL-2009': 'tracker-table',
  'CL-2010': 'marketing-tool',
  'CL-2011': 'tracker-table',
  'CL-2012': 'checklist',
  'CL-2013': 'tracker-table',
  'CL-2014': 'marketing-tool',
  'CL-2015': 'marketing-tool',
  'CL-2016': 'marketing-tool',
  'CL-2017': 'marketing-tool',
  'CL-2018': 'marketing-tool',
  'CL-2019': 'tracker-table',
  'CL-2020': 'tracker-table',
  'CL-2021': 'calculator',
  'CL-2022': 'tracker-table',
  'CL-2023': 'tracker-table',
  'CL-2024': 'planner',
  'CL-2025': 'marketing-tool',
  'CL-2026': 'tracker-table',
  'CL-2027': 'marketing-tool',
  'CL-2028': 'marketing-tool',
  'CL-2029': 'marketing-tool',
  'CL-2030': 'planner',
  'CL-2031': 'planner',
  'CL-2032': 'marketing-tool',
  'CL-2033': 'marketing-tool',
  'CL-2034': 'marketing-tool',
  'CL-2035': 'tracker-table',
  'CL-2036': 'marketing-tool',
  'CL-2037': 'marketing-tool',
  'CL-2038': 'tracker-table',
  'CL-2039': 'tracker-table',
  'CL-2040': 'planner',
  'CL-2041': 'marketing-tool',
  'CL-2042': 'marketing-tool',
  'CL-2043': 'tracker-table',
  'CL-2044': 'marketing-tool',
  'CL-2045': 'tracker-table',
  'CL-2046': 'tracker-table',
  'CL-2047': 'planner',
  'CL-2048': 'planner',
  'CL-2049': 'tracker-table',
  'CL-2050': 'tracker-table',
  'CL-2051': 'tracker-table',
  'CL-2052': 'planner',
  'CL-2053': 'marketing-tool',
  'CL-2054': 'planner',
  'CL-2055': 'tracker-table',
  'CL-2056': 'tracker-table',
  'CL-2057': 'tracker-table',
  'CL-2058': 'tracker-table',
  'CL-2059': 'planner',
  'CL-2060': 'planner',
  'CL-2061': 'tracker-table',
  'CL-2062': 'tracker-table',
  'CL-2063': 'tracker-table',
  'CL-2064': 'tracker-table',
  'CL-2065': 'tracker-table',
  'CL-2066': 'tracker-table',
  'CL-2067': 'planner',
  'CL-2068': 'tracker-table',
  'CL-2069': 'tracker-table',
  'CL-2070': 'checklist',
  'CL-2071': 'planner',
  'CL-2072': 'planner',
  'CL-2073': 'tracker-table',
  'CL-2074': 'tracker-table',
  'CL-2075': 'marketing-tool',
  'CL-2076': 'marketing-tool',
  'CL-2077': 'marketing-tool',
  'CL-2078': 'tracker-table',
  'CL-2079': 'tracker-table',
  'CL-2080': 'tracker-table',
  'CL-2081': 'daily-planner',
  'CL-2082': 'planner',
  'CL-2083': 'planner',
  'CL-2084': 'planner',
  'CL-2085': 'time-tracker',
  'CL-2086': 'daily-planner',
  'CL-2087': 'daily-planner',
  'CL-2088': 'daily-planner',
  'CL-2089': 'tracker-table',
  'CL-2090': 'habit-tracker',
  'CL-2091': 'tracker-table',
  'CL-2092': 'goals-planner',
  'CL-2093': 'journal',
  'CL-2094': 'tracker-table',
  'CL-2095': 'journal',
  'CL-2096': 'journal',
  'CL-2097': 'journal',
  'CL-2098': 'journal',
  'CL-2099': 'journal',
  'CL-2100': 'journal',
  'CL-2101': 'daily-planner',
  'CL-2102': 'home-manager',
  'CL-2103': 'home-manager',
  'CL-2104': 'daily-planner',
  'CL-2105': 'planner',
  'CL-2106': 'daily-planner',
  'CL-2107': 'daily-planner',
  'CL-2108': 'wellness-tracker',
  'CL-2109': 'tracker-table',
  'CL-2110': 'wellness-tracker',
  'CL-2111': 'health-tool',
  'CL-2112': 'tracker-table',
  'CL-2113': 'meal-planner',
  'CL-2114': 'tracker-table',
  'CL-2115': 'tracker-table',
  'CL-2116': 'tracker-table',
  'CL-2117': 'planner',
  'CL-2118': 'meal-planner',
  'CL-2119': 'planner',
  'CL-2120': 'planner',
  'CL-2121': 'journal',
  'CL-2122': 'time-tracker',
  'CL-2123': 'daily-planner',
  'CL-2124': 'journal',
  'CL-2125': 'journal',
  'CL-2126': 'daily-planner',
  'CL-2127': 'daily-planner',
  'CL-2128': 'daily-planner',
  'CL-2129': 'tracker-table',
  'CL-2130': 'daily-planner',
  'CL-2131': 'planner',
  'CL-2132': 'journal',
  'CL-2133': 'planner',
  'CL-2134': 'journal',
  'CL-2135': 'tracker-table',
  'CL-2136': 'tracker-table',
  'CL-2137': 'home-manager',
  'CL-2138': 'goals-planner',
  'CL-2139': 'tracker-table',
  'CL-2140': 'journal',
  'CL-2141': 'meal-planner',
  'CL-2142': 'tracker-table',
  'CL-2143': 'planner',
  'CL-2144': 'daily-planner',
  'CL-2145': 'meal-planner',
  'CL-2146': 'daily-planner',
  'CL-2147': 'home-manager',
  'CL-2148': 'daily-planner',
  'CL-2149': 'journal',
  'CL-2150': 'journal',
  'CL-2151': 'tracker-table',
  'CL-2152': 'tracker-table',
  'CL-2153': 'daily-planner',
  'CL-2154': 'journal',
  'CL-2155': 'home-manager',
  'CL-2156': 'daily-planner',
  'CL-2157': 'journal',
  'CL-2158': 'goals-planner',
  'CL-2159': 'daily-planner',
  'CL-2160': 'planner',
  'CL-2161': 'daily-planner',
  'CL-2162': 'habit-tracker',
  'CL-2163': 'tracker-table',
  'CL-2164': 'journal',
  'CL-2165': 'daily-planner',
  'CL-2166': 'daily-planner',
  'CL-2167': 'health-tool',
  'CL-2168': 'tracker-table',
  'CL-2169': 'journal',
  'CL-2170': 'wellness-tracker',
  'CL-2171': 'tracker-table',
  'CL-2172': 'journal',
  'CL-2173': 'daily-planner',
  'CL-2174': 'wellness-tracker',
  'CL-2175': 'journal',
  'CL-2176': 'daily-planner',
  'CL-2177': 'daily-planner',
  'CL-2178': 'health-tool',
  'CL-2179': 'tracker-table',
  'CL-2180': 'home-manager',
  'CL-2181': 'meal-planner',
  'CL-2182': 'journal',
  'CL-2183': 'tracker-table',
  'CL-2184': 'planner',
  'CL-2185': 'daily-planner',
  'CL-2186': 'tracker-table',
  'CL-2187': 'tracker-table',
  'CL-2188': 'tracker-table',
  'CL-2189': 'daily-planner',
  'CL-2190': 'meal-planner',
  'CL-2191': 'tracker-table',
  'CL-2192': 'daily-planner',
  'CL-2193': 'planner',
  'CL-2194': 'tracker-table',
  'CL-2195': 'daily-planner',
  'CL-2196': 'time-tracker',
  'CL-2197': 'journal',
  'CL-2198': 'planner',
  'CL-2199': 'planner',
  'CL-2200': 'journal',
  'CL-2201': 'wellness-tracker',
  'CL-2202': 'planner',
  'CL-2203': 'journal',
  'CL-2204': 'planner',
  'CL-2205': 'journal',
  'CL-2206': 'time-tracker',
  'CL-2207': 'time-tracker',
  'CL-2208': 'journal',
  'CL-2209': 'tracker-table',
  'CL-2210': 'tracker-table',
  'CL-2211': 'journal',
  'CL-2212': 'daily-planner',
  'CL-2213': 'tracker-table',
  'CL-2214': 'daily-planner',
  'CL-2215': 'journal',
  'CL-2216': 'health-tool',
  'CL-2217': 'planner',
  'CL-2218': 'habit-tracker',
  'CL-2219': 'planner',
  'CL-2220': 'tracker-table',
  'CL-2221': 'journal',
  'CL-2222': 'daily-planner',
  'CL-2223': 'goals-planner',
  'CL-2224': 'home-manager',
  'CL-2225': 'tracker-table',
  'CL-2226': 'daily-planner',
  'CL-2227': 'daily-planner',
  'CL-2228': 'tracker-table',
  'CL-2229': 'tracker-table',
  'CL-2230': 'tracker-table',
  'CL-2231': 'tracker-table',
  'CL-2232': 'daily-planner',
  'CL-2233': 'daily-planner',
  'CL-2234': 'health-tool',
  'CL-2235': 'journal',
  'CL-2236': 'tracker-table',
  'CL-2237': 'tracker-table',
  'CL-2238': 'daily-planner',
  'CL-2239': 'daily-planner',
  'CL-2240': 'meal-planner',
  'CL-2241': 'journal',
  'CL-2242': 'journal',
  'CL-2243': 'planner',
  'CL-2244': 'journal',
  'CL-2245': 'tracker-table',
  'CL-2246': 'journal',
  'CL-2247': 'tracker-table',
  'CL-2248': 'home-manager',
  'CL-2249': 'habit-tracker',
  'CL-2250': 'planner',
  'CL-2251': 'daily-planner',
  'CL-2252': 'meal-planner',
  'CL-2253': 'journal',
  'CL-2254': 'tracker-table',
  'CL-2255': 'home-manager',
  'CL-2256': 'journal',
  'CL-2257': 'daily-planner',
  'CL-2258': 'daily-planner',
  'CL-2259': 'wellness-tracker',
  'CL-2260': 'journal',
  'CL-2261': 'daily-planner',
  'CL-2262': 'planner',
  'CL-2263': 'daily-planner',
  'CL-2264': 'daily-planner',
  'CL-2265': 'wellness-tracker',
  'CL-2266': 'journal',
  'CL-2267': 'tracker-table',
  'CL-2268': 'tracker-table',
  'CL-2269': 'planner',
  'CL-2270': 'tracker-table',
  'CL-2271': 'journal',
  'CL-2272': 'daily-planner',
  'CL-2273': 'health-tool',
  'CL-2274': 'daily-planner',
  'CL-2275': 'planner',
  'CL-2276': 'journal',
  'CL-2277': 'wellness-tracker',
  'CL-2278': 'daily-planner',
  'CL-2279': 'journal',
  'CL-2280': 'journal',
  'CL-2281': 'daily-planner',
  'CL-2282': 'journal',
  'CL-2283': 'journal',
  'CL-2284': 'planner',
  'CL-2285': 'habit-tracker',
  'CL-2286': 'time-tracker',
  'CL-2287': 'planner',
  'CL-2288': 'goals-planner',
  'CL-2289': 'habit-tracker',
  'CL-2290': 'planner',
  'CL-2291': 'time-tracker',
  'CL-2292': 'daily-planner',
  'CL-2293': 'tracker-table',
  'CL-2294': 'tracker-table',
  'CL-2295': 'journal',
  'CL-2296': 'journal',
  'CL-2297': 'daily-planner',
  'CL-2298': 'tracker-table',
  'CL-2299': 'habit-tracker',
  'CL-2300': 'tracker-table',
  'CL-2301': 'journal',
  'CL-2302': 'home-manager',
  'CL-2303': 'daily-planner',
  'CL-2304': 'planner',
  'CL-2305': 'tracker-table',
  'CL-2306': 'tracker-table',
  'CL-2307': 'planner',
  'CL-2308': 'planner',
  'CL-2309': 'planner',
  'CL-2310': 'daily-planner',
  'CL-2311': 'tracker-table',
  'CL-2312': 'daily-planner',
  'CL-2313': 'tracker-table',
  'CL-2314': 'meal-planner',
  'CL-2315': 'goals-planner',
  'CL-2316': 'journal',
  'CL-2317': 'tracker-table',
  'CL-2318': 'goals-planner',
  'CL-2319': 'planner',
  'CL-2320': 'planner',
  'CL-2321': 'health-tool',
  'CL-2322': 'tracker-table',
  'CL-2323': 'tracker-table',
  'CL-2324': 'daily-planner',
  'CL-2325': 'journal',
  'CL-2326': 'tracker-table',
  'CL-2327': 'habit-tracker',
  'CL-2328': 'journal',
  'CL-2329': 'planner',
  'CL-2330': 'planner',
  'CL-2331': 'journal',
  'CL-2332': 'tracker-table',
  'CL-2333': 'health-tool',
  'CL-2334': 'daily-planner',
  'CL-2335': 'journal',
  'CL-2336': 'time-tracker',
  'CL-2337': 'planner',
  'CL-2338': 'home-manager',
  'CL-2339': 'daily-planner',
  'CL-2340': 'planner',
  'CL-2341': 'planner',
  'CL-2342': 'tracker-table',
  'CL-2343': 'daily-planner',
  'CL-2344': 'daily-planner',
  'CL-2345': 'meal-planner',
  'CL-2346': 'daily-planner',
  'CL-2347': 'daily-planner',
  'CL-2348': 'daily-planner',
  'CL-2349': 'tracker-table',
  'CL-2350': 'habit-tracker',
  'CL-2351': 'tracker-table',
  'CL-2352': 'meal-planner',
  'CL-2353': 'daily-planner',
  'CL-2354': 'journal',
  'CL-2355': 'planner',
  'CL-2356': 'daily-planner',
  'CL-2357': 'planner',
  'CL-2358': 'home-manager',
  'CL-2359': 'daily-planner',
  'CL-2360': 'journal',
  'CL-2361': 'health-tool',
  'CL-2362': 'planner',
  'CL-2363': 'tracker-table',
  'CL-2364': 'wellness-tracker',
  'CL-2365': 'habit-tracker',
  'CL-2366': 'home-manager',
  'CL-2367': 'wellness-tracker',
  'CL-2368': 'planner',
  'CL-2369': 'journal',
  'CL-2370': 'journal',
  'CL-2371': 'daily-planner',
  'CL-2372': 'daily-planner',
  'CL-2373': 'planner',
  'CL-2374': 'health-tool',
  'CL-2375': 'tracker-table',
  'CL-2376': 'tracker-table',
  'CL-2377': 'planner',
  'CL-2378': 'tracker-table',
  'CL-2379': 'tracker-table',
  'CL-2380': 'planner',
  'CL-2381': 'journal',
  'CL-2382': 'tracker-table',
  'CL-2383': 'planner',
  'CL-2384': 'journal',
  'CL-2385': 'meal-planner',
  'CL-2386': 'tracker-table',
  'CL-2387': 'meal-planner',
  'CL-2388': 'home-manager',
  'CL-2389': 'tracker-table',
  'CL-2390': 'daily-planner',
  'CL-2391': 'wellness-tracker',
  'CL-2392': 'daily-planner',
  'CL-2393': 'daily-planner',
  'CL-2394': 'planner',
  'CL-2395': 'habit-tracker',
  'CL-2396': 'journal',
  'CL-2397': 'daily-planner',
  'CL-2398': 'planner',
  'CL-2399': 'wellness-tracker',
  'CL-2400': 'tracker-table',
  'CL-2401': 'wellness-tracker',
  'CL-2402': 'daily-planner',
  'CL-2403': 'journal',
  'CL-2404': 'journal',
  'CL-2405': 'goals-planner',
  'CL-2406': 'daily-planner',
  'CL-2407': 'journal',
  'CL-2408': 'journal',
  'CL-2409': 'daily-planner',
  'CL-2410': 'planner',
  'CL-2411': 'tracker-table',
  'CL-2412': 'daily-planner',
  'CL-2413': 'tracker-table',
  'CL-2414': 'tracker-table',
  'CL-2415': 'journal',
  'CL-2416': 'tracker-table',
  'CL-2417': 'planner',
  'CL-2418': 'tracker-table',
  'CL-2419': 'daily-planner',
  'CL-2420': 'journal',
  'CL-2421': 'tracker-table',
  'CL-2422': 'journal',
  'CL-2423': 'time-tracker',
  'CL-2424': 'tracker-table',
  'CL-2425': 'daily-planner',
  'CL-2426': 'daily-planner',
  'CL-2427': 'daily-planner',
  'CL-2428': 'planner',
  'CL-2429': 'daily-planner',
  'CL-2430': 'tracker-table',
  'CL-2431': 'time-tracker',
  'CL-2432': 'tracker-table',
  'CL-2433': 'daily-planner',
  'CL-2434': 'planner',
  'CL-2435': 'daily-planner',
  'CL-2436': 'home-manager',
  'CL-2437': 'tracker-table',
  'CL-2438': 'planner',
  'CL-2439': 'daily-planner',
  'CL-2440': 'planner',
  'CL-2441': 'event-tool',
  'CL-2442': 'event-tool',
  'CL-2443': 'event-tool',
  'CL-2444': 'event-tool',
  'CL-2445': 'event-tool',
  'CL-2446': 'savings-goal',
  'CL-2447': 'event-tool',
  'CL-2448': 'event-tool',
  'CL-2449': 'event-tool',
  'CL-2450': 'event-tool',
  'CL-2451': 'event-tool',
  'CL-2452': 'event-tool',
  'CL-2453': 'event-tool',
  'CL-2454': 'event-tool',
  'CL-2455': 'event-tool',
  'CL-2456': 'tracker-table',
  'CL-2457': 'event-tool',
  'CL-2458': 'event-tool',
  'CL-2459': 'planner',
  'CL-2460': 'tracker-table',
  'CL-2461': 'tracker-table',
  'CL-2462': 'event-tool',
  'CL-2463': 'tracker-table',
  'CL-2464': 'tracker-table',
  'CL-2465': 'tracker-table',
  'CL-2466': 'event-tool',
  'CL-2467': 'event-tool',
  'CL-2468': 'tracker-table',
  'CL-2469': 'tracker-table',
  'CL-2470': 'tracker-table',
  'CL-2471': 'event-tool',
  'CL-2472': 'event-tool',
  'CL-2473': 'event-tool',
  'CL-2474': 'event-tool',
  'CL-2475': 'tracker-table',
  'CL-2476': 'event-tool',
  'CL-2477': 'event-tool',
  'CL-2478': 'event-tool',
  'CL-2479': 'event-tool',
  'CL-2480': 'tracker-table',
  'CL-2481': 'event-tool',
  'CL-2482': 'tracker-table',
  'CL-2483': 'event-tool',
  'CL-2484': 'event-tool',
  'CL-2485': 'event-tool',
  'CL-2486': 'event-tool',
  'CL-2487': 'tracker-table',
  'CL-2488': 'tracker-table',
  'CL-2489': 'tracker-table',
  'CL-2490': 'event-tool',
  'CL-2491': 'event-tool',
  'CL-2492': 'savings-goal',
  'CL-2493': 'event-tool',
  'CL-2494': 'event-tool',
  'CL-2495': 'tracker-table',
  'CL-2496': 'event-tool',
  'CL-2497': 'event-tool',
  'CL-2498': 'event-tool',
  'CL-2499': 'event-tool',
  'CL-2500': 'event-tool',
  'CL-2501': 'event-tool',
  'CL-2502': 'tracker-table',
  'CL-2503': 'event-tool',
  'CL-2504': 'event-tool',
  'CL-2505': 'event-tool',
  'CL-2506': 'event-tool',
  'CL-2507': 'event-tool',
  'CL-2508': 'event-tool',
  'CL-2509': 'event-tool',
  'CL-2510': 'event-tool',
  'CL-2511': 'tracker-table',
  'CL-2512': 'event-tool',
  'CL-2513': 'event-tool',
  'CL-2514': 'tracker-table',
  'CL-2515': 'tracker-table',
  'CL-2516': 'tracker-table',
  'CL-2517': 'event-tool',
  'CL-2518': 'event-tool',
  'CL-2519': 'event-tool',
  'CL-2520': 'tracker-table',
  'CL-2521': 'event-tool',
  'CL-2522': 'tracker-table',
  'CL-2523': 'event-tool',
  'CL-2524': 'event-tool',
  'CL-2525': 'event-tool',
  'CL-2526': 'tracker-table',
  'CL-2527': 'event-tool',
  'CL-2528': 'event-tool',
  'CL-2529': 'event-tool',
  'CL-2530': 'tracker-table',
  'CL-2531': 'event-tool',
  'CL-2532': 'event-tool',
  'CL-2533': 'event-tool',
  'CL-2534': 'event-tool',
  'CL-2535': 'event-tool',
  'CL-2536': 'event-tool',
  'CL-2537': 'event-tool',
  'CL-2538': 'tracker-table',
  'CL-2539': 'event-tool',
  'CL-2540': 'event-tool',
  'CL-2541': 'tracker-table',
  'CL-2542': 'savings-goal',
  'CL-2543': 'planner',
  'CL-2544': 'event-tool',
  'CL-2545': 'event-tool',
  'CL-2546': 'event-tool',
  'CL-2547': 'event-tool',
  'CL-2548': 'savings-goal',
  'CL-2549': 'event-tool',
  'CL-2550': 'event-tool',
  'CL-2551': 'tracker-table',
  'CL-2552': 'event-tool',
  'CL-2553': 'tracker-table',
  'CL-2554': 'event-tool',
  'CL-2555': 'event-tool',
  'CL-2556': 'event-tool',
  'CL-2557': 'tracker-table',
  'CL-2558': 'event-tool',
  'CL-2559': 'event-tool',
  'CL-2560': 'tracker-table',
  'CL-2561': 'tracker-table',
  'CL-2562': 'tracker-table',
  'CL-2563': 'tracker-table',
  'CL-2564': 'event-tool',
  'CL-2565': 'event-tool',
  'CL-2566': 'tracker-table',
  'CL-2567': 'event-tool',
  'CL-2568': 'tracker-table',
  'CL-2569': 'event-tool',
  'CL-2570': 'event-tool',
  'CL-2571': 'event-tool',
  'CL-2572': 'tracker-table',
  'CL-2573': 'event-tool',
  'CL-2574': 'event-tool',
  'CL-2575': 'tracker-table',
  'CL-2576': 'event-tool',
  'CL-2577': 'event-tool',
  'CL-2578': 'event-tool',
  'CL-2579': 'tracker-table',
  'CL-2580': 'event-tool',
  'CL-2581': 'tracker-table',
  'CL-2582': 'tracker-table',
  'CL-2583': 'tracker-table',
  'CL-2584': 'event-tool',
  'CL-2585': 'event-tool',
  'CL-2586': 'event-tool',
  'CL-2587': 'event-tool',
  'CL-2588': 'event-tool',
  'CL-2589': 'tracker-table',
  'CL-2590': 'event-tool',
  'CL-2591': 'event-tool',
  'CL-2592': 'event-tool',
  'CL-2593': 'event-tool',
  'CL-2594': 'tracker-table',
  'CL-2595': 'event-tool',
  'CL-2596': 'event-tool',
  'CL-2597': 'event-tool',
  'CL-2598': 'tracker-table',
  'CL-2599': 'event-tool',
  'CL-2600': 'event-tool',
  'CL-2601': 'tracker-table',
  'CL-2602': 'event-tool',
  'CL-2603': 'event-tool',
  'CL-2604': 'event-tool',
  'CL-2605': 'event-tool',
  'CL-2606': 'event-tool',
  'CL-2607': 'event-tool',
  'CL-2608': 'event-tool',
  'CL-2609': 'event-tool',
  'CL-2610': 'event-tool',
  'CL-2611': 'study-tool',
  'CL-2612': 'planner',
  'CL-2613': 'study-tool',
  'CL-2614': 'study-tool',
  'CL-2615': 'tracker-table',
  'CL-2616': 'study-tool',
  'CL-2617': 'calculator',
  'CL-2618': 'tracker-table',
  'CL-2619': 'study-tool',
  'CL-2620': 'tracker-table',
  'CL-2621': 'tracker-table',
  'CL-2622': 'tracker-table',
  'CL-2623': 'planner',
  'CL-2624': 'loan-repayment',
  'CL-2625': 'tracker-table',
  'CL-2626': 'tracker-table',
  'CL-2627': 'tracker-table',
  'CL-2628': 'tracker-table',
  'CL-2629': 'tracker-table',
  'CL-2630': 'study-tool',
  'CL-2631': 'planner',
  'CL-2632': 'planner',
  'CL-2633': 'study-tool',
  'CL-2634': 'study-tool',
  'CL-2635': 'kpi-dashboard',
  'CL-2636': 'tracker-table',
  'CL-2637': 'study-tool',
  'CL-2638': 'study-tool',
  'CL-2639': 'planner',
  'CL-2640': 'planner',
  'CL-2641': 'planner',
  'CL-2642': 'study-tool',
  'CL-2643': 'planner',
  'CL-2644': 'tracker-table',
  'CL-2645': 'tracker-table',
  'CL-2646': 'study-tool',
  'CL-2647': 'tracker-table',
  'CL-2648': 'study-tool',
  'CL-2649': 'study-tool',
  'CL-2650': 'study-tool',
  'CL-2651': 'study-tool',
  'CL-2652': 'tracker-table',
  'CL-2653': 'tracker-table',
  'CL-2654': 'tracker-table',
  'CL-2655': 'planner',
  'CL-2656': 'planner',
  'CL-2657': 'study-tool',
  'CL-2658': 'tracker-table',
  'CL-2659': 'tracker-table',
  'CL-2660': 'tracker-table',
  'CL-2661': 'tracker-table',
  'CL-2662': 'study-tool',
  'CL-2663': 'study-tool',
  'CL-2664': 'tracker-table',
  'CL-2665': 'tracker-table',
  'CL-2666': 'tracker-table',
  'CL-2667': 'planner',
  'CL-2668': 'tracker-table',
  'CL-2669': 'tracker-table',
  'CL-2670': 'tracker-table',
  'CL-2671': 'tracker-table',
  'CL-2672': 'tracker-table',
  'CL-2673': 'study-tool',
  'CL-2674': 'tracker-table',
  'CL-2675': 'study-tool',
  'CL-2676': 'planner',
  'CL-2677': 'study-tool',
  'CL-2678': 'calculator',
  'CL-2679': 'planner',
  'CL-2680': 'tracker-table',
  'CL-2681': 'tracker-table',
  'CL-2682': 'planner',
  'CL-2683': 'study-tool',
  'CL-2684': 'tracker-table',
  'CL-2685': 'planner',
  'CL-2686': 'study-tool',
  'CL-2687': 'tracker-table',
  'CL-2688': 'tracker-table',
  'CL-2689': 'study-tool',
  'CL-2690': 'calculator',
  'CL-2691': 'study-tool',
  'CL-2692': 'kpi-dashboard',
  'CL-2693': 'planner',
  'CL-2694': 'tracker-table',
  'CL-2695': 'study-tool',
  'CL-2696': 'calculator',
  'CL-2697': 'tracker-table',
  'CL-2698': 'study-tool',
  'CL-2699': 'study-tool',
  'CL-2700': 'tracker-table',
  'CL-2701': 'loan-repayment',
  'CL-2702': 'tracker-table',
  'CL-2703': 'planner',
  'CL-2704': 'tracker-table',
  'CL-2705': 'study-tool',
  'CL-2706': 'study-tool',
  'CL-2707': 'study-tool',
  'CL-2708': 'tracker-table',
  'CL-2709': 'tracker-table',
  'CL-2710': 'tracker-table',
  'CL-2711': 'tracker-table',
  'CL-2712': 'tracker-table',
  'CL-2713': 'tracker-table',
  'CL-2714': 'tracker-table',
  'CL-2715': 'tracker-table',
  'CL-2716': 'planner',
  'CL-2717': 'tracker-table',
  'CL-2718': 'study-tool',
  'CL-2719': 'tracker-table',
  'CL-2720': 'tracker-table',
  'CL-2721': 'kpi-dashboard',
  'CL-2722': 'calculator',
  'CL-2723': 'calculator',
  'CL-2724': 'tracker-table',
  'CL-2725': 'planner',
  'CL-2726': 'planner',
  'CL-2727': 'loan-repayment',
  'CL-2728': 'study-tool',
  'CL-2729': 'study-tool',
  'CL-2730': 'tracker-table',
  'CL-2731': 'tracker-table',
  'CL-2732': 'loan-repayment',
  'CL-2733': 'tracker-table',
  'CL-2734': 'loan-repayment',
  'CL-2735': 'kpi-dashboard',
  'CL-2736': 'tracker-table',
  'CL-2737': 'study-tool',
  'CL-2738': 'planner',
  'CL-2739': 'study-tool',
  'CL-2740': 'loan-repayment',
  'CL-2741': 'study-tool',
  'CL-2742': 'study-tool',
  'CL-2743': 'tracker-table',
  'CL-2744': 'tracker-table',
  'CL-2745': 'tracker-table',
  'CL-2746': 'study-tool',
  'CL-2747': 'tracker-table',
  'CL-2748': 'planner',
  'CL-2749': 'tracker-table',
  'CL-2750': 'tracker-table',
  'CL-2751': 'tracker-table',
  'CL-2752': 'tracker-table',
  'CL-2753': 'kpi-dashboard',
  'CL-2754': 'tracker-table',
  'CL-2755': 'study-tool',
  'CL-2756': 'study-tool',
  'CL-2757': 'calculator',
  'CL-2758': 'study-tool',
  'CL-2759': 'study-tool',
  'CL-2760': 'study-tool',
  'CL-2761': 'planner',
  'CL-2762': 'study-tool',
  'CL-2763': 'study-tool',
  'CL-2764': 'tracker-table',
  'CL-2765': 'study-tool',
  'CL-2766': 'kpi-dashboard',
  'CL-2767': 'kpi-dashboard',
  'CL-2768': 'study-tool',
  'CL-2769': 'tracker-table',
  'CL-2770': 'planner',
  'CL-2771': 'tracker-table',
  'CL-2772': 'creator-tool',
  'CL-2773': 'tracker-table',
  'CL-2774': 'tracker-table',
  'CL-2775': 'tracker-table',
  'CL-2776': 'tracker-table',
  'CL-2777': 'marketing-tool',
  'CL-2778': 'tracker-table',
  'CL-2779': 'planner',
  'CL-2780': 'creator-tool',
  'CL-2781': 'creator-tool',
  'CL-2782': 'tracker-table',
  'CL-2783': 'sales-pipeline',
  'CL-2784': 'tracker-table',
  'CL-2785': 'ecommerce-tool',
  'CL-2786': 'creator-tool',
  'CL-2787': 'tracker-table',
  'CL-2788': 'tracker-table',
  'CL-2789': 'creator-tool',
  'CL-2790': 'creator-tool',
  'CL-2791': 'creator-tool',
  'CL-2792': 'creator-tool',
  'CL-2793': 'tracker-table',
  'CL-2794': 'creator-tool',
  'CL-2795': 'creator-tool',
  'CL-2796': 'tracker-table',
  'CL-2797': 'tracker-table',
  'CL-2798': 'creator-tool',
  'CL-2799': 'creator-tool',
  'CL-2800': 'tracker-table',
  'CL-2801': 'ecommerce-tool',
  'CL-2802': 'tracker-table',
  'CL-2803': 'tracker-table',
  'CL-2804': 'creator-tool',
  'CL-2805': 'creator-tool',
  'CL-2806': 'creator-tool',
  'CL-2807': 'ecommerce-tool',
  'CL-2808': 'tracker-table',
  'CL-2809': 'tracker-table',
  'CL-2810': 'creator-tool',
  'CL-2811': 'tracker-table',
  'CL-2812': 'planner',
  'CL-2813': 'creator-tool',
  'CL-2814': 'creator-tool',
  'CL-2815': 'creator-tool',
  'CL-2816': 'creator-tool',
  'CL-2817': 'ecommerce-tool',
  'CL-2818': 'tracker-table',
  'CL-2819': 'creator-tool',
  'CL-2820': 'tracker-table',
  'CL-2821': 'creator-tool',
  'CL-2822': 'sales-pipeline',
  'CL-2823': 'creator-tool',
  'CL-2824': 'tracker-table',
  'CL-2825': 'creator-tool',
  'CL-2826': 'creator-tool',
  'CL-2827': 'creator-tool',
  'CL-2828': 'tracker-table',
  'CL-2829': 'tracker-table',
  'CL-2830': 'tracker-table',
  'CL-2831': 'tracker-table',
  'CL-2832': 'tracker-table',
  'CL-2833': 'creator-tool',
  'CL-2834': 'tracker-table',
  'CL-2835': 'marketing-tool',
  'CL-2836': 'tracker-table',
  'CL-2837': 'tracker-table',
  'CL-2838': 'tracker-table',
  'CL-2839': 'tracker-table',
  'CL-2840': 'ecommerce-tool',
  'CL-2841': 'tracker-table',
  'CL-2842': 'creator-tool',
  'CL-2843': 'creator-tool',
  'CL-2844': 'tracker-table',
  'CL-2845': 'creator-tool',
  'CL-2846': 'tracker-table',
  'CL-2847': 'creator-tool',
  'CL-2848': 'creator-tool',
  'CL-2849': 'tracker-table',
  'CL-2850': 'creator-tool',
  'CL-2851': 'creator-tool',
  'CL-2852': 'tracker-table',
  'CL-2853': 'creator-tool',
  'CL-2854': 'tracker-table',
  'CL-2855': 'creator-tool',
  'CL-2856': 'tracker-table',
  'CL-2857': 'creator-tool',
  'CL-2858': 'creator-tool',
  'CL-2859': 'tracker-table',
  'CL-2860': 'tracker-table',
  'CL-2861': 'tracker-table',
  'CL-2862': 'tracker-table',
  'CL-2863': 'ecommerce-tool',
  'CL-2864': 'tracker-table',
  'CL-2865': 'tracker-table',
  'CL-2866': 'creator-tool',
  'CL-2867': 'creator-tool',
  'CL-2868': 'tracker-table',
  'CL-2869': 'tracker-table',
  'CL-2870': 'tracker-table',
  'CL-2871': 'creator-tool',
  'CL-2872': 'creator-tool',
  'CL-2873': 'creator-tool',
  'CL-2874': 'tracker-table',
  'CL-2875': 'planner',
  'CL-2876': 'tracker-table',
  'CL-2877': 'tracker-table',
  'CL-2878': 'marketing-tool',
  'CL-2879': 'creator-tool',
  'CL-2880': 'creator-tool',
  'CL-2881': 'marketing-tool',
  'CL-2882': 'creator-tool',
  'CL-2883': 'tracker-table',
  'CL-2884': 'creator-tool',
  'CL-2885': 'creator-tool',
  'CL-2886': 'tracker-table',
  'CL-2887': 'tracker-table',
  'CL-2888': 'creator-tool',
  'CL-2889': 'creator-tool',
  'CL-2890': 'tracker-table',
  'CL-2891': 'creator-tool',
  'CL-2892': 'tracker-table',
  'CL-2893': 'creator-tool',
  'CL-2894': 'creator-tool',
  'CL-2895': 'tracker-table',
  'CL-2896': 'tracker-table',
  'CL-2897': 'creator-tool',
  'CL-2898': 'marketing-tool',
  'CL-2899': 'creator-tool',
  'CL-2900': 'tracker-table',
  'CL-2901': 'tracker-table',
  'CL-2902': 'tracker-table',
  'CL-2903': 'creator-tool',
  'CL-2904': 'tracker-table',
  'CL-2905': 'tracker-table',
  'CL-2906': 'tracker-table',
  'CL-2907': 'creator-tool',
  'CL-2908': 'planner',
  'CL-2909': 'marketing-tool',
  'CL-2910': 'tracker-table',
  'CL-2911': 'creator-tool',
  'CL-2912': 'tracker-table',
  'CL-2913': 'tracker-table',
  'CL-2914': 'ecommerce-tool',
  'CL-2915': 'ecommerce-tool',
  'CL-2916': 'tracker-table',
  'CL-2917': 'tracker-table',
  'CL-2918': 'planner',
  'CL-2919': 'creator-tool',
  'CL-2920': 'tracker-table',
  'CL-2921': 'creator-tool',
  'CL-2922': 'planner',
  'CL-2923': 'ecommerce-tool',
  'CL-2924': 'creator-tool',
  'CL-2925': 'tracker-table',
  'CL-2926': 'tracker-table',
  'CL-2927': 'tracker-table',
  'CL-2928': 'marketing-tool',
  'CL-2929': 'creator-tool',
  'CL-2930': 'creator-tool',
  'CL-2931': 'net-worth',
  'CL-2932': 'operations-tool',
  'CL-2933': 'tracker-table',
  'CL-2934': 'tracker-table',
  'CL-2935': 'operations-tool',
  'CL-2936': 'net-worth',
  'CL-2937': 'operations-tool',
  'CL-2938': 'tracker-table',
  'CL-2939': 'operations-tool',
  'CL-2940': 'tracker-table',
  'CL-2941': 'tracker-table',
  'CL-2942': 'operations-tool',
  'CL-2943': 'tracker-table',
  'CL-2944': 'tracker-table',
  'CL-2945': 'tracker-table',
  'CL-2946': 'operations-tool',
  'CL-2947': 'operations-tool',
  'CL-2948': 'tracker-table',
  'CL-2949': 'tracker-table',
  'CL-2950': 'tracker-table',
  'CL-2951': 'tracker-table',
  'CL-2952': 'checklist',
  'CL-2953': 'tracker-table',
  'CL-2954': 'operations-tool',
  'CL-2955': 'checklist',
  'CL-2956': 'project-dashboard',
  'CL-2957': 'net-worth',
  'CL-2958': 'operations-tool',
  'CL-2959': 'project-dashboard',
  'CL-2960': 'operations-tool',
  'CL-2961': 'tracker-table',
  'CL-2962': 'tracker-table',
  'CL-2963': 'operations-tool',
  'CL-2964': 'tracker-table',
  'CL-2965': 'tracker-table',
  'CL-2966': 'operations-tool',
  'CL-2967': 'tracker-table',
  'CL-2968': 'operations-tool',
  'CL-2969': 'tracker-table',
  'CL-2970': 'tracker-table',
  'CL-2971': 'tracker-table',
  'CL-2972': 'tracker-table',
  'CL-2973': 'tracker-table',
  'CL-2974': 'operations-tool',
  'CL-2975': 'tracker-table',
  'CL-2976': 'checklist',
  'CL-2977': 'tracker-table',
  'CL-2978': 'operations-tool',
  'CL-2979': 'net-worth',
  'CL-2980': 'operations-tool',
  'CL-2981': 'tracker-table',
  'CL-2982': 'tracker-table',
  'CL-2983': 'net-worth',
  'CL-2984': 'tracker-table',
  'CL-2985': 'operations-tool',
  'CL-2986': 'tracker-table',
  'CL-2987': 'tracker-table',
  'CL-2988': 'tracker-table',
  'CL-2989': 'tracker-table',
  'CL-2990': 'tracker-table',
  'CL-2991': 'operations-tool',
  'CL-2992': 'project-dashboard',
  'CL-2993': 'tracker-table',
  'CL-2994': 'checklist',
  'CL-2995': 'tracker-table',
  'CL-2996': 'net-worth',
  'CL-2997': 'operations-tool',
  'CL-2998': 'operations-tool',
  'CL-2999': 'operations-tool',
  'CL-3000': 'operations-tool',
  'CL-3001': 'operations-tool',
  'CL-3002': 'tracker-table',
  'CL-3003': 'project-dashboard',
  'CL-3004': 'operations-tool',
  'CL-3005': 'tracker-table',
  'CL-3006': 'tracker-table',
  'CL-3007': 'operations-tool',
  'CL-3008': 'operations-tool',
  'CL-3009': 'tracker-table',
  'CL-3010': 'tracker-table',
  'CL-3011': 'operations-tool',
  'CL-3012': 'tracker-table',
  'CL-3013': 'tracker-table',
  'CL-3014': 'tracker-table',
  'CL-3015': 'tracker-table',
  'CL-3016': 'operations-tool',
  'CL-3017': 'operations-tool',
  'CL-3018': 'project-dashboard',
  'CL-3019': 'tracker-table',
  'CL-3020': 'net-worth',
  'CL-3021': 'tracker-table',
  'CL-3022': 'operations-tool',
  'CL-3023': 'operations-tool',
  'CL-3024': 'project-dashboard',
  'CL-3025': 'operations-tool',
  'CL-3026': 'tracker-table',
  'CL-3027': 'tracker-table',
  'CL-3028': 'tracker-table',
  'CL-3029': 'operations-tool',
  'CL-3030': 'checklist',
  'CL-3031': 'checklist',
  'CL-3032': 'operations-tool',
  'CL-3033': 'tracker-table',
  'CL-3034': 'net-worth',
  'CL-3035': 'tracker-table',
  'CL-3036': 'operations-tool',
  'CL-3037': 'operations-tool',
  'CL-3038': 'tracker-table',
  'CL-3039': 'tracker-table',
  'CL-3040': 'tracker-table',
  'CL-3041': 'tracker-table',
  'CL-3042': 'tracker-table',
  'CL-3043': 'tracker-table',
  'CL-3044': 'tracker-table',
  'CL-3045': 'operations-tool',
  'CL-3046': 'operations-tool',
  'CL-3047': 'operations-tool',
  'CL-3048': 'checklist',
  'CL-3049': 'tracker-table',
  'CL-3050': 'tracker-table',
  'CL-3051': 'operations-tool',
  'CL-3052': 'tracker-table',
  'CL-3053': 'operations-tool',
  'CL-3054': 'operations-tool',
  'CL-3055': 'tracker-table',
  'CL-3056': 'tracker-table',
  'CL-3057': 'net-worth',
  'CL-3058': 'net-worth',
  'CL-3059': 'net-worth',
  'CL-3060': 'tracker-table',
  'CL-3061': 'operations-tool',
  'CL-3062': 'operations-tool',
  'CL-3063': 'project-dashboard',
  'CL-3064': 'tracker-table',
  'CL-3065': 'operations-tool',
  'CL-3066': 'operations-tool',
  'CL-3067': 'operations-tool',
  'CL-3068': 'checklist',
  'CL-3069': 'operations-tool',
  'CL-3070': 'operations-tool',
  'CL-3071': 'tracker-table',
  'CL-3072': 'tracker-table',
  'CL-3073': 'tracker-table',
  'CL-3074': 'checklist',
  'CL-3075': 'tracker-table',
  'CL-3076': 'tracker-table',
  'CL-3077': 'tracker-table',
  'CL-3078': 'operations-tool',
  'CL-3079': 'tracker-table',
  'CL-3080': 'tracker-table',
  'CL-3081': 'tracker-table',
  'CL-3082': 'tracker-table',
  'CL-3083': 'net-worth',
  'CL-3084': 'tracker-table',
  'CL-3085': 'project-dashboard',
  'CL-3086': 'tracker-table',
  'CL-3087': 'tracker-table',
  'CL-3088': 'tracker-table',
  'CL-3089': 'tracker-table',
  'CL-3090': 'operations-tool',
  'CL-3091': 'tracker-table',
  'CL-3092': 'operations-tool',
  'CL-3093': 'tracker-table',
  'CL-3094': 'tracker-table',
  'CL-3095': 'operations-tool',
  'CL-3096': 'operations-tool',
  'CL-3097': 'checklist',
  'CL-3098': 'tracker-table',
  'CL-3099': 'tracker-table',
  'CL-3100': 'tracker-table',
  'CL-3101': 'tracker-table',
  'CL-3102': 'operations-tool',
  'CL-3103': 'tracker-table',
  'CL-3104': 'tracker-table',
  'CL-3105': 'tracker-table',
  'CL-3106': 'tracker-table',
  'CL-3107': 'tracker-table',
  'CL-3108': 'operations-tool',
  'CL-3109': 'tracker-table',
  'CL-3110': 'tracker-table',
  'CL-3111': 'health-tool',
  'CL-3112': 'health-tool',
  'CL-3113': 'tracker-table',
  'CL-3114': 'tracker-table',
  'CL-3115': 'insurance-comparison',
  'CL-3116': 'tracker-table',
  'CL-3117': 'health-tool',
  'CL-3118': 'planner',
  'CL-3119': 'tracker-table',
  'CL-3120': 'tracker-table',
  'CL-3121': 'tracker-table',
  'CL-3122': 'tracker-table',
  'CL-3123': 'invoice-tool',
  'CL-3124': 'health-tool',
  'CL-3125': 'tracker-table',
  'CL-3126': 'tracker-table',
  'CL-3127': 'tracker-table',
  'CL-3128': 'health-tool',
  'CL-3129': 'tracker-table',
  'CL-3130': 'health-tool',
  'CL-3131': 'health-tool',
  'CL-3132': 'tracker-table',
  'CL-3133': 'health-tool',
  'CL-3134': 'tracker-table',
  'CL-3135': 'health-tool',
  'CL-3136': 'tracker-table',
  'CL-3137': 'tracker-table',
  'CL-3138': 'tracker-table',
  'CL-3139': 'tracker-table',
  'CL-3140': 'tracker-table',
  'CL-3141': 'health-tool',
  'CL-3142': 'tracker-table',
  'CL-3143': 'health-tool',
  'CL-3144': 'tracker-table',
  'CL-3145': 'tracker-table',
  'CL-3146': 'tracker-table',
  'CL-3147': 'tracker-table',
  'CL-3148': 'tracker-table',
  'CL-3149': 'tracker-table',
  'CL-3150': 'tracker-table',
  'CL-3151': 'invoice-tool',
  'CL-3152': 'tracker-table',
  'CL-3153': 'health-tool',
  'CL-3154': 'tracker-table',
  'CL-3155': 'health-tool',
  'CL-3156': 'tracker-table',
  'CL-3157': 'health-tool',
  'CL-3158': 'tracker-table',
  'CL-3159': 'tracker-table',
  'CL-3160': 'tracker-table',
  'CL-3161': 'health-tool',
  'CL-3162': 'tracker-table',
  'CL-3163': 'insurance-comparison',
  'CL-3164': 'health-tool',
  'CL-3165': 'health-tool',
  'CL-3166': 'planner',
  'CL-3167': 'tracker-table',
  'CL-3168': 'tracker-table',
  'CL-3169': 'health-tool',
  'CL-3170': 'tracker-table',
  'CL-3171': 'planner',
  'CL-3172': 'planner',
  'CL-3173': 'tracker-table',
  'CL-3174': 'health-tool',
  'CL-3175': 'tracker-table',
  'CL-3176': 'tracker-table',
  'CL-3177': 'tracker-table',
  'CL-3178': 'tracker-table',
  'CL-3179': 'planner',
  'CL-3180': 'tracker-table',
  'CL-3181': 'insurance-comparison',
  'CL-3182': 'health-tool',
  'CL-3183': 'tracker-table',
  'CL-3184': 'health-tool',
  'CL-3185': 'insurance-comparison',
  'CL-3186': 'planner',
  'CL-3187': 'tracker-table',
  'CL-3188': 'tracker-table',
  'CL-3189': 'invoice-tool',
  'CL-3190': 'insurance-comparison',
  'CL-3191': 'tracker-table',
  'CL-3192': 'health-tool',
  'CL-3193': 'health-tool',
  'CL-3194': 'tracker-table',
  'CL-3195': 'tracker-table',
  'CL-3196': 'tracker-table',
  'CL-3197': 'tracker-table',
  'CL-3198': 'health-tool',
  'CL-3199': 'tracker-table',
  'CL-3200': 'tracker-table',
  'CL-3201': 'tracker-table',
  'CL-3202': 'tracker-table',
  'CL-3203': 'tracker-table',
  'CL-3204': 'tracker-table',
  'CL-3205': 'tracker-table',
  'CL-3206': 'tracker-table',
  'CL-3207': 'tracker-table',
  'CL-3208': 'planner',
  'CL-3209': 'health-tool',
  'CL-3210': 'health-tool',
  'CL-3211': 'tracker-table',
  'CL-3212': 'tracker-table',
  'CL-3213': 'health-tool',
  'CL-3214': 'tracker-table',
  'CL-3215': 'health-tool',
  'CL-3216': 'tracker-table',
  'CL-3217': 'tracker-table',
  'CL-3218': 'tracker-table',
  'CL-3219': 'tracker-table',
  'CL-3220': 'health-tool',
  'CL-3221': 'tracker-table',
  'CL-3222': 'tracker-table',
  'CL-3223': 'invoice-tool',
  'CL-3224': 'tracker-table',
  'CL-3225': 'health-tool',
  'CL-3226': 'tracker-table',
  'CL-3227': 'tracker-table',
  'CL-3228': 'health-tool',
  'CL-3229': 'tracker-table',
  'CL-3230': 'insurance-comparison',
  'CL-3231': 'health-tool',
  'CL-3232': 'health-tool',
  'CL-3233': 'invoice-tool',
  'CL-3234': 'health-tool',
  'CL-3235': 'health-tool',
  'CL-3236': 'tracker-table',
  'CL-3237': 'tracker-table',
  'CL-3238': 'health-tool',
  'CL-3239': 'health-tool',
  'CL-3240': 'health-tool',
  'CL-3241': 'tracker-table',
  'CL-3242': 'tracker-table',
  'CL-3243': 'insurance-comparison',
  'CL-3244': 'health-tool',
  'CL-3245': 'tracker-table',
  'CL-3246': 'tracker-table',
  'CL-3247': 'health-tool',
  'CL-3248': 'health-tool',
  'CL-3249': 'tracker-table',
  'CL-3250': 'tracker-table',
  'CL-3251': 'health-tool',
  'CL-3252': 'tracker-table',
  'CL-3253': 'health-tool',
  'CL-3254': 'insurance-comparison',
  'CL-3255': 'health-tool',
  'CL-3256': 'tracker-table',
  'CL-3257': 'health-tool',
  'CL-3258': 'tracker-table',
  'CL-3259': 'tracker-table',
  'CL-3260': 'tracker-table',
  'CL-3261': 'tracker-table',
  'CL-3262': 'checklist',
  'CL-3263': 'checklist',
  'CL-3264': 'tracker-table',
  'CL-3265': 'tracker-table',
  'CL-3266': 'tracker-table',
  'CL-3267': 'tracker-table',
  'CL-3268': 'tracker-table',
  'CL-3269': 'invoice-tool',
  'CL-3270': 'freelance-tool',
  'CL-3271': 'checklist',
  'CL-3272': 'checklist',
  'CL-3273': 'checklist',
  'CL-3274': 'checklist',
  'CL-3275': 'checklist',
  'CL-3276': 'checklist',
  'CL-3277': 'tracker-table',
  'CL-3278': 'tracker-table',
  'CL-3279': 'tracker-table',
  'CL-3280': 'tracker-table',
  'CL-3281': 'tracker-table',
  'CL-3282': 'tracker-table',
  'CL-3283': 'tracker-table',
  'CL-3284': 'tracker-table',
  'CL-3285': 'tracker-table',
  'CL-3286': 'checklist',
  'CL-3287': 'tracker-table',
  'CL-3288': 'freelance-tool',
  'CL-3289': 'checklist',
  'CL-3290': 'checklist',
  'CL-3291': 'checklist',
  'CL-3292': 'tracker-table',
  'CL-3293': 'tracker-table',
  'CL-3294': 'checklist',
  'CL-3295': 'tracker-table',
  'CL-3296': 'tracker-table',
  'CL-3297': 'tracker-table',
  'CL-3298': 'checklist',
  'CL-3299': 'tracker-table',
  'CL-3300': 'checklist',
  'CL-3301': 'tracker-table',
  'CL-3302': 'checklist',
  'CL-3303': 'tracker-table',
  'CL-3304': 'freelance-tool',
  'CL-3305': 'tracker-table',
  'CL-3306': 'checklist',
  'CL-3307': 'checklist',
  'CL-3308': 'tracker-table',
  'CL-3309': 'tracker-table',
  'CL-3310': 'tracker-table',
  'CL-3311': 'checklist',
  'CL-3312': 'tracker-table',
  'CL-3313': 'tracker-table',
  'CL-3314': 'checklist',
  'CL-3315': 'checklist',
  'CL-3316': 'checklist',
  'CL-3317': 'checklist',
  'CL-3318': 'tracker-table',
  'CL-3319': 'tracker-table',
  'CL-3320': 'checklist',
  'CL-3321': 'tracker-table',
  'CL-3322': 'checklist',
  'CL-3323': 'tracker-table',
  'CL-3324': 'tracker-table',
  'CL-3325': 'checklist',
  'CL-3326': 'tracker-table',
  'CL-3327': 'tracker-table',
  'CL-3328': 'tracker-table',
  'CL-3329': 'checklist',
  'CL-3330': 'tracker-table',
  'CL-3331': 'tracker-table',
  'CL-3332': 'checklist',
  'CL-3333': 'tracker-table',
  'CL-3334': 'tracker-table',
  'CL-3335': 'checklist',
  'CL-3336': 'checklist',
  'CL-3337': 'tracker-table',
  'CL-3338': 'tracker-table',
  'CL-3339': 'tracker-table',
  'CL-3340': 'checklist',
  'CL-3341': 'checklist',
  'CL-3342': 'checklist',
  'CL-3343': 'checklist',
  'CL-3344': 'checklist',
  'CL-3345': 'tracker-table',
  'CL-3346': 'checklist',
  'CL-3347': 'tracker-table',
  'CL-3348': 'checklist',
  'CL-3349': 'tracker-table',
  'CL-3350': 'tracker-table',
  'CL-3351': 'checklist',
  'CL-3352': 'checklist',
  'CL-3353': 'invoice-tool',
  'CL-3354': 'checklist',
  'CL-3355': 'tracker-table',
  'CL-3356': 'tracker-table',
  'CL-3357': 'checklist',
  'CL-3358': 'checklist',
  'CL-3359': 'tracker-table',
  'CL-3360': 'checklist',
  'CL-3361': 'tracker-table',
  'CL-3362': 'tracker-table',
  'CL-3363': 'invoice-tool',
  'CL-3364': 'checklist',
  'CL-3365': 'tracker-table',
  'CL-3366': 'tracker-table',
  'CL-3367': 'tracker-table',
  'CL-3368': 'tracker-table',
  'CL-3369': 'tracker-table',
  'CL-3370': 'tracker-table',
  'CL-3371': 'tracker-table',
  'CL-3372': 'tracker-table',
  'CL-3373': 'tracker-table',
  'CL-3374': 'tracker-table',
  'CL-3375': 'invoice-tool',
  'CL-3376': 'tracker-table',
  'CL-3377': 'tracker-table',
  'CL-3378': 'checklist',
  'CL-3379': 'checklist',
  'CL-3380': 'checklist',
  'CL-3381': 'kpi-dashboard',
  'CL-3382': 'kpi-dashboard',
  'CL-3383': 'kpi-dashboard',
  'CL-3384': 'kpi-dashboard',
  'CL-3385': 'kpi-dashboard',
  'CL-3386': 'kpi-dashboard',
  'CL-3387': 'kpi-dashboard',
  'CL-3388': 'kpi-dashboard',
  'CL-3389': 'kpi-dashboard',
  'CL-3390': 'kpi-dashboard',
  'CL-3391': 'kpi-dashboard',
  'CL-3392': 'kpi-dashboard',
  'CL-3393': 'kpi-dashboard',
  'CL-3394': 'kpi-dashboard',
  'CL-3395': 'kpi-dashboard',
  'CL-3396': 'kpi-dashboard',
  'CL-3397': 'kpi-dashboard',
  'CL-3398': 'cash-flow-planner',
  'CL-3399': 'kpi-dashboard',
  'CL-3400': 'kpi-dashboard',
  'CL-3401': 'kpi-dashboard',
  'CL-3402': 'kpi-dashboard',
  'CL-3403': 'kpi-dashboard',
  'CL-3404': 'kpi-dashboard',
  'CL-3405': 'kpi-dashboard',
  'CL-3406': 'kpi-dashboard',
  'CL-3407': 'kpi-dashboard',
  'CL-3408': 'kpi-dashboard',
  'CL-3409': 'kpi-dashboard',
  'CL-3410': 'kpi-dashboard',
  'CL-3411': 'kpi-dashboard',
  'CL-3412': 'kpi-dashboard',
  'CL-3413': 'kpi-dashboard',
  'CL-3414': 'kpi-dashboard',
  'CL-3415': 'kpi-dashboard',
  'CL-3416': 'kpi-dashboard',
  'CL-3417': 'kpi-dashboard',
  'CL-3418': 'kpi-dashboard',
  'CL-3419': 'kpi-dashboard',
  'CL-3420': 'kpi-dashboard',
  'CL-3421': 'kpi-dashboard',
  'CL-3422': 'kpi-dashboard',
  'CL-3423': 'kpi-dashboard',
  'CL-3424': 'kpi-dashboard',
  'CL-3425': 'kpi-dashboard',
  'CL-3426': 'kpi-dashboard',
  'CL-3427': 'kpi-dashboard',
  'CL-3428': 'kpi-dashboard',
  'CL-3429': 'kpi-dashboard',
  'CL-3430': 'kpi-dashboard',
  'CL-3431': 'kpi-dashboard',
  'CL-3432': 'cash-flow-planner',
  'CL-3433': 'kpi-dashboard',
  'CL-3434': 'kpi-dashboard',
  'CL-3435': 'kpi-dashboard',
  'CL-3436': 'kpi-dashboard',
  'CL-3437': 'kpi-dashboard',
  'CL-3438': 'kpi-dashboard',
  'CL-3439': 'kpi-dashboard',
  'CL-3440': 'kpi-dashboard',
  'CL-3441': 'kpi-dashboard',
  'CL-3442': 'kpi-dashboard',
  'CL-3443': 'kpi-dashboard',
  'CL-3444': 'kpi-dashboard',
  'CL-3445': 'kpi-dashboard',
  'CL-3446': 'kpi-dashboard',
  'CL-3447': 'kpi-dashboard',
  'CL-3448': 'kpi-dashboard',
  'CL-3449': 'kpi-dashboard',
  'CL-3450': 'kpi-dashboard',
  'CL-3451': 'kpi-dashboard',
  'CL-3452': 'kpi-dashboard',
  'CL-3453': 'kpi-dashboard',
  'CL-3454': 'kpi-dashboard',
  'CL-3455': 'kpi-dashboard',
  'CL-3456': 'kpi-dashboard',
  'CL-3457': 'kpi-dashboard',
  'CL-3458': 'kpi-dashboard',
  'CL-3459': 'kpi-dashboard',
  'CL-3460': 'kpi-dashboard',
  'CL-3461': 'kpi-dashboard',
  'CL-3462': 'kpi-dashboard',
  'CL-3463': 'kpi-dashboard',
  'CL-3464': 'kpi-dashboard',
  'CL-3465': 'cash-flow-planner',
  'CL-3466': 'kpi-dashboard',
  'CL-3467': 'kpi-dashboard',
  'CL-3468': 'kpi-dashboard',
  'CL-3469': 'kpi-dashboard',
  'CL-3470': 'kpi-dashboard',
  'CL-3471': 'kpi-dashboard',
  'CL-3472': 'kpi-dashboard',
  'CL-3473': 'kpi-dashboard',
  'CL-3474': 'kpi-dashboard',
  'CL-3475': 'kpi-dashboard',
  'CL-3476': 'kpi-dashboard',
  'CL-3477': 'kpi-dashboard',
  'CL-3478': 'kpi-dashboard',
  'CL-3479': 'kpi-dashboard',
  'CL-3480': 'kpi-dashboard',
  'CL-3481': 'kpi-dashboard',
  'CL-3482': 'kpi-dashboard',
  'CL-3483': 'kpi-dashboard',
  'CL-3484': 'kpi-dashboard',
  'CL-3485': 'kpi-dashboard',
  'CL-3486': 'kpi-dashboard',
  'CL-3487': 'kpi-dashboard',
  'CL-3488': 'kpi-dashboard',
  'CL-3489': 'kpi-dashboard',
  'CL-3490': 'kpi-dashboard',
  'CL-3491': 'kpi-dashboard',
  'CL-3492': 'kpi-dashboard',
  'CL-3493': 'kpi-dashboard',
  'CL-3494': 'kpi-dashboard',
  'CL-3495': 'kpi-dashboard',
  'CL-3496': 'kpi-dashboard',
  'CL-3497': 'kpi-dashboard',
  'CL-3498': 'kpi-dashboard',
  'CL-3499': 'kpi-dashboard',
  'CL-3500': 'kpi-dashboard',
  'CL-3501': 'cash-flow-planner',
  'CL-3502': 'kpi-dashboard',
  'CL-3503': 'kpi-dashboard',
  'CL-3504': 'cash-flow-planner',
  'CL-3505': 'kpi-dashboard',
  'CL-3506': 'kpi-dashboard',
  'CL-3507': 'kpi-dashboard',
  'CL-3508': 'kpi-dashboard',
  'CL-3509': 'kpi-dashboard',
  'CL-3510': 'kpi-dashboard',
  'CL-3511': 'kpi-dashboard',
  'CL-3512': 'kpi-dashboard',
  'CL-3513': 'kpi-dashboard',
  'CL-3514': 'kpi-dashboard',
  'CL-3515': 'kpi-dashboard',
  'CL-3516': 'kpi-dashboard',
  'CL-3517': 'kpi-dashboard',
  'CL-3518': 'kpi-dashboard',
  'CL-3519': 'kpi-dashboard',
  'CL-3520': 'kpi-dashboard',
  'CL-3521': 'kpi-dashboard',
  'CL-3522': 'cash-flow-planner',
  'CL-3523': 'kpi-dashboard',
  'CL-3524': 'kpi-dashboard',
  'CL-3525': 'cash-flow-planner',
  'CL-3526': 'kpi-dashboard',
  'CL-3527': 'kpi-dashboard',
  'CL-3528': 'kpi-dashboard',
  'CL-3529': 'kpi-dashboard',
  'CL-3530': 'kpi-dashboard',
  'CL-3531': 'kpi-dashboard',
  'CL-3532': 'kpi-dashboard',
  'CL-3533': 'kpi-dashboard',
  'CL-3534': 'kpi-dashboard',
  'CL-3535': 'kpi-dashboard',
  'CL-3536': 'kpi-dashboard',
  'CL-3537': 'kpi-dashboard',
  'CL-3538': 'kpi-dashboard',
  'CL-3539': 'kpi-dashboard',
  'CL-3540': 'kpi-dashboard',
  'CL-3541': 'kpi-dashboard',
  'CL-3542': 'kpi-dashboard',
  'CL-3543': 'cash-flow-planner',
  'CL-3544': 'kpi-dashboard',
  'CL-3545': 'kpi-dashboard',
  'CL-3546': 'kpi-dashboard',
  'CL-3547': 'kpi-dashboard',
  'CL-3548': 'kpi-dashboard',
  'CL-3549': 'kpi-dashboard',
  'CL-3550': 'kpi-dashboard',
  'CL-3551': 'kpi-dashboard',
  'CL-3552': 'kpi-dashboard',
  'CL-3553': 'kpi-dashboard',
  'CL-3554': 'kpi-dashboard',
  'CL-3555': 'kpi-dashboard',
  'CL-3556': 'kpi-dashboard',
  'CL-3557': 'kpi-dashboard',
  'CL-3558': 'kpi-dashboard',
  'CL-3559': 'kpi-dashboard',
  'CL-3560': 'kpi-dashboard'
}

export function getToolConfig(tool) {
  if (!tool) return {}
  const n = (tool.name || '').toLowerCase()

  // ── Period ──────────────────────────────────────────────────
  let period = 'monthly', periodLabel = 'Monthly'
  if (n.includes('weekly') || n.includes('week')) { period = 'weekly'; periodLabel = 'Weekly' }
  else if (n.includes('daily')) { period = 'daily'; periodLabel = 'Daily' }
  else if (n.includes('annual') || n.includes('year')) { period = 'annual'; periodLabel = 'Annual' }
  else if (n.includes('paycheck') || n.includes('per pay')) { period = 'paycheck'; periodLabel = 'Per Paycheck' }
  else if (n.includes('quarterly')) { period = 'quarterly'; periodLabel = 'Quarterly' }

  // ── Audience ─────────────────────────────────────────────────
  let audience = '', audienceLabel = ''
  if (n.includes('family')) { audience = 'family'; audienceLabel = 'Family' }
  else if (n.includes('couple')) { audience = 'couple'; audienceLabel = 'Couple' }
  else if (n.includes('single parent')) { audience = 'single_parent'; audienceLabel = 'Single Parent' }
  else if (n.includes('freelancer') || n.includes('freelance')) { audience = 'freelancer'; audienceLabel = 'Freelancer' }
  else if (n.includes('student')) { audience = 'student'; audienceLabel = 'Student' }
  else if (n.includes('teen')) { audience = 'teen'; audienceLabel = 'Teen' }
  else if (n.includes('retirement') || n.includes('retired')) { audience = 'retirement'; audienceLabel = 'Retirement' }
  else if (n.includes('small business')) { audience = 'business'; audienceLabel = 'Business' }
  else if (n.includes('high income')) { audience = 'high_income'; audienceLabel = 'High Income' }
  else if (n.includes('low income')) { audience = 'low_income'; audienceLabel = 'Low Income' }

  // ── Savings goal type ────────────────────────────────────────
  let savingsGoal = 'general', savingsTarget = 5000
  let savingsIcon = 'ti-piggy-bank', savingsColor = '#1d9e75'
  if (n.includes('emergency fund')) { savingsGoal='emergency'; savingsTarget=10000; savingsIcon='ti-shield'; savingsColor='#378add' }
  else if (n.includes('vacation') || n.includes('holiday')) { savingsGoal='vacation'; savingsTarget=3000; savingsIcon='ti-plane'; savingsColor='#7f77dd' }
  else if (n.includes('house deposit') || n.includes('home deposit')) { savingsGoal='house'; savingsTarget=25000; savingsIcon='ti-home'; savingsColor='#ba7517' }
  else if (n.includes('car savings') || n.includes('car saving')) { savingsGoal='car'; savingsTarget=12000; savingsIcon='ti-car'; savingsColor='#d4537e' }
  else if (n.includes('education savings') || n.includes('college')) { savingsGoal='education'; savingsTarget=20000; savingsIcon='ti-school'; savingsColor='#639922' }
  else if (n.includes('no-spend') || n.includes('no spend')) { savingsGoal='no_spend'; savingsTarget=0; savingsIcon='ti-ban'; savingsColor='#e24b4a' }
  else if (n.includes('sinking fund')) { savingsGoal='sinking'; savingsTarget=2000; savingsIcon='ti-wallet'; savingsColor='#ef9f27' }
  else if (n.includes('christmas') || n.includes('xmas')) { savingsGoal='christmas'; savingsTarget=1000; savingsIcon='ti-gift'; savingsColor='#d4537e' }

  // ── Income type ──────────────────────────────────────────────
  let incomeType = 'general', incomeLabel = 'Income'
  if (n.includes('salary')) { incomeType='salary'; incomeLabel='Salary' }
  else if (n.includes('commission')) { incomeType='commission'; incomeLabel='Commission' }
  else if (n.includes('bonus')) { incomeType='bonus'; incomeLabel='Bonus' }
  else if (n.includes('passive income')) { incomeType='passive'; incomeLabel='Passive Income' }
  else if (n.includes('side income')) { incomeType='side'; incomeLabel='Side Income' }
  else if (n.includes('rental income')) { incomeType='rental'; incomeLabel='Rental Income' }
  else if (n.includes('freelance income')) { incomeType='freelance'; incomeLabel='Freelance Income' }

  // ── Expense type ─────────────────────────────────────────────
  let expenseType = 'general'
  if (n.includes('medical') || n.includes('health expense')) expenseType = 'medical'
  else if (n.includes('pet')) expenseType = 'pet'
  else if (n.includes('childcare') || n.includes('child care')) expenseType = 'childcare'
  else if (n.includes('household')) expenseType = 'household'
  else if (n.includes('recurring')) expenseType = 'recurring'
  else if (n.includes('shared')) expenseType = 'shared'
  else if (n.includes('daily spending')) expenseType = 'daily'
  else if (n.includes('category spend')) expenseType = 'category'
  else if (n.includes('lifestyle')) expenseType = 'lifestyle'
  else if (n.includes('subscription')) expenseType = 'subscription'
  else if (n.includes('bill')) expenseType = 'bills'

  // Period multipliers for scaling defaults
  const mult = { daily: 1/30, weekly: 7/30, monthly: 1, annual: 12, paycheck: 0.5, quarterly: 3 }[period] || 1

  return {
    period, periodLabel, audience, audienceLabel,
    savingsGoal, savingsTarget, savingsIcon, savingsColor,
    incomeType, incomeLabel, expenseType, mult,
    // Scaled defaults
    defIncome:    Math.round(2500 * mult),
    defRent:      Math.round(900  * mult),
    defFood:      Math.round(300  * mult),
    defTransport: Math.round(150  * mult),
    defPersonal:  Math.round(200  * mult),
    defSavings:   Math.round(250  * mult),
    defFun:       Math.round(100  * mult),
  }
}

const fmtShort = (n, sym = '£') => `${sym}${Math.round(Math.abs(n)).toLocaleString('en-GB')}`
const fmtPct = n => `${n.toFixed(1)}%`

// ── SHARED: NumberInput ────────────────────────────────────────
function NumInput({ label, value, onChange, prefix = '£', suffix = '', id }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, minHeight:34 }}>
      {label && <span style={{ fontSize:12, color:'var(--txt2)', flex:1, minWidth:0 }}>{label}</span>}
      <div style={{ position:'relative', width:140, flexShrink:0 }}>
        {prefix && <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--txt3)', pointerEvents:'none', zIndex:1 }}>{prefix}</span>}
        <input id={id} type="text" inputMode="decimal"
          value={value === 0 ? '' : String(value)} placeholder="0"
          onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) onChange(parseFloat(e.target.value) || 0) }}
          onFocus={e => { e.target.style.borderColor='var(--bdr2)'; e.target.select() }}
          onBlur={e => e.target.style.borderColor='var(--bdr)'}
          style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:7,
            padding:`8px ${suffix?'28px':'10px'} 8px ${prefix?'24px':'10px'}`,
            fontSize:13, color:'var(--txt)', fontFamily:'inherit', outline:'none', textAlign:'right' }}/>
        {suffix && <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--txt3)', pointerEvents:'none' }}>{suffix}</span>}
      </div>
    </div>
  )
}

// ── SHARED: SectionBlock ──────────────────────────────────────
function SectionBlock({ title, icon, color, children, total, totalLabel, collapsible = true }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ background:'var(--bg2)', border:`1px solid ${open ? color+'44' : 'var(--bdr)'}`, borderRadius:12, overflow:'hidden', transition:'border .2s' }}>
      <div onClick={() => collapsible && setOpen(o=>!o)}
        style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, cursor:collapsible?'pointer':'default', userSelect:'none', background:open?`${color}08`:'transparent' }}>
        <div style={{ width:30, height:30, borderRadius:8, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <i className={`ti ${icon}`} style={{ fontSize:14, color }} aria-hidden="true"/>
        </div>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, color:'var(--txt)', flex:1 }}>{title}</div>
        {total !== undefined && <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color }}>{fmt(total)}</div>}
        {collapsible && <i className={`ti ti-chevron-${open?'up':'down'}`} style={{ fontSize:13, color:'var(--txt3)', flexShrink:0, marginLeft:4 }} aria-hidden="true"/>}
      </div>
      {open && <div style={{ padding:'12px 16px', borderTop:'1px solid var(--bdr)', display:'flex', flexDirection:'column', gap:10 }}>{children}</div>}
    </div>
  )
}

// ── SHARED: AddCustomRow ──────────────────────────────────────
function AddCustomRows({ sectionId, onAdd, extras, onRemove, onUpdateLabel, onUpdateValue, values }) {
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [pending, setPending] = useState({})

  const addRow = () => {
    const id = `custom_${sectionId}_${Date.now()}`
    onAdd(id)
    setPending(p => ({ ...p, [id]: '' }))
  }

  return (
    <>
      {extras.map(ex => (
        <div key={ex} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input value={pending[ex] || ''}
            onChange={e => { setPending(p => ({ ...p, [ex]: e.target.value })); onUpdateLabel(ex, e.target.value) }}
            placeholder="Item name..."
            onFocus={e => e.target.style.borderColor='var(--bdr2)'}
            onBlur={e => e.target.style.borderColor='var(--bdr)'}
            style={{ flex:1, background:'var(--bg4)', border:'1px solid var(--bdr)', borderRadius:7, padding:'7px 10px', fontSize:12, color:'var(--txt)', fontFamily:'inherit', outline:'none', minWidth:0 }}/>
          <div style={{ position:'relative', width:140, flexShrink:0 }}>
            <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--txt3)' }}>{sym}</span>
            <input type="text" inputMode="decimal" value={values[ex]||''} placeholder="0"
              onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) onUpdateValue(ex, parseFloat(e.target.value)||0) }}
              onFocus={e => { e.target.style.borderColor='var(--bdr2)'; e.target.select() }}
              onBlur={e => e.target.style.borderColor='var(--bdr)'}
              style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:7, padding:'7px 10px 7px 24px', fontSize:13, color:'var(--txt)', fontFamily:'inherit', outline:'none', textAlign:'right' }}/>
          </div>
          <button onClick={() => { onRemove(ex); setPending(p => { const n={...p}; delete n[ex]; return n }) }}
            style={{ background:'rgba(226,75,74,.08)', border:'1px solid rgba(226,75,74,.2)', borderRadius:6, cursor:'pointer', padding:'6px 8px', flexShrink:0 }}>
            <i className="ti ti-trash" style={{ fontSize:12, color:'#e24b4a' }} aria-hidden="true"/>
          </button>
        </div>
      ))}
      <button onClick={addRow}
        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px dashed var(--bdr)', background:'transparent', fontSize:11, color:'var(--txt3)', cursor:'pointer', fontFamily:'inherit', alignSelf:'flex-start', transition:'all .15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--bdr)'; e.currentTarget.style.color='var(--txt3)' }}>
        <i className="ti ti-plus" style={{ fontSize:11 }} aria-hidden="true"/> Add custom row
      </button>
    </>
  )
}

// ── SHARED: ExportModal ───────────────────────────────────────
function ExportModal({ open, onClose, onExport }) {
  const [format, setFormat] = useState('pdf-premium')
  const [pw, setPw] = useState('')
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:16, padding:28, maxWidth:420, width:'100%', boxShadow:'0 24px 60px rgba(0,0,0,.7)' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'var(--txt)', marginBottom:4 }}>Export</div>
        <div style={{ fontSize:12, color:'var(--txt2)', marginBottom:20 }}>Choose format and protection</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
          {[['csv','CSV','.csv','ti-file-text','#378add'],['excel','Excel','.xls','ti-file-spreadsheet','#1d9e75'],['pdf-plain','PDF Plain','.pdf','ti-file-type-pdf','#d85a30'],['pdf-premium','PDF Premium','.pdf','ti-crown','#c9a96e']].map(([id,label,ext,icon,color]) => (
            <div key={id} onClick={() => setFormat(id)}
              style={{ padding:12, borderRadius:9, border:`2px solid ${format===id?color:'var(--bdr)'}`, background:format===id?`${color}14`:'var(--bg3)', cursor:'pointer', textAlign:'center', transition:'all .15s' }}>
              <i className={`ti ${icon}`} style={{ fontSize:22, color, display:'block', marginBottom:6 }} aria-hidden="true"/>
              <div style={{ fontSize:12, fontWeight:600, color:format===id?color:'var(--txt)' }}>{label}</div>
              <div style={{ fontSize:10, color:'var(--txt3)' }}>{ext}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--txt3)', marginBottom:8 }}>Password (optional)</div>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Leave blank = no protection"
            style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:7, padding:'8px 12px', fontSize:12, color:'var(--txt)', fontFamily:'inherit', outline:'none' }}/>
        </div>
        <div style={{ background:'var(--gold3)', border:'1px solid var(--bdr2)', borderRadius:8, padding:'8px 12px', marginBottom:16, fontSize:11, color:'var(--txt2)' }}>
          🔒 All exports include CLARIS watermark. Redistribution prohibited.
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:'var(--r)', border:'1px solid var(--bdr)', background:'transparent', fontSize:12, color:'var(--txt2)', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={() => { onExport(format, pw); onClose() }}
            style={{ padding:'9px 20px', borderRadius:'var(--r)', border:'none', background:'var(--gold)', fontSize:12, fontWeight:600, color:'#0c0c12', cursor:'pointer', fontFamily:'Syne,sans-serif' }}>
            Download
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SHARED: ToolHeader ────────────────────────────────────────
function CurrencyPicker() {
  const { currency, changeCurrency, currencies } = useCurrency()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--bdr)', background: open ? 'var(--bg3)' : 'transparent', fontSize: 12, fontWeight: 700, color: 'var(--gold)', cursor: 'pointer', fontFamily: 'Syne,sans-serif', flexShrink: 0, letterSpacing: '.02em' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'var(--bdr)' }}>
        <span style={{ fontSize: 14 }}>{currency.symbol}</span>
        <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{currency.code}</span>
        <i className="ti ti-chevron-down" style={{ fontSize: 10, color: 'var(--txt3)' }} aria-hidden="true" />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg1)', border: '1px solid var(--bdr2)', borderRadius: 12, padding: 6, zIndex: 100, width: 220, maxHeight: 320, overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
            <div style={{ padding: '6px 10px 8px', fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--bdr)' }}>
              Select currency
            </div>
            {currencies.map(c => (
              <button key={c.code} onClick={() => { changeCurrency(c.code); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 7, border: 'none', background: currency.code === c.code ? 'var(--bg3)' : 'transparent', fontSize: 12, color: currency.code === c.code ? 'var(--gold)' : 'var(--txt)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                onMouseEnter={e => { if (currency.code !== c.code) e.currentTarget.style.background = 'var(--bg2)' }}
                onMouseLeave={e => { if (currency.code !== c.code) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ fontSize: 15, width: 24, textAlign: 'center', flexShrink: 0, fontFamily: 'Syne,sans-serif', fontWeight: 700, color: currency.code === c.code ? 'var(--gold)' : 'var(--txt2)' }}>{c.symbol}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{c.code}</span>
                {currency.code === c.code && <i className="ti ti-check" style={{ fontSize: 11, color: 'var(--gold)' }} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ExportMenu({ toolName, exportData }) {
  const [open, setOpen] = useState(false)
  const { currency } = useCurrency()
  const sym = currency.symbol

  // ── Collect all section data from the DOM ──────────────────────
  const collectSections = () => {
    const sections = []
    // Get all section blocks (colored headers)
    const sectionDivs = document.querySelectorAll('[data-section]')
    sectionDivs.forEach(sec => {
      const title = sec.getAttribute('data-section')
      const total = sec.getAttribute('data-total') || ''
      const rows = []
      sec.querySelectorAll('[data-row]').forEach(row => {
        const name = row.getAttribute('data-name') || ''
        const amount = row.getAttribute('data-amount') || ''
        if (name || amount) rows.push({ name, amount })
      })
      if (title) sections.push({ title, total, rows })
    })
    // Fallback: collect from inputs
    if (sections.length === 0) {
      const inputs = document.querySelectorAll('input[type="text"], input[inputmode="decimal"]')
      inputs.forEach(el => {
        if (el.value) sections.push({ title: el.placeholder || 'Field', total: '', rows: [{ name: el.closest('div')?.querySelector('input:not([type="text"])')?.value || '', amount: el.value }] })
      })
    }
    return sections
  }

  // ── Professional PDF via print ────────────────────────────────
  const printPDF = () => {
    const sections = collectSections()
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const refNo = `CLR-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).substr(2,6).toUpperCase()}`

    // Build sections HTML
    const sectionsHTML = sections.map(s => `
      <div class="section">
        <div class="section-header">
          <span class="section-title">${s.title}</span>
          <span class="section-total">${s.total ? sym + parseFloat(s.total.replace(/[^0-9.-]/g,'')).toLocaleString('en-GB', {minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</span>
        </div>
        ${s.rows.map((r,i) => `
          <div class="row ${i % 2 === 0 ? 'row-even' : 'row-odd'}">
            <span class="row-name">${r.name || '—'}</span>
            <span class="row-amount">${r.amount ? sym + parseFloat(r.amount).toLocaleString('en-GB', {minimumFractionDigits:2,maximumFractionDigits:2}) : '—'}</span>
          </div>
        `).join('')}
      </div>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${toolName || 'CLARIS Report'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 12px; }

  /* Header */
  .header { background: #0d0d17; padding: 28px 40px 24px; display: flex; justify-content: space-between; align-items: center; }
  .logo-area { display: flex; flex-direction: column; }
  .logo { font-size: 26px; font-weight: 900; color: #c9a96e; letter-spacing: .06em; font-family: Georgia, serif; }
  .logo-sub { font-size: 9px; color: #888; letter-spacing: .15em; text-transform: uppercase; margin-top: 2px; }
  .header-right { text-align: right; }
  .doc-title { font-size: 16px; font-weight: 700; color: #ffffff; }
  .doc-sub { font-size: 10px; color: #c9a96e; margin-top: 3px; text-transform: uppercase; letter-spacing: .08em; }

  /* Gold divider */
  .gold-bar { height: 3px; background: linear-gradient(90deg, #c9a96e 0%, #f0d080 50%, #c9a96e 100%); }

  /* Meta strip */
  .meta { background: #f8f7f4; border-bottom: 1px solid #e8e4da; padding: 12px 40px; display: flex; gap: 40px; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: .1em; font-weight: 600; }
  .meta-value { font-size: 12px; color: #1a1a2e; font-weight: 600; margin-top: 1px; }

  /* Content */
  .content { padding: 28px 40px; }
  .content-title { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #c9a96e; display: flex; justify-content: space-between; align-items: center; }
  .content-title-sub { font-size: 10px; color: #888; font-weight: 400; }

  /* Sections */
  .section { margin-bottom: 18px; border: 1px solid #e8e4da; border-radius: 8px; overflow: hidden; break-inside: avoid; }
  .section-header { background: #1a1a2e; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
  .section-title { font-size: 12px; font-weight: 700; color: #c9a96e; letter-spacing: .04em; text-transform: uppercase; }
  .section-total { font-size: 14px; font-weight: 700; color: #ffffff; font-family: 'Courier New', monospace; }
  .row { display: flex; justify-content: space-between; padding: 8px 16px; }
  .row-even { background: #ffffff; }
  .row-odd { background: #faf9f6; }
  .row-name { color: #444; font-size: 11px; }
  .row-amount { color: #1a1a2e; font-weight: 600; font-family: 'Courier New', monospace; font-size: 12px; }

  /* Footer */
  .footer { margin-top: 30px; padding: 20px 40px; border-top: 1px solid #e8e4da; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 9px; color: #aaa; line-height: 1.8; }
  .footer-right { text-align: right; }
  .footer-logo { font-size: 14px; font-weight: 900; color: #c9a96e; letter-spacing: .08em; }
  .footer-copy { font-size: 8px; color: #bbb; margin-top: 2px; }

  /* Watermark */
  .watermark { position: fixed; bottom: 80px; right: 40px; font-size: 9px; color: #ddd; transform: rotate(-45deg); transform-origin: right bottom; pointer-events: none; font-weight: 700; letter-spacing: .1em; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { -webkit-print-color-adjust: exact; }
    .section-header { -webkit-print-color-adjust: exact; }
    @page { margin: 0; size: A4 portrait; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo-area">
    <div class="logo">CLARIS</div>
    <div class="logo-sub">Professional Finance Platform</div>
  </div>
  <div class="header-right">
    <div class="doc-title">${toolName || 'Financial Report'}</div>
    <div class="doc-sub">Interactive Financial Document</div>
  </div>
</div>

<div class="gold-bar"></div>

<div class="meta">
  <div class="meta-item">
    <span class="meta-label">Document date</span>
    <span class="meta-value">${dateStr}</span>
  </div>
  <div class="meta-item">
    <span class="meta-label">Generated at</span>
    <span class="meta-value">${timeStr}</span>
  </div>
  <div class="meta-item">
    <span class="meta-label">Reference no.</span>
    <span class="meta-value">${refNo}</span>
  </div>
  <div class="meta-item">
    <span class="meta-label">Currency</span>
    <span class="meta-value">${sym} ${currency.code}</span>
  </div>
  <div class="meta-item">
    <span class="meta-label">Document type</span>
    <span class="meta-value">Financial Summary</span>
  </div>
</div>

<div class="content">
  <div class="content-title">
    <span>${toolName || 'Report'}</span>
    <span class="content-title-sub">Generated by CLARIS Financial Platform</span>
  </div>

  ${sectionsHTML}
</div>

<div class="footer">
  <div class="footer-left">
    This document was generated by CLARIS Professional Finance Platform.<br>
    All figures are entered by the user and are for personal planning purposes only.<br>
    © ${now.getFullYear()} CLARIS. All rights reserved. Confidential — not for redistribution.<br>
    Reference: ${refNo} · ${dateStr} · ${currency.code}
  </div>
  <div class="footer-right">
    <div class="footer-logo">CLARIS</div>
    <div class="footer-copy">Professional Finance Platform</div>
  </div>
</div>

<div class="watermark">CLARIS CONFIDENTIAL</div>

<script>window.onload = () => window.print()</script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
    setOpen(false)
  }

  // ── CSV Export ────────────────────────────────────────────────
  const exportCSV = () => {
    const sections = collectSections()
    const rows = [['Section', 'Item', `Amount (${sym})`, 'Currency', 'Date']]
    const dateStr = new Date().toLocaleDateString('en-GB')
    sections.forEach(s => {
      s.rows.forEach(r => {
        rows.push([s.title, r.name || '', r.amount || '', currency.code, dateStr])
      })
    })
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv)
    a.download = `${(toolName || 'claris').toLowerCase().replace(/[^a-z0-9]+/g,'-')}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    setOpen(false)
  }

  // ── JSON Export ───────────────────────────────────────────────
  const exportJSON = () => {
    const sections = collectSections()
    const data = {
      tool: toolName,
      currency: currency.code,
      symbol: sym,
      generatedAt: new Date().toISOString(),
      generatedBy: 'CLARIS Professional Finance Platform',
      sections
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${(toolName || 'claris').toLowerCase().replace(/[^a-z0-9]+/g,'-')}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, border: '1px solid var(--bdr)', background: open ? 'var(--bg3)' : 'transparent', fontSize: 11, fontWeight: 500, color: open ? 'var(--gold)' : 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--txt2)' } }}>
        <i className="ti ti-download" style={{ fontSize: 12 }} aria-hidden="true" />
        <span>Export</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg2)', border: '1px solid var(--bdr2)', borderRadius: 10, padding: 6, zIndex: 100, minWidth: 200, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
            <div style={{ padding: '6px 12px 8px', fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--bdr)', marginBottom: 4 }}>
              Export "{(toolName || 'Tool').slice(0, 24)}"
            </div>
            {[
              { icon: 'ti-file-type-pdf', label: 'Professional PDF', sub: 'CLARIS branded document', action: printPDF, color: '#e24b4a' },
              { icon: 'ti-file-type-csv', label: 'Download CSV', sub: 'Spreadsheet format', action: exportCSV, color: '#1d9e75' },
              { icon: 'ti-braces', label: 'Download JSON', sub: 'Raw data format', action: exportJSON, color: '#378add' },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <i className={`ti ${btn.icon}`} style={{ fontSize: 18, color: btn.color, flexShrink: 0 }} aria-hidden="true" />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--txt)', fontWeight: 600 }}>{btn.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{btn.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


function PeriodSelector({ tool }) {
  const n = (tool?.name || '').toLowerCase()
  const [open, setOpen] = useState(false)

  // Detect period type from tool name
  const isWeekly    = n.includes('weekly') || n.includes('week')
  const isDaily     = n.includes('daily') || n.includes('day')
  const isAnnual    = n.includes('annual') || n.includes('yearly') || n.includes('year')
  const isMonthly   = n.includes('monthly') || n.includes('month')
  const isQuarterly = n.includes('quarterly') || n.includes('quarter')
  const isCustom    = n.includes('challenge') || n.includes('tracker') || n.includes('log')

  // State based on type
  const now = new Date()
  const [selYear,  setSelYear]  = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selWeek,  setSelWeek]  = useState(Math.ceil(now.getDate() / 7))
  const [selDate,  setSelDate]  = useState(now.toISOString().split('T')[0])
  const [dateFrom, setDateFrom] = useState(now.toISOString().split('T')[0])
  const [dateTo,   setDateTo]   = useState(now.toISOString().split('T')[0])
  const [selQ,     setSelQ]     = useState(Math.ceil((now.getMonth() + 1) / 3))

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const label = isDaily     ? selDate
    : isWeekly   ? `Week ${selWeek}, ${MONTHS[selMonth]} ${selYear}`
    : isQuarterly? `Q${selQ} ${selYear}`
    : isAnnual   ? `${selYear}`
    : isCustom   ? `${dateFrom} → ${dateTo}`
    : `${MONTHS_FULL[selMonth]} ${selYear}`

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${open ? 'var(--gold)' : 'var(--bdr)'}`, background: open ? 'rgba(201,169,110,.08)' : 'transparent', fontSize: 11, color: open ? 'var(--gold)' : 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--txt2)' } }}>
        <i className="ti ti-calendar" style={{ fontSize: 12 }} aria-hidden="true" />
        <span>{label}</span>
        <i className="ti ti-chevron-down" style={{ fontSize: 10 }} aria-hidden="true" />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg2)', border: '1px solid var(--bdr2)', borderRadius: 12, padding: 16, zIndex: 100, minWidth: 240, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>

            {/* Year selector — always visible */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button onClick={() => setSelYear(y => y - 1)}
                style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer' }}>‹</button>
              <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{selYear}</span>
              <button onClick={() => setSelYear(y => y + 1)}
                style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer' }}>›</button>
            </div>

            {/* Annual — just year */}
            {isAnnual && (
              <button onClick={() => setOpen(false)}
                style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: 'rgba(201,169,110,.12)', fontSize: 12, fontWeight: 600, color: 'var(--gold)', cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>
                ✓ {selYear} selected
              </button>
            )}

            {/* Monthly — month grid */}
            {(isMonthly || (!isDaily && !isWeekly && !isAnnual && !isQuarterly && !isCustom)) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {MONTHS.map((m, i) => (
                  <button key={m} onClick={() => { setSelMonth(i); setOpen(false) }}
                    style={{ padding: '7px 4px', borderRadius: 7, border: `1px solid ${selMonth === i ? 'var(--gold)' : 'var(--bdr)'}`, background: selMonth === i ? 'rgba(201,169,110,.12)' : 'transparent', fontSize: 11, color: selMonth === i ? 'var(--gold)' : 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: selMonth === i ? 700 : 400 }}>
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* Weekly — month + week number */}
            {isWeekly && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 10 }}>
                  {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => setSelMonth(i)}
                      style={{ padding: '6px 4px', borderRadius: 6, border: `1px solid ${selMonth === i ? 'var(--gold)' : 'var(--bdr)'}`, background: selMonth === i ? 'rgba(201,169,110,.12)' : 'transparent', fontSize: 10, color: selMonth === i ? 'var(--gold)' : 'var(--txt3)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {m}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {[1,2,3,4,5].map(w => (
                    <button key={w} onClick={() => { setSelWeek(w); setOpen(false) }}
                      style={{ padding: '7px 4px', borderRadius: 7, border: `1px solid ${selWeek === w ? 'var(--gold)' : 'var(--bdr)'}`, background: selWeek === w ? 'rgba(201,169,110,.12)' : 'transparent', fontSize: 11, color: selWeek === w ? 'var(--gold)' : 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: selWeek === w ? 700 : 400 }}>
                      Wk {w}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Daily — date picker */}
            {isDaily && (
              <input type="date" value={selDate} onChange={e => { setSelDate(e.target.value); setOpen(false) }}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none' }} />
            )}

            {/* Quarterly */}
            {isQuarterly && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {[1,2,3,4].map(q => (
                  <button key={q} onClick={() => { setSelQ(q); setOpen(false) }}
                    style={{ padding: '10px 4px', borderRadius: 7, border: `1px solid ${selQ === q ? 'var(--gold)' : 'var(--bdr)'}`, background: selQ === q ? 'rgba(201,169,110,.12)' : 'transparent', fontSize: 13, fontWeight: 700, color: selQ === q ? 'var(--gold)' : 'var(--txt2)', cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>
                    Q{q}
                  </button>
                ))}
              </div>
            )}

            {/* Custom range — for trackers/logs/challenges */}
            {isCustom && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 4 }}>From</div>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 4 }}>To</div>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <button onClick={() => setOpen(false)}
                  style={{ padding: '8px', borderRadius: 8, border: 'none', background: 'rgba(201,169,110,.12)', fontSize: 12, fontWeight: 600, color: 'var(--gold)', cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>
                  ✓ Apply range
                </button>
              </div>
            )}

            <div style={{ marginTop: 10, fontSize: 10, color: 'var(--txt3)', textAlign: 'center', borderTop: '1px solid var(--bdr)', paddingTop: 8 }}>
              Period context for this tool
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ToolHeader({ tool, color, icon, onExport, exportData, extra, isSaving, lastSaved, clearSave }) {
  const { currency } = useCurrency()
  const cfg = getToolConfig(tool)
  return (
    <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--bdr)', background:'var(--bg2)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
      <div style={{ width:38, height:38, borderRadius:9, background:`${color}18`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <i className={`ti ${icon}`} style={{ fontSize:18, color }} aria-hidden="true"/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--txt)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tool?.name || ''}</div>
        <div style={{ fontSize:11, color:'var(--txt2)' }}>
          {cfg.audienceLabel && <span style={{ color, fontWeight:600, marginRight:6 }}>{cfg.audienceLabel}</span>}
          {cfg.periodLabel} {tool?.subcategory?.toLowerCase() || ''}
        </div>
      </div>
      {extra}
      {(isSaving !== undefined || lastSaved) && (
        <SaveIndicator isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      )}
      <PeriodSelector tool={tool} />
      <CurrencyPicker />
      <ExportMenu toolName={tool?.name} exportData={exportData || null} />
    </div>
  )
}

// ── SHARED: LiveResultsPanel ──────────────────────────────────
function LiveResultsPanel({ income, expenses, savings, savingsRate, sections }) {
  const { currency } = useCurrency()
  const sym = currency.symbol
  const remaining = income - expenses
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { label:'Income', val:fmt(income), color:'#1d9e75' },
          { label:'Expenses', val:fmt(expenses), color:'#d4537e' },
          { label:remaining>=0?'Surplus':'Deficit', val:fmt(remaining), color:remaining>=0?'#1d9e75':'#e24b4a' },
          { label:'Savings rate', val:fmtPct(savingsRate), color:savingsRate>=20?'#1d9e75':savingsRate>=10?'#ba7517':'#d4537e' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:9, padding:'10px 12px' }}>
            <div style={{ fontSize:8, color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div style={{ background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:9, padding:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:11, color:'var(--txt)' }}>Savings rate</span>
          <span style={{ fontSize:11, fontWeight:700, color:savingsRate>=20?'#1d9e75':savingsRate>=10?'#ba7517':'#d4537e' }}>{fmtPct(savingsRate)}</span>
        </div>
        <div style={{ height:6, background:'var(--bg4)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.min(100,savingsRate)}%`, background:savingsRate>=20?'#1d9e75':savingsRate>=10?'#ba7517':'#d4537e', borderRadius:3, transition:'width .5s' }}/>
        </div>
        <div style={{ fontSize:10, color:'var(--txt2)', marginTop:6 }}>
          {savingsRate>=20?'✅ Excellent — saving 20%+':savingsRate>=10?'⚠️ Good — aim for 20%':remaining>=0?'💡 Try to save at least 10%':'❗ Spending more than earning'}
        </div>
      </div>
      {/* Breakdown bars */}
      {sections && sections.length > 0 && (
        <div style={{ background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:9, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:500, color:'var(--txt)', marginBottom:10 }}>Spending breakdown</div>
          {sections.filter(s=>s.amount>0).sort((a,b)=>b.amount-a.amount).map(s => {
            const pct = income>0?(s.amount/income*100):0
            return (
              <div key={s.label} style={{ marginBottom:7 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <span style={{ fontSize:10, color:'var(--txt2)', display:'flex', alignItems:'center', gap:4 }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize:10, color:s.color }} aria-hidden="true"/>{s.label}
                  </span>
                  <span style={{ fontSize:10, fontWeight:600, color:'var(--txt)' }}>{fmt(s.amount)}</span>
                </div>
                <div style={{ height:3, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background:s.color, borderRadius:2, opacity:.8 }}/>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BUDGET PLANNER — adapts to Weekly/Monthly/Annual/Paycheck/Family/Couple
// ═══════════════════════════════════════════════════════════════
export function BudgetPlannerTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n = (tool?.name || '').toLowerCase()

  const isWedding    = n.includes('wedding')
  const isTravel     = n.includes('travel') || n.includes('holiday') || n.includes('vacation') || n.includes('trip')
  const isRenovation = n.includes('renovation') || n.includes('remodel')
  const isStudent    = n.includes('student') || n.includes('university') || n.includes('college')
  const isBusiness   = n.includes('business') || n.includes('marketing') || n.includes('department') || n.includes('startup')
  const isPaycheck   = n.includes('paycheck') || n.includes('pay check') || n.includes('biweekly') || n.includes('fortnightly')
  const isCash       = n.includes('cash budget') || n.includes('cash-only') || n.includes('cash flow budget')
  const isFamily     = n.includes('family') || n.includes('couple') || n.includes('household')
  const isTeen       = n.includes('teen') || n.includes('young adult')

  const mk = (arr) => arr.map((x, i) => ({ id: i + 1, name: x[0], amount: x[1] }))

  const getInit = () => {
    if (isWedding) return {
      s0: mk([['Total budget', 20000], ['Family contribution', 5000]]),
      s1: mk([['Venue hire', 6000], ['Ceremony', 1500], ['Bridal accommodation', 1000]]),
      s2: mk([['Catering', 4000], ['Wedding cake', 500], ['Evening buffet', 800]]),
      s3: mk([['Wedding cars', 600], ['Honeymoon travel', 3000]]),
      s4: mk([['Wedding dress', 1500], ['Groom attire', 500], ['Hair & makeup', 400], ['Flowers', 800]]),
      s5: mk([['Photography', 2000], ['Videography', 1500], ['DJ / Band', 1200]]),
      s6: mk([['Invitations', 300], ['Decorations', 500], ['Favours', 300]]),
      s7: mk([['Miscellaneous', 1000], ['Insurance', 200]]),
    }
    if (isTravel) return {
      s0: mk([['Travel budget', 3000], ['Emergency fund', 500]]),
      s1: mk([['Flights', 800], ['Hotels', 1000], ['Airport transfers', 100]]),
      s2: mk([['Meals & dining', 400], ['Snacks & drinks', 150]]),
      s3: mk([['Local transport', 150], ['Car hire', 200]]),
      s4: mk([['Activities & tours', 300], ['Entrance fees', 100], ['Shopping', 200]]),
      s5: mk([['Travel insurance', 100], ['Visas & documents', 80]]),
      s6: mk([['Entertainment', 200], ['Experiences', 100]]),
      s7: mk([['Miscellaneous', 100]]),
    }
    if (isRenovation) return {
      s0: mk([['Total budget', 25000], ['Loan / financing', 10000]]),
      s1: mk([['Labour costs', 8000], ['Architect fees', 2000], ['Permits', 500]]),
      s2: mk([['Kitchen & appliances', 5000], ['Bathroom fittings', 2000]]),
      s3: mk([['Materials delivery', 300], ['Skip hire', 400]]),
      s4: mk([['Flooring', 2000], ['Paint & decoration', 800], ['Windows & doors', 3000]]),
      s5: mk([['Electrical work', 1500], ['Plumbing', 1200], ['Heating', 1500]]),
      s6: mk([['Furniture', 2000], ['Garden', 800]]),
      s7: mk([['Contingency 15%', 3750]]),
    }
    if (isStudent) return {
      s0: mk([['Student loan', 1200], ['Part-time job', 500], ['Parental support', 200]]),
      s1: mk([['Rent / halls', 600], ['Utilities', 60], ['Internet', 25]]),
      s2: mk([['Groceries', 150], ['Eating out', 60], ['Canteen', 40]]),
      s3: mk([['Bus / train pass', 50], ['Trips home', 40]]),
      s4: mk([['Books & materials', 50], ['Stationery', 15]]),
      s5: mk([['Emergency fund', 50], ['Savings', 30]]),
      s6: mk([['Socialising', 60], ['Streaming', 15], ['Hobbies', 30]]),
      s7: mk([['Overdraft repayment', 0]]),
    }
    if (isBusiness) return {
      s0: mk([['Revenue / sales', 20000], ['Other income', 1000]]),
      s1: mk([['Office rent', 2000], ['Business rates', 300], ['Utilities', 200]]),
      s2: mk([['Staff salaries', 8000], ['Contractors', 1500]]),
      s3: mk([['Travel & expenses', 300], ['Fleet / vehicles', 400]]),
      s4: mk([['Marketing & ads', 1000], ['Software', 400], ['Professional fees', 500]]),
      s5: mk([['Tax provision', 1500], ['Business savings', 500]]),
      s6: mk([['Equipment', 500], ['Training', 300], ['Client entertainment', 200]]),
      s7: mk([['Loan repayments', 500]]),
    }
    if (isPaycheck) return {
      s0: mk([['Paycheck amount', 1250], ['Side income this period', 0]]),
      s1: mk([['Rent / Mortgage (half)', 450], ['Utilities (half)', 75], ['Internet (half)', 25]]),
      s2: mk([['Groceries', 150], ['Eating out', 40]]),
      s3: mk([['Fuel / Transport', 60], ['Car payment (half)', 100]]),
      s4: mk([['Healthcare', 20], ['Clothing', 25], ['Personal care', 15]]),
      s5: mk([['Emergency fund', 100], ['Savings', 75]]),
      s6: mk([['Streaming', 15], ['Hobbies', 30]]),
      s7: mk([['Credit card (half)', 0], ['Loan (half)', 0]]),
    }
    if (isCash) return {
      s0: mk([['Cash withdrawn', 300], ['Starting cash', 50]]),
      s1: mk([['Rent (bank transfer)', 900], ['Bills (bank transfer)', 150]]),
      s2: mk([['Groceries (cash)', 100], ['Market / fresh food', 40]]),
      s3: mk([['Bus / tube fare', 30], ['Parking (cash)', 10]]),
      s4: mk([['Haircut / barber', 20], ['Pharmacy', 15]]),
      s5: mk([['Cash savings jar', 50]]),
      s6: mk([['Coffee / snacks', 20], ['Entertainment', 30]]),
      s7: mk([['Cash misc', 0]]),
    }
    if (isFamily) return {
      s0: mk([['Partner 1 income', 2500], ['Partner 2 income', 2000], ['Child benefit', 100]]),
      s1: mk([['Mortgage / Rent', 1200], ['Utilities', 200], ['Internet / TV', 80]]),
      s2: mk([['Groceries', 500], ['Eating out', 100], ['School meals', 50]]),
      s3: mk([['Fuel', 150], ['Car insurance', 80], ['School run / childcare transport', 0]]),
      s4: mk([['Healthcare', 50], ['Kids activities', 100], ['Clothing (family)', 80]]),
      s5: mk([['Emergency fund', 300], ['Kids savings', 100], ['Pension', 200]]),
      s6: mk([['Streaming / TV', 30], ['Family days out', 80], ['Hobbies', 50]]),
      s7: mk([['Mortgage overpayment', 0], ['Credit card', 0]]),
    }
    if (isTeen) return {
      s0: mk([['Allowance / pocket money', 100], ['Part-time job', 200], ['Birthday money', 0]]),
      s1: mk([['Phone bill', 15], ['Bus pass', 20]]),
      s2: mk([['Lunch / snacks', 40], ['Eating out with friends', 30]]),
      s3: mk([['Transport', 15]]),
      s4: mk([['Clothing', 30], ['Personal care', 10]]),
      s5: mk([['Savings goal', 50], ['Emergency fund', 20]]),
      s6: mk([['Streaming / games', 15], ['Hobbies', 25], ['Social / nights out', 20]]),
      s7: mk([['Phone payment plan', 0]]),
    }
    return {
      s0: mk([['Primary income', cfg.defIncome || 2500], ['Other income', 0]]),
      s1: mk([['Rent / Mortgage', cfg.defRent || 900], ['Utilities', 150], ['Internet / Phone', 50]]),
      s2: mk([['Groceries', cfg.defFood || 300], ['Eating out / Takeaway', 90]]),
      s3: mk([['Fuel / Car costs', 120], ['Public transport', 45]]),
      s4: mk([['Healthcare', 40], ['Clothing', 50], ['Gym / Fitness', 35]]),
      s5: mk([['Emergency fund', 200], ['Investments / Pension', 150], ['Savings goal', 100]]),
      s6: mk([['Streaming', 30], ['Hobbies', 60], ['Nights out', 40]]),
      s7: mk([['Credit card', 0], ['Loan repayment', 0]]),
    }
  }

  const init = getInit()
  const [s0, setS0] = useState(init.s0)
  const [s1, setS1] = useState(init.s1)
  const [s2, setS2] = useState(init.s2)
  const [s3, setS3] = useState(init.s3)
  const [s4, setS4] = useState(init.s4)
  const [s5, setS5] = useState(init.s5)
  const [s6, setS6] = useState(init.s6)
  const [s7, setS7] = useState(init.s7)

  const tot = (rows) => rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const totalIncome   = tot(s0)
  const totalExpenses = tot(s1) + tot(s2) + tot(s3) + tot(s4) + tot(s6) + tot(s7)
  const totalSavings  = tot(s5)
  const totalOut      = totalExpenses + totalSavings
  const remaining     = totalIncome - totalOut
  const savingsRate   = totalIncome > 0 ? (totalSavings / totalIncome * 100) : 0

  const add = (setter) => setter(p => [...p, { id: Date.now(), name: '', amount: 0 }])
  const upd = (setter, id, k, v) => { setter(p => p.map(r => r.id === id ? { ...r, [k]: v } : r)); save({ s0, s1, s2, s3, s4, s5, s6, s7 }) }
  const rem = (setter, id) => setter(p => p.filter(r => r.id !== id))

  // EXACT same Section as BizFinanceTool — the one that works
  const Section = ({ title, color, items, setter }) => {
    const secTotal = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
    return (
      <div data-section={title} data-total={secTotal} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color }}>{title}</span>
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color }}>{fmt(secTotal, sym)}</span>
        </div>
        {items.map((item, i) => (
          <div key={item.id} data-row="" data-name={item.name} data-amount={item.amount} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: i < items.length - 1 ? '1px solid var(--bdr)' : 'none' }}>
            <input value={item.name} onChange={e => upd(setter, item.id, 'name', e.target.value)} placeholder="Line item..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit' }} />
            <div style={{ position: 'relative', width: 130, flexShrink: 0 }}>
              <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--txt3)' }}>{sym}</span>
              <input type="text" inputMode="decimal" value={item.amount || ''} placeholder="0"
                onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) upd(setter, item.id, 'amount', parseFloat(e.target.value) || 0) }}
                onFocus={e => e.target.select()}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '6px 8px 6px 22px', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />
            </div>
            <button onClick={() => rem(setter, item.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--txt3)', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#e24b4a'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--txt3)'}>×</button>
          </div>
        ))}
        <div style={{ padding: '8px 14px' }}>
          <button onClick={() => add(setter)}
            style={{ fontSize: 12, color, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.8 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}>
            + Add line
          </button>
        </div>
      </div>
    )
  }

  const labels = isPaycheck
    ? ['Paycheck & Income','Housing (this period)','Food & Dining','Transport','Personal & Health','Savings','Entertainment','Debt (this period)']
    : isCash
    ? ['Cash In','Bills (bank)','Groceries (cash)','Transport','Personal','Cash Savings','Leisure','Miscellaneous']
    : isFamily
    ? ['Family Income','Home & Utilities','Food & Family Meals','Transport','Kids & Health','Savings & Pensions','Entertainment','Debt & Loans']
    : isTeen
    ? ['Income & Pocket Money','Phone & Bills','Food & Drinks','Getting Around','Clothing & Care','Savings','Fun & Social','Debt']
    : isWedding
    ? ['Budget & Contributions','Venue & Ceremony','Catering & Cake','Transport','Attire & Beauty','Photography & Entertainment','Stationery & Décor','Miscellaneous']
    : isTravel
    ? ['Budget & Savings','Flights & Accommodation','Food & Drinks','Local Transport','Activities & Shopping','Insurance & Documents','Entertainment','Miscellaneous']
    : isRenovation
    ? ['Budget & Financing','Labour & Professionals','Kitchen & Fittings','Logistics & Waste','Flooring, Paint & Windows','Services','Furniture & Garden','Contingency']
    : isStudent
    ? ['Income & Support','Rent & Bills','Food & Groceries','Transport','Study & Academic','Savings','Social & Leisure','Debt']
    : isBusiness
    ? ['Revenue & Income','Premises & Overheads','People & Salaries','Travel & Logistics','Marketing & Tech','Tax & Savings','Equipment & Training','Debt & Loans']
    : ['Income','Housing','Food & Dining','Transport','Personal & Health','Savings & Investments','Entertainment & Subscriptions','Debt Payments']

  const colors = ['#1d9e75','#378add','#ba7517','#7f77dd','#d4537e','#1d9e75','#ef9f27','#e24b4a']

  const SECTIONS = [
    { title: labels[0], color: colors[0], items: s0, setter: setS0 },
    { title: labels[1], color: colors[1], items: s1, setter: setS1 },
    { title: labels[2], color: colors[2], items: s2, setter: setS2 },
    { title: labels[3], color: colors[3], items: s3, setter: setS3 },
    { title: labels[4], color: colors[4], items: s4, setter: setS4 },
    { title: labels[5], color: colors[5], items: s5, setter: setS5 },
    { title: labels[6], color: colors[6], items: s6, setter: setS6 },
    { title: labels[7], color: colors[7], items: s7, setter: setS7 },
  ]

  const remColor = remaining >= 0 ? '#1d9e75' : '#e24b4a'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} color='#c9a96e' icon='ti-wallet' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left — sections */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14 }}>
          {SECTIONS.map(s => <Section key={s.title} {...s} />)}
        </div>

        {/* Right — summary */}
        <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid var(--bdr)', overflowY: 'auto', padding: 14, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>
            {cfg.periodLabel || 'Monthly'} summary
          </div>
          <div style={{ background: remaining >= 0 ? 'rgba(29,158,117,.08)' : 'rgba(226,75,74,.08)', border: `2px solid ${remaining >= 0 ? 'rgba(29,158,117,.4)' : 'rgba(226,75,74,.4)'}`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
              {remaining >= 0 ? 'Remaining' : 'Overspent'}
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 700, color: remColor }}>{fmt(Math.abs(remaining, sym))}</div>
          </div>
          {[
            { l: 'Total income',   v: fmt(totalIncome, sym),   c: '#1d9e75', bold: true },
            { l: 'Total expenses', v: fmt(totalExpenses, sym), c: '#d4537e', bold: false },
            { l: 'Total savings',  v: fmt(totalSavings, sym),  c: '#378add', bold: false },
            { l: 'Total outgoing', v: fmt(totalOut, sym),      c: 'var(--txt)', bold: true },
            { l: 'Savings rate',   v: `${savingsRate.toFixed(1)}%`, c: savingsRate >= 20 ? '#1d9e75' : savingsRate >= 10 ? '#ba7517' : '#e24b4a', bold: false },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: r.bold ? '8px 12px' : '6px 0', background: r.bold ? 'var(--bg3)' : 'transparent', borderRadius: r.bold ? 8 : 0, border: r.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !r.bold ? '1px solid var(--bdr)' : undefined }}>
              <span style={{ fontSize: 11, color: r.bold ? 'var(--txt)' : 'var(--txt2)', fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
              <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 500, color: r.c }}>{r.v}</span>
            </div>
          ))}
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 9, padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt)', marginBottom: 8 }}>By category</div>
            {SECTIONS.slice(1).map(s => {
              const t = s.items.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0)
              const pct = totalOut > 0 ? (t / totalOut * 100) : 0
              return (
                <div key={s.title} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: 'var(--txt2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{s.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: s.color }}>{fmt(t, sym)}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 2 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


export function BudgetReviewTool({ tool }) {
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol

  const mk = (arr) => arr.map((x, i) => ({ id: i+1, category: x[0], planned: x[1], actual: x[2] }))
  const [rows, setRows] = useState(mk([
    ['Income',                   2500, 2650],
    ['Rent / Mortgage',           900,  900],
    ['Utilities',                 150,  163],
    ['Groceries',                 300,  287],
    ['Eating out',                100,  145],
    ['Transport',                 150,  138],
    ['Entertainment',              80,  110],
    ['Healthcare',                 50,   22],
    ['Clothing',                   60,    0],
    ['Savings',                   200,  200],
    ['Emergency fund',            100,  100],
    ['Subscriptions',              30,   30],
    ['Debt repayment',              0,    0],
    ['Personal care',              40,   35],
    ['Miscellaneous',              50,   78],
  ]))
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }))

  const upd = (id, k, v) => { setRows(p => p.map(r => r.id === id ? { ...r, [k]: v } : r)); save({ rows, month }) }
  const add = () => setRows(p => [...p, { id: Date.now(), category: '', planned: 0, actual: 0 }])

  const totalPlanned = rows.reduce((s, r) => s + (r.planned || 0), 0)
  const totalActual  = rows.reduce((s, r) => s + (r.actual || 0), 0)
  const totalVar     = totalActual - totalPlanned
  const onBudget     = rows.filter(r => Math.abs((r.actual || 0) - (r.planned || 0)) <= (r.planned || 0) * 0.05).length

  const cS = { background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', width: '100%' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} color='#7f77dd' icon='ti-clipboard-check' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={
          <input value={month} onChange={e => setMonth(e.target.value)} placeholder="Month..."
            style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '5px 10px', fontSize: 11, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', width: 160 }} />
        } />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 110px 80px', gap: 8, padding: '10px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--bdr)' }}>
              {['Category', 'Planned', 'Actual', 'Variance', ''].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {rows.map((r, i) => {
              const variance = (r.actual || 0) - (r.planned || 0)
              const pct = r.planned > 0 ? (variance / r.planned * 100) : 0
              const varColor = Math.abs(pct) <= 5 ? '#1d9e75' : Math.abs(pct) <= 15 ? '#ba7517' : '#e24b4a'
              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 110px 80px', gap: 8, padding: '8px 14px', borderBottom: '1px solid var(--bdr)', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)' }}>
                  <input value={r.category} onChange={e => upd(r.id, 'category', e.target.value)} placeholder="Category..." style={cS} />
                  {['planned','actual'].map(k => (
                    <div key={k} style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--txt3)' }}>{sym}</span>
                      <input type="text" inputMode="decimal" value={r[k] || ''} placeholder="0"
                        onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) upd(r.id, k, parseFloat(e.target.value) || 0) }}
                        onFocus={e => e.target.select()}
                        style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '6px 8px 6px 20px', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />
                    </div>
                  ))}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: varColor }}>{variance >= 0 ? '+' : ''}{fmt(variance, sym)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: varColor, fontWeight: 600 }}>{pct >= 0 ? '+' : ''}{pct.toFixed(0)}%</span>
                    <button onClick={() => setRows(p => p.filter(x => x.id !== r.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: 14, lineHeight: 1, padding: '2px 4px', marginLeft: 'auto' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#e24b4a'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--txt3)'}>×</button>
                  </div>
                </div>
              )
            })}
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--bdr)' }}>
              <button onClick={add} style={{ fontSize: 12, color: '#7f77dd', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                + Add category
              </button>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 240, flexShrink: 0, borderLeft: '1px solid var(--bdr)', overflowY: 'auto', padding: 14, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>Budget Review</div>
          <div style={{ background: Math.abs(totalVar) < 50 ? 'rgba(29,158,117,.1)' : totalVar < 0 ? 'rgba(29,158,117,.08)' : 'rgba(226,75,74,.08)', border: `2px solid ${totalVar <= 0 ? '#1d9e75' : '#e24b4a'}55`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', marginBottom: 4 }}>{totalVar <= 0 ? 'Under budget' : 'Over budget'}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 700, color: totalVar <= 0 ? '#1d9e75' : '#e24b4a' }}>{totalVar >= 0 ? '+' : ''}{fmt(totalVar, sym)}</div>
          </div>
          {[
            { l: 'Total planned',  v: fmt(totalPlanned, sym), c: 'var(--txt)', bold: true },
            { l: 'Total actual',   v: fmt(totalActual, sym),  c: totalActual > totalPlanned ? '#e24b4a' : '#1d9e75', bold: true },
            { l: 'On budget',      v: `${onBudget}/${rows.length}`, c: '#1d9e75', bold: false },
            { l: 'Over budget',    v: rows.filter(r => (r.actual||0) > (r.planned||0)).length, c: '#e24b4a', bold: false },
            { l: 'Under budget',   v: rows.filter(r => (r.actual||0) < (r.planned||0)).length, c: '#1d9e75', bold: false },
          ].map(row => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: row.bold ? '8px 12px' : '5px 0', background: row.bold ? 'var(--bg3)' : 'transparent', borderRadius: row.bold ? 8 : 0, border: row.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !row.bold ? '1px solid var(--bdr)' : undefined }}>
              <span style={{ fontSize: 11, color: row.bold ? 'var(--txt)' : 'var(--txt3)', fontWeight: row.bold ? 600 : 400 }}>{row.l}</span>
              <span style={{ fontSize: row.bold ? 13 : 11, fontWeight: row.bold ? 700 : 500, color: row.c }}>{row.v}</span>
            </div>
          ))}
          {/* Top overruns */}
          {rows.filter(r => (r.actual||0) > (r.planned||0)).length > 0 && (
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 9, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>Top overruns</div>
              {rows.filter(r => (r.actual||0) > (r.planned||0)).sort((a,b) => ((b.actual||0)-(b.planned||0)) - ((a.actual||0)-(a.planned||0))).slice(0,5).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--bdr)' }}>
                  <span style={{ fontSize: 10, color: 'var(--txt2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{r.category || '—'}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#e24b4a' }}>+{fmt((r.actual||0)-(r.planned||0), sym)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function BudgetVarianceTool({ tool }) {
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const mk = (arr) => arr.map((x, i) => ({ id: i+1, category: x[0], planned: x[1], actuals: x[2] }))

  const [rows, setRows] = useState(mk([
    ['Income',          2500, [2500,2650,2500,2500,2800,2500,2500,2500,2500,2600,2500,3000]],
    ['Housing',          900, [900,900,900,900,900,900,900,900,900,900,900,900]],
    ['Food & Dining',    380, [365,420,380,410,355,390,380,405,370,385,395,480]],
    ['Transport',        150, [138,165,145,150,142,158,150,160,138,145,152,165]],
    ['Entertainment',    100, [110,85,120,95,130,100,90,115,105,95,110,140]],
    ['Savings',          200, [200,200,200,200,200,200,200,200,200,200,200,200]],
    ['Utilities',        150, [145,155,163,148,140,142,145,148,150,153,158,165]],
    ['Personal',          80, [75,90,65,85,72,88,80,95,70,82,90,110]],
  ]))

  const curMonth = new Date().getMonth()
  const [selMonth, setSelMonth] = useState(curMonth)

  const upd = (id, k, v) => { setRows(p => p.map(r => r.id === id ? { ...r, [k]: v } : r)); save({ rows }) }
  const updActual = (id, mi, v) => {
    setRows(p => p.map(r => {
      if (r.id !== id) return r
      const actuals = [...(r.actuals || Array(12).fill(0))]
      actuals[mi] = parseFloat(v) || 0
      return { ...r, actuals }
    }))
    save({ rows })
  }

  const cS = { background: 'transparent', border: 'none', outline: 'none', fontSize: 11, color: 'var(--txt)', fontFamily: 'inherit', width: '100%' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} color='#ba7517' icon='ti-chart-bar' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={
          <div style={{ display: 'flex', gap: 4 }}>
            {MONTHS.map((m, i) => (
              <button key={m} onClick={() => setSelMonth(i)}
                style={{ padding: '3px 7px', borderRadius: 5, border: `1px solid ${selMonth === i ? '#ba7517' : 'var(--bdr)'}`, background: selMonth === i ? 'rgba(186,117,23,.15)' : 'transparent', fontSize: 9, color: selMonth === i ? '#ba7517' : 'var(--txt3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: selMonth === i ? 700 : 400 }}>
                {m}
              </button>
            ))}
          </div>
        } />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px', gap: 8, padding: '10px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--bdr)' }}>
              {[`Category`, `Planned`, `${MONTHS[selMonth]} Actual`, 'Variance', '±%'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {rows.map((r, ri) => {
              const actual = (r.actuals || [])[selMonth] || 0
              const variance = actual - (r.planned || 0)
              const pct = r.planned > 0 ? (variance / r.planned * 100) : 0
              const vc = Math.abs(pct) <= 5 ? '#1d9e75' : Math.abs(pct) <= 15 ? '#ba7517' : '#e24b4a'
              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px', gap: 8, padding: '8px 14px', borderBottom: '1px solid var(--bdr)', alignItems: 'center', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)' }}>
                  <input value={r.category} onChange={e => upd(r.id, 'category', e.target.value)} style={cS} />
                  {[{k:'planned',v:r.planned},{k:'actual',v:actual}].map(f => (
                    <div key={f.k} style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--txt3)' }}>{sym}</span>
                      <input type="text" inputMode="decimal" value={f.v || ''} placeholder="0"
                        onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) { f.k === 'planned' ? upd(r.id, 'planned', parseFloat(e.target.value)||0) : updActual(r.id, selMonth, e.target.value) } }}
                        onFocus={ev => ev.target.select()}
                        style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '6px 8px 6px 20px', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: vc }}>{variance >= 0 ? '+' : ''}{fmt(variance, sym)}</div>
                  <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: vc }}>{pct >= 0 ? '+' : ''}{pct.toFixed(0)}%</div>
                </div>
              )
            })}
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--bdr)' }}>
              <button onClick={() => setRows(p => [...p, { id: Date.now(), category: '', planned: 0, actuals: Array(12).fill(0) }])}
                style={{ fontSize: 12, color: '#ba7517', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                + Add category
              </button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ width: 240, flexShrink: 0, borderLeft: '1px solid var(--bdr)', overflowY: 'auto', padding: 14, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{MONTHS[selMonth]} Variance</div>
          {(() => {
            const totPlanned = rows.reduce((s,r) => s+(r.planned||0), 0)
            const totActual  = rows.reduce((s,r) => s+((r.actuals||[])[selMonth]||0), 0)
            const totVar = totActual - totPlanned
            return <>
              <div style={{ background: totVar <= 0 ? 'rgba(29,158,117,.1)' : 'rgba(226,75,74,.1)', border: `2px solid ${totVar<=0?'#1d9e75':'#e24b4a'}55`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', marginBottom: 4 }}>{totVar <= 0 ? 'Under budget' : 'Over budget'}</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 700, color: totVar <= 0 ? '#1d9e75' : '#e24b4a' }}>{totVar >= 0 ? '+' : ''}{fmt(totVar, sym)}</div>
              </div>
              {[
                { l: 'Planned', v: fmt(totPlanned, sym), c: 'var(--txt)', bold: true },
                { l: 'Actual',  v: fmt(totActual, sym),  c: totActual > totPlanned ? '#e24b4a' : '#1d9e75', bold: true },
                { l: 'Best month', v: (() => { const bests = rows.map(r => { const best = Math.min(...(r.actuals||[]).map((a,i) => a - r.planned)); return { cat: r.category, v: best } }); const b = bests.sort((a,b) => a.v-b.v)[0]; return b ? b.cat : '—' })(), c: '#1d9e75', bold: false },
                { l: 'Worst category', v: (() => { const worst = rows.sort((a,b) => { const va = ((b.actuals||[])[selMonth]||0)-b.planned; const vb = ((a.actuals||[])[selMonth]||0)-a.planned; return va-vb })[0]; return worst ? (worst.category || '—') : '—' })(), c: '#e24b4a', bold: false },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: row.bold ? '8px 12px' : '5px 0', background: row.bold ? 'var(--bg3)' : 'transparent', borderRadius: row.bold ? 8 : 0, border: row.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !row.bold ? '1px solid var(--bdr)' : undefined }}>
                  <span style={{ fontSize: 11, color: row.bold ? 'var(--txt)' : 'var(--txt3)', fontWeight: row.bold ? 600 : 400 }}>{row.l}</span>
                  <span style={{ fontSize: row.bold ? 13 : 11, fontWeight: row.bold ? 700 : 500, color: row.c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{row.v}</span>
                </div>
              ))}
            </>
          })()}
        </div>
      </div>
    </div>
  )
}


export function SavingsGoalTool({ tool }) {
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n = (tool?.name || '').toLowerCase()

  // Detect savings type
  const isEmergency = n.includes('emergency')
  const isSinking   = n.includes('sinking')
  const isVacation  = n.includes('vacation') || n.includes('holiday') || n.includes('travel')
  const isHouse     = n.includes('house') || n.includes('deposit') || n.includes('home')
  const isCar       = n.includes('car') || n.includes('vehicle')
  const isEducation = n.includes('education') || n.includes('university') || n.includes('student')
  const isRetirement = n.includes('retirement') || n.includes('pension')
  const isWedding   = n.includes('wedding')
  const isBusiness  = n.includes('business') || n.includes('startup')

  const getDefaults = () => {
    if (isEmergency)  return { target: 10000, label: 'Emergency Fund',  icon: 'ti-shield', color: '#e24b4a',  monthly: 400,  tip: 'Aim for 3-6 months of expenses' }
    if (isSinking)    return { target: 3000,  label: 'Sinking Fund',    icon: 'ti-coins',  color: '#ba7517',  monthly: 250,  tip: 'Save ahead for irregular expenses' }
    if (isVacation)   return { target: 3000,  label: 'Vacation Fund',   icon: 'ti-plane',  color: '#378add',  monthly: 250,  tip: 'Saving for your dream holiday' }
    if (isHouse)      return { target: 30000, label: 'House Deposit',   icon: 'ti-home',   color: '#7f77dd',  monthly: 1000, tip: 'Most mortgages need 5-20% deposit' }
    if (isCar)        return { target: 12000, label: 'Car Fund',        icon: 'ti-car',    color: '#ba7517',  monthly: 500,  tip: 'Saving for your next car' }
    if (isEducation)  return { target: 20000, label: 'Education Fund',  icon: 'ti-book',   color: '#1d9e75',  monthly: 600,  tip: 'Invest in your future education' }
    if (isRetirement) return { target: 500000,label: 'Retirement Pot',  icon: 'ti-sunset', color: '#ef9f27',  monthly: 800,  tip: 'Start early — compound interest works!' }
    if (isWedding)    return { target: 20000, label: 'Wedding Fund',    icon: 'ti-heart',  color: '#d4537e',  monthly: 800,  tip: 'For your perfect day' }
    if (isBusiness)   return { target: 15000, label: 'Business Fund',   icon: 'ti-briefcase', color: '#1d9e75', monthly: 500, tip: 'Building your business capital' }
    return             { target: 5000,  label: 'Savings Goal',  icon: 'ti-piggy-bank', color: '#c9a96e', monthly: 200,  tip: 'Every pound saved counts!' }
  }

  const def = getDefaults()
  const [target,  setTarget]  = useState(def.target)
  const [saved,   setSaved]   = useState(Math.round(def.target * 0.12))
  const [monthly, setMonthly] = useState(def.monthly)
  const [goalName, setGoalName] = useState(def.label)
  const [deadline, setDeadline] = useState('')
  const [contributions, setContributions] = useState([
    { id:1, date: new Date().toISOString().split('T')[0], amount: def.monthly, note: 'Monthly transfer' },
  ])

  const pct = target > 0 ? Math.min(100, saved / target * 100) : 0
  const remaining = Math.max(0, target - saved)
  const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : 0
  const projDate = monthly > 0 && remaining > 0 ? new Date(Date.now() + monthsLeft * 30.44 * 86400000).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'
  const pctColor = pct >= 100 ? '#1d9e75' : pct >= 75 ? '#1d9e75' : pct >= 50 ? '#ba7517' : def.color

  const addContrib = () => setContributions(p => [...p, { id: Date.now(), date: new Date().toISOString().split('T')[0], amount: 0, note: '' }])
  const updContrib = (id, k, v) => { setContributions(p => p.map(r => r.id === id ? { ...r, [k]: v } : r)); save({ target, saved, monthly, contributions }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} color={def.color} icon={def.icon} isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={deadline !== undefined && (
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '5px 10px', fontSize: 11, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none' }} />
        )} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Goal card */}
          <div style={{ background: 'var(--bg2)', border: `1px solid ${def.color}44`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: `${def.color}08`, borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${def.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ti ${def.icon}`} style={{ fontSize: 16, color: def.color }} aria-hidden="true" />
              </div>
              <input value={goalName} onChange={e => setGoalName(e.target.value)}
                style={{ flex: 1, fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)', background: 'transparent', border: 'none', outline: 'none' }} />
            </div>
            {[
              { label: 'Target amount',       key: 'target', val: target,  setter: setTarget  },
              { label: 'Amount saved so far', key: 'saved',  val: saved,   setter: setSaved   },
              { label: 'Monthly contribution',key: 'monthly',val: monthly, setter: setMonthly },
            ].map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid var(--bdr)', gap: 12 }}>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--txt2)' }}>{f.label}</span>
                <div style={{ position: 'relative', width: 150 }}>
                  <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--txt3)' }}>{sym}</span>
                  <input type="text" inputMode="decimal" value={f.val || ''} placeholder="0"
                    onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) { f.setter(parseFloat(e.target.value) || 0); save({ target, saved, monthly, contributions }) } }}
                    onFocus={e => e.target.select()}
                    style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '7px 8px 7px 26px', fontSize: 13, color: def.color, fontWeight: 700, fontFamily: 'Syne,sans-serif', outline: 'none', textAlign: 'right' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Contributions log */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: def.color }}>Contribution log</span>
              <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: def.color }}>{fmt(contributions.reduce((s,r)=>s+(r.amount||0),0), sym)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 140px 1fr 28px', padding: '6px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--bdr)', gap: 8 }}>
              {['Date','Amount','Note',''].map(h => <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase' }}>{h}</div>)}
            </div>
            {contributions.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '120px 140px 1fr 28px', gap: 8, padding: '7px 14px', borderBottom: '1px solid var(--bdr)', alignItems: 'center' }}>
                <input type="date" value={c.date} onChange={e => updContrib(c.id,'date',e.target.value)}
                  style={{ background:'transparent', border:'none', outline:'none', fontSize:10, color:'var(--txt)', fontFamily:'inherit', width:'100%' }} />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--txt3)' }}>{sym}</span>
                  <input type="text" inputMode="decimal" value={c.amount || ''} placeholder="0"
                    onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) updContrib(c.id, 'amount', parseFloat(e.target.value)||0) }}
                    onFocus={e => e.target.select()}
                    style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:6, padding:'6px 8px 6px 20px', fontSize:12, color:'var(--txt)', fontFamily:'inherit', outline:'none', textAlign:'right' }} />
                </div>
                <input value={c.note || ''} onChange={e => updContrib(c.id,'note',e.target.value)} placeholder="Note..."
                  style={{ background:'transparent', border:'none', outline:'none', fontSize:11, color:'var(--txt)', fontFamily:'inherit', width:'100%' }} />
                <button onClick={() => setContributions(p => p.filter(x => x.id !== c.id))}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt3)', fontSize:14, lineHeight:1, padding:'2px 4px' }}
                  onMouseEnter={e => e.currentTarget.style.color='#e24b4a'} onMouseLeave={e => e.currentTarget.style.color='var(--txt3)'}>×</button>
              </div>
            ))}
            <div style={{ padding: '8px 14px' }}>
              <button onClick={addContrib} style={{ fontSize:12, color:def.color, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                + Add contribution
              </button>
            </div>
          </div>
        </div>

        {/* Right — progress panel */}
        <div style={{ width: 240, flexShrink: 0, borderLeft: '1px solid var(--bdr)', overflowY: 'auto', padding: 14, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Big progress indicator */}
          <div style={{ background: `${pctColor}10`, border: `2px solid ${pctColor}44`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Progress</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 700, color: pctColor }}>{pct.toFixed(1)}%</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{fmt(saved, sym)} of {fmt(target, sym)}</div>
          </div>

          {/* Progress bar */}
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 9, padding: 12 }}>
            <div style={{ height: 10, background: 'var(--bg4)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pctColor, borderRadius: 5, transition: 'width .8s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--txt3)' }}>
              <span>{fmt(saved, sym)}</span>
              <span>{fmt(target, sym)}</span>
            </div>
          </div>

          {[
            { l: 'Still needed',    v: fmt(remaining, sym),       c: remaining > 0 ? def.color : '#1d9e75', bold: true },
            { l: 'Monthly saving',  v: fmt(monthly, sym),         c: 'var(--txt)', bold: false },
            { l: 'Months to goal',  v: monthsLeft > 0 ? `${monthsLeft} months` : pct >= 100 ? 'Achieved! 🎉' : '—', c: '#1d9e75', bold: false },
            { l: 'Projected date',  v: pct < 100 ? projDate : 'Achieved! 🎉', c: 'var(--txt2)', bold: false },
            { l: 'Contributions',   v: contributions.length, c: 'var(--txt2)', bold: false },
          ].map(r => (
            <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding: r.bold ? '8px 12px' : '5px 0', background: r.bold ? 'var(--bg3)' : 'transparent', borderRadius: r.bold ? 8 : 0, border: r.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !r.bold ? '1px solid var(--bdr)' : undefined }}>
              <span style={{ fontSize:11, color: r.bold ? 'var(--txt)' : 'var(--txt3)', fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
              <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 500, color: r.c }}>{r.v}</span>
            </div>
          ))}

          <div style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px', fontSize:10, color:'var(--txt3)', lineHeight:1.6 }}>
            💡 {def.tip}
          </div>
        </div>
      </div>
    </div>
  )
}


export function SavingsChallengeTool({ tool }) {
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n = (tool?.name || '').toLowerCase()

  const is30Day = n.includes('30') || n.includes('30-day')
  const is100Day = n.includes('100')
  const isCent   = n.includes('cent') || n.includes('penny')

  // 52-week challenge: week 1 save £1, week 2 save £2 ... week 52 save £52 = £1378 total
  // 30-day challenge: day 1 save £1 ... day 30 = £465 total
  const weeks = is30Day ? 30 : is100Day ? 100 : 52
  const label = is30Day ? 'Day' : 'Week'

  const [completed, setCompleted] = useState(() => {
    const arr = new Array(weeks).fill(false)
    arr[0] = true; arr[1] = true; arr[2] = true
    return arr
  })
  const [startDate] = useState(new Date().toISOString().split('T')[0])
  const [customAmounts, setCustomAmounts] = useState(false)
  const [amounts, setAmounts] = useState(() => Array.from({length: weeks}, (_, i) => isCent ? (i+1) * 0.01 : i+1))

  const toggle = (i) => { const next = [...completed]; next[i] = !next[i]; setCompleted(next); save({completed, amounts}) }
  const totalTarget = amounts.reduce((s,a) => s+a, 0)
  const totalSaved  = amounts.filter((_, i) => completed[i]).reduce((s,a) => s+a, 0)
  const pct = totalTarget > 0 ? (totalSaved / totalTarget * 100) : 0
  const completedCount = completed.filter(Boolean).length
  const color = '#1d9e75'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>
      <ToolHeader tool={tool} color={color} icon='ti-trophy' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={
          <button onClick={() => setCustomAmounts(c => !c)}
            style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${customAmounts ? color : 'var(--bdr)'}`, background: customAmounts ? `${color}15` : 'transparent', fontSize:11, color: customAmounts ? color : 'var(--txt3)', cursor:'pointer', fontFamily:'inherit' }}>
            Custom amounts
          </button>
        } />
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:14 }}>
          {/* Progress bar */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--txt)' }}>{weeks}-{label} Savings Challenge</span>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color }}>{pct.toFixed(0)}%</span>
            </div>
            <div style={{ height:8, background:'var(--bg4)', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
              <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:4, transition:'width .4s' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--txt3)' }}>
              <span>{completedCount} of {weeks} {label.toLowerCase()}s done</span>
              <span>{fmt(totalSaved, sym)} saved of {fmt(totalTarget, sym)}</span>
            </div>
          </div>

          {/* Grid of weeks */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(75px, 1fr))', gap:6 }}>
            {Array.from({length: weeks}, (_, i) => (
              <div key={i} onClick={() => toggle(i)}
                style={{ background: completed[i] ? `${color}18` : 'var(--bg2)', border:`1px solid ${completed[i] ? color+'66' : 'var(--bdr)'}`, borderRadius:9, padding:'8px 6px', textAlign:'center', cursor:'pointer', transition:'all .15s' }}>
                <div style={{ fontSize:9, color: completed[i] ? color : 'var(--txt3)', fontWeight:600, marginBottom:3 }}>{label} {i+1}</div>
                {customAmounts ? (
                  <input type="text" inputMode="decimal" value={amounts[i] || ''} placeholder="0"
                    onClick={e => e.stopPropagation()}
                    onChange={e => { const next = [...amounts]; next[i] = parseFloat(e.target.value)||0; setAmounts(next) }}
                    style={{ width:'100%', background:'transparent', border:'none', outline:'none', fontSize:11, fontWeight:700, color: completed[i] ? color : 'var(--txt)', fontFamily:'Syne,sans-serif', textAlign:'center' }} />
                ) : (
                  <div style={{ fontSize:12, fontWeight:700, color: completed[i] ? color : 'var(--txt)', fontFamily:'Syne,sans-serif' }}>{fmt(amounts[i], sym)}</div>
                )}
                {completed[i] && <i className="ti ti-check" style={{ fontSize:10, color, display:'block', marginTop:3 }} aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ width:220, flexShrink:0, borderLeft:'1px solid var(--bdr)', overflowY:'auto', padding:14, background:'var(--bg2)', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ background:`${color}10`, border:`2px solid ${color}44`, borderRadius:12, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--txt3)', textTransform:'uppercase', marginBottom:4 }}>Total saved</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color }}>{fmt(totalSaved, sym)}</div>
            <div style={{ fontSize:10, color:'var(--txt3)', marginTop:2 }}>of {fmt(totalTarget, sym)} goal</div>
          </div>
          {[
            { l:`${label}s done`,    v:`${completedCount}/${weeks}`, c:color, bold:false },
            { l:`${label}s left`,    v:weeks-completedCount,         c:'var(--txt2)', bold:false },
            { l:'Still to save',     v:fmt(totalTarget-totalSaved,sym), c:'var(--gold)', bold:true },
            { l:'Avg per '+label.toLowerCase(), v:fmt(totalTarget/weeks, sym), c:'var(--txt2)', bold:false },
          ].map(r => (
            <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding: r.bold ? '8px 12px' : '5px 0', background: r.bold ? 'var(--bg3)' : 'transparent', borderRadius: r.bold ? 8 : 0, border: r.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !r.bold ? '1px solid var(--bdr)' : undefined }}>
              <span style={{ fontSize:11, color: r.bold ? 'var(--txt)' : 'var(--txt3)', fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
              <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 500, color:r.c }}>{r.v}</span>
            </div>
          ))}
          <div style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px', fontSize:10, color:'var(--txt3)', lineHeight:1.6 }}>
            💡 Click any {label.toLowerCase()} box to mark it as saved. Check them off as you go!
          </div>
        </div>
      </div>
    </div>
  )
}

export function NoSpendChallengeTool({ tool }) {
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n = (tool?.name || '').toLowerCase()
  const days = n.includes('7') ? 7 : n.includes('14') ? 14 : n.includes('21') ? 21 : 30

  const today = new Date()
  const [log, setLog] = useState(() =>
    Array.from({length: days}, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (days - 1 - i))
      return { id: i+1, date: d.toISOString().split('T')[0], noSpend: i < 3, spent: i < 3 ? 0 : 0, note: '' }
    })
  )
  const [savedAmount, setSavedAmount] = useState(0)

  const upd = (id, k, v) => { setLog(p => p.map(r => r.id === id ? { ...r, [k]: v } : r)); save({ log, savedAmount }) }
  const noSpendDays = log.filter(d => d.noSpend).length
  const spendDays   = log.filter(d => !d.noSpend && d.date <= today.toISOString().split('T')[0]).length
  const totalSpent  = log.reduce((s, d) => s + (d.spent || 0), 0)
  const streak = (() => { let s = 0; for (let i = log.length-1; i >= 0; i--) { if (log[i].noSpend) s++; else break; } return s })()

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>
      <ToolHeader tool={tool} color='#1d9e75' icon='ti-lock' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave} />
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:10 }}>
          {/* Day grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:6 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:9, color:'var(--txt3)', fontWeight:700, padding:'4px 0' }}>{d}</div>
            ))}
            {log.map(d => (
              <div key={d.id} onClick={() => upd(d.id, 'noSpend', !d.noSpend)}
                style={{ background: d.noSpend ? 'rgba(29,158,117,.15)' : 'rgba(226,75,74,.08)', border:`1px solid ${d.noSpend ? '#1d9e7566' : '#e24b4a44'}`, borderRadius:9, padding:'10px 6px', textAlign:'center', cursor:'pointer', transition:'all .15s' }}>
                <div style={{ fontSize:9, color:'var(--txt3)', marginBottom:4 }}>{new Date(d.date).getDate()}</div>
                <i className={`ti ${d.noSpend ? 'ti-check' : 'ti-x'}`} style={{ fontSize:14, color: d.noSpend ? '#1d9e75' : '#e24b4a' }} aria-hidden="true" />
                {!d.noSpend && (
                  <input type="text" inputMode="decimal" value={d.spent || ''} placeholder="0"
                    onClick={e => e.stopPropagation()} onChange={e => { if(/^[\d]*\.?[\d]*$/.test(e.target.value)) upd(d.id,'spent',parseFloat(e.target.value)||0) }}
                    style={{ width:'100%', background:'transparent', border:'none', outline:'none', fontSize:10, color:'#e24b4a', fontFamily:'inherit', textAlign:'center', marginTop:4 }}
                    placeholder={sym+'0'} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ width:220, flexShrink:0, borderLeft:'1px solid var(--bdr)', overflowY:'auto', padding:14, background:'var(--bg2)', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ background:'rgba(29,158,117,.1)', border:'2px solid rgba(29,158,117,.4)', borderRadius:12, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--txt3)', textTransform:'uppercase', marginBottom:4 }}>No-spend days</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:36, fontWeight:700, color:'#1d9e75' }}>{noSpendDays}</div>
            <div style={{ fontSize:10, color:'var(--txt3)' }}>of {days} days</div>
          </div>
          {[
            { l:'Current streak', v:`${streak} days 🔥`, c:'#ef9f27', bold:false },
            { l:'Spend days',     v:spendDays,           c:'#e24b4a', bold:false },
            { l:'Total spent',    v:fmt(totalSpent,sym),  c:'#e24b4a', bold:true  },
            { l:'Money saved',    v:fmt(savedAmount,sym), c:'#1d9e75', bold:true  },
          ].map(r => (
            <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding: r.bold ? '8px 12px' : '5px 0', background: r.bold ? 'var(--bg3)' : 'transparent', borderRadius: r.bold ? 8 : 0, border: r.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !r.bold ? '1px solid var(--bdr)' : undefined }}>
              <span style={{ fontSize:11, color: r.bold ? 'var(--txt)' : 'var(--txt3)', fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
              <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 500, color:r.c }}>{r.v}</span>
            </div>
          ))}
          <div>
            <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:4 }}>I saved this much vs normal spending:</div>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'var(--txt3)' }}>{sym}</span>
              <input type="text" inputMode="decimal" value={savedAmount||''} placeholder="0"
                onChange={e => { if(/^[\d]*\.?[\d]*$/.test(e.target.value)) setSavedAmount(parseFloat(e.target.value)||0) }}
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:7, padding:'8px 8px 8px 24px', fontSize:14, fontWeight:700, color:'#1d9e75', fontFamily:'Syne,sans-serif', outline:'none', textAlign:'right' }} />
            </div>
          </div>
          <div style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px', fontSize:10, color:'var(--txt3)', lineHeight:1.6 }}>
            💡 Click a day to toggle no-spend. On spend days, enter how much you spent.
          </div>
        </div>
      </div>
    </div>
  )
}


export function ExpenseTrackerTool({ tool }) {
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n = (tool?.name || '').toLowerCase()

  const isDaily    = n.includes('daily')
  const isCategory = n.includes('category')
  const isRecurring = n.includes('recurring')
  const isHousehold = n.includes('household')
  const isBill     = n.includes('bill')
  const isLifestyle = n.includes('lifestyle')
  const isMedical  = n.includes('medical')
  const isPet      = n.includes('pet')
  const isChild    = n.includes('child')

  const getCats = () => {
    if (isRecurring) return ['Rent/Mortgage','Utilities','Internet','Phone','Insurance','Subscriptions','Gym','Other']
    if (isHousehold) return ['Groceries','Cleaning','Repairs','Furniture','Garden','Utilities','Other']
    if (isBill)      return ['Electricity','Gas','Water','Internet','Phone','Council Tax','Insurance','TV Licence','Other']
    if (isLifestyle) return ['Dining out','Entertainment','Clothing','Beauty','Hobbies','Travel','Fitness','Other']
    if (isMedical)   return ['GP/Doctor','Prescription','Dental','Optical','Physiotherapy','Hospital','Other']
    if (isPet)       return ['Food','Vet','Grooming','Insurance','Medication','Accessories','Other']
    if (isChild)     return ['Nursery','After school','School meals','Uniforms','Activities','Trips','Other']
    if (isCategory)  return ['Housing','Food','Transport','Entertainment','Healthcare','Clothing','Savings','Other']
    return ['Housing','Food & Dining','Transport','Entertainment','Shopping','Healthcare','Other']
  }
  const cats = getCats()

  const [entries, setEntries] = useState([
    { id:1, date: new Date().toISOString().split('T')[0], category: cats[0], description:'', amount:0, notes:'' },
  ])
  const [filter, setFilter] = useState('all')

  const now = new Date()
  const filtered = entries.filter(e => {
    if (filter === 'week')  return (now - new Date(e.date)) / 86400000 <= 7
    if (filter === 'month') { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }
    return true
  })

  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0)
  const byCat = cats.map(c => ({ cat:c, total: filtered.filter(e => e.category === c).reduce((s,e) => s+e.amount, 0) })).filter(c => c.total > 0)
  const upd = (id, k, v) => { setEntries(p => p.map(r => r.id === id ? { ...r, [k]: v } : r)); save({ entries }) }
  const add = () => setEntries(p => [...p, { id: Date.now(), date: new Date().toISOString().split('T')[0], category: cats[0], description:'', amount:0, notes:'' }])
  const cS = { background:'transparent', border:'none', outline:'none', fontSize:11, color:'var(--txt)', fontFamily:'inherit', width:'100%' }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>
      <ToolHeader tool={tool} color='#378add' icon='ti-receipt' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={
          <div style={{ display:'flex', gap:4 }}>
            {[['all','All'],['month','Month'],['week','Week']].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${filter===k?'#378add':'var(--bdr)'}`, background: filter===k?'rgba(55,138,221,.12)':'transparent', fontSize:10, color: filter===k?'#378add':'var(--txt2)', cursor:'pointer', fontFamily:'inherit' }}>{l}</button>
            ))}
          </div>
        } />
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:14 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', background:'var(--bg3)', borderBottom:'1px solid var(--bdr)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#378add' }}>Expense log</span>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#378add' }}>{fmt(total, sym)}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'110px 130px 1fr 140px 1fr 28px', padding:'6px 14px', background:'var(--bg3)', borderBottom:'1px solid var(--bdr)', gap:8 }}>
              {['Date','Category','Description',`Amount (${sym})`, 'Notes',''].map(h => <div key={h} style={{ fontSize:9, fontWeight:700, color:'var(--txt3)', textTransform:'uppercase' }}>{h}</div>)}
            </div>
            {filtered.map((e, i) => (
              <div key={e.id} data-row="" data-name={e.description || e.category} data-amount={e.amount} style={{ display:'grid', gridTemplateColumns:'110px 130px 1fr 140px 1fr 28px', gap:8, padding:'8px 14px', borderBottom:'1px solid var(--bdr)', alignItems:'center', background: i%2===0?'transparent':'rgba(255,255,255,.01)' }}>
                <input type="date" value={e.date} onChange={ev => upd(e.id,'date',ev.target.value)} style={{...cS, fontSize:10}} />
                <select value={e.category} onChange={ev => upd(e.id,'category',ev.target.value)} style={{...cS, cursor:'pointer', fontSize:10}}>
                  {cats.map(c => <option key={c}>{c}</option>)}
                </select>
                <input value={e.description||''} onChange={ev => upd(e.id,'description',ev.target.value)} placeholder="Description..." style={cS} />
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:7, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--txt3)' }}>{sym}</span>
                  <input type="text" inputMode="decimal" value={e.amount||''} placeholder="0"
                    onChange={ev => { if(/^[\d]*\.?[\d]*$/.test(ev.target.value)) upd(e.id,'amount',parseFloat(ev.target.value)||0) }}
                    onFocus={ev => ev.target.select()}
                    style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:6, padding:'6px 8px 6px 20px', fontSize:12, color:'var(--txt)', fontFamily:'inherit', outline:'none', textAlign:'right' }} />
                </div>
                <input value={e.notes||''} onChange={ev => upd(e.id,'notes',ev.target.value)} placeholder="Notes..." style={cS} />
                <button onClick={() => setEntries(p => p.filter(r => r.id !== e.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt3)', fontSize:14, lineHeight:1, padding:'2px 4px' }}
                  onMouseEnter={ev => ev.currentTarget.style.color='#e24b4a'} onMouseLeave={ev => ev.currentTarget.style.color='var(--txt3)'}>×</button>
              </div>
            ))}
            <div style={{ padding:'8px 14px' }}>
              <button onClick={add} style={{ fontSize:12, color:'#378add', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>+ Add expense</button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ width:240, flexShrink:0, borderLeft:'1px solid var(--bdr)', overflowY:'auto', padding:14, background:'var(--bg2)', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ background:'rgba(55,138,221,.1)', border:'2px solid rgba(55,138,221,.4)', borderRadius:12, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--txt3)', textTransform:'uppercase', marginBottom:4 }}>Total {filter === 'all' ? '' : filter}</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color:'#378add' }}>{fmt(total, sym)}</div>
            <div style={{ fontSize:10, color:'var(--txt3)', marginTop:2 }}>{filtered.length} entries</div>
          </div>
          {[
            { l:'Entries', v:filtered.length, c:'var(--txt)', bold:true },
            { l:'Avg per entry', v:fmt(filtered.length > 0 ? total/filtered.length : 0, sym), c:'var(--txt2)', bold:false },
            { l:'Largest',      v:fmt(Math.max(0,...filtered.map(e => e.amount||0)), sym), c:'#e24b4a', bold:false },
          ].map(r => (
            <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding: r.bold ? '8px 12px' : '5px 0', background: r.bold ? 'var(--bg3)' : 'transparent', borderRadius: r.bold ? 8 : 0, border: r.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !r.bold ? '1px solid var(--bdr)' : undefined }}>
              <span style={{ fontSize:11, color: r.bold ? 'var(--txt)' : 'var(--txt3)', fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
              <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 500, color:r.c }}>{r.v}</span>
            </div>
          ))}
          {byCat.length > 0 && (
            <div style={{ background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:9, padding:10 }}>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--txt)', marginBottom:8 }}>By category</div>
              {byCat.sort((a,b) => b.total-a.total).map((c, i) => {
                const pct = total > 0 ? (c.total / total * 100) : 0
                const colors = ['#378add','#ba7517','#d4537e','#7f77dd','#1d9e75','#ef9f27','#e24b4a','#c9a96e']
                const col = colors[i % colors.length]
                return (
                  <div key={c.cat} style={{ marginBottom:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ fontSize:10, color:'var(--txt2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>{c.cat}</span>
                      <span style={{ fontSize:10, fontWeight:600, color:col }}>{fmt(c.total, sym)}</span>
                    </div>
                    <div style={{ height:3, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:col, borderRadius:2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export function IncomeTrackerTool({ tool }) {
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n = (tool?.name || '').toLowerCase()

  const isSalary    = n.includes('salary') || n.includes('payslip')
  const isSide      = n.includes('side') || n.includes('extra')
  const isFreelance = n.includes('freelance') || n.includes('contractor')
  const isCommission = n.includes('commission')
  const isBonus     = n.includes('bonus')
  const isPassive   = n.includes('passive') || n.includes('rental') || n.includes('dividend')

  const getSources = () => {
    if (isSalary)    return ['Base salary','Overtime','Holiday pay','Sick pay','Benefits','Expenses reimbursed','Other']
    if (isFreelance) return ['Project fees','Hourly work','Retainer','Rush fee','Expenses reimbursed','Bonus','Other']
    if (isCommission)return ['Base salary','Commission earned','Bonus','Override commission','Tier bonus','Other']
    if (isBonus)     return ['Annual bonus','Performance bonus','Signing bonus','Referral bonus','Sales bonus','Other']
    if (isPassive)   return ['Rental income','Dividends','Interest','Royalties','Side business','Peer lending','Other']
    if (isSide)      return ['Freelance','Gig work','Selling items','Tutoring','Content creation','Investments','Other']
    return ['Salary','Freelance','Commission','Bonus','Rental','Dividends','Interest','Other']
  }
  const sources = getSources()

  const [entries, setEntries] = useState([
    { id:1, date: new Date().toISOString().split('T')[0], source: sources[0], description:'', amount:0, recurring:true, notes:'' },
  ])

  const total    = entries.reduce((s, e) => s + (e.amount || 0), 0)
  const recurring = entries.filter(e => e.recurring).reduce((s, e) => s + (e.amount || 0), 0)
  const oneOff   = total - recurring
  const bySrc    = sources.map(s => ({ src:s, total: entries.filter(e => e.source === s).reduce((a,e) => a+e.amount, 0) })).filter(s => s.total > 0)

  const upd = (id, k, v) => { setEntries(p => p.map(r => r.id === id ? { ...r, [k]: v } : r)); save({ entries }) }
  const add = () => setEntries(p => [...p, { id: Date.now(), date: new Date().toISOString().split('T')[0], source: sources[0], description:'', amount:0, recurring:false, notes:'' }])
  const cS = { background:'transparent', border:'none', outline:'none', fontSize:11, color:'var(--txt)', fontFamily:'inherit', width:'100%' }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>
      <ToolHeader tool={tool} color='#1d9e75' icon='ti-coins' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave} />
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:14 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', background:'var(--bg3)', borderBottom:'1px solid var(--bdr)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#1d9e75' }}>Income log</span>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#1d9e75' }}>{fmt(total, sym)}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'110px 130px 1fr 140px 70px 1fr 28px', padding:'6px 14px', background:'var(--bg3)', borderBottom:'1px solid var(--bdr)', gap:8 }}>
              {['Date','Source','Description',`Amount (${sym})`,'Recur','Notes',''].map(h => <div key={h} style={{ fontSize:9, fontWeight:700, color:'var(--txt3)', textTransform:'uppercase' }}>{h}</div>)}
            </div>
            {entries.map((e, i) => (
              <div key={e.id} style={{ display:'grid', gridTemplateColumns:'110px 130px 1fr 140px 70px 1fr 28px', gap:8, padding:'8px 14px', borderBottom:'1px solid var(--bdr)', alignItems:'center', background: i%2===0?'transparent':'rgba(255,255,255,.01)' }}>
                <input type="date" value={e.date} onChange={ev => upd(e.id,'date',ev.target.value)} style={{...cS,fontSize:10}} />
                <select value={e.source} onChange={ev => upd(e.id,'source',ev.target.value)} style={{...cS,cursor:'pointer',fontSize:10}}>
                  {sources.map(s => <option key={s}>{s}</option>)}
                </select>
                <input value={e.description||''} onChange={ev => upd(e.id,'description',ev.target.value)} placeholder="Description..." style={cS} />
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:7, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--txt3)' }}>{sym}</span>
                  <input type="text" inputMode="decimal" value={e.amount||''} placeholder="0"
                    onChange={ev => { if(/^[\d]*\.?[\d]*$/.test(ev.target.value)) upd(e.id,'amount',parseFloat(ev.target.value)||0) }}
                    onFocus={ev => ev.target.select()}
                    style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:6, padding:'6px 8px 6px 20px', fontSize:12, color:'var(--txt)', fontFamily:'inherit', outline:'none', textAlign:'right' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <input type="checkbox" checked={!!e.recurring} onChange={ev => upd(e.id,'recurring',ev.target.checked)} style={{ cursor:'pointer', accentColor:'#1d9e75', width:16, height:16 }} />
                </div>
                <input value={e.notes||''} onChange={ev => upd(e.id,'notes',ev.target.value)} placeholder="Notes..." style={cS} />
                <button onClick={() => setEntries(p => p.filter(r => r.id !== e.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt3)', fontSize:14, lineHeight:1, padding:'2px 4px' }}
                  onMouseEnter={ev => ev.currentTarget.style.color='#e24b4a'} onMouseLeave={ev => ev.currentTarget.style.color='var(--txt3)'}>×</button>
              </div>
            ))}
            <div style={{ padding:'8px 14px' }}>
              <button onClick={add} style={{ fontSize:12, color:'#1d9e75', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>+ Add income</button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ width:240, flexShrink:0, borderLeft:'1px solid var(--bdr)', overflowY:'auto', padding:14, background:'var(--bg2)', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ background:'rgba(29,158,117,.1)', border:'2px solid rgba(29,158,117,.4)', borderRadius:12, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--txt3)', textTransform:'uppercase', marginBottom:4 }}>Total income</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color:'#1d9e75' }}>{fmt(total, sym)}</div>
            <div style={{ fontSize:10, color:'var(--txt3)', marginTop:2 }}>{entries.length} entries</div>
          </div>
          {[
            { l:'Recurring',    v: fmt(recurring, sym), c:'#1d9e75', bold:true },
            { l:'One-off',      v: fmt(oneOff, sym),    c:'var(--gold)', bold:false },
            { l:'Avg per entry',v: fmt(entries.length > 0 ? total/entries.length : 0, sym), c:'var(--txt2)', bold:false },
          ].map(r => (
            <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding: r.bold ? '8px 12px' : '5px 0', background: r.bold ? 'var(--bg3)' : 'transparent', borderRadius: r.bold ? 8 : 0, border: r.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !r.bold ? '1px solid var(--bdr)' : undefined }}>
              <span style={{ fontSize:11, color: r.bold ? 'var(--txt)' : 'var(--txt3)', fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
              <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 500, color:r.c }}>{r.v}</span>
            </div>
          ))}
          {bySrc.length > 0 && (
            <div style={{ background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:9, padding:10 }}>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--txt)', marginBottom:8 }}>By source</div>
              {bySrc.sort((a,b) => b.total-a.total).map((s,i) => {
                const pct = total > 0 ? (s.total/total*100) : 0
                return (
                  <div key={s.src} style={{ marginBottom:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ fontSize:10, color:'var(--txt2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>{s.src}</span>
                      <span style={{ fontSize:10, fontWeight:600, color:'#1d9e75' }}>{fmt(s.total, sym)}</span>
                    </div>
                    <div style={{ height:3, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:'#1d9e75', borderRadius:2, opacity: 1 - i*0.1 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export function KPIDashboardTool({ tool }) {
  const n = (tool?.name || '').toLowerCase()
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol

  // Determine dashboard type
  let dashType = 'budget'
  if (n.includes('net worth') || n.includes('wealth')) dashType = 'networth'
  else if (n.includes('debt')) dashType = 'debt'
  else if (n.includes('goal')) dashType = 'goals'
  else if (n.includes('cash flow')) dashType = 'cashflow'
  else if (n.includes('forecast')) dashType = 'forecast'

  const dashConfigs = {
    budget: {
      icon:'ti-chart-bar', color:'var(--gold)',
      defaultKPIs: [
        { id:1, metric:'Monthly income', actual:2500, target:2500, unit:'£', color:'#1d9e75' },
        { id:2, metric:'Total expenses', actual:2100, target:2000, unit:'£', color:'#d4537e' },
        { id:3, metric:'Savings rate', actual:16, target:20, unit:'%', color:'#378add' },
        { id:4, metric:'Emergency fund', actual:4200, target:10000, unit:'£', color:'var(--gold)' },
      ]
    },
    networth: {
      icon:'ti-chart-pie', color:'#1d9e75',
      defaultKPIs: [
        { id:1, metric:'Total assets', actual:85000, target:100000, unit:'£', color:'#1d9e75' },
        { id:2, metric:'Total liabilities', actual:32000, target:20000, unit:'£', color:'#d4537e' },
        { id:3, metric:'Net worth', actual:53000, target:80000, unit:'£', color:'var(--gold)' },
        { id:4, metric:'Debt-to-asset ratio', actual:38, target:25, unit:'%', color:'#ba7517' },
      ]
    },
    debt: {
      icon:'ti-credit-card', color:'#d4537e',
      defaultKPIs: [
        { id:1, metric:'Total debt', actual:18000, target:0, unit:'£', color:'#d4537e' },
        { id:2, metric:'Monthly debt payment', actual:450, target:400, unit:'£', color:'#ba7517' },
        { id:3, metric:'Debt-to-income ratio', actual:18, target:15, unit:'%', color:'#378add' },
        { id:4, metric:'Months to debt-free', actual:40, target:24, unit:'mo', color:'var(--gold)' },
      ]
    },
    goals: {
      icon:'ti-target', color:'#378add',
      defaultKPIs: [
        { id:1, metric:'Emergency fund', actual:4200, target:10000, unit:'£', color:'#378add' },
        { id:2, metric:'House deposit', actual:12000, target:25000, unit:'£', color:'#ba7517' },
        { id:3, metric:'Pension pot', actual:22000, target:50000, unit:'£', color:'#1d9e75' },
        { id:4, metric:'ISA balance', actual:8500, target:20000, unit:'£', color:'var(--gold)' },
      ]
    },
    cashflow: {
      icon:'ti-trending-up', color:'#7f77dd',
      defaultKPIs: [
        { id:1, metric:'Monthly income', actual:2500, target:2800, unit:'£', color:'#1d9e75' },
        { id:2, metric:'Monthly expenses', actual:2100, target:2000, unit:'£', color:'#d4537e' },
        { id:3, metric:'Net cash flow', actual:400, target:500, unit:'£', color:'var(--gold)' },
        { id:4, metric:'Savings rate', actual:16, target:20, unit:'%', color:'#378add' },
      ]
    },
    forecast: {
      icon:'ti-chart-line', color:'#ef9f27',
      defaultKPIs: [
        { id:1, metric:'Projected savings (12mo)', actual:4800, target:6000, unit:'£', color:'#1d9e75' },
        { id:2, metric:'Projected net worth', actual:58000, target:70000, unit:'£', color:'var(--gold)' },
        { id:3, metric:'Savings rate target', actual:16, target:20, unit:'%', color:'#378add' },
        { id:4, metric:'Emergency fund progress', actual:4200, target:10000, unit:'£', color:'#7f77dd' },
      ]
    },
  }

  const dc = dashConfigs[dashType] || dashConfigs.budget
  const [kpis, setKpis] = useState(dc.defaultKPIs)
  const update = (id, key, val) => setKpis(p => p.map(k => k.id===id ? {...k,[key]:val} : k))
  const addKPI = () => setKpis(p => [...p, { id:Date.now(), metric:'New metric', actual:0, target:100, unit:'£', color:'var(--gold)' }])

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>
      <ToolHeader tool={tool} color={dc.color} icon={dc.icon}
        extra={
          <button onClick={addKPI}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px solid var(--bdr)', background:'transparent', fontSize:11, color:'var(--txt2)', cursor:'pointer', fontFamily:'inherit' }}>
            <i className="ti ti-plus" style={{ fontSize:11 }} aria-hidden="true" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/> Add metric
          </button>
        }/>
      <div style={{ flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:10 }}>
        {/* KPI grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {kpis.map(kpi => {
            // For debt metrics where lower is better
            const lowerIsBetter = ['debt','liabilit','ratio'].some(x => kpi.metric.toLowerCase().includes(x))
            const pct = kpi.target > 0 ? Math.min(100, (kpi.actual/kpi.target)*100) : 0
            const isGood = lowerIsBetter ? (kpi.actual <= kpi.target) : (kpi.actual >= kpi.target)
            const barColor = isGood ? '#1d9e75' : pct >= 70 ? '#ba7517' : '#e24b4a'

            return (
              <div key={kpi.id} style={{ background:'var(--bg2)', border:`1px solid ${isGood?'rgba(29,158,117,.3)':'var(--bdr)'}`, borderRadius:12, padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <input value={kpi.metric} onChange={e=>update(kpi.id,'metric',e.target.value)}
                    style={{ flex:1, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--txt)', background:'transparent', border:'none', outline:'none' }}/>
                  <button onClick={()=>setKpis(p=>p.filter(k=>k.id!==kpi.id))} style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}>
                    <i className="ti ti-x" style={{ fontSize:11, color:'var(--txt3)' }} aria-hidden="true"/>
                  </button>
                </div>
                {/* Actual value (big) */}
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color:isGood?'#1d9e75':'var(--gold)' }}>
                    {kpi.unit==='£'?'£':''}{typeof kpi.actual === 'number' ? kpi.actual.toLocaleString('en-GB') : kpi.actual}
                    {kpi.unit!=='£'&&kpi.unit?kpi.unit:''}
                  </div>
                  <span style={{ fontSize:10, color:'var(--txt3)' }}>/ target: {kpi.unit==='£'?'£':''}{kpi.target.toLocaleString('en-GB')}{kpi.unit!=='£'&&kpi.unit?kpi.unit:''}</span>
                </div>
                {/* Progress bar */}
                <div style={{ height:6, background:'var(--bg4)', borderRadius:3, overflow:'hidden', marginBottom:10 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:barColor, borderRadius:3, transition:'width .5s' }}/>
                </div>
                {/* Edit inputs */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {[{l:'Actual',k:'actual'},{l:'Target',k:'target'}].map(f => (
                    <div key={f.k}>
                      <div style={{ fontSize:8, color:'var(--txt3)', textTransform:'uppercase', marginBottom:2 }}>{f.l}</div>
                      <input type="text" inputMode="decimal" value={kpi[f.k]||''} placeholder="0"
                        onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))update(kpi.id,f.k,parseFloat(e.target.value)||0)}}
                        style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:5, padding:'5px 6px', fontSize:11, color:'var(--txt)', fontFamily:'inherit', outline:'none', textAlign:'right' }}/>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Overall summary */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:12, padding:14 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, color:'var(--txt)', marginBottom:10 }}>
            Dashboard summary — {kpis.filter(k=>{
              const lIB = ['debt','liabilit','ratio'].some(x=>k.metric.toLowerCase().includes(x))
              return lIB ? k.actual<=k.target : k.actual>=k.target
            }).length}/{kpis.length} targets met
          </div>
          {kpis.map(k => {
            const lIB = ['debt','liabilit','ratio'].some(x=>k.metric.toLowerCase().includes(x))
            const ok = lIB ? k.actual<=k.target : k.actual>=k.target
            const pct = k.target>0?Math.min(100,(k.actual/k.target)*100):0
            return (
              <div key={k.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:11, color:'var(--txt2)', width:160, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k.metric}</span>
                <div style={{ flex:1, height:4, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:ok?'#1d9e75':'#e24b4a', borderRadius:2 }}/>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:ok?'#1d9e75':'#e24b4a', width:36, textAlign:'right' }}>{Math.round(pct)}%</span>
                <i className={`ti ti-${ok?'check':'x'}`} style={{ fontSize:12, color:ok?'#1d9e75':'#e24b4a', flexShrink:0 }} aria-hidden="true"/>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DEBT TOOL — Snowball, Avalanche, Consolidation, Payoff Tracker
// ═══════════════════════════════════════════════════════════════
export function DebtTool({ tool }) {
  const n = (tool?.name || '').toLowerCase()
  const isAvalanche = n.includes('avalanche')
  const isConsolidation = n.includes('consolidation')
  const isPayoff = n.includes('payoff')
  const strategy = isAvalanche ? 'avalanche' : 'snowball'

  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [debts, setDebts] = useState([
    { id:1, name:'Credit card A', balance:1800, rate:24.9, minPayment:40 },
    { id:2, name:'Credit card B', balance:900,  rate:19.9, minPayment:25 },
    { id:3, name:'Personal loan', balance:4200, rate:8.9,  minPayment:90 },
  ])
  const [extra, setExtra] = useState(150)
  const [strat, setStrat] = useState(strategy)
  // Consolidation loan
  const [consRate, setConsRate] = useState(6.9)
  const [consTerm, setConsTerm] = useState(36)

  // fmt uses global with sym
  const totalDebt = debts.reduce((s,d) => s+d.balance, 0)
  const totalMin = debts.reduce((s,d) => s+d.minPayment, 0)
  const totalPayment = totalMin + extra

  // Sort by strategy
  const sorted = [...debts].sort((a,b) => strat==='snowball' ? a.balance-b.balance : b.rate-a.rate)

  // Calculate payoff
  const calcPayoff = () => {
    let rem = debts.map(d => ({ ...d, bal:d.balance }))
    let months=0, results=[], freed=0
    while (rem.some(d=>d.bal>0) && months<480) {
      months++
      let ea = extra + freed
      for (let d of rem) {
        if(d.bal<=0) continue
        d.bal += d.bal*(d.rate/100/12)
        d.bal = Math.max(0, d.bal - Math.min(d.bal,d.minPayment))
      }
      const order = [...rem].filter(d=>d.bal>0).sort((a,b)=>strat==='snowball'?a.bal-b.bal:b.rate-a.rate)
      for (let od of order) {
        const d = rem.find(x=>x.id===od.id)
        if(!d||d.bal<=0) continue
        const pay = Math.min(d.bal,ea)
        d.bal -= pay; ea -= pay
        if(ea<=0) break
      }
      for (let d of rem) {
        if(d.bal<=0&&!results.find(r=>r.id===d.id)) {
          freed += d.minPayment
          results.push({id:d.id,name:d.name,months,orig:debts.find(x=>x.id===d.id)?.balance||0})
          d.bal=0
        }
      }
    }
    return results
  }

  const payoffOrder = calcPayoff()
  const totalMonths = payoffOrder.length>0?Math.max(...payoffOrder.map(p=>p.months)):0
  const yrs = Math.floor(totalMonths/12), mos = totalMonths%12

  // Consolidation
  const mr = consRate/100/12
  const consPayment = totalDebt > 0 && mr > 0
    ? totalDebt * (mr*Math.pow(1+mr,consTerm)) / (Math.pow(1+mr,consTerm)-1) : totalDebt/consTerm
  const consTotalPaid = consPayment * consTerm
  const consInterest = consTotalPaid - totalDebt
  const currentInterest = debts.reduce((s,d)=>s+(d.balance*(d.rate/100/12)*totalMonths),0)

  const update = (id,k,v) => setDebts(p=>p.map(d=>d.id===id?{...d,[k]:v}:d))
  const addDebt = () => setDebts(p=>[...p,{id:Date.now(),name:'New debt',balance:0,rate:0,minPayment:0}])

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>
      <ToolHeader tool={tool} color='#d4537e' icon='ti-credit-card'
        extra={!isConsolidation && (
          <div style={{ display:'flex', gap:5 }}>
            {[['snowball','Snowball'],['avalanche','Avalanche']].map(([s,l]) => (
              <button key={s} onClick={()=>setStrat(s)}
                style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${strat===s?'#d4537e':'var(--bdr)'}`, background:strat===s?'rgba(212,83,126,.12)':'transparent', fontSize:10, color:strat===s?'#d4537e':'var(--txt2)', cursor:'pointer', fontFamily:'inherit' }}>
                {l}
              </button>
            ))}
          </div>
        )}/>
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 260px', overflow:'hidden', minHeight:0 }}>
        {/* Left */}
        <div style={{ overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:10 }}>
          {/* Extra payment */}
          {!isConsolidation && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:12, padding:14 }}>
              <NumInput label="Extra monthly payment above minimums" value={extra} onChange={setExtra}/>
            </div>
          )}
          {/* Consolidation settings */}
          {isConsolidation && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:12, padding:14 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, color:'var(--txt)', marginBottom:10 }}>Consolidation loan</div>
              <NumInput label="Interest rate (%)" value={consRate} onChange={setConsRate} prefix="" suffix="%"/>
              <div style={{ marginTop:10 }}>
                <NumInput label="Loan term (months)" value={consTerm} onChange={setConsTerm} prefix="" suffix="mo"/>
              </div>
            </div>
          )}
          {/* Debt table */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px 100px 28px', padding:'9px 14px', background:'var(--bg3)', borderBottom:'1px solid var(--bdr)', gap:8 }}>
              {['Debt name','Balance (£)','Rate %','Min pay',''].map((h,i) => (
                <div key={i} style={{ fontSize:9, fontWeight:600, color:'var(--txt3)', textTransform:'uppercase', textAlign:i>0?'right':'left' }}>{h}</div>
              ))}
            </div>
            {sorted.map((d,i) => (
              <div key={d.id} style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px 100px 28px', gap:8, padding:'9px 14px', borderBottom:i<sorted.length-1?'1px solid var(--bdr)':'none', alignItems:'center' }}>
                <input value={d.name} onChange={e=>update(d.id,'name',e.target.value)}
                  style={{ background:'transparent', border:'none', outline:'none', fontSize:12, fontWeight:500, color:'var(--txt)', fontFamily:'inherit' }}/>
                {[{k:'balance',pfx:'£'},{k:'rate',sfx:'%'},{k:'minPayment',pfx:'£'}].map(f => (
                  <div key={f.k} style={{ position:'relative' }}>
                    {f.pfx&&<span style={{ position:'absolute', left:5, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'var(--txt3)' }}>{sym}</span>}
                    <input type="text" inputMode="decimal" value={d[f.k]||''} placeholder="0"
                      onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))update(d.id,f.k,parseFloat(e.target.value)||0)}}
                      style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:5, padding:`5px ${f.sfx?'18px':'5px'} 5px ${f.pfx?'16px':'5px'}`, fontSize:11, color:'var(--txt)', fontFamily:'inherit', outline:'none', textAlign:'right' }}/>
                    {f.sfx&&<span style={{ position:'absolute', right:5, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'var(--txt3)' }}>%</span>}
                  </div>
                ))}
                <button onClick={()=>setDebts(p=>p.filter(x=>x.id!==d.id))} style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}>
                  <i className="ti ti-trash" style={{ fontSize:11, color:'#e24b4a' }} aria-hidden="true"/>
                </button>
              </div>
            ))}
            <div style={{ padding:'8px 14px' }}>
              <button onClick={addDebt}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, border:'1px dashed var(--bdr)', background:'transparent', fontSize:10, color:'var(--txt3)', cursor:'pointer', fontFamily:'inherit' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#d4537e';e.currentTarget.style.color='#d4537e'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bdr)';e.currentTarget.style.color='var(--txt3)'}}>
                <i className="ti ti-plus" style={{ fontSize:10 }} aria-hidden="true"/> Add debt
              </button>
            </div>
          </div>
        </div>

        {/* Right — results */}
        <div style={{ borderLeft:'1px solid var(--bdr)', overflowY:'auto', padding:14, background:'var(--bg2)', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, color:'var(--txt)' }}>
            {isConsolidation ? 'Consolidation analysis' : `${strat==='snowball'?'❄️ Snowball':'🏔️ Avalanche'} plan`}
          </div>

          {isConsolidation ? (
            <>
              {[
                {label:'Total debt',val:fmt(totalDebt, sym, sym),color:'#d4537e'},
                {label:'Consolidation payment',val:fmt(consPayment, sym, sym)+'/mo',color:'var(--gold)'},
                {label:'Total repaid',val:fmt(consTotalPaid, sym, sym),color:'var(--txt)'},
                {label:'Interest on consolidation',val:fmt(consInterest, sym, sym),color:'#ba7517'},
                {label:'Est. interest without',val:fmt(Math.abs(currentInterest, sym, sym)),color:'#e24b4a'},
                {label:'Potential saving',val:fmt(Math.max(0,currentInterest-consInterest, sym, sym)),color:'#1d9e75'},
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'var(--bg3)', borderRadius:9, border:'1px solid var(--bdr)' }}>
                  <span style={{ fontSize:11, color:'var(--txt2)' }}>{r.label}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:r.color }}>{r.val}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                {label:'Total debt',val:fmt(totalDebt, sym, sym),color:'#d4537e'},
                {label:'Monthly payment',val:fmt(totalPayment, sym, sym),color:'var(--gold)'},
                {label:'Debt-free in',val:totalMonths>0?(yrs>0?`${yrs}y ${mos}m`:`${totalMonths}mo`):'—',color:'#1d9e75'},
              ].map(r => (
                <div key={r.label} style={{ background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:9, padding:'11px 13px' }}>
                  <div style={{ fontSize:9, color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{r.label}</div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:r.color }}>{r.val}</div>
                </div>
              ))}

              {payoffOrder.length > 0 && (
                <div style={{ background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:9, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--txt)', marginBottom:8 }}>Payoff order</div>
                  {payoffOrder.map((p,i) => (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:i<payoffOrder.length-1?'1px solid var(--bdr)':'none' }}>
                      <span style={{ width:18, height:18, borderRadius:'50%', background:'rgba(212,83,126,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#d4537e', flexShrink:0 }}>{i+1}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:500, color:'var(--txt)' }}>{p.name}</div>
                        <div style={{ fontSize:10, color:'var(--txt3)' }}>{p.months}mo · {fmt(p.orig, sym, sym)}</div>
                      </div>
                      <i className="ti ti-check" style={{ fontSize:12, color:'#1d9e75' }} aria-hidden="true"/>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CASH FLOW PLANNER — monthly/weekly income vs expense flow
// ═══════════════════════════════════════════════════════════════
export function CashFlowTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const cols = cfg.period === 'weekly' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] :
               cfg.period === 'quarterly' ? ['Q1','Q2','Q3','Q4'] :
               ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const [income, setIncome] = useState(cols.map(() => cfg.defIncome))
  const [expenses, setExpenses] = useState(cols.map(() => Math.round(cfg.defIncome * 0.85)))

  const cashFlows = income.map((inc,i) => inc - expenses[i])
  const cumulative = cashFlows.reduce((acc,cf,i) => { acc.push((acc[i-1]||0)+cf); return acc }, [])
  const totalIncome = income.reduce((s,v)=>s+v,0)
  const totalExpenses = expenses.reduce((s,v)=>s+v,0)
  const totalCF = totalIncome - totalExpenses
  const positivePeriods = cashFlows.filter(cf=>cf>0).length
  const isCF = cf => cf >= 0

  const inputS = { background:'var(--bg3)', border:'1px solid var(--bdr)', borderRadius:5, padding:'5px', fontSize:10, color:'var(--txt)', fontFamily:'inherit', outline:'none', width:'100%', textAlign:'right' }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>
      <ToolHeader tool={tool} color='#7f77dd' icon='ti-trending-up' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{ flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:12 }}>
        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[
            {label:`Total ${cfg.periodLabel} income`, val:fmt(totalIncome, sym, sym), color:'#1d9e75'},
            {label:`Total ${cfg.periodLabel} expenses`, val:fmt(totalExpenses, sym, sym), color:'#d4537e'},
            {label:'Net cash flow', val:fmt(totalCF, sym, sym), color:totalCF>=0?'#1d9e75':'#e24b4a'},
            {label:'Positive periods', val:`${positivePeriods}/${cols.length}`, color:'var(--gold)'},
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:10, padding:'11px 13px' }}>
              <div style={{ fontSize:9, color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:500, color:'var(--txt)', marginBottom:10 }}>Cash flow by period</div>
          <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:60 }}>
            {cashFlows.map((cf,i) => {
              const max = Math.max(...cashFlows.map(Math.abs), 1)
              const h = Math.max(2, Math.abs(cf)/max*54)
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ width:'100%', height:h, background:isCF(cf)?'rgba(29,158,117,.7)':'rgba(226,75,74,.7)', borderRadius:2 }}/>
                  <span style={{ fontSize:7, color:'var(--txt3)', textAlign:'center' }}>{cols[i]?.slice(0,1)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'70px 1fr 1fr 90px 90px', padding:'8px 12px', background:'var(--bg3)', borderBottom:'1px solid var(--bdr)', gap:8 }}>
            {['Period','Income (£)','Expenses (£)','Cash flow','Cumulative'].map((h,i) => (
              <div key={h} style={{ fontSize:9, fontWeight:600, color:'var(--txt3)', textTransform:'uppercase', textAlign:i>0?'right':'left' }}>{h}</div>
            ))}
          </div>
          {cols.map((col,i) => {
            const cf = cashFlows[i], cum = cumulative[i]
            return (
              <div key={col} style={{ display:'grid', gridTemplateColumns:'70px 1fr 1fr 90px 90px', gap:8, padding:'7px 12px', borderBottom:i<cols.length-1?'1px solid var(--bdr)':'none', alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:500, color:'var(--txt)' }}>{col}</span>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <input type="text" inputMode="decimal" value={income[i]||''} placeholder="0"
                    onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value)){const n=[...income];n[i]=parseFloat(e.target.value)||0;setIncome(n)}}}
                    style={{ ...inputS, width:90, color:'#1d9e75', fontWeight:500 }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <input type="text" inputMode="decimal" value={expenses[i]||''} placeholder="0"
                    onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value)){const n=[...expenses];n[i]=parseFloat(e.target.value)||0;setExpenses(n)}}}
                    style={{ ...inputS, width:90, color:'#d4537e', fontWeight:500 }}/>
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:isCF(cf)?'#1d9e75':'#e24b4a', textAlign:'right' }}>{cf>=0?'+':''}{fmt(cf, sym, sym)}</span>
                <span style={{ fontSize:10, color:cum>=0?'var(--txt2)':'#e24b4a', textAlign:'right' }}>{fmt(cum, sym, sym)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ZERO-BASED BUDGET — assigns every £ a job
// ═══════════════════════════════════════════════════════════════
export function ZeroBasedBudgetTool({ tool }) {
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n = (tool?.name || '').toLowerCase()

  const mk = (arr) => arr.map((x, i) => ({ id: i + 1, name: x[0], amount: x[1] }))

  const [income, setIncome] = useState(mk([
    ['Take-home salary', 2500], ['Side income', 300],
  ]))
  const [housing, setHousing] = useState(mk([
    ['Rent / Mortgage', 900], ['Utilities', 150], ['Internet', 50],
  ]))
  const [food, setFood] = useState(mk([
    ['Groceries', 300], ['Eating out', 80],
  ]))
  const [transport, setTransport] = useState(mk([
    ['Fuel / Car', 120], ['Public transport', 45],
  ]))
  const [personal, setPersonal] = useState(mk([
    ['Healthcare', 40], ['Clothing', 50], ['Gym', 35],
  ]))
  const [savings, setSavings] = useState(mk([
    ['Emergency fund', 200], ['Pension / ISA', 150],
  ]))
  const [entertainment, setEntertainment] = useState(mk([
    ['Streaming', 30], ['Hobbies', 60], ['Dining out', 40],
  ]))
  const [debt, setDebt] = useState(mk([
    ['Credit card', 0], ['Loan', 0],
  ]))

  const tot = (rows) => rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const totalIncome   = tot(income)
  const totalAssigned = tot(housing) + tot(food) + tot(transport) + tot(personal) + tot(savings) + tot(entertainment) + tot(debt)
  const unassigned    = totalIncome - totalAssigned
  const isZero        = Math.abs(unassigned) < 1

  const add = (setter) => setter(p => [...p, { id: Date.now(), name: '', amount: 0 }])
  const upd = (setter, id, k, v) => { setter(p => p.map(r => r.id === id ? { ...r, [k]: v } : r)); save({income, housing, food, transport, personal, savings, entertainment, debt}) }
  const rem = (setter, id) => setter(p => p.filter(r => r.id !== id))

  const Section = ({ title, color, items, setter }) => {
    const secTotal = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color }}>{title}</span>
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color }}>{fmt(secTotal, sym, sym)}</span>
        </div>
        {items.map((item, i) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: i < items.length - 1 ? '1px solid var(--bdr)' : 'none' }}>
            <input value={item.name} onChange={e => upd(setter, item.id, 'name', e.target.value)} placeholder="Line item..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit' }} />
            <div style={{ position: 'relative', width: 130, flexShrink: 0 }}>
              <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--txt3)' }}>{sym}</span>
              <input type="text" inputMode="decimal" value={item.amount || ''} placeholder="0"
                onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) upd(setter, item.id, 'amount', parseFloat(e.target.value) || 0) }}
                onFocus={e => e.target.select()}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '6px 8px 6px 22px', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />
            </div>
            <button onClick={() => rem(setter, item.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--txt3)', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#e24b4a'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--txt3)'}>×</button>
          </div>
        ))}
        <div style={{ padding: '8px 14px' }}>
          <button onClick={() => add(setter)}
            style={{ fontSize: 12, color, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.8 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}>
            + Add line
          </button>
        </div>
      </div>
    )
  }

  const zeroColor = isZero ? '#1d9e75' : unassigned > 0 ? '#ba7517' : '#e24b4a'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} color='#1d9e75' icon='ti-equal' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left — sections */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14 }}>
          <Section title="Income" color='#1d9e75' items={income} setter={setIncome} />
          <Section title="Housing & Bills" color='#378add' items={housing} setter={setHousing} />
          <Section title="Food & Dining" color='#ba7517' items={food} setter={setFood} />
          <Section title="Transport" color='#7f77dd' items={transport} setter={setTransport} />
          <Section title="Personal & Health" color='#d4537e' items={personal} setter={setPersonal} />
          <Section title="Savings & Investments" color='#1d9e75' items={savings} setter={setSavings} />
          <Section title="Entertainment" color='#ef9f27' items={entertainment} setter={setEntertainment} />
          <Section title="Debt Payments" color='#e24b4a' items={debt} setter={setDebt} />
        </div>

        {/* Right — zero balance panel */}
        <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid var(--bdr)', overflowY: 'auto', padding: 14, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>Zero-Based Balance</div>

          {/* The KEY metric — must reach £0 */}
          <div style={{ background: isZero ? 'rgba(29,158,117,.1)' : unassigned > 0 ? 'rgba(186,117,23,.1)' : 'rgba(226,75,74,.1)', border: `2px solid ${zeroColor}55`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
              {isZero ? '✓ Every £ assigned' : unassigned > 0 ? 'Still to assign' : 'Over-assigned'}
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 700, color: zeroColor }}>
              {fmt(Math.abs(unassigned, sym, sym))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>
              {isZero ? 'Budget = £0 remaining' : unassigned > 0 ? 'Assign remaining income' : 'Reduce your spending'}
            </div>
          </div>

          {/* Progress bar to zero */}
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 9, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--txt2)' }}>Assigned</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: zeroColor }}>
                {totalIncome > 0 ? Math.min(100, (totalAssigned / totalIncome * 100)).toFixed(0) : 0}%
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalIncome > 0 ? Math.min(100, totalAssigned / totalIncome * 100) : 0}%`, background: zeroColor, borderRadius: 4, transition: 'width .4s' }} />
            </div>
          </div>

          {[
            { l: 'Total income',   v: fmt(totalIncome, sym, sym),   c: '#1d9e75', bold: true },
            { l: 'Total assigned', v: fmt(totalAssigned, sym, sym), c: unassigned > 0 ? '#ba7517' : '#1d9e75', bold: true },
            { l: 'Housing',        v: fmt(tot(housing, sym, sym)),  c: 'var(--txt2)', bold: false },
            { l: 'Food',           v: fmt(tot(food, sym, sym)),     c: 'var(--txt2)', bold: false },
            { l: 'Transport',      v: fmt(tot(transport, sym, sym)),c: 'var(--txt2)', bold: false },
            { l: 'Personal',       v: fmt(tot(personal, sym, sym)), c: 'var(--txt2)', bold: false },
            { l: 'Savings',        v: fmt(tot(savings, sym, sym)),  c: '#1d9e75',    bold: false },
            { l: 'Entertainment',  v: fmt(tot(entertainment, sym, sym)), c: 'var(--txt2)', bold: false },
            { l: 'Debt',           v: fmt(tot(debt, sym, sym)),     c: '#e24b4a',    bold: false },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: r.bold ? '8px 12px' : '5px 0', background: r.bold ? 'var(--bg3)' : 'transparent', borderRadius: r.bold ? 8 : 0, border: r.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !r.bold ? '1px solid var(--bdr)' : undefined }}>
              <span style={{ fontSize: 11, color: r.bold ? 'var(--txt)' : 'var(--txt3)', fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
              <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 500, color: r.c }}>{r.v}</span>
            </div>
          ))}

          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', fontSize: 10, color: 'var(--txt3)', lineHeight: 1.6 }}>
            💡 <strong style={{ color: 'var(--txt)' }}>Zero-based rule:</strong> Assign every pound of income to a category until balance = £0. Every £ has a job.
          </div>
        </div>
      </div>
    </div>
  )
}


export function EnvelopeBudgetTool({ tool }) {
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol

  const defaultEnvelopes = [
    { id: 1, name: 'Rent / Mortgage', icon: 'ti-home',            color: '#378add', budget: 900,  spent: 900  },
    { id: 2, name: 'Groceries',        icon: 'ti-shopping-cart',   color: '#ba7517', budget: 300,  spent: 210  },
    { id: 3, name: 'Transport',        icon: 'ti-car',             color: '#7f77dd', budget: 150,  spent: 95   },
    { id: 4, name: 'Utilities',        icon: 'ti-bolt',            color: '#ef9f27', budget: 150,  spent: 140  },
    { id: 5, name: 'Eating out',       icon: 'ti-tools-kitchen-2', color: '#d4537e', budget: 100,  spent: 65   },
    { id: 6, name: 'Entertainment',    icon: 'ti-device-tv',       color: '#ef9f27', budget: 80,   spent: 45   },
    { id: 7, name: 'Clothing',         icon: 'ti-shirt',           color: '#d4537e', budget: 60,   spent: 0    },
    { id: 8, name: 'Emergency fund',   icon: 'ti-piggy-bank',      color: '#1d9e75', budget: 200,  spent: 200  },
    { id: 9, name: 'Savings',          icon: 'ti-coins',           color: '#1d9e75', budget: 150,  spent: 150  },
    { id: 10, name: 'Healthcare',      icon: 'ti-heart',           color: '#d4537e', budget: 50,   spent: 20   },
    { id: 11, name: 'Personal care',   icon: 'ti-sparkles',        color: '#7f77dd', budget: 40,   spent: 35   },
    { id: 12, name: 'Subscriptions',   icon: 'ti-brand-netflix',   color: '#ef9f27', budget: 30,   spent: 30   },
  ]

  const [envelopes, setEnvelopes] = useState(defaultEnvelopes)
  const [income, setIncome] = useState(2500)
  const [editId, setEditId] = useState(null)

  const totalBudget = envelopes.reduce((s, e) => s + e.budget, 0)
  const totalSpent  = envelopes.reduce((s, e) => s + e.spent, 0)
  const unallocated = income - totalBudget

  const upd = (id, k, v) => { setEnvelopes(p => p.map(e => e.id === id ? { ...e, [k]: v } : e)); save({ envelopes, income }) }
  const addEnv = () => setEnvelopes(p => [...p, { id: Date.now(), name: 'New envelope', icon: 'ti-wallet', color: '#c9a96e', budget: 0, spent: 0 }])

  const COLORS = ['#1d9e75','#378add','#ba7517','#7f77dd','#d4537e','#ef9f27','#e24b4a','#c9a96e']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} color='#ef9f27' icon='ti-wallet' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left — envelopes grid */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14 }}>
          {/* Income input */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-coins" style={{ fontSize: 18, color: '#1d9e75' }} aria-hidden="true" />
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--txt)', flex: 1 }}>Monthly income to envelope</span>
            <div style={{ position: 'relative', width: 150 }}>
              <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }}>{sym}</span>
              <input type="text" inputMode="decimal" value={income || ''} placeholder="0"
                onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) setIncome(parseFloat(e.target.value) || 0) }}
                onFocus={e => e.target.select()}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '8px 8px 8px 24px', fontSize: 14, fontWeight: 700, color: '#1d9e75', fontFamily: 'Syne,sans-serif', outline: 'none', textAlign: 'right' }} />
            </div>
          </div>

          {/* Envelopes grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {envelopes.map(env => {
              const pct = env.budget > 0 ? Math.min(100, env.spent / env.budget * 100) : 0
              const overSpent = env.spent > env.budget
              const barColor = overSpent ? '#e24b4a' : pct > 80 ? '#ef9f27' : env.color
              return (
                <div key={env.id} style={{ background: 'var(--bg2)', border: `1px solid ${editId === env.id ? env.color + '66' : 'var(--bdr)'}`, borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'border .15s' }}
                  onClick={() => setEditId(editId === env.id ? null : env.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${env.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${env.icon}`} style={{ fontSize: 15, color: env.color }} aria-hidden="true" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.name}</span>
                    <button onClick={e => { e.stopPropagation(); setEnvelopes(p => p.filter(x => x.id !== env.id)) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: 14, lineHeight: 1, padding: 2, flexShrink: 0 }}
                      onMouseEnter={ev => ev.currentTarget.style.color = '#e24b4a'}
                      onMouseLeave={ev => ev.currentTarget.style.color = 'var(--txt3)'}>×</button>
                  </div>

                  {editId === env.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input value={env.name} onChange={e => upd(env.id, 'name', e.target.value)} onClick={e => e.stopPropagation()}
                        style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '5px 8px', fontSize: 11, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', width: '100%' }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['Budget £','Spent £'].map((lbl, li) => (
                          <div key={lbl} style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: 'var(--txt3)', marginBottom: 2 }}>{lbl}</div>
                            <input type="text" inputMode="decimal" value={li === 0 ? (env.budget || '') : (env.spent || '')} placeholder="0"
                              onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) upd(env.id, li === 0 ? 'budget' : 'spent', parseFloat(e.target.value) || 0) }}
                              onClick={ev => ev.stopPropagation()} onFocus={ev => ev.target.select()}
                              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 5, padding: '5px 7px', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none' }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {COLORS.map(c => (
                          <div key={c} onClick={e => { e.stopPropagation(); upd(env.id, 'color', c) }}
                            style={{ width: 16, height: 16, borderRadius: 4, background: c, border: `2px solid ${env.color === c ? 'white' : 'transparent'}`, cursor: 'pointer' }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: overSpent ? '#e24b4a' : 'var(--txt2)' }}>{fmt(env.spent, sym, sym)} spent</span>
                        <span style={{ fontSize: 11, color: 'var(--txt3)' }}>of {fmt(env.budget, sym, sym)}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width .4s' }} />
                      </div>
                      <div style={{ fontSize: 10, color: overSpent ? '#e24b4a' : '#1d9e75', marginTop: 4, textAlign: 'right' }}>
                        {overSpent ? `${fmt(env.spent - env.budget, sym, sym)} over` : `${fmt(env.budget - env.spent, sym, sym)} left`}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
            <div onClick={addEnv} style={{ background: 'transparent', border: '1px dashed var(--bdr)', borderRadius: 12, padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--txt3)', fontSize: 12, minHeight: 100 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef9f27'; e.currentTarget.style.color = '#ef9f27' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--txt3)' }}>
              <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" /> Add envelope
            </div>
          </div>
        </div>

        {/* Right — summary */}
        <div style={{ width: 240, flexShrink: 0, borderLeft: '1px solid var(--bdr)', overflowY: 'auto', padding: 14, background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>Envelope Summary</div>

          <div style={{ background: Math.abs(unallocated) < 1 ? 'rgba(29,158,117,.1)' : unallocated > 0 ? 'rgba(186,117,23,.1)' : 'rgba(226,75,74,.1)', border: `2px solid ${Math.abs(unallocated) < 1 ? '#1d9e75' : unallocated > 0 ? '#ba7517' : '#e24b4a'}55`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', marginBottom: 4 }}>
              {Math.abs(unallocated) < 1 ? 'Fully allocated' : unallocated > 0 ? 'Unallocated' : 'Over-allocated'}
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 700, color: Math.abs(unallocated) < 1 ? '#1d9e75' : unallocated > 0 ? '#ba7517' : '#e24b4a' }}>{fmt(Math.abs(unallocated, sym, sym))}</div>
          </div>

          {[
            { l: 'Income',       v: fmt(income, sym, sym),       c: '#1d9e75', bold: true },
            { l: 'Budgeted',     v: fmt(totalBudget, sym, sym),  c: 'var(--txt)', bold: true },
            { l: 'Total spent',  v: fmt(totalSpent, sym, sym),   c: totalSpent > totalBudget ? '#e24b4a' : '#1d9e75', bold: false },
            { l: 'Remaining',    v: fmt(totalBudget - totalSpent, sym, sym), c: totalSpent > totalBudget ? '#e24b4a' : '#1d9e75', bold: false },
            { l: 'Envelopes',    v: envelopes.length,  c: 'var(--txt)', bold: false },
            { l: 'On track',     v: `${envelopes.filter(e => e.spent <= e.budget).length}/${envelopes.length}`, c: '#1d9e75', bold: false },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: r.bold ? '8px 12px' : '5px 0', background: r.bold ? 'var(--bg3)' : 'transparent', borderRadius: r.bold ? 8 : 0, border: r.bold ? '1px solid var(--bdr)' : 'none', borderBottom: !r.bold ? '1px solid var(--bdr)' : undefined }}>
              <span style={{ fontSize: 11, color: r.bold ? 'var(--txt)' : 'var(--txt3)', fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
              <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 500, color: r.c }}>{r.v}</span>
            </div>
          ))}
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', fontSize: 10, color: 'var(--txt3)', lineHeight: 1.6 }}>
            💡 Click any envelope to edit name, budget, spent amount & colour.
          </div>
        </div>
      </div>
    </div>
  )
}


export function TrackerTable({ tool }) {
  const [rows, setRows] = useState([
    { id: 1, date: new Date().toISOString().split('T')[0], name: '', value: '', status: 'Active', notes: '' }
  ])
  const STATUS = ['Active', 'Complete', 'Pending', 'Cancelled']
  const cfg = getToolConfig(tool)
  const add = () => setRows(p => [...p, { id: Date.now(), date: new Date().toISOString().split('T')[0], name: '', value: '', status: 'Active', notes: '' }])
  const update = (id, key, val) => setRows(p => p.map(r => r.id === id ? { ...r, [key]: val } : r))
  const remove = id => setRows(p => p.filter(r => r.id !== id))
  const cellS = { background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '7px 10px', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', width: '100%' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} cfg={cfg} onExport={() => {}} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 110px 1fr 28px', padding: '8px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--bdr)', gap: 8 }}>
            {['Date', cfg.colB || 'Name / Item', 'Value', 'Status', 'Notes', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 9, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
            ))}
          </div>
          {rows.map((row, i) => (
            <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 110px 1fr 28px', gap: 8, padding: '8px 14px', borderBottom: i < rows.length - 1 ? '1px solid var(--bdr)' : 'none', alignItems: 'center' }}>
              <input type="date" value={row.date} onChange={e => update(row.id, 'date', e.target.value)} style={{ ...cellS, fontSize: 11 }} />
              <input value={row.name} onChange={e => update(row.id, 'name', e.target.value)} placeholder="Enter item..." style={cellS} />
              <input value={row.value} onChange={e => update(row.id, 'value', e.target.value)} placeholder="0" style={{ ...cellS, textAlign: 'right' }} />
              <select value={row.status} onChange={e => update(row.id, 'status', e.target.value)} style={cellS}>
                {STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
              <input value={row.notes} onChange={e => update(row.id, 'notes', e.target.value)} placeholder="Notes..." style={cellS} />
              <button onClick={() => remove(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <i className="ti ti-trash" style={{ fontSize: 12, color: '#e24b4a' }} aria-hidden="true" />
              </button>
            </div>
          ))}
          <div style={{ padding: '8px 14px' }}>
            <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 6, border: '1px dashed var(--bdr)', background: 'transparent', fontSize: 11, color: 'var(--txt3)', cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color || 'var(--gold)'; e.currentTarget.style.color = cfg.color || 'var(--gold)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--txt3)' }}>
              <i className="ti ti-plus" style={{ fontSize: 11 }} aria-hidden="true" /> Add row
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { label: 'Total rows', val: rows.length, color: 'var(--txt)' },
            { label: 'Active', val: rows.filter(r => r.status === 'Active').length, color: cfg.color || 'var(--gold)' },
            { label: 'Complete', val: rows.filter(r => r.status === 'Complete').length, color: '#1d9e75' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 9, padding: '11px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ChecklistTool({ tool }) {
  const [items, setItems] = useState([{ id: 1, text: 'First item', done: false, priority: 'Medium' }])
  const [newItem, setNewItem] = useState('')
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
  const pColor = { Low: '#1d9e75', Medium: '#378add', High: '#ba7517', Critical: '#e24b4a' }
  const done = items.filter(i => i.done).length
  const pct = items.length > 0 ? Math.round(done / items.length * 100) : 0
  const add = () => { if (!newItem.trim()) return; setItems(p => [...p, { id: Date.now(), text: newItem.trim(), done: false, priority: 'Medium' }]); setNewItem('') }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} cfg={cfg} onExport={() => {}}  isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>Progress</span>
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: pct === 100 ? '#1d9e75' : 'var(--gold)' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#1d9e75' : 'var(--gold)', borderRadius: 3, transition: 'width .4s' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Add item and press Enter..."
            style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={add} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: cfg.color || 'var(--gold)', fontSize: 12, fontWeight: 600, color: '#0c0c12', cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>Add</button>
        </div>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden' }}>
          {items.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < items.length - 1 ? '1px solid var(--bdr)' : 'none' }}>
              <div onClick={() => setItems(p => p.map(x => x.id === item.id ? { ...x, done: !x.done } : x))}
                style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.done ? '#1d9e75' : 'var(--bdr2)'}`, background: item.done ? '#1d9e75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {item.done && <i className="ti ti-check" style={{ fontSize: 11, color: '#fff' }} aria-hidden="true" />}
              </div>
              <span style={{ flex: 1, fontSize: 12, color: item.done ? 'var(--txt3)' : 'var(--txt)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
              <select value={item.priority} onChange={e => setItems(p => p.map(x => x.id === item.id ? { ...x, priority: e.target.value } : x))}
                style={{ background: 'transparent', border: 'none', fontSize: 10, color: pColor[item.priority], cursor: 'pointer', outline: 'none', fontWeight: 600, fontFamily: 'inherit' }}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
              <button onClick={() => setItems(p => p.filter(x => x.id !== item.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <i className="ti ti-x" style={{ fontSize: 11, color: 'var(--txt3)' }} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PlannerTool({ tool }) {
  const [tasks, setTasks] = useState([{ id: 1, task: 'First task', due: '', status: 'To Do', priority: 'Medium', notes: '' }])
  const [newTask, setNewTask] = useState('')
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const STATUS = ['To Do', 'In Progress', 'Done', 'Blocked']
  const sColor = { 'To Do': 'var(--txt3)', 'In Progress': '#378add', 'Done': '#1d9e75', 'Blocked': '#e24b4a' }
  const add = () => { if (!newTask.trim()) return; setTasks(p => [...p, { id: Date.now(), task: newTask.trim(), due: '', status: 'To Do', priority: 'Medium', notes: '' }]); setNewTask('') }
  const update = (id, key, val) => setTasks(p => p.map(t => t.id === id ? { ...t, [key]: val } : t))
  const done = tasks.filter(t => t.status === 'Done').length
  const inS = { background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', width: '100%' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} cfg={cfg} onExport={() => {}}  isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={`Add ${cfg.periodLabel || ''} task...`}
            style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={add} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: cfg.color || '#7f77dd', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>Add</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {STATUS.map(s => <div key={s} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: sColor[s] }}>{tasks.filter(t => t.status === s).length}</div>
            <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{s}</div>
          </div>)}
        </div>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 28px', padding: '8px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--bdr)', gap: 8 }}>
            {['Task', 'Due date', 'Status', 'Priority', ''].map((h, i) => <div key={i} style={{ fontSize: 9, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase' }}>{h}</div>)}
          </div>
          {tasks.map((t, i) => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 28px', gap: 8, padding: '8px 14px', borderBottom: i < tasks.length - 1 ? '1px solid var(--bdr)' : 'none', alignItems: 'center' }}>
              <input value={t.task} onChange={e => update(t.id, 'task', e.target.value)} style={{ ...inS, textDecoration: t.status === 'Done' ? 'line-through' : 'none' }} />
              <input type="date" value={t.due} onChange={e => update(t.id, 'due', e.target.value)} style={{ ...inS, fontSize: 11 }} />
              <select value={t.status} onChange={e => update(t.id, 'status', e.target.value)} style={{ ...inS, color: sColor[t.status], fontWeight: 500 }}>{STATUS.map(s => <option key={s}>{s}</option>)}</select>
              <select value={t.priority} onChange={e => update(t.id, 'priority', e.target.value)} style={inS}>{['Low','Medium','High','Critical'].map(p => <option key={p}>{p}</option>)}</select>
              <button onClick={() => setTasks(p => p.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><i className="ti ti-x" style={{ fontSize: 11, color: 'var(--txt3)' }} aria-hidden="true" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function JournalTool({ tool }) {
  const [entries, setEntries] = useState([{ id: 1, date: new Date().toISOString().split('T')[0], title: '', body: '', mood: '😊' }])
  const [active, setActive] = useState(1)
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const MOODS = ['😴', '😟', '😐', '😊', '🤩']
  const current = entries.find(e => e.id === active)
  const upd = (key, val) => setEntries(p => p.map(e => e.id === active ? { ...e, [key]: val } : e))
  const addEntry = () => { const id = Date.now(); setEntries(p => [...p, { id, date: new Date().toISOString().split('T')[0], title: '', body: '', mood: '😊' }]); setActive(id) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} cfg={cfg} onExport={() => {}}  isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '200px 1fr', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ borderRight: '1px solid var(--bdr)', overflowY: 'auto', background: 'var(--bg2)' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bdr)' }}>
            <button onClick={addEntry} style={{ width: '100%', padding: '7px', borderRadius: 7, border: 'none', background: cfg.color || 'var(--gold)', fontSize: 11, fontWeight: 600, color: '#0c0c12', cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>+ New entry</button>
          </div>
          {entries.map(e => <div key={e.id} onClick={() => setActive(e.id)} style={{ padding: '10px 14px', borderBottom: '1px solid var(--bdr)', cursor: 'pointer', background: active === e.id ? 'var(--bg3)' : 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{e.date}</span>
              <span style={{ fontSize: 14 }}>{e.mood}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title || 'Untitled'}</div>
          </div>)}
        </div>
        {current && <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 20, gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="date" value={current.date} onChange={e => upd('date', e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none' }} />
            <select value={current.mood} onChange={e => upd('mood', e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '7px 10px', fontSize: 16, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              {MOODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <input value={current.title} onChange={e => upd('title', e.target.value)} placeholder="Entry title..." style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--bdr)', outline: 'none', fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--txt)', padding: '8px 0', width: '100%' }} />
          <textarea value={current.body} onChange={e => upd('body', e.target.value)} placeholder="Write your entry here..." style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 13, color: 'var(--txt)', lineHeight: 1.8, resize: 'none', minHeight: 300, width: '100%' }} />
        </div>}
      </div>
    </div>
  )
}

export function CalculatorTool({ tool }) {
  const [inputs, setInputs] = useState({ a: 0, b: 0, c: 0, d: 0, e: 0 })
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  // fmt uses global with sym
  const total = Object.values(inputs).reduce((s, v) => s + v, 0)
  const avg = total / 5
  const labels = cfg.labels || ['Primary value', 'Secondary value', 'Rate (%)', 'Period', 'Additional']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <ToolHeader tool={tool} cfg={cfg} onExport={() => {}}  isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>Inputs</div>
          {Object.entries(inputs).map(([key, val], i) => (
            <div key={key} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 9, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--txt2)', marginBottom: 5 }}>{labels[i] || key}</div>
              <input type="text" inputMode="decimal" value={val === 0 ? '' : val} placeholder="0"
                onChange={e => { if (/^[\d]*\.?[\d]*$/.test(e.target.value)) setInputs(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 })) }}
                onFocus={e => e.target.select()}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />
            </div>
          ))}
        </div>
        <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>Results</div>
          {[
            { label: 'Total', val: fmt(total, sym), color: cfg.color || 'var(--gold)' },
            { label: 'Average', val: fmt(avg, sym), color: '#378add' },
            { label: 'Net (A - B)', val: fmt(inputs.a - inputs.b, sym), color: inputs.a - inputs.b >= 0 ? '#1d9e75' : '#e24b4a' },
          ].map(r => (
            <div key={r.label} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 9, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{r.label}</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 700, color: r.color }}>{r.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN ROUTER — ToolEngine
// ═══════════════════════════════════════════════════════════════
export function ToolEngine({ templateId, tool }) {
  // Route to the correct component based on templateId
  const props = { tool }

  // Budget family
  if (templateId === 'budget-planner')     return <BudgetPlannerTool {...props} />
  if (templateId === 'zero-based-budget')  return <ZeroBasedBudgetTool {...props} />
  if (templateId === 'envelope-budget')    return <EnvelopeBudgetTool {...props} />

  // Savings & goals
  if (templateId === 'savings-goal')       return <SavingsGoalTool {...props} />

  // Expense & income
  if (templateId === 'expense-tracker')    return <ExpenseTrackerTool {...props} />
  if (templateId === 'income-tracker')     return <IncomeTrackerTool {...props} />

  // Debt
  if (templateId === 'debt-snowball-calc') return <DebtTool {...props} />
  if (templateId === 'debt-snowball')      return <DebtTool {...props} />

  // Planning & flow
  if (templateId === 'cash-flow-planner')  return <CashFlowTool {...props} />

  // Dashboards & KPIs
  if (templateId === 'kpi-dashboard')      return <KPIDashboardTool {...props} />

  // Generic templates
  if (templateId === 'tracker-table')      return <TrackerTable {...props} />
  if (templateId === 'checklist')          return <ChecklistTool {...props} />
  if (templateId === 'planner')            return <PlannerTool {...props} />
  if (templateId === 'journal')            return <JournalTool {...props} />
  if (templateId === 'calculator')         return <CalculatorTool {...props} />

  if(templateId==='daily-planner')     return <DailyPlannerTool tool={tool}/>
  if(templateId==='habit-tracker')     return <HabitTrackerTool tool={tool}/>
  // Property tools
  if(templateId==='property-manager')   return <PropertyManagerTool tool={tool}/>
  if(templateId==='airbnb-tracker')     return <AirbnbTracker tool={tool}/>
  if(templateId==='renovation-tracker') return <RenovationTracker tool={tool}/>
  if(templateId==='home-buying')        return <HomeBuyingTool tool={tool}/>
  if(templateId==='real-estate-invest') return <RealEstateInvestTool tool={tool}/>
  if(templateId==='rental-yield')        return <RealEstateInvestTool tool={tool}/>
  // Productivity tools
  if(templateId==='fitness-tracker')   return <FitnessTracker tool={tool}/>
  if(templateId==='meal-planner')      return <MealPlanner tool={tool}/>
  if(templateId==='wellness-tracker')  return <WellnessTracker tool={tool}/>
  if(templateId==='home-manager')      return <HomeManager tool={tool}/>
  if(templateId==='time-tracker')      return <TimeTracker tool={tool}/>
  // Investing tools
  if(templateId==='trading-journal')      return <TradingJournal tool={tool}/>
  if(templateId==='crypto-tracker')       return <CryptoTracker tool={tool}/>
  if(templateId==='dividend-tracker')     return <DividendTracker tool={tool}/>
  if(templateId==='investment-analytics') return <InvestmentAnalytics tool={tool}/>
  // Business tools
  if(templateId==='biz-finance')      return <BizFinanceTool tool={tool}/>
  if(templateId==='invoice-tool')     return <InvoiceTool tool={tool}/>
  if(templateId==='sales-pipeline')   return <SalesPipelineTool tool={tool}/>
  if(templateId==='ecommerce-tool')   return <EcommerceTool tool={tool}/>
  if(templateId==='startup-tool')     return <StartupTool tool={tool}/>
  if(templateId==='okr-tool')         return <OKRTool tool={tool}/>
  if(templateId==='freelance-tool')   return <FreelanceTool tool={tool}/>
  if(templateId==='operations-tool')  return <OperationsTool tool={tool}/>
  // Category-specific tools
  if(templateId==='stock-portfolio')    return <StockPortfolioTool tool={tool}/>
  if(templateId==='retirement-planner') return <RetirementPlannerTool tool={tool}/>
  if(templateId==='hr-tool')            return <HRTool tool={tool}/>
  if(templateId==='marketing-tool')     return <MarketingTool tool={tool}/>
  if(templateId==='crm-tool')           return <CRMTool tool={tool}/>
  if(templateId==='inventory-tool')     return <InventoryTool tool={tool}/>
  if(templateId==='health-tool')        return <HealthTool tool={tool}/>
  if(templateId==='study-tool')         return <StudyTool tool={tool}/>
  if(templateId==='event-tool')         return <EventTool tool={tool}/>
  if(templateId==='creator-tool')       return <CreatorTool tool={tool}/>
  if(templateId==='project-dashboard')  return <ProjectDashboardTool tool={tool}/>
  // Previously built specific components - add routes
  if (templateId === 'net-worth')            return <NetWorthTool tool={tool} />
  if (templateId === 'loan-repayment')       return <LoanRepaymentTool tool={tool} />
  if (templateId === 'interest-calculator')  return <InterestCalcTool tool={tool} />
  if (templateId === 'insurance-comparison') return <InsuranceCompTool tool={tool} />
  if (templateId === 'credit-tracker')       return <CreditTrackerTool tool={tool} />
  if (templateId === 'inflation-calc')       return <InflationCalcTool tool={tool} />
  if (templateId === 'financial-health')     return <FinancialHealthTool tool={tool} />
  if (templateId === 'goals-planner')        return <GoalsPlannerTool tool={tool} />

  // Coming soon fallback
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <i className="ti ti-tool" style={{ fontSize: 36, color: 'var(--txt3)', display: 'block', marginBottom: 14 }} aria-hidden="true" />
      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 8 }}>
        {tool?.name}
      </div>
      <div style={{ fontSize: 12, color: 'var(--txt2)' }}>This tool is being built. Check back soon!</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MISSING ROUTE COMPONENTS — 54 tools now working
// ═══════════════════════════════════════════════════════════════

// ── NET WORTH TOOL ─────────────────────────────────────────────
export function NetWorthTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const isWealth = (tool?.name||'').toLowerCase().includes('wealth forecast')
  const [assets, setAssets] = useState([
    { id:1, name:'Savings / Cash',     category:'Cash',        value:8000  },
    { id:2, name:'Stocks & ISA',       category:'Investments', value:15000 },
    { id:3, name:'Pension',            category:'Retirement',  value:25000 },
    { id:4, name:'Property value',     category:'Property',    value:280000},
    { id:5, name:'Car / Vehicle',      category:'Other',       value:8000  },
  ])
  const [liabilities, setLiabilities] = useState([
    { id:1, name:'Mortgage',           category:'Property',    value:210000},
    { id:2, name:'Credit cards',       category:'Consumer',    value:1500  },
    { id:3, name:'Personal loan',      category:'Consumer',    value:4000  },
  ])
  const [projYears, setProjYears] = useState(5)
  const [growthRate, setGrowthRate] = useState(7)

  const totalAssets = assets.reduce((s,a)=>s+a.value,0)
  const totalLiabilities = liabilities.reduce((s,l)=>s+l.value,0)
  const netWorth = totalAssets - totalLiabilities
  const projectedNW = netWorth * Math.pow(1 + growthRate/100, projYears)

  const upd = (setter,id,key,val) => setter(p=>p.map(r=>r.id===id?{...r,[key]:val}:r))
  const addAsset = () => setAssets(p=>[...p,{id:Date.now(),name:'New asset',category:'Other',value:0}])
  const addLiab  = () => setLiabilities(p=>[...p,{id:Date.now(),name:'New liability',category:'Consumer',value:0}])

  const nwColor = netWorth >= 0 ? '#1d9e75' : '#e24b4a'
  const inp = {background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none',width:'100%',textAlign:'right'}

  const SideList = ({title,color,items,setter,onAdd}) => (
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)'}}>
        <span style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:700,color}}>{title}</span>
        <span style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,color}}>
          {fmt(items.reduce((s,i, sym)=>s+i.value,0))}
        </span>
      </div>
      {items.map(item=>(
        <div key={item.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderBottom:'1px solid var(--bdr)'}}>
          <input value={item.name} onChange={e=>upd(setter,item.id,'name',e.target.value)}
            style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:12,color:'var(--txt)',fontFamily:'inherit'}}/>
          <div style={{position:'relative',width:120,flexShrink:0}}>
            <span style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--txt3)'}}>{sym}</span>
            <input type="text" inputMode="decimal" value={item.value||''} placeholder="0"
              onChange={e=>{if(/^[\d]*$/.test(e.target.value))upd(setter,item.id,'value',parseInt(e.target.value)||0)}}
              style={{...inp,paddingLeft:18}}/>
          </div>
          <button onClick={()=>setter(p=>p.filter(r=>r.id!==item.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
            <i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/>
          </button>
        </div>
      ))}
      <div style={{padding:'8px 14px'}}>
        <button onClick={onAdd} style={{fontSize:11,color,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}
          onMouseEnter={e=>e.currentTarget.style.opacity='.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add
        </button>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#1d9e75" icon="ti-chart-bar"
        extra={isWealth && (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:11,color:'var(--txt3)'}}>Project</span>
            <input type="text" inputMode="decimal" value={projYears} onChange={e=>{if(/^\d+$/.test(e.target.value))setProjYears(parseInt(e.target.value)||1)}}
              style={{width:40,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'5px 6px',fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'center'}}/>
            <span style={{fontSize:11,color:'var(--txt3)'}}>yrs @</span>
            <input type="text" inputMode="decimal" value={growthRate} onChange={e=>{if(/^[\d.]*$/.test(e.target.value))setGrowthRate(parseFloat(e.target.value)||0)}}
              style={{width:40,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'5px 6px',fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'center'}}/>
            <span style={{fontSize:11,color:'var(--txt3)'}}>%</span>
          </div>
        )}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr 220px',overflow:'hidden',minHeight:0}}>
        {/* Assets */}
        <div style={{overflowY:'auto',borderRight:'1px solid var(--bdr)',background:'var(--bg2)'}}>
          <SideList title="Assets" color="#1d9e75" items={assets} setter={setAssets} onAdd={addAsset}/>
        </div>
        {/* Liabilities */}
        <div style={{overflowY:'auto',borderRight:'1px solid var(--bdr)',background:'var(--bg2)'}}>
          <SideList title="Liabilities" color="#d4537e" items={liabilities} setter={setLiabilities} onAdd={addLiab}/>
        </div>
        {/* Summary */}
        <div style={{overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:`${nwColor}14`,border:`2px solid ${nwColor}55`,borderRadius:12,padding:16,textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:6}}>Net Worth</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:26,fontWeight:700,color:nwColor}}>{fmt(netWorth, sym)}</div>
          </div>
          {[
            {l:'Total assets',v:fmt(totalAssets, sym),c:'#1d9e75'},
            {l:'Total liabilities',v:fmt(totalLiabilities, sym),c:'#d4537e'},
            {l:'Debt ratio',v:`${totalAssets>0?(totalLiabilities/totalAssets*100).toFixed(1):0}%`,c:'var(--txt2)'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
          {isWealth && (
            <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:12}}>
              <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',marginBottom:4}}>
                Projected in {projYears}yr
              </div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,color:'var(--gold)'}}>{fmt(projectedNW, sym)}</div>
              <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>at {growthRate}% annual growth</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── LOAN REPAYMENT TOOL ────────────────────────────────────────
export function LoanRepaymentTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n = (tool?.name||'').toLowerCase()
  const isMortgage = n.includes('mortgage')
  const isFamily   = cfg.audience === 'family'

  const [principal, setPrincipal] = useState(isMortgage ? 250000 : 15000)
  const [rate,      setRate]      = useState(isMortgage ? 4.5 : 6.9)
  const [years,     setYears]     = useState(isMortgage ? 25 : 5)
  const [extra,     setExtra]     = useState(0)

  const monthlyRate = rate/100/12
  const totalMonths = years*12
  const payment = totalMonths>0 && monthlyRate>0
    ? principal*(monthlyRate*Math.pow(1+monthlyRate,totalMonths))/(Math.pow(1+monthlyRate,totalMonths)-1)
    : principal/totalMonths
  const totalPaid    = payment*totalMonths
  const totalInterest= totalPaid-principal

  // With extra payment
  let balEx=principal, mEx=0, intEx=0
  while(balEx>0.01&&mEx<600){
    const i=balEx*monthlyRate; intEx+=i
    balEx=balEx+i-(payment+extra)
    if(balEx<0)balEx=0; mEx++
  }
  const savedInt = totalInterest-intEx
  const savedMo  = totalMonths-mEx

  // Amortisation (first 24 months)
  const sched=[]
  let bal=principal
  for(let m=1;m<=Math.min(24,totalMonths)&&bal>0.01;m++){
    const i=bal*monthlyRate, p=Math.min(bal,payment-i)
    bal=Math.max(0,bal-p)
    sched.push({m,payment,interest:i,principal:p,balance:bal})
  }

  const inputRow=(label,val,set,opts={})=>(
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--bdr)'}}>
      <span style={{fontSize:12,color:'var(--txt2)',flex:1}}>{label}</span>
      <div style={{position:'relative',width:140,flexShrink:0}}>
        {opts.prefix&&<span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'var(--txt3)'}}>{sym}</span>}
        <input type="text" inputMode="decimal" value={val===0?'':val} placeholder="0"
          onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))set(parseFloat(e.target.value)||0)}}
          onFocus={e=>e.target.select()}
          style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:7,padding:`7px ${opts.suffix?'28px':'10px'} 7px ${opts.prefix?'24px':'10px'}`,fontSize:13,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
        {opts.suffix&&<span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'var(--txt3)'}}>{opts.suffix}</span>}
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="var(--gold)" icon="ti-calculator" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'280px 1fr',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:16,borderRight:'1px solid var(--bdr)',display:'flex',flexDirection:'column',gap:4}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)',marginBottom:8}}>Loan details</div>
          {inputRow('Loan amount',principal,setPrincipal,{prefix:'£'})}
          {inputRow('Annual interest rate',rate,setRate,{suffix:'%'})}
          {inputRow(`Loan term (years)`,years,setYears,{suffix:'yrs'})}
          {inputRow('Extra monthly payment',extra,setExtra,{prefix:'£'})}

          <div style={{marginTop:12,background:'rgba(201,169,110,.08)',border:'1px solid var(--bdr2)',borderRadius:12,padding:14,textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',marginBottom:4}}>Monthly payment</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:28,fontWeight:700,color:'var(--gold)'}}>{fmt(payment, sym)}</div>
            <div style={{fontSize:10,color:'var(--txt3)',marginTop:4}}>Total interest: {fmt(totalInterest, sym)}</div>
          </div>

          {extra>0&&(
            <div style={{background:'rgba(29,158,117,.08)',border:'1px solid rgba(29,158,117,.3)',borderRadius:10,padding:12}}>
              <div style={{fontSize:11,fontWeight:600,color:'#1d9e75',marginBottom:6}}>With £{extra}/mo extra</div>
              {[{l:'Months saved',v:`${savedMo} months`},{l:'Interest saved',v:fmt(savedInt, sym)}].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'3px 0'}}>
                  <span style={{color:'var(--txt2)'}}>{r.l}</span>
                  <span style={{fontWeight:600,color:'#1d9e75'}}>{r.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{overflowY:'auto',padding:14}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)',marginBottom:10}}>
            Amortisation schedule (first {sched.length} months)
          </div>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'50px 1fr 1fr 1fr 1fr',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Mo','Payment','Interest','Principal','Balance'].map((h,i)=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase',textAlign:'right'}}>{h}</div>
              ))}
            </div>
            {sched.map((r,i)=>(
              <div key={r.m} style={{display:'grid',gridTemplateColumns:'50px 1fr 1fr 1fr 1fr',gap:8,padding:'7px 14px',borderBottom:i<sched.length-1?'1px solid var(--bdr)':'none',fontSize:11}}>
                <span style={{color:'var(--txt3)',textAlign:'right'}}>{r.m}</span>
                <span style={{textAlign:'right',color:'var(--txt)'}}>{fmt(r.payment, sym)}</span>
                <span style={{textAlign:'right',color:'#d4537e'}}>{fmt(r.interest, sym)}</span>
                <span style={{textAlign:'right',color:'#1d9e75'}}>{fmt(r.principal, sym)}</span>
                <span style={{textAlign:'right',color:'var(--txt)'}}>{fmt(r.balance, sym)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── INTEREST CALCULATOR TOOL ────────────────────────────────────
export function InterestCalcTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const isFuture = (tool?.name||'').toLowerCase().includes('future value')
  const [principal,  setPrincipal]  = useState(10000)
  const [rate,       setRate]       = useState(5)
  const [years,      setYears]      = useState(10)
  const [monthly,    setMonthly]    = useState(0)
  const [mode,       setMode]       = useState('compound')
  const [compFreq,   setCompFreq]   = useState(12)

  const n = compFreq
  const compound = principal*Math.pow(1+rate/100/n,n*years)
    + (monthly>0 ? monthly*((Math.pow(1+rate/100/12,12*years)-1)/(rate/100/12)) : 0)
  const simple = principal*(1+rate/100*years) + monthly*years*12
  const result = mode==='compound' ? compound : simple
  const interest = result - principal - monthly*years*12
  const totalContrib = principal + monthly*years*12

  const timeline = Array.from({length:Math.min(years,15)},(_,i)=>({
    yr:i+1,
    val:principal*Math.pow(1+rate/100/n,n*(i+1))+(monthly>0?monthly*((Math.pow(1+rate/100/12,12*(i+1))-1)/(rate/100/12)):0)
  }))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="var(--gold)" icon="ti-calculator"
        extra={
          <div style={{display:'flex',gap:5}}>
            {[['compound','Compound'],['simple','Simple']].map(([m,l])=>(
              <button key={m} onClick={()=>setMode(m)}
                style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${mode===m?'var(--gold)':'var(--bdr)'}`,background:mode===m?'var(--gold3)':'transparent',fontSize:10,color:mode===m?'var(--gold)':'var(--txt3)',cursor:'pointer',fontFamily:'inherit'}}>
                {l}
              </button>
            ))}
          </div>
        }/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'260px 1fr',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:16,borderRight:'1px solid var(--bdr)',display:'flex',flexDirection:'column',gap:10}}>
          {[
            {l:'Principal (£)',v:principal,set:setPrincipal,pre:'£'},
            {l:'Annual rate (%)',v:rate,set:setRate,suf:'%'},
            {l:`Period (years)`,v:years,set:setYears,suf:'yrs'},
            {l:'Monthly contribution (£)',v:monthly,set:setMonthly,pre:'£'},
          ].map(f=>(
            <div key={f.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 14px'}}>
              <div style={{fontSize:11,color:'var(--txt2)',marginBottom:5}}>{f.l}</div>
              <div style={{position:'relative'}}>
                {f.pre&&<span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--txt3)'}}>{sym}</span>}
                <input type="text" inputMode="decimal" value={f.v===0?'':f.v} placeholder="0"
                  onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))f.set(parseFloat(e.target.value)||0)}}
                  onFocus={e=>e.target.select()}
                  style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:7,padding:`8px ${f.suf?'32px':'10px'} 8px ${f.pre?'24px':'10px'}`,fontSize:13,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                {f.suf&&<span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'var(--txt3)'}}>{f.suf}</span>}
              </div>
            </div>
          ))}
          <div style={{background:'rgba(201,169,110,.08)',border:'1px solid var(--bdr2)',borderRadius:12,padding:16,textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',marginBottom:4}}>Final value</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:28,fontWeight:700,color:'var(--gold)'}}>{fmt(result, sym)}</div>
            <div style={{fontSize:10,color:'var(--txt3)',marginTop:4}}>Interest earned: {fmt(interest, sym)}</div>
          </div>
        </div>

        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Growth over {years} years</div>
          {/* Visual bar chart */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,padding:14}}>
            <div style={{display:'flex',gap:3,alignItems:'flex-end',height:80,marginBottom:6}}>
              {timeline.map((t,i)=>{
                const h=result>0?Math.max(4,t.val/result*76):4
                return <div key={t.yr} style={{flex:1,height:h,background:'var(--gold)',borderRadius:'2px 2px 0 0',opacity:.4+i/timeline.length*.6}} title={`Year ${t.yr}: ${fmt(t.val, sym)}`}/>
              })}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--txt3)'}}>
              <span>Year 1</span><span>Year {Math.min(years,15)}</span>
            </div>
          </div>
          {[
            {l:'Principal',v:fmt(principal, sym),c:'var(--txt)'},
            {l:'Contributions',v:fmt(monthly*years*12, sym),c:'#378add'},
            {l:'Interest earned',v:fmt(interest, sym),c:'#1d9e75'},
            {l:'Total value',v:fmt(result, sym),c:'var(--gold)'},
            {l:`Growth ×`,v:`${(result/principal).toFixed(2)}×`,c:'var(--gold)'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'var(--bg3)',borderRadius:9,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── INSURANCE COMPARISON TOOL ───────────────────────────────────
export function InsuranceCompTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n = (tool?.name||'').toLowerCase()
  const isTracker = n.includes('insurance tracker')
  const TYPES = ['Home','Life','Health','Car','Travel','Income protection','Critical illness']
  const [insType, setInsType] = useState('Home')
  const [policies, setPolicies] = useState([
    {id:1,provider:'Provider A',monthly:42,excess:250,cover:200000,rating:4.2,notes:''},
    {id:2,provider:'Provider B',monthly:35,excess:500,cover:150000,rating:3.8,notes:''},
    {id:3,provider:'Provider C',monthly:55,excess:100,cover:250000,rating:4.7,notes:''},
  ])
  const best    = [...policies].sort((a,b)=>b.rating-a.rating)[0]
  const cheapest= [...policies].sort((a,b)=>a.monthly-b.monthly)[0]
  const upd = (id,k,v) => setPolicies(p=>p.map(x=>x.id===id?{...x,[k]:v}:x))
  const addPolicy = () => setPolicies(p=>[...p,{id:Date.now(),provider:`Provider ${String.fromCharCode(64+p.length+1)}`,monthly:0,excess:250,cover:0,rating:3.0,notes:''}])
  const inp = (val,set,opts={})=>(
    <div style={{position:'relative'}}>
      {opts.pre&&<span style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--txt3)'}}>{sym}</span>}
      <input type="text" inputMode="decimal" value={val||''} placeholder="0"
        onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))set(parseFloat(e.target.value)||0)}}
        style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:`6px ${opts.suf?'22px':'8px'} 6px ${opts.pre?'18px':'8px'}`,fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
      {opts.suf&&<span style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--txt3)'}}>{opts.suf}</span>}
    </div>
  )
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#378add" icon="ti-shield"
        extra={
          <select value={insType} onChange={e=>setInsType(e.target.value)}
            style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:7,padding:'6px 10px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
            {TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        }/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{l:'Best rated',p:best,c:'#1d9e75',i:'ti-star-filled'},{l:'Cheapest',p:cheapest,c:'var(--gold)',i:'ti-coins'}].map(b=>(
            <div key={b.l} style={{background:`${b.c}10`,border:`1px solid ${b.c}44`,borderRadius:10,padding:12}}>
              <div style={{fontSize:9,fontWeight:700,color:b.c,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:3,display:'flex',alignItems:'center',gap:5}}>
                <i className={`ti ${b.i}`} style={{fontSize:11}} aria-hidden="true"/>{b.l}
              </div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--txt)'}}>{b.p?.provider}</div>
              <div style={{fontSize:11,color:'var(--txt2)',marginTop:2}}>£{b.p?.monthly}/mo · ⭐{b.p?.rating}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${policies.length},1fr)`,gap:10}}>
          {policies.map(pol=>(
            <div key={pol.id} style={{background:'var(--bg2)',border:`2px solid ${pol.id===best?.id?'rgba(29,158,117,.4)':'var(--bdr)'}`,borderRadius:12,padding:14}}>
              <input value={pol.provider} onChange={e=>upd(pol.id,'provider',e.target.value)}
                style={{width:'100%',fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--txt)',background:'transparent',border:'none',outline:'none',marginBottom:10}}/>
              {[
                {l:'Monthly (£)',k:'monthly',pre:'£'},
                {l:'Excess (£)',k:'excess',pre:'£'},
                {l:'Cover (£)',k:'cover',pre:'£'},
                {l:'Rating /5',k:'rating',suf:'/5'},
              ].map(f=>(
                <div key={f.k} style={{marginBottom:8}}>
                  <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',marginBottom:3}}>{f.l}</div>
                  {inp(pol[f.k],v=>upd(pol.id,f.k,v),{pre:f.pre,suf:f.suf})}
                </div>
              ))}
              <button onClick={()=>setPolicies(p=>p.filter(x=>x.id!==pol.id))}
                style={{width:'100%',marginTop:6,padding:'5px',borderRadius:6,border:'1px solid rgba(226,75,74,.2)',background:'rgba(226,75,74,.06)',fontSize:10,color:'#e24b4a',cursor:'pointer',fontFamily:'inherit'}}>
                Remove
              </button>
            </div>
          ))}
          <button onClick={addPolicy}
            style={{background:'var(--bg2)',border:'1px dashed var(--bdr)',borderRadius:12,padding:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:12,color:'var(--txt3)',fontFamily:'inherit'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#378add';e.currentTarget.style.color='#378add'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bdr)';e.currentTarget.style.color='var(--txt3)'}}>
            <i className="ti ti-plus" style={{fontSize:14}} aria-hidden="true"/> Add policy
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CREDIT TRACKER TOOL ─────────────────────────────────────────
export function CreditTrackerTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [cards, setCards] = useState([
    {id:1,name:'Barclaycard',limit:5000,balance:1200,rate:22.9},
    {id:2,name:'AMEX Gold',limit:8000,balance:450,rate:28.5},
    {id:3,name:'Halifax',limit:3000,balance:0,rate:19.9},
  ])
  const addCard = () => setCards(p=>[...p,{id:Date.now(),name:'New card',limit:1000,balance:0,rate:24.9}])
  const upd = (id,k,v) => setCards(p=>p.map(c=>c.id===id?{...c,[k]:v}:c))
  const totalLimit = cards.reduce((s,c)=>s+c.limit,0)
  const totalBal   = cards.reduce((s,c)=>s+c.balance,0)
  const overallUtil= totalLimit>0?(totalBal/totalLimit*100):0
  const monthlyInt = cards.reduce((s,c)=>s+(c.balance*c.rate/100/12),0)
  const uColor = p => p<=10?'#1d9e75':p<=30?'#1d9e75':p<=50?'#ba7517':p<=75?'#d4537e':'#e24b4a'
  const uLabel = p => p<=10?'Excellent':p<=30?'Good':p<=50?'Fair':p<=75?'Poor':'Critical'
  const inp=(val,set)=>(
    <input type="text" inputMode="decimal" value={val||''} placeholder="0"
      onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))set(parseFloat(e.target.value)||0)}}
      style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'5px 8px',fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
  )
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#d4537e" icon="ti-credit-card"
        extra={<button onClick={addCard} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:7,border:'1px solid var(--bdr)',background:'transparent',fontSize:11,color:'var(--txt2)',cursor:'pointer',fontFamily:'inherit'}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/> Add card
        </button>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {cards.map(card=>{
            const util=card.limit>0?(card.balance/card.limit*100):0
            const c=uColor(util)
            return (
              <div key={card.id} style={{background:'var(--bg2)',border:`1px solid ${c}44`,borderRadius:12,padding:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <input value={card.name} onChange={e=>upd(card.id,'name',e.target.value)}
                    style={{flex:1,fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--txt)',background:'transparent',border:'none',outline:'none'}}/>
                  <span style={{fontSize:11,fontWeight:700,color:c}}>{uLabel(util)}</span>
                  <button onClick={()=>setCards(p=>p.filter(x=>x.id!==card.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
                    <i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/>
                  </button>
                </div>
                <div style={{height:6,background:'var(--bg4)',borderRadius:3,overflow:'hidden',marginBottom:6}}>
                  <div style={{height:'100%',width:`${Math.min(100,util)}%`,background:c,borderRadius:3,transition:'width .4s'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--txt3)',marginBottom:10}}>
                  <span>{fmt(card.balance, sym)} used</span>
                  <span style={{fontWeight:700,color:c}}>{util.toFixed(1)}%</span>
                  <span>{fmt(card.limit, sym)} limit</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[{l:'Limit',k:'limit'},{l:'Balance',k:'balance'},{l:'APR %',k:'rate'}].map(f=>(
                    <div key={f.k}>
                      <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',marginBottom:3}}>{f.l}</div>
                      {inp(card[f.k],v=>upd(card.id,f.k,v))}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:`${uColor(overallUtil)}14`,border:`2px solid ${uColor(overallUtil)}55`,borderRadius:12,padding:14,textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',marginBottom:4}}>Overall utilisation</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:30,fontWeight:700,color:uColor(overallUtil)}}>{overallUtil.toFixed(1)}%</div>
            <div style={{fontSize:11,color:'var(--txt2)',marginTop:3}}>{uLabel(overallUtil)}</div>
          </div>
          {[
            {l:'Total limit',v:fmt(totalLimit, sym),c:'var(--txt)'},
            {l:'Total balance',v:fmt(totalBal, sym),c:'#d4537e'},
            {l:'Available',v:fmt(totalLimit-totalBal, sym),c:'#1d9e75'},
            {l:'Monthly interest',v:fmt(monthlyInt, sym),c:'#ba7517'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:10,fontSize:11,color:'var(--txt2)',lineHeight:1.6}}>
            {overallUtil<=30?'✅ Good utilisation. Keep below 30% for best credit score.':
             overallUtil<=50?'⚠️ Fair. Pay down to under 30% to improve score.':
             '🚨 High utilisation is hurting your credit score.'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── INFLATION CALCULATOR TOOL ────────────────────────────────────
export function InflationCalcTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [amount,    setAmount]    = useState(1000)
  const [years,     setYears]     = useState(10)
  const [inflation, setInflation] = useState(3.5)
  const [invest,    setInvest]    = useState(7)

  const futurePrice  = amount * Math.pow(1+inflation/100, years)
  const realValue    = amount / Math.pow(1+inflation/100, years)
  const investedVal  = amount * Math.pow(1+invest/100, years)
  const realReturn   = invest - inflation
  const powerLoss    = amount - realValue

  const timeline = Array.from({length:Math.min(years,20)},(_,i)=>({
    yr:i+1,
    real:amount/Math.pow(1+inflation/100,i+1),
    inv:amount*Math.pow(1+invest/100,i+1),
  }))

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#ba7517" icon="ti-trending-up" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'260px 1fr',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:16,borderRight:'1px solid var(--bdr)',display:'flex',flexDirection:'column',gap:10}}>
          {[
            {l:'Amount today (£)',v:amount,set:setAmount,pre:'£'},
            {l:'Years ahead',v:years,set:setYears,suf:'yrs'},
            {l:'Inflation rate (%)',v:inflation,set:setInflation,suf:'%'},
            {l:'Investment return (%)',v:invest,set:setInvest,suf:'%'},
          ].map(f=>(
            <div key={f.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 14px'}}>
              <div style={{fontSize:11,color:'var(--txt2)',marginBottom:5}}>{f.l}</div>
              <div style={{position:'relative'}}>
                {f.pre&&<span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--txt3)'}}>{sym}</span>}
                <input type="text" inputMode="decimal" value={f.v===0?'':f.v} placeholder="0"
                  onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))f.set(parseFloat(e.target.value)||0)}}
                  onFocus={e=>e.target.select()}
                  style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:7,padding:`8px ${f.suf?'36px':'10px'} 8px ${f.pre?'24px':'10px'}`,fontSize:13,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                {f.suf&&<span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--txt3)'}}>{f.suf}</span>}
              </div>
            </div>
          ))}
          {[
            {l:`Real value in ${years}yr`,v:fmt(realValue, sym),c:'#e24b4a'},
            {l:'Purchasing power lost',v:fmt(powerLoss, sym),c:'#d4537e'},
            {l:`Cost of today's goods in ${years}yr`,v:fmt(futurePrice, sym),c:'#ba7517'},
            {l:`If invested (${invest}%)`,v:fmt(investedVal, sym),c:'#1d9e75'},
            {l:'Real return above inflation',v:`${realReturn.toFixed(1)}%/yr`,c:realReturn>0?'#1d9e75':'#e24b4a'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:10,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:11,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
        <div style={{overflowY:'auto',padding:14}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)',marginBottom:10}}>Purchasing power vs invested over time</div>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'60px 1fr 1fr',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Year','Real value','If invested'].map((h,i)=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase',textAlign:i>0?'right':'left'}}>{h}</div>
              ))}
            </div>
            {timeline.map((r,i)=>(
              <div key={r.yr} style={{display:'grid',gridTemplateColumns:'60px 1fr 1fr',gap:8,padding:'7px 14px',borderBottom:i<timeline.length-1?'1px solid var(--bdr)':'none',fontSize:11}}>
                <span style={{color:'var(--txt3)'}}>Year {r.yr}</span>
                <span style={{textAlign:'right',color:'#e24b4a',fontWeight:500}}>{fmt(r.real, sym)}</span>
                <span style={{textAlign:'right',color:'#1d9e75',fontWeight:500}}>{fmt(r.inv, sym)}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:10,padding:12,fontSize:11,color:'var(--txt2)',lineHeight:1.65}}>
            💡 With {inflation}% inflation, {fmt(amount, sym)} today buys what {fmt(realValue, sym)} buys now in {years} years.
            {realReturn>0?` Investing at ${invest}% gives a real return of ${realReturn.toFixed(1)}%/yr above inflation.`:' Your investments must beat inflation just to maintain purchasing power.'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── FINANCIAL HEALTH TOOL ────────────────────────────────────────
export function FinancialHealthTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)

  const questions = [
    {id:'emergency',q:'How many months of expenses saved?',
     opts:[{v:0,t:'None'},{v:1,t:'Under 1 month'},{v:2,t:'1–2 months'},{v:4,t:'3–5 months'},{v:5,t:'6+ months'}]},
    {id:'debt',q:'What % of income goes to debt payments?',
     opts:[{v:5,t:'None'},{v:4,t:'Under 15%'},{v:3,t:'15–25%'},{v:2,t:'25–40%'},{v:0,t:'Over 40%'}]},
    {id:'savings',q:'How much of income do you save monthly?',
     opts:[{v:0,t:'Nothing'},{v:1,t:'Under 5%'},{v:2,t:'5–10%'},{v:3,t:'10–20%'},{v:5,t:'Over 20%'}]},
    {id:'budget',q:'Do you track your spending?',
     opts:[{v:0,t:'Never'},{v:1,t:'Rarely'},{v:3,t:'Sometimes'},{v:5,t:'Yes, consistently'}]},
    {id:'invest',q:'Do you invest for the future?',
     opts:[{v:0,t:'No'},{v:2,t:'Just started'},{v:3,t:'Sometimes'},{v:5,t:'Yes, consistently'}]},
    {id:'insurance',q:'Do you have adequate insurance?',
     opts:[{v:0,t:'None'},{v:2,t:'Basic only'},{v:4,t:'Most covered'},{v:5,t:'Fully covered'}]},
    {id:'goals',q:'Do you have written financial goals?',
     opts:[{v:0,t:'No goals'},{v:1,t:'Vague ideas'},{v:3,t:'Some goals'},{v:5,t:'Clear written goals'}]},
    {id:'networth',q:'Is your net worth growing?',
     opts:[{v:0,t:'Declining'},{v:1,t:'Flat'},{v:3,t:'Slowly growing'},{v:5,t:'Growing well'}]},
  ]
  const maxScore = questions.reduce((s,q)=>s+Math.max(...q.opts.map(o=>o.v)),0)
  const score = Object.values(answers).reduce((s,v)=>s+v,0)
  const pct = maxScore>0?Math.round(score/maxScore*100):0
  const answered = Object.keys(answers).length
  const grade = pct>=85?{g:'A+',l:'Excellent',c:'#1d9e75'}:pct>=70?{g:'A',l:'Very Good',c:'#1d9e75'}:pct>=55?{g:'B',l:'Good',c:'#ba7517'}:pct>=40?{g:'C',l:'Fair',c:'#ba7517'}:{g:'D',l:'Needs Work',c:'#e24b4a'}

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#1d9e75" icon="ti-heartbeat"
        extra={answered===questions.length&&(
          <button onClick={()=>setShowResult(r=>!r)}
            style={{padding:'6px 14px',borderRadius:7,border:'none',background:'#1d9e75',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif'}}>
            {showResult?'Retake':'See score'}
          </button>
        )}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        {/* Progress */}
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:10,padding:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:12,fontWeight:500,color:'var(--txt)'}}>Progress</span>
            <span style={{fontSize:12,color:'var(--txt3)'}}>{answered}/{questions.length}</span>
          </div>
          <div style={{height:5,background:'var(--bg4)',borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${answered/questions.length*100}%`,background:'#1d9e75',borderRadius:3,transition:'width .3s'}}/>
          </div>
        </div>
        {!showResult ? questions.map(q=>(
          <div key={q.id} style={{background:'var(--bg2)',border:`1px solid ${answers[q.id]!==undefined?'rgba(29,158,117,.3)':'var(--bdr)'}`,borderRadius:12,padding:14}}>
            <div style={{fontSize:13,fontWeight:500,color:'var(--txt)',marginBottom:10}}>{q.q}</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {q.opts.map(opt=>(
                <div key={opt.t} onClick={()=>setAnswers(p=>({...p,[q.id]:opt.v}))}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:8,border:`1px solid ${answers[q.id]===opt.v?'#1d9e75':'var(--bdr)'}`,background:answers[q.id]===opt.v?'rgba(29,158,117,.08)':'transparent',cursor:'pointer',transition:'all .15s'}}>
                  <div style={{width:16,height:16,borderRadius:'50%',border:`2px solid ${answers[q.id]===opt.v?'#1d9e75':'var(--bdr2)'}`,background:answers[q.id]===opt.v?'#1d9e75':'transparent',flexShrink:0}}/>
                  <span style={{fontSize:12,color:answers[q.id]===opt.v?'var(--txt)':'var(--txt2)'}}>{opt.t}</span>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <>
            <div style={{background:`${grade.c}14`,border:`2px solid ${grade.c}55`,borderRadius:14,padding:24,textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:64,fontWeight:700,color:grade.c,lineHeight:1}}>{grade.g}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:'var(--txt)',marginTop:4}}>{grade.l}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:36,fontWeight:700,color:grade.c,marginTop:8}}>{pct}/100</div>
              <div style={{height:6,background:'var(--bg4)',borderRadius:3,overflow:'hidden',margin:'12px auto 0',maxWidth:260}}>
                <div style={{height:'100%',width:`${pct}%`,background:grade.c,borderRadius:3}}/>
              </div>
            </div>
            {questions.map(q=>{
              const max=Math.max(...q.opts.map(o=>o.v))
              const val=answers[q.id]||0
              const p=max>0?val/max*100:0
              const c=p>=70?'#1d9e75':p>=40?'#ba7517':'#e24b4a'
              return (
                <div key={q.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--bg3)',borderRadius:9,border:'1px solid var(--bdr)'}}>
                  <span style={{fontSize:11,color:'var(--txt2)',flex:1}}>{q.q}</span>
                  <div style={{width:80,height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${p}%`,background:c,borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:10,fontWeight:600,color:c,width:30,textAlign:'right'}}>{Math.round(p)}%</span>
                </div>
              )
            })}
            <button onClick={()=>{setAnswers({});setShowResult(false)}}
              style={{padding:'9px',borderRadius:9,border:'1px solid var(--bdr)',background:'transparent',fontSize:12,color:'var(--txt2)',cursor:'pointer',fontFamily:'inherit'}}>
              Retake assessment
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── GOALS PLANNER TOOL ───────────────────────────────────────────
export function GoalsPlannerTool({ tool }) {
  const cfg = getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [goals, setGoals] = useState([
    {id:1,name:'Buy a house',target:50000,saved:12000,monthly:800,priority:'High',deadline:'2028-06-01',color:'#378add'},
    {id:2,name:'Emergency fund (6mo)',target:15000,saved:4500,monthly:300,priority:'Critical',deadline:'2026-12-01',color:'#1d9e75'},
    {id:3,name:'Holiday in Japan',target:3500,saved:800,monthly:150,priority:'Low',deadline:'2027-06-01',color:'#d4537e'},
  ])
  const PRIOS = ['Critical','High','Medium','Low']
  const pColor = {Critical:'#e24b4a',High:'#ba7517',Medium:'#378add',Low:'var(--txt3)'}
  const upd = (id,k,v) => setGoals(p=>p.map(g=>g.id===id?{...g,[k]:v}:g))
  const addGoal = () => setGoals(p=>[...p,{id:Date.now(),name:'New goal',target:0,saved:0,monthly:0,priority:'Medium',deadline:'',color:'#7f77dd'}])
  const totalMonthly = goals.reduce((s,g)=>s+g.monthly,0)
  const inp=(val,set)=>(
    <div style={{position:'relative'}}>
      <span style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',fontSize:10,color:'var(--txt3)'}}>{sym}</span>
      <input type="text" inputMode="decimal" value={val||''} placeholder="0"
        onChange={e=>{if(/^[\d]*$/.test(e.target.value))set(parseInt(e.target.value)||0)}}
        style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'5px 5px 5px 16px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
    </div>
  )
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#378add" icon="ti-target"
        extra={<button onClick={addGoal} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:7,border:'none',background:'#378add',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif'}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/> Add goal
        </button>}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--txt2)'}}>Total monthly commitment</span>
          <span style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:'#378add'}}>{fmt(totalMonthly, sym)}/mo</span>
        </div>
        {[...goals].sort((a,b)=>PRIOS.indexOf(a.priority)-PRIOS.indexOf(b.priority)).map(goal=>{
          const pct=goal.target>0?Math.min(100,goal.saved/goal.target*100):0
          const remaining=goal.target-goal.saved
          const monthsLeft=goal.monthly>0?Math.ceil(remaining/goal.monthly):0
          return (
            <div key={goal.id} style={{background:'var(--bg2)',border:`1px solid ${goal.color}44`,borderRadius:12,padding:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <input value={goal.name} onChange={e=>upd(goal.id,'name',e.target.value)}
                  style={{flex:1,fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--txt)',background:'transparent',border:'none',outline:'none'}}/>
                <select value={goal.priority} onChange={e=>upd(goal.id,'priority',e.target.value)}
                  style={{background:'transparent',border:'none',outline:'none',fontSize:10,color:pColor[goal.priority],fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  {PRIOS.map(p=><option key={p}>{p}</option>)}
                </select>
                <button onClick={()=>setGoals(p=>p.filter(g=>g.id!==goal.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
                  <i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/>
                </button>
              </div>
              <div style={{height:7,background:'var(--bg4)',borderRadius:4,overflow:'hidden',marginBottom:6}}>
                <div style={{height:'100%',width:`${pct}%`,background:goal.color,borderRadius:4,transition:'width .5s'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--txt3)',marginBottom:10}}>
                <span>{fmt(goal.saved, sym)} saved</span>
                <span style={{fontWeight:700,color:goal.color}}>{pct.toFixed(0)}%</span>
                <span>Target: {fmt(goal.target, sym)}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                {[{l:'Target',k:'target'},{l:'Saved',k:'saved'},{l:'Monthly',k:'monthly'}].map(f=>(
                  <div key={f.k}>
                    <div style={{fontSize:8,color:'var(--txt3)',textTransform:'uppercase',marginBottom:2}}>{f.l}</div>
                    {inp(goal[f.k],v=>upd(goal.id,f.k,v))}
                  </div>
                ))}
                <div>
                  <div style={{fontSize:8,color:'var(--txt3)',textTransform:'uppercase',marginBottom:2}}>Deadline</div>
                  <input type="date" value={goal.deadline||''} onChange={e=>upd(goal.id,'deadline',e.target.value)}
                    style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'5px 4px',fontSize:10,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}/>
                </div>
              </div>
              {remaining>0&&goal.monthly>0&&(
                <div style={{marginTop:8,fontSize:10,color:'var(--txt3)'}}>
                  {fmt(remaining, sym)} to go · {monthsLeft} months at {fmt(goal.monthly, sym)}/mo
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── NEW CATEGORY ROUTES ───────────────────────────────────────
// Added to ToolEngine router via patch below
export function StockPortfolioTool({tool}){
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [holdings,setHoldings]=useState([
    {id:1,ticker:'AAPL',name:'Apple Inc',shares:10,buy:150,current:189,sector:'Tech'},
    {id:2,ticker:'VUSA',name:'Vanguard S&P500',shares:20,buy:65,current:88,sector:'ETF'},
    {id:3,ticker:'LLOY',name:'Lloyds Banking',shares:500,buy:0.45,current:0.55,sector:'Finance'},
  ])
  const [adding,setAdding]=useState(false)
  const [nr,setNr]=useState({ticker:'',name:'',shares:0,buy:0,current:0,sector:'Tech'})
  const SECTORS=['Tech','Finance','Healthcare','Energy','Consumer','ETF','Crypto','Other']
  const enrich=h=>({...h,value:h.shares*h.current,cost:h.shares*h.buy,gain:h.shares*h.current-h.shares*h.buy,gainPct:h.buy>0?((h.current-h.buy)/h.buy*100):0})
  const rows=holdings.map(enrich)
  const totalVal=rows.reduce((s,r)=>s+r.value,0)
  const totalGain=rows.reduce((s,r)=>s+r.gain,0)
  const totalGainPct=rows.reduce((s,r)=>s+r.cost,0)>0?(totalGain/rows.reduce((s,r)=>s+r.cost,0)*100):0
  const upd=(id,k,v)=>setHoldings(p=>p.map(h=>h.id===id?{...h,[k]:v}:h))
  const addH=()=>{if(!nr.ticker)return;setHoldings(p=>[...p,{...nr,id:Date.now()}]);setNr({ticker:'',name:'',shares:0,buy:0,current:0,sector:'Tech'});setAdding(false)}
  const is=(s,v)=>(
    <input type="text" inputMode="decimal" value={v||''} placeholder="0"
      onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(s.id,'current',parseFloat(e.target.value)||0)}}
      style={{width:70,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
  )
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#1d9e75" icon="ti-chart-line"
        extra={<button onClick={()=>setAdding(a=>!a)} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#1d9e75',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif'}}>+ Add</button>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 200px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {adding&&(
            <div style={{background:'var(--bg2)',border:'1px solid var(--bdr2)',borderRadius:12,padding:14}}>
              <div style={{display:'grid',gridTemplateColumns:'80px 1fr 70px 90px 90px 1fr',gap:8,marginBottom:8}}>
                {[['Ticker','ticker','text'],['Company','name','text'],['Shares','shares','num'],['Buy £','buy','num'],['Current £','current','num']].map(([l,k,t])=>(
                  <div key={k}>
                    <div style={{fontSize:9,color:'var(--txt3)',marginBottom:3}}>{l}</div>
                    <input type={t==='num'?'text':'text'} inputMode={t==='num'?'decimal':'text'} value={nr[k]||''} placeholder={t==='num'?'0':''}
                      onChange={e=>{const v=e.target.value;if(t==='num'){if(/^[\d]*\.?[\d]*$/.test(v))setNr(p=>({...p,[k]:parseFloat(v)||0}))}else setNr(p=>({...p,[k]:v}))}}
                      style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}/>
                  </div>
                ))}
                <div>
                  <div style={{fontSize:9,color:'var(--txt3)',marginBottom:3}}>Sector</div>
                  <select value={nr.sector} onChange={e=>setNr(p=>({...p,sector:e.target.value}))} style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}>
                    {SECTORS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={addH} style={{padding:'7px 16px',borderRadius:7,border:'none',background:'#1d9e75',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif'}}>Add holding</button>
                <button onClick={()=>setAdding(false)} style={{padding:'7px 14px',borderRadius:7,border:'1px solid var(--bdr)',background:'transparent',fontSize:11,color:'var(--txt2)',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'70px 1fr 60px 80px 80px 70px 70px 24px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Ticker','Company','Shares','Buy £','Price £','Value','Gain',''].map((h,i)=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase',textAlign:i>1?'right':'left'}}>{h}</div>
              ))}
            </div>
            {rows.map((r,i)=>(
              <div key={r.id} style={{display:'grid',gridTemplateColumns:'70px 1fr 60px 80px 80px 70px 70px 24px',gap:8,padding:'8px 14px',borderBottom:i<rows.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                <span style={{fontFamily:'Syne,sans-serif',fontSize:11,fontWeight:700,color:'var(--gold)'}}>{r.ticker}</span>
                <input value={r.name} onChange={e=>upd(r.id,'name',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit'}}/>
                <input type="text" inputMode="decimal" value={r.shares||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(r.id,'shares',parseFloat(e.target.value)||0)}} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                <input type="text" inputMode="decimal" value={r.buy||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(r.id,'buy',parseFloat(e.target.value)||0)}} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                <input type="text" inputMode="decimal" value={r.current||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(r.id,'current',parseFloat(e.target.value)||0)}} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                <span style={{fontSize:11,fontWeight:500,color:'var(--txt)',textAlign:'right'}}>{fmt(r.value, sym)}</span>
                <span style={{fontSize:11,fontWeight:600,color:r.gain>=0?'#1d9e75':'#e24b4a',textAlign:'right'}}>{r.gain>=0?'+':''}{fmt(r.gain, sym)}</span>
                <button onClick={()=>setHoldings(p=>p.filter(h=>h.id!==r.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
          </div>
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          {[{l:'Portfolio value',v:fmt(totalVal, sym),c:'var(--gold)'},{l:'Total gain/loss',v:fmt(totalGain, sym),c:totalGain>=0?'#1d9e75':'#e24b4a'},{l:'Return',v:`${totalGainPct>=0?'+':''}${totalGainPct.toFixed(2)}%`,c:totalGainPct>=0?'#1d9e75':'#e24b4a'}].map(s=>(
            <div key={s.l} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:'11px 13px'}}>
              <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',marginBottom:4}}>{s.l}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
            </div>
          ))}
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:12}}>
            <div style={{fontSize:11,fontWeight:500,color:'var(--txt)',marginBottom:8}}>By sector</div>
            {['Tech','Finance','Healthcare','Energy','Consumer','ETF','Crypto','Other'].map(sec=>{
              const secVal=rows.filter(r=>r.sector===sec).reduce((s,r)=>s+r.value,0)
              if(!secVal)return null
              const pct=totalVal>0?(secVal/totalVal*100):0
              return(
                <div key={sec} style={{marginBottom:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <span style={{fontSize:10,color:'var(--txt2)'}}>{sec}</span>
                    <span style={{fontSize:10,fontWeight:600,color:'var(--txt)'}}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{height:3,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:'var(--gold)',borderRadius:2}}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function RetirementPlannerTool({tool}){
  const [age,setAge]=useState(35)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [retAge,setRetAge]=useState(65)
  const [saved,setSaved]=useState(20000)
  const [monthly,setMonthly]=useState(400)
  const [ret,setRet]=useState(7)
  const [inf,setInf]=useState(2.5)
  const [desired,setDesired]=useState(2000)
  const yrs=retAge-age, mr=ret/100/12, mo=yrs*12
  const fv=saved*Math.pow(1+ret/100,yrs)+monthly*((Math.pow(1+mr,mo)-1)/mr)
  const adjInc=desired*Math.pow(1+inf/100,yrs)
  const need=adjInc*12*25
  const pct=Math.min(100,fv/need*100)
  const onTrack=fv>=need*0.9
  let mNeeded=0
  if(fv<need){
    const fvSaved=saved*Math.pow(1+ret/100,yrs)
    mNeeded=(need-fvSaved)/((Math.pow(1+mr,mo)-1)/mr)
  }
  const inp=(l,v,set,suf)=>(
    <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 14px',marginBottom:8}}>
      <div style={{fontSize:11,color:'var(--txt2)',marginBottom:5}}>{l}</div>
      <div style={{position:'relative'}}>
        {!suf&&<span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--txt3)'}}>{sym}</span>}
        <input type="text" inputMode="decimal" value={v===0?'':v} placeholder="0"
          onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))set(parseFloat(e.target.value)||0)}}
          onFocus={e=>e.target.select()}
          style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:7,padding:`8px ${suf?'32px':'10px'} 8px ${suf?'10px':'24px'}`,fontSize:13,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
        {suf&&<span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--txt3)'}}>{suf}</span>}
      </div>
    </div>
  )
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="var(--gold)" icon="ti-beach" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'280px 1fr',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,borderRight:'1px solid var(--bdr)'}}>
          {inp('Current age',age,setAge,'yrs')}
          {inp('Retirement age',retAge,setRetAge,'yrs')}
          {inp('Current savings (£)',saved,setSaved)}
          {inp('Monthly contribution (£)',monthly,setMonthly)}
          {inp('Expected return (%)',ret,setRet,'%')}
          {inp('Inflation rate (%)',inf,setInf,'%')}
          {inp('Monthly income needed (£)',desired,setDesired)}
        </div>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:`${onTrack?'rgba(29,158,117':'rgba(226,75,74'}, .08)`,border:`2px solid ${onTrack?'rgba(29,158,117,.4)':'rgba(226,75,74,.4)'}`,borderRadius:12,padding:18,textAlign:'center'}}>
            <i className={`ti ${onTrack?'ti-circle-check':'ti-alert-circle'}`} style={{fontSize:28,color:onTrack?'#1d9e75':'#e24b4a',display:'block',marginBottom:8}} aria-hidden="true"/>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:700,color:onTrack?'#1d9e75':'#e24b4a'}}>{onTrack?'On track!':'Not on track'}</div>
            <div style={{fontSize:11,color:'var(--txt2)',marginTop:4}}>Retire at {retAge} — {yrs} years away</div>
          </div>
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:10,padding:12}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:12,fontWeight:500,color:'var(--txt)'}}>Progress to goal</span>
              <span style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:onTrack?'#1d9e75':'var(--gold)'}}>{pct.toFixed(1)}%</span>
            </div>
            <div style={{height:7,background:'var(--bg4)',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:onTrack?'#1d9e75':'var(--gold)',borderRadius:4,transition:'width .8s'}}/>
            </div>
          </div>
          {[
            {l:'Projected pot',v:fmt(fv, sym),c:onTrack?'#1d9e75':'var(--gold)'},
            {l:'Required pot (4% rule)',v:fmt(need, sym),c:'var(--txt)'},
            {l:'Inflation-adj income/mo',v:fmt(adjInc, sym),c:'var(--txt2)'},
            {l:'Monthly needed to hit goal',v:fmt(mNeeded||monthly, sym),c:mNeeded<=monthly?'#1d9e75':'#e24b4a'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'var(--bg3)',borderRadius:9,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
          {!onTrack&&<div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:10,fontSize:11,color:'var(--txt2)',lineHeight:1.6}}>
            💡 Increase monthly contribution by {fmt(Math.max(0,mNeeded-monthly, sym))} to reach {fmt(mNeeded, sym)}/mo and get back on track.
          </div>}
        </div>
      </div>
    </div>
  )
}

export function HRTool({tool}){
  const cfg=getToolConfig(tool)
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n=(tool?.name||'').toLowerCase()
  const isOnboarding=n.includes('onboard')
  const isLeave=n.includes('leave')||n.includes('pto')||n.includes('holiday')
  const isPayroll=n.includes('payroll')||n.includes('salary')
  const isPerf=n.includes('performance')||n.includes('review')
  const [rows,setRows]=useState([
    {id:1,name:'',dept:'',value:'',status:'Active',date:'',notes:''},
  ])
  const upd=(id,k,v)=>setRows(p=>p.map(r=>r.id===id?{...r,[k]:v}:r))
  const add=()=>setRows(p=>[...p,{id:Date.now(),name:'',dept:'',value:'',status:'Active',date:'',notes:''}])
  const DEPTS=['Engineering','Marketing','Sales','Finance','HR','Operations','Product','Design','Legal','Other']
  const STATUS=isOnboarding?['Not started','In progress','Complete','On hold']:isLeave?['Approved','Pending','Rejected','Used']:['Active','Inactive','On probation','Left']
  const sColor={'Active':'#1d9e75','Complete':'#1d9e75','Approved':'#1d9e75','In progress':'#378add','Pending':'#ba7517','On probation':'#ba7517','Not started':'var(--txt3)','Inactive':'var(--txt3)','Rejected':'#e24b4a','Left':'#e24b4a','On hold':'var(--txt3)','Used':'var(--txt3)'}
  const cellS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  const col1=isOnboarding?'Employee':isLeave?'Employee':isPayroll?'Employee':'Employee'
  const col2=isOnboarding?'Department':isLeave?'Leave type':isPayroll?'Salary (£)':'Department'
  const col3=isOnboarding?'Start date':isLeave?'Days':isPayroll?'Bonus (£)':'Value'
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#7f77dd" icon="ti-users" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[{l:'Total',v:rows.length,c:'var(--txt)'},{l:'Active/Complete',v:rows.filter(r=>['Active','Complete','Approved'].includes(r.status)).length,c:'#1d9e75'},{l:'In progress',v:rows.filter(r=>['In progress','Pending'].includes(r.status)).length,c:'#ba7517'},{l:'Inactive',v:rows.filter(r=>['Inactive','Left','Rejected'].includes(r.status)).length,c:'#e24b4a'}].map(s=>(
            <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 120px 100px 110px 110px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
            {[col1,'Department',col2,col3,'Status','Notes',''].map((h,i)=>(
              <div key={i} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
            ))}
          </div>
          {rows.map((row,i)=>(
            <div key={row.id} style={{display:'grid',gridTemplateColumns:'1fr 120px 100px 110px 110px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<rows.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
              <input value={row.name} onChange={e=>upd(row.id,'name',e.target.value)} placeholder="Name..." style={cellS}/>
              <select value={row.dept} onChange={e=>upd(row.id,'dept',e.target.value)} style={{...cellS,cursor:'pointer'}}>
                <option value="">Select...</option>{DEPTS.map(d=><option key={d}>{d}</option>)}
              </select>
              <input value={row.value} onChange={e=>upd(row.id,'value',e.target.value)} placeholder="Value..." style={cellS}/>
              <input type="date" value={row.date} onChange={e=>upd(row.id,'date',e.target.value)} style={{...cellS,fontSize:10}}/>
              <select value={row.status} onChange={e=>upd(row.id,'status',e.target.value)} style={{...cellS,color:sColor[row.status]||'var(--txt)',fontWeight:600,cursor:'pointer'}}>
                {STATUS.map(s=><option key={s}>{s}</option>)}
              </select>
              <input value={row.notes} onChange={e=>upd(row.id,'notes',e.target.value)} placeholder="Notes..." style={cellS}/>
              <button onClick={()=>setRows(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
          <div style={{padding:'8px 14px'}}>
            <button onClick={add} style={{fontSize:11,color:'#7f77dd',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
              <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add row
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MarketingTool({tool}){
  const n=(tool?.name||'').toLowerCase()
  const isCalendar=n.includes('calendar')||n.includes('content plan')
  const isCampaign=n.includes('campaign')
  const isSocial=n.includes('social media')
  const CHANNELS=['Blog','Instagram','Twitter/X','LinkedIn','YouTube','TikTok','Email','Paid Ads','SEO','Other']
  const STATUS=['Draft','Scheduled','Published','Live','Complete','Paused']
  const sColor={'Draft':'var(--txt3)','Scheduled':'#378add','Published':'#1d9e75','Live':'#1d9e75','Complete':'var(--txt3)','Paused':'#ba7517'}
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [items,setItems]=useState([
    {id:1,title:'',channel:CHANNELS[0],date:'',status:'Draft',reach:0,budget:0,notes:''},
  ])
  const upd=(id,k,v)=>setItems(p=>p.map(r=>r.id===id?{...r,[k]:v}:r))
  const add=()=>setItems(p=>[...p,{id:Date.now(),title:'',channel:CHANNELS[0],date:'',status:'Draft',reach:0,budget:0,notes:''}])
  const totalBudget=items.reduce((s,r)=>s+(r.budget||0),0)
  const totalReach=items.reduce((s,r)=>s+(r.reach||0),0)
  const live=items.filter(r=>['Published','Live'].includes(r.status)).length
  const cellS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#ef9f27" icon="ti-speakerphone" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[{l:'Total items',v:items.length,c:'var(--txt)'},{l:'Live/Published',v:live,c:'#1d9e75'},{l:'Total budget',v:fmt(totalBudget, sym),c:'var(--gold)'},{l:'Total reach',v:totalReach.toLocaleString(),c:'#378add'}].map(s=>(
            <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 110px 100px 100px 80px 80px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
            {['Title','Channel','Date','Status','Reach','Budget','Notes',''].map((h,i)=>(
              <div key={i} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
            ))}
          </div>
          {items.map((row,i)=>(
            <div key={row.id} style={{display:'grid',gridTemplateColumns:'1fr 110px 100px 100px 80px 80px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<items.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
              <input value={row.title} onChange={e=>upd(row.id,'title',e.target.value)} placeholder="Title..." style={cellS}/>
              <select value={row.channel} onChange={e=>upd(row.id,'channel',e.target.value)} style={{...cellS,cursor:'pointer'}}>
                {CHANNELS.map(c=><option key={c}>{c}</option>)}
              </select>
              <input type="date" value={row.date} onChange={e=>upd(row.id,'date',e.target.value)} style={{...cellS,fontSize:10}}/>
              <select value={row.status} onChange={e=>upd(row.id,'status',e.target.value)} style={{...cellS,color:sColor[row.status]||'var(--txt)',fontWeight:600,cursor:'pointer'}}>
                {STATUS.map(s=><option key={s}>{s}</option>)}
              </select>
              <input type="text" inputMode="decimal" value={row.reach||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'reach',parseInt(e.target.value)||0)}} placeholder="0" style={{...cellS,textAlign:'right'}}/>
              <input type="text" inputMode="decimal" value={row.budget||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(row.id,'budget',parseFloat(e.target.value)||0)}} placeholder="0" style={{...cellS,textAlign:'right'}}/>
              <input value={row.notes} onChange={e=>upd(row.id,'notes',e.target.value)} placeholder="Notes..." style={cellS}/>
              <button onClick={()=>setItems(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
          <div style={{padding:'8px 14px'}}><button onClick={add} style={{fontSize:11,color:'#ef9f27',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add</button></div>
        </div>
      </div>
    </div>
  )
}

export function CRMTool({tool}){
  const STAGES=['Lead','Contacted','Qualified','Proposal','Negotiation','Won','Lost']
  const sColor={'Lead':'var(--txt3)','Contacted':'#378add','Qualified':'#7f77dd','Proposal':'#ba7517','Negotiation':'#ef9f27','Won':'#1d9e75','Lost':'#e24b4a'}
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [deals,setDeals]=useState([
    {id:1,company:'',contact:'',value:0,stage:'Lead',date:'',prob:50,notes:''},
  ])
  const upd=(id,k,v)=>setDeals(p=>p.map(d=>d.id===id?{...d,[k]:v}:d))
  const add=()=>setDeals(p=>[...p,{id:Date.now(),company:'',contact:'',value:0,stage:'Lead',date:'',prob:50,notes:''}])
  const pipeline=deals.filter(d=>!['Won','Lost'].includes(d.stage)).reduce((s,d)=>s+d.value*d.prob/100,0)
  const won=deals.filter(d=>d.stage==='Won').reduce((s,d)=>s+d.value,0)
  const cellS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#7f77dd" icon="ti-users" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[{l:'Total deals',v:deals.length,c:'var(--txt)'},{l:'Won',v:deals.filter(d=>d.stage==='Won').length,c:'#1d9e75'},{l:'Pipeline value',v:fmt(pipeline, sym),c:'var(--gold)'},{l:'Revenue won',v:fmt(won, sym),c:'#1d9e75'}].map(s=>(
            <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 120px 90px 110px 80px 60px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
            {['Company','Contact','Value','Stage','Close date','Prob%','Notes',''].map((h,i)=>(
              <div key={i} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
            ))}
          </div>
          {deals.map((d,i)=>(
            <div key={d.id} style={{display:'grid',gridTemplateColumns:'1fr 120px 90px 110px 80px 60px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<deals.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
              <input value={d.company} onChange={e=>upd(d.id,'company',e.target.value)} placeholder="Company..." style={cellS}/>
              <input value={d.contact} onChange={e=>upd(d.id,'contact',e.target.value)} placeholder="Contact..." style={cellS}/>
              <input type="text" inputMode="decimal" value={d.value||''} onChange={e=>{if(/^[\d]*$/.test(e.target.value))upd(d.id,'value',parseInt(e.target.value)||0)}} placeholder="0" style={{...cellS,textAlign:'right'}}/>
              <select value={d.stage} onChange={e=>upd(d.id,'stage',e.target.value)} style={{...cellS,color:sColor[d.stage],fontWeight:600,cursor:'pointer'}}>
                {STAGES.map(s=><option key={s}>{s}</option>)}
              </select>
              <input type="date" value={d.date} onChange={e=>upd(d.id,'date',e.target.value)} style={{...cellS,fontSize:10}}/>
              <input type="text" inputMode="decimal" value={d.prob||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(d.id,'prob',parseInt(e.target.value)||0)}} placeholder="50" style={{...cellS,textAlign:'right'}}/>
              <input value={d.notes} onChange={e=>upd(d.id,'notes',e.target.value)} placeholder="Notes..." style={cellS}/>
              <button onClick={()=>setDeals(p=>p.filter(x=>x.id!==d.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
          <div style={{padding:'8px 14px'}}><button onClick={add} style={{fontSize:11,color:'#7f77dd',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add deal</button></div>
        </div>
      </div>
    </div>
  )
}

export function InventoryTool({tool}){
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [items,setItems]=useState([
    {id:1,sku:'',name:'',category:'',qty:0,minQty:0,cost:0,price:0,location:'',notes:''},
  ])
  const upd=(id,k,v)=>setItems(p=>p.map(r=>r.id===id?{...r,[k]:v}:r))
  const add=()=>setItems(p=>[...p,{id:Date.now(),sku:'',name:'',category:'',qty:0,minQty:0,cost:0,price:0,location:'',notes:''}])
  const lowStock=items.filter(r=>r.qty<=r.minQty&&r.minQty>0)
  const totalValue=items.reduce((s,r)=>s+r.qty*r.cost,0)
  const cellS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  const numS={...cellS,textAlign:'right'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#ba7517" icon="ti-package" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[{l:'Total items',v:items.length,c:'var(--txt)'},{l:'Low stock',v:lowStock.length,c:lowStock.length>0?'#e24b4a':'#1d9e75'},{l:'Total qty',v:items.reduce((s,r)=>s+r.qty,0),c:'var(--txt)'},{l:'Inventory value',v:fmt(totalValue, sym),c:'var(--gold)'}].map(s=>(
            <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        {lowStock.length>0&&(
          <div style={{background:'rgba(226,75,74,.08)',border:'1px solid rgba(226,75,74,.3)',borderRadius:10,padding:10,fontSize:11,color:'#e24b4a'}}>
            ⚠️ Low stock: {lowStock.map(r=>r.name||r.sku).join(', ')}
          </div>
        )}
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'80px 1fr 100px 60px 60px 80px 80px 100px 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:6}}>
            {['SKU','Name','Category','Qty','Min','Cost £','Price £','Location',''].map((h,i)=>(
              <div key={i} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
            ))}
          </div>
          {items.map((row,i)=>(
            <div key={row.id} style={{display:'grid',gridTemplateColumns:'80px 1fr 100px 60px 60px 80px 80px 100px 28px',gap:6,padding:'7px 14px',borderBottom:i<items.length-1?'1px solid var(--bdr)':'none',alignItems:'center',background:row.qty<=row.minQty&&row.minQty>0?'rgba(226,75,74,.04)':'transparent'}}>
              <input value={row.sku} onChange={e=>upd(row.id,'sku',e.target.value)} placeholder="SKU" style={cellS}/>
              <input value={row.name} onChange={e=>upd(row.id,'name',e.target.value)} placeholder="Item name" style={cellS}/>
              <input value={row.category} onChange={e=>upd(row.id,'category',e.target.value)} placeholder="Category" style={cellS}/>
              <input type="text" inputMode="decimal" value={row.qty||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'qty',parseInt(e.target.value)||0)}} style={{...numS,color:row.qty<=row.minQty&&row.minQty>0?'#e24b4a':'var(--txt)'}}/>
              <input type="text" inputMode="decimal" value={row.minQty||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'minQty',parseInt(e.target.value)||0)}} style={numS}/>
              <input type="text" inputMode="decimal" value={row.cost||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(row.id,'cost',parseFloat(e.target.value)||0)}} style={numS}/>
              <input type="text" inputMode="decimal" value={row.price||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(row.id,'price',parseFloat(e.target.value)||0)}} style={numS}/>
              <input value={row.location} onChange={e=>upd(row.id,'location',e.target.value)} placeholder="Location" style={cellS}/>
              <button onClick={()=>setItems(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
          <div style={{padding:'8px 14px'}}><button onClick={add} style={{fontSize:11,color:'#ba7517',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add item</button></div>
        </div>
      </div>
    </div>
  )
}

export function HealthTool({tool}){
  const n=(tool?.name||'').toLowerCase()
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol

  // Detect tool type from name
  const isBP      = n.includes('blood pressure')
  const isMed     = n.includes('medication') || n.includes('prescription')
  const isWeight  = n.includes('weight') || n.includes('bmi')
  const isGlucose = n.includes('glucose') || n.includes('blood sugar') || n.includes('diabetes')
  const isSymptom = n.includes('symptom')
  const isCaregiver = n.includes('caregiver') || n.includes('care schedule')
  const isSleep   = n.includes('sleep')
  const isMood    = n.includes('mood') || n.includes('mental health')
  const isDental  = n.includes('dental') || n.includes('tooth')
  const isFitness = n.includes('fitness') || n.includes('exercise') || n.includes('workout')

  // Blood Pressure Tracker
  if (isBP) {
    const [readings, setReadings] = useState([
      { id:1, date:new Date().toISOString().split('T')[0], time:'08:00', systolic:120, diastolic:80, pulse:72, arm:'Left', notes:'' },
    ])
    const avg = (key) => readings.length ? Math.round(readings.reduce((s,r)=>s+(r[key]||0),0)/readings.length) : 0
    const category = (s,d) => {
      if(s<120&&d<80) return {label:'Normal',color:'#1d9e75'}
      if(s<130&&d<80) return {label:'Elevated',color:'#ba7517'}
      if(s<140||d<90) return {label:'High Stage 1',color:'#ef9f27'}
      if(s>=140||d>=90) return {label:'High Stage 2',color:'#e24b4a'}
      return {label:'Check',color:'var(--txt3)'}
    }
    const avgCat = category(avg('systolic'), avg('diastolic'))
    const add = () => setReadings(p=>[...p,{id:Date.now(),date:new Date().toISOString().split('T')[0],time:'08:00',systolic:0,diastolic:0,pulse:0,arm:'Left',notes:''}])
    const upd = (id,k,v) => { setReadings(p=>p.map(r=>r.id===id?{...r,[k]:v}:r)); save({readings}) }
    const cS = {background:'transparent',border:'none',outline:'none',fontSize:12,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
    return (
      <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
        <ToolHeader tool={tool} color='#d4537e' icon='ti-heart-rate-monitor' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
        <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0}}>
          <div style={{flex:1,minHeight:0,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
            <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',background:'rgba(212,83,126,.08)',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:30,height:30,borderRadius:8,background:'rgba(212,83,126,.18)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className="ti ti-heart-rate-monitor" style={{fontSize:14,color:'#d4537e'}} aria-hidden="true"/>
                </div>
                <span style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--txt)',flex:1}}>Blood Pressure Log</span>
                <span style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:700,color:'#d4537e'}}>{readings.length} readings</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'110px 70px 90px 90px 70px 80px 1fr 28px',padding:'7px 16px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
                {['Date','Time','Systolic','Diastolic','Pulse','Arm','Notes',''].map(h=>(
                  <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
                ))}
              </div>
              {readings.map((r,i)=>{
                const cat = category(r.systolic,r.diastolic)
                return(
                  <div key={r.id} style={{display:'grid',gridTemplateColumns:'110px 70px 90px 90px 70px 80px 1fr 28px',gap:8,padding:'8px 16px',borderTop:'1px solid var(--bdr)',alignItems:'center',background:i%2===0?'transparent':'rgba(255,255,255,.01)'}}>
                    <input type="date" value={r.date} onChange={e=>upd(r.id,'date',e.target.value)} style={{...cS,fontSize:10}}/>
                    <input type="time" value={r.time} onChange={e=>upd(r.id,'time',e.target.value)} style={{...cS,fontSize:10}}/>
                    <div style={{position:'relative'}}>
                      <input type="text" inputMode="numeric" value={r.systolic||''} placeholder="120"
                        onChange={e=>{if(/^\d*$/.test(e.target.value))upd(r.id,'systolic',parseInt(e.target.value)||0)}}
                        style={{width:'100%',background:'var(--bg3)',border:`1px solid ${cat.color}66`,borderRadius:6,padding:'6px 8px',fontSize:13,fontWeight:600,color:cat.color,fontFamily:'inherit',outline:'none',textAlign:'center'}}/>
                    </div>
                    <div style={{position:'relative'}}>
                      <input type="text" inputMode="numeric" value={r.diastolic||''} placeholder="80"
                        onChange={e=>{if(/^\d*$/.test(e.target.value))upd(r.id,'diastolic',parseInt(e.target.value)||0)}}
                        style={{width:'100%',background:'var(--bg3)',border:`1px solid ${cat.color}66`,borderRadius:6,padding:'6px 8px',fontSize:13,fontWeight:600,color:cat.color,fontFamily:'inherit',outline:'none',textAlign:'center'}}/>
                    </div>
                    <input type="text" inputMode="numeric" value={r.pulse||''} placeholder="72"
                      onChange={e=>{if(/^\d*$/.test(e.target.value))upd(r.id,'pulse',parseInt(e.target.value)||0)}}
                      style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'center'}}/>
                    <select value={r.arm} onChange={e=>upd(r.id,'arm',e.target.value)} style={{...cS,cursor:'pointer',fontSize:10}}>
                      {['Left','Right'].map(a=><option key={a}>{a}</option>)}
                    </select>
                    <input value={r.notes||''} onChange={e=>upd(r.id,'notes',e.target.value)} placeholder="Notes..." style={cS}/>
                    <button onClick={()=>setReadings(p=>p.filter(x=>x.id!==r.id))} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 6px',color:'var(--txt3)',fontSize:16,lineHeight:1}}
                      onMouseEnter={e=>e.currentTarget.style.color='#e24b4a'} onMouseLeave={e=>e.currentTarget.style.color='var(--txt3)'}>×</button>
                  </div>
                )
              })}
              <div style={{padding:'8px 16px',borderTop:'1px solid var(--bdr)'}}>
                <button onClick={add} style={{fontSize:12,color:'#d4537e',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
                  <i className="ti ti-plus" style={{fontSize:12}} aria-hidden="true"/> Add reading
                </button>
              </div>
            </div>
          </div>
          <div style={{width:220,flexShrink:0,borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
            <div style={{background:`${avgCat.color}14`,border:`2px solid ${avgCat.color}55`,borderRadius:12,padding:14,textAlign:'center'}}>
              <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',marginBottom:4}}>Average</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:28,fontWeight:700,color:avgCat.color}}>{avg('systolic')}/{avg('diastolic')}</div>
              <div style={{fontSize:11,color:avgCat.color,fontWeight:600,marginTop:3}}>{avgCat.label}</div>
              <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>Pulse: {avg('pulse')} bpm</div>
            </div>
            {[{label:'Normal',range:'<120/80',color:'#1d9e75'},{label:'Elevated',range:'120-129/<80',color:'#ba7517'},{label:'High Stage 1',range:'130-139/80-89',color:'#ef9f27'},{label:'High Stage 2',range:'≥140/≥90',color:'#e24b4a'}].map(c=>(
              <div key={c.label} style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',background:'var(--bg3)',borderRadius:8,border:`1px solid ${c.color}33`}}>
                <span style={{fontSize:10,color:c.color,fontWeight:600}}>{c.label}</span>
                <span style={{fontSize:10,color:'var(--txt3)'}}>{c.range}</span>
              </div>
            ))}
            <div style={{fontSize:10,color:'var(--txt3)',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,lineHeight:1.6}}>
              💡 Measure at same time each day, rest 5 min before reading, use correct arm position.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Medication Tracker
  if (isMed) {
    const [meds, setMeds] = useState([
      {id:1,name:'Medication 1',dose:'10mg',frequency:'Once daily',time:'08:00',taken:false,notes:''},
    ])
    const [log, setLog] = useState([])
    const taken = meds.filter(m=>m.taken).length
    const upd = (id,k,v) => setMeds(p=>p.map(m=>m.id===id?{...m,[k]:v}:m))
    const mark = (id) => { setMeds(p=>p.map(m=>m.id===id?{...m,taken:!m.taken}:m)); save({meds}) }
    return (
      <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
        <ToolHeader tool={tool} color='#378add' icon='ti-pill' isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
        <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[{l:'Total medications',v:meds.length,c:'var(--txt)'},{l:'Taken today',v:taken,c:'#1d9e75'},{l:'Remaining',v:meds.length-taken,c:'var(--gold)'}].map(s=>(
              <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'11px 13px',textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          {meds.map(m=>(
            <div key={m.id} style={{background:'var(--bg2)',border:`1px solid ${m.taken?'rgba(29,158,117,.3)':'var(--bdr)'}`,borderRadius:12,padding:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div onClick={()=>mark(m.id)} style={{width:22,height:22,borderRadius:6,border:`2px solid ${m.taken?'#1d9e75':'var(--bdr2)'}`,background:m.taken?'#1d9e75':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                  {m.taken&&<i className="ti ti-check" style={{fontSize:11,color:'#fff'}} aria-hidden="true"/>}
                </div>
                <input value={m.name} onChange={e=>upd(m.id,'name',e.target.value)}
                  style={{flex:1,fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:m.taken?'var(--txt3)':'var(--txt)',background:'transparent',border:'none',outline:'none',textDecoration:m.taken?'line-through':'none'}}/>
                <button onClick={()=>setMeds(p=>p.filter(x=>x.id!==m.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
                  <i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/>
                </button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 80px',gap:8}}>
                {[{l:'Dose',k:'dose',ph:'10mg'},{l:'Frequency',k:'frequency',ph:'Once daily'},{l:'Notes',k:'notes',ph:'With food...'},{l:'Time',k:'time',type:'time'}].map(f=>(
                  <div key={f.k}>
                    <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',marginBottom:3}}>{f.l}</div>
                    <input type={f.type||'text'} value={m[f.k]||''} placeholder={f.ph||''}
                      onChange={e=>upd(m.id,f.k,e.target.value)}
                      style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={()=>setMeds(p=>[...p,{id:Date.now(),name:'New medication',dose:'',frequency:'Once daily',time:'08:00',taken:false,notes:''}])}
            style={{padding:'10px',borderRadius:9,border:'1px dashed var(--bdr)',background:'transparent',fontSize:12,color:'var(--txt3)',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#378add';e.currentTarget.style.color='#378add'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bdr)';e.currentTarget.style.color='var(--txt3)'}}>
            <i className="ti ti-plus" style={{fontSize:14}} aria-hidden="true"/> Add medication
          </button>
        </div>
      </div>
    )
  }

  // Generic health tracker for all other health tools (symptom, weight, glucose, etc.)
  const getConfig = () => {
    if(isWeight) return {icon:'ti-scale',color:'#378add',cols:['Date','Weight (kg)','BMI','Notes'],fields:['date','weight','bmi','notes']}
    if(isGlucose) return {icon:'ti-droplet',color:'#ba7517',cols:['Date','Time','Reading (mmol/L)','Meal status','Notes'],fields:['date','time','reading','meal','notes']}
    if(isSymptom) return {icon:'ti-stethoscope',color:'#d4537e',cols:['Date','Symptom','Severity','Duration','Notes'],fields:['date','symptom','severity','duration','notes']}
    if(isCaregiver) return {icon:'ti-wheelchair',color:'#7f77dd',cols:['Date','Time','Task','Patient','Done','Notes'],fields:['date','time','task','patient','done','notes']}
    if(isSleep) return {icon:'ti-moon',color:'#7f77dd',cols:['Date','Bedtime','Wake time','Hours','Quality','Notes'],fields:['date','bedtime','wakeTime','hours','quality','notes']}
    if(isDental) return {icon:'ti-tooth',color:'#1d9e75',cols:['Date','Treatment','Dentist','Cost','Next appt','Notes'],fields:['date','treatment','dentist','cost','nextAppt','notes']}
    return {icon:'ti-heartbeat',color:'#d4537e',cols:['Date','Item','Value','Unit','Status','Notes'],fields:['date','item','value','unit','status','notes']}
  }
  const cfg2 = getConfig()
  const [entries, setEntries] = useState([{id:1,date:new Date().toISOString().split('T')[0],item:'',value:'',unit:'',status:'',notes:'',weight:'',bmi:'',reading:'',meal:'',symptom:'',severity:'',duration:'',task:'',patient:'',done:false,bedtime:'22:00',wakeTime:'07:00',hours:'',quality:'',treatment:'',dentist:'',cost:'',nextAppt:'',time:'08:00'}])
  const upd = (id,k,v) => { setEntries(p=>p.map(r=>r.id===id?{...r,[k]:v}:r)); save({entries}) }
  const add = () => setEntries(p=>[...p,{id:Date.now(),date:new Date().toISOString().split('T')[0],item:'',value:'',unit:'',status:'',notes:''}])
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color={cfg2.color} icon={cfg2.icon} isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:`110px repeat(${cfg2.cols.length-2},1fr) 1fr 28px`,padding:'7px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
            {[...cfg2.cols,''].map(h=><div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>)}
          </div>
          {entries.map((e,i)=>(
            <div key={e.id} style={{display:'grid',gridTemplateColumns:`110px repeat(${cfg2.cols.length-2},1fr) 1fr 28px`,gap:8,padding:'8px 14px',borderTop:'1px solid var(--bdr)',alignItems:'center'}}>
              <input type="date" value={e.date} onChange={ev=>upd(e.id,'date',ev.target.value)} style={{...cS,fontSize:10}}/>
              {cfg2.fields.slice(1).map(f=>(
                <input key={f} value={e[f]||''} onChange={ev=>upd(e.id,f,ev.target.value)} placeholder={f.charAt(0).toUpperCase()+f.slice(1)+'...'} style={cS}/>
              ))}
              <button onClick={()=>setEntries(p=>p.filter(r=>r.id!==e.id))} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 6px',color:'var(--txt3)',fontSize:16,lineHeight:1}}
                onMouseEnter={ev=>ev.currentTarget.style.color='#e24b4a'} onMouseLeave={ev=>ev.currentTarget.style.color='var(--txt3)'}>×</button>
            </div>
          ))}
          <div style={{padding:'8px 14px',borderTop:'1px solid var(--bdr)'}}>
            <button onClick={add} style={{fontSize:12,color:cfg2.color,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
              <i className="ti ti-plus" style={{fontSize:12}} aria-hidden="true"/> Add entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


export function StudyTool({tool}){
  const n=(tool?.name||'').toLowerCase()
  const isGPA=n.includes('gpa')||n.includes('grade')
  const GRADES=['A+','A','A-','B+','B','B-','C+','C','C-','D','F']
  const gp={'A+':4.0,'A':4.0,'A-':3.7,'B+':3.3,'B':3.0,'B-':2.7,'C+':2.3,'C':2.0,'C-':1.7,'D':1.0,'F':0.0}
  const gColor=g=>gp[g]>=3.7?'#1d9e75':gp[g]>=3.0?'#ba7517':'#e24b4a'
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [courses,setCourses]=useState([
    {id:1,name:'',grade:'B',credits:3,assignments:0,completed:0,due:'',notes:''},
  ])
  const upd=(id,k,v)=>setCourses(p=>p.map(c=>c.id===id?{...c,[k]:v}:c))
  const add=()=>setCourses(p=>[...p,{id:Date.now(),name:'',grade:'B',credits:3,assignments:0,completed:0,due:'',notes:''}])
  const totalCredits=courses.reduce((s,c)=>s+c.credits,0)
  const gpa=totalCredits>0?courses.reduce((s,c)=>s+(gp[c.grade]||0)*c.credits,0)/totalCredits:0
  const gpaColor=gpa>=3.7?'#1d9e75':gpa>=3.0?'#ba7517':gpa>=2.0?'#378add':'#e24b4a'
  const cellS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#378add" icon="ti-school" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 180px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 70px 60px 70px 80px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Course/Subject','Grade','Credits','Done','Due','Notes',''].map((h,i)=>(
                <div key={i} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {courses.map((c,i)=>(
              <div key={c.id} style={{display:'grid',gridTemplateColumns:'1fr 70px 60px 70px 80px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<courses.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                <input value={c.name} onChange={e=>upd(c.id,'name',e.target.value)} placeholder="Course name..." style={cellS}/>
                <select value={c.grade} onChange={e=>upd(c.id,'grade',e.target.value)} style={{...cellS,color:gColor(c.grade),fontWeight:700,cursor:'pointer'}}>
                  {GRADES.map(g=><option key={g}>{g}</option>)}
                </select>
                <input type="text" inputMode="decimal" value={c.credits||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(c.id,'credits',parseInt(e.target.value)||0)}} style={{...cellS,textAlign:'right'}}/>
                <input type="text" inputMode="decimal" value={c.completed||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(c.id,'completed',parseInt(e.target.value)||0)}} style={{...cellS,textAlign:'right'}}/>
                <input type="date" value={c.due||''} onChange={e=>upd(c.id,'due',e.target.value)} style={{...cellS,fontSize:10}}/>
                <input value={c.notes} onChange={e=>upd(c.id,'notes',e.target.value)} placeholder="Notes..." style={cellS}/>
                <button onClick={()=>setCourses(p=>p.filter(x=>x.id!==c.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
            <div style={{padding:'8px 14px'}}><button onClick={add} style={{fontSize:11,color:'#378add',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add course</button></div>
          </div>
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:`${gpaColor}14`,border:`2px solid ${gpaColor}55`,borderRadius:12,padding:16,textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',marginBottom:4}}>GPA</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:40,fontWeight:700,color:gpaColor}}>{gpa.toFixed(2)}</div>
            <div style={{fontSize:11,color:'var(--txt2)',marginTop:4}}>{totalCredits} credits</div>
          </div>
          {[{l:'Courses',v:courses.length,c:'var(--txt)'},{l:'Highest grade',v:courses.sort((a,b)=>(gp[b.grade]||0)-(gp[a.grade]||0))[0]?.grade||'—',c:'#1d9e75'}].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EventTool({tool}){
  const n=(tool?.name||'').toLowerCase()
  const isWedding=n.includes('wedding')
  const isTravel=n.includes('travel')||n.includes('trip')||n.includes('vacation')
  const isBudget=n.includes('budget')||n.includes('cost')
  const CATS=isWedding?['Venue','Catering','Photography','Flowers','Music','Attire','Invitations','Transport','Honeymoon','Other']:
    isTravel?['Flights','Hotel','Transport','Food','Activities','Shopping','Insurance','Other']:
    ['Venue','Catering','Entertainment','Decor','Marketing','Staff','Equipment','Other']
  const [items,setItems]=useState([{id:1,item:'',category:CATS[0],budget:0,actual:0,paid:false,notes:''}])
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const upd=(id,k,v)=>setItems(p=>p.map(r=>r.id===id?{...r,[k]:v}:r))
  const add=()=>setItems(p=>[...p,{id:Date.now(),item:'',category:CATS[0],budget:0,actual:0,paid:false,notes:''}])
  const totalBudget=items.reduce((s,r)=>s+r.budget,0)
  const totalActual=items.reduce((s,r)=>s+r.actual,0)
  const remaining=totalBudget-totalActual
  const cellS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#ef9f27" icon={isWedding?'ti-heart':isTravel?'ti-plane':'ti-calendar-event'} isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 110px 90px 90px 50px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Item','Category','Budget £','Actual £','Paid','Notes',''].map((h,i)=>(
                <div key={i} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {items.map((row,i)=>(
              <div key={row.id} style={{display:'grid',gridTemplateColumns:'1fr 110px 90px 90px 50px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<items.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                <input value={row.item} onChange={e=>upd(row.id,'item',e.target.value)} placeholder="Item..." style={cellS}/>
                <select value={row.category} onChange={e=>upd(row.id,'category',e.target.value)} style={{...cellS,cursor:'pointer'}}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
                <input type="text" inputMode="decimal" value={row.budget||''} onChange={e=>{if(/^[\d]*$/.test(e.target.value))upd(row.id,'budget',parseInt(e.target.value)||0)}} style={{...cellS,textAlign:'right'}}/>
                <input type="text" inputMode="decimal" value={row.actual||''} onChange={e=>{if(/^[\d]*$/.test(e.target.value))upd(row.id,'actual',parseInt(e.target.value)||0)}} style={{...cellS,textAlign:'right',color:row.actual>row.budget&&row.budget>0?'#e24b4a':'var(--txt)'}}/>
                <div style={{display:'flex',justifyContent:'center'}}>
                  <input type="checkbox" checked={row.paid} onChange={e=>upd(row.id,'paid',e.target.checked)} style={{cursor:'pointer',accentColor:'#1d9e75'}}/>
                </div>
                <input value={row.notes} onChange={e=>upd(row.id,'notes',e.target.value)} placeholder="Notes..." style={cellS}/>
                <button onClick={()=>setItems(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
            <div style={{padding:'8px 14px'}}><button onClick={add} style={{fontSize:11,color:'#ef9f27',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add item</button></div>
          </div>
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:remaining>=0?'rgba(29,158,117,.08)':'rgba(226,75,74,.08)',border:`2px solid ${remaining>=0?'rgba(29,158,117,.4)':'rgba(226,75,74,.4)'}`,borderRadius:12,padding:14,textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',marginBottom:4}}>{remaining>=0?'Under budget':'Over budget'}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:24,fontWeight:700,color:remaining>=0?'#1d9e75':'#e24b4a'}}>{fmt(Math.abs(remaining, sym))}</div>
          </div>
          {[{l:'Total budget',v:fmt(totalBudget, sym),c:'var(--gold)'},{l:'Total spent',v:fmt(totalActual, sym),c:'#d4537e'},{l:'Paid items',v:items.filter(r=>r.paid).length,c:'#1d9e75'}].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CreatorTool({tool}){
  const n=(tool?.name||'').toLowerCase()
  const isIncome=n.includes('income')||n.includes('revenue')||n.includes('sponsorship')
  const isContent=n.includes('content')||n.includes('calendar')||n.includes('planner')
  const PLATFORMS=['YouTube','Instagram','TikTok','Twitter/X','LinkedIn','Podcast','Blog','Newsletter','Other']
  const STATUS=['Idea','Drafting','Filming','Editing','Scheduled','Published']
  const sColor={Idea:'var(--txt3)',Drafting:'#378add',Filming:'#7f77dd',Editing:'#ba7517',Scheduled:'#ef9f27',Published:'#1d9e75'}
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [items,setItems]=useState(isIncome?
    [{id:1,source:'Brand deal',platform:'YouTube',amount:0,date:'',status:'Pending',notes:''}]:
    [{id:1,title:'',platform:PLATFORMS[0],date:'',status:'Idea',views:0,engagement:0,notes:''}]
  )
  const upd=(id,k,v)=>setItems(p=>p.map(r=>r.id===id?{...r,[k]:v}:r))
  const add=()=>setItems(p=>[...p,isIncome?{id:Date.now(),source:'',platform:PLATFORMS[0],amount:0,date:'',status:'Pending',notes:''}:{id:Date.now(),title:'',platform:PLATFORMS[0],date:'',status:'Idea',views:0,engagement:0,notes:''}])
  const totalIncome=items.reduce((s,r)=>s+(r.amount||0),0)
  const published=items.filter(r=>r.status==='Published').length
  const cellS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#d4537e" icon={isIncome?'ti-coins':'ti-brand-youtube'}
        extra={<div style={{fontSize:12,color:'var(--txt2)'}}>{isIncome?`Total: ${fmt(totalIncome, sym)}`:`${published} published`}</div>}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          {isIncome?(
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 110px 90px 100px 100px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
                {['Source','Platform','Amount £','Date','Status','Notes',''].map((h,i)=>(
                  <div key={i} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
                ))}
              </div>
              {items.map((row,i)=>(
                <div key={row.id} style={{display:'grid',gridTemplateColumns:'1fr 110px 90px 100px 100px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<items.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                  <input value={row.source||''} onChange={e=>upd(row.id,'source',e.target.value)} placeholder="Source..." style={cellS}/>
                  <select value={row.platform||''} onChange={e=>upd(row.id,'platform',e.target.value)} style={{...cellS,cursor:'pointer'}}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select>
                  <input type="text" inputMode="decimal" value={row.amount||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(row.id,'amount',parseFloat(e.target.value)||0)}} style={{...cellS,textAlign:'right'}}/>
                  <input type="date" value={row.date||''} onChange={e=>upd(row.id,'date',e.target.value)} style={{...cellS,fontSize:10}}/>
                  <select value={row.status||'Pending'} onChange={e=>upd(row.id,'status',e.target.value)} style={{...cellS,color:row.status==='Paid'?'#1d9e75':'#ba7517',fontWeight:600,cursor:'pointer'}}>
                    {['Pending','Invoiced','Paid','Cancelled'].map(s=><option key={s}>{s}</option>)}
                  </select>
                  <input value={row.notes||''} onChange={e=>upd(row.id,'notes',e.target.value)} placeholder="Notes..." style={cellS}/>
                  <button onClick={()=>setItems(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
                </div>
              ))}
            </>
          ):(
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 110px 100px 110px 80px 80px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
                {['Title','Platform','Date','Status','Views','Engag%','Notes',''].map((h,i)=>(
                  <div key={i} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
                ))}
              </div>
              {items.map((row,i)=>(
                <div key={row.id} style={{display:'grid',gridTemplateColumns:'1fr 110px 100px 110px 80px 80px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<items.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                  <input value={row.title||''} onChange={e=>upd(row.id,'title',e.target.value)} placeholder="Content title..." style={cellS}/>
                  <select value={row.platform||PLATFORMS[0]} onChange={e=>upd(row.id,'platform',e.target.value)} style={{...cellS,cursor:'pointer'}}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select>
                  <input type="date" value={row.date||''} onChange={e=>upd(row.id,'date',e.target.value)} style={{...cellS,fontSize:10}}/>
                  <select value={row.status||'Idea'} onChange={e=>upd(row.id,'status',e.target.value)} style={{...cellS,color:sColor[row.status||'Idea'],fontWeight:600,cursor:'pointer'}}>{STATUS.map(s=><option key={s}>{s}</option>)}</select>
                  <input type="text" inputMode="decimal" value={row.views||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'views',parseInt(e.target.value)||0)}} style={{...cellS,textAlign:'right'}}/>
                  <input type="text" inputMode="decimal" value={row.engagement||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(row.id,'engagement',parseFloat(e.target.value)||0)}} style={{...cellS,textAlign:'right'}}/>
                  <input value={row.notes||''} onChange={e=>upd(row.id,'notes',e.target.value)} placeholder="Notes..." style={cellS}/>
                  <button onClick={()=>setItems(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
                </div>
              ))}
            </>
          )}
          <div style={{padding:'8px 14px'}}><button onClick={add} style={{fontSize:11,color:'#d4537e',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add</button></div>
        </div>
      </div>
    </div>
  )
}

export function ProjectDashboardTool({tool}){
  const STATUS=['Planning','In Progress','On Hold','Complete','Cancelled']
  const sColor={'Planning':'#378add','In Progress':'#ba7517','On Hold':'var(--txt3)','Complete':'#1d9e75','Cancelled':'#e24b4a'}
  const { save, isSaving, lastSaved, clearSave } = useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [projects,setProjects]=useState([
    {id:1,name:'',owner:'',status:'Planning',priority:'Medium',budget:0,spent:0,start:'',end:'',pct:0,notes:''},
  ])
  const upd=(id,k,v)=>setProjects(p=>p.map(r=>r.id===id?{...r,[k]:v}:r))
  const add=()=>setProjects(p=>[...p,{id:Date.now(),name:'',owner:'',status:'Planning',priority:'Medium',budget:0,spent:0,start:'',end:'',pct:0,notes:''}])
  const totalBudget=projects.reduce((s,r)=>s+r.budget,0)
  const totalSpent=projects.reduce((s,r)=>s+r.spent,0)
  const cellS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  const pColor={'Low':'var(--txt3)','Medium':'#378add','High':'#ba7517','Critical':'#e24b4a'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#7f77dd" icon="ti-layout-kanban" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          {STATUS.map(s=>(
            <div key={s} style={{background:'var(--bg2)',border:`1px solid ${sColor[s]}33`,borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,color:sColor[s]}}>{projects.filter(r=>r.status===s).length}</div>
              <div style={{fontSize:9,color:'var(--txt3)',marginTop:2,textTransform:'uppercase'}}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 14px',display:'flex',justifyContent:'space-between'}}>
          <span style={{fontSize:12,color:'var(--txt2)'}}>Budget utilisation</span>
          <span style={{fontSize:12,fontWeight:600,color:totalSpent>totalBudget?'#e24b4a':'#1d9e75'}}>{fmt(totalSpent, sym)} / {fmt(totalBudget, sym)}</span>
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 100px 110px 80px 90px 80px 70px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:6}}>
            {['Project','Owner','Status','Priority','Budget £','Spent £','Done%','Notes',''].map((h,i)=>(
              <div key={i} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
            ))}
          </div>
          {projects.map((row,i)=>(
            <div key={row.id} style={{display:'grid',gridTemplateColumns:'1fr 100px 110px 80px 90px 80px 70px 1fr 28px',gap:6,padding:'8px 14px',borderBottom:i<projects.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
              <input value={row.name} onChange={e=>upd(row.id,'name',e.target.value)} placeholder="Project name..." style={cellS}/>
              <input value={row.owner} onChange={e=>upd(row.id,'owner',e.target.value)} placeholder="Owner..." style={cellS}/>
              <select value={row.status} onChange={e=>upd(row.id,'status',e.target.value)} style={{...cellS,color:sColor[row.status],fontWeight:600,cursor:'pointer'}}>{STATUS.map(s=><option key={s}>{s}</option>)}</select>
              <select value={row.priority} onChange={e=>upd(row.id,'priority',e.target.value)} style={{...cellS,color:pColor[row.priority],fontWeight:600,cursor:'pointer'}}>{['Low','Medium','High','Critical'].map(p=><option key={p}>{p}</option>)}</select>
              <input type="text" inputMode="decimal" value={row.budget||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'budget',parseInt(e.target.value)||0)}} style={{...cellS,textAlign:'right'}}/>
              <input type="text" inputMode="decimal" value={row.spent||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'spent',parseInt(e.target.value)||0)}} style={{...cellS,textAlign:'right',color:row.spent>row.budget&&row.budget>0?'#e24b4a':'var(--txt)'}}/>
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <span style={{fontSize:10,fontWeight:600,color:row.pct===100?'#1d9e75':'var(--gold)',textAlign:'right'}}>{row.pct}%</span>
                <input type="range" min="0" max="100" value={row.pct} onChange={e=>upd(row.id,'pct',parseInt(e.target.value))} style={{width:'100%',accentColor:'var(--gold)'}}/>
              </div>
              <input value={row.notes} onChange={e=>upd(row.id,'notes',e.target.value)} placeholder="Notes..." style={cellS}/>
              <button onClick={()=>setProjects(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
          <div style={{padding:'8px 14px'}}><button onClick={add} style={{fontSize:11,color:'#7f77dd',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add project</button></div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BUSINESS & ENTREPRENEURSHIP — SPECIFIC COMPONENTS
// ═══════════════════════════════════════════════════════════════

export function BizFinanceTool({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const n=(tool?.name||'').toLowerCase()
  const isPL=n.includes('profit')||n.includes('loss')||n.includes('p&l')||n.includes('bookkeeping')
  const isBS=n.includes('balance sheet')
  const isCF=n.includes('cash flow')
  const isVAT=n.includes('vat')||n.includes('tax')
  const isBurn=n.includes('burn rate')

  const [revenue,setRevenue]=useState([
    {id:1,name:'Product sales',amount:12000},{id:2,name:'Service revenue',amount:4500},{id:3,name:'Other',amount:800}
  ])
  const [cogs,setCogs]=useState([
    {id:1,name:'Cost of goods',amount:4800},{id:2,name:'Direct labour',amount:1800}
  ])
  const [opex,setOpex]=useState([
    {id:1,name:'Salaries',amount:5000},{id:2,name:'Rent',amount:1200},{id:3,name:'Marketing',amount:600},{id:4,name:'Software',amount:300},{id:5,name:'Insurance',amount:200}
  ])

  const totalRev=revenue.reduce((s,r)=>s+r.amount,0)
  const totalCOGS=cogs.reduce((s,r)=>s+r.amount,0)
  const grossProfit=totalRev-totalCOGS
  const grossMargin=totalRev>0?(grossProfit/totalRev*100):0
  const totalOpex=opex.reduce((s,r)=>s+r.amount,0)
  const netProfit=grossProfit-totalOpex
  const netMargin=totalRev>0?(netProfit/totalRev*100):0

  const add=(setter)=>setter(p=>[...p,{id:Date.now(),name:'',amount:0}])
  const upd=(setter,id,k,v)=>setter(p=>p.map(r=>r.id===id?{...r,[k]:v}:r))
  const rem=(setter,id)=>setter(p=>p.filter(r=>r.id!==id))

  const Section=({title,color,items,setter,total})=>(
    <div data-section={title} data-total={total} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden',marginBottom:10}}>
      <div style={{padding:'10px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',display:'flex',justifyContent:'space-between'}}>
        <span style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:700,color}}>{title}</span>
        <span style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color}}>{fmt(total, sym, sym)}</span>
      </div>
      {items.map((item,i)=>(
        <div key={item.id} data-row="" data-name={item.name} data-amount={item.amount} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderBottom:i<items.length-1?'1px solid var(--bdr)':'none'}}>
          <input value={item.name} onChange={e=>upd(setter,item.id,'name',e.target.value)} placeholder="Line item..." style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:12,color:'var(--txt)',fontFamily:'inherit'}}/>
          <div style={{position:'relative',width:130,flexShrink:0}}>
            <span style={{position:'absolute',left:7,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--txt3)'}}>{sym}</span>
            <input type="text" inputMode="decimal" value={item.amount||''} placeholder="0"
              onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value)){upd(setter,item.id,'amount',parseFloat(e.target.value)||0);save({revenue,cogs,opex})}}}
              style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'5px 7px 5px 20px',fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
          </div>
          <button onClick={()=>rem(setter,item.id)} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
        </div>
      ))}
      <div style={{padding:'6px 14px'}}>
        <button onClick={()=>add(setter)} style={{fontSize:11,color,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add line
        </button>
      </div>
    </div>
  )

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#639922" icon="ti-report-money" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 260px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14}}>
          <Section title="Revenue" color="#1d9e75" items={revenue} setter={setRevenue} total={totalRev}/>
          <Section title="Cost of Goods Sold" color="#d4537e" items={cogs} setter={setCogs} total={totalCOGS}/>
          <Section title="Operating Expenses" color="#378add" items={opex} setter={setOpex} total={totalOpex}/>
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)',marginBottom:4}}>P&L Summary</div>
          {[
            {l:'Total Revenue',v:fmt(totalRev, sym, sym),c:'#1d9e75',bold:true},
            {l:'COGS',v:`(${fmt(totalCOGS, sym, sym)})`,c:'#d4537e',bold:false},
            {l:'Gross Profit',v:fmt(grossProfit, sym, sym),c:grossProfit>=0?'#1d9e75':'#e24b4a',bold:true},
            {l:'Gross Margin',v:`${grossMargin.toFixed(1)}%`,c:'var(--txt2)'},
            {l:'Operating Expenses',v:`(${fmt(totalOpex, sym, sym)})`,c:'#378add'},
            {l:'Net Profit',v:fmt(netProfit, sym, sym),c:netProfit>=0?'#1d9e75':'#e24b4a',bold:true},
            {l:'Net Margin',v:`${netMargin.toFixed(1)}%`,c:'var(--txt2)'},
          ].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:r.bold?'var(--bg3)':'transparent',borderRadius:r.bold?8:0,border:r.bold?'1px solid var(--bdr)':'none',borderBottom:!r.bold?'1px solid var(--bdr)':'none'}}>
              <span style={{fontSize:11,color:r.bold?'var(--txt)':'var(--txt2)',fontWeight:r.bold?600:400}}>{r.l}</span>
              <span style={{fontSize:r.bold?13:11,fontWeight:r.bold?700:400,color:r.c}}>{r.v}</span>
            </div>
          ))}
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:10,marginTop:4}}>
            <div style={{fontSize:10,color:'var(--txt3)',marginBottom:6}}>Margin analysis</div>
            {[{l:'Gross margin',v:grossMargin,c:'#1d9e75'},{l:'Net margin',v:netMargin,c:netProfit>=0?'#378add':'#e24b4a'}].map(m=>(
              <div key={m.l} style={{marginBottom:6}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                  <span style={{fontSize:10,color:'var(--txt2)'}}>{m.l}</span>
                  <span style={{fontSize:10,fontWeight:600,color:m.c}}>{m.v.toFixed(1)}%</span>
                </div>
                <div style={{height:3,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.min(100,Math.max(0,m.v))}%`,background:m.c,borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function InvoiceTool({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isRecurring=n.includes('recurring')
  const isRefund=n.includes('refund')
  const STATUS=isRefund?['Requested','Approved','Processed','Rejected']:['Draft','Sent','Viewed','Paid','Overdue','Cancelled']
  const sColor={Draft:'var(--txt3)',Sent:'#378add',Viewed:'#7f77dd',Paid:'#1d9e75',Overdue:'#e24b4a',Cancelled:'var(--txt3)',Requested:'#378add',Approved:'#ba7517',Processed:'#1d9e75',Rejected:'#e24b4a'}
  const [invoices,setInvoices]=useState([
    {id:1,number:'INV-001',client:'',amount:0,dueDate:'',status:'Draft',notes:''},
  ])
  const upd=(id,k,v)=>{setInvoices(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));save({invoices})}
  const add=()=>setInvoices(p=>[...p,{id:Date.now(),number:`INV-${String(p.length+1).padStart(3,'0')}`,client:'',amount:0,dueDate:'',status:'Draft',notes:''}])
  const totalPaid=invoices.filter(r=>r.status==='Paid').reduce((s,r)=>s+r.amount,0)
  const totalOutstanding=invoices.filter(r=>['Sent','Viewed','Overdue'].includes(r.status)).reduce((s,r)=>s+r.amount,0)
  const overdue=invoices.filter(r=>r.status==='Overdue')
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#ba7517" icon="ti-file-invoice" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<button onClick={add} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#ba7517',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> New invoice
        </button>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {overdue.length>0&&<div style={{background:'rgba(226,75,74,.08)',border:'1px solid rgba(226,75,74,.3)',borderRadius:9,padding:'8px 12px',fontSize:11,color:'#e24b4a'}}>
            ⚠️ {overdue.length} overdue invoice{overdue.length>1?'s':''} — {fmt(overdue.reduce((s,r, sym)=>s+r.amount,0))} outstanding
          </div>}
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'90px 1fr 100px 100px 110px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Number','Client','Amount','Due date','Status','Notes',''].map((h,i)=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {invoices.map((inv,i)=>(
              <div key={inv.id} style={{display:'grid',gridTemplateColumns:'90px 1fr 100px 100px 110px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<invoices.length-1?'1px solid var(--bdr)':'none',alignItems:'center',background:inv.status==='Overdue'?'rgba(226,75,74,.04)':'transparent'}}>
                <input value={inv.number} onChange={e=>upd(inv.id,'number',e.target.value)} style={{...cS,fontFamily:'Syne,sans-serif',fontWeight:600,color:'var(--gold)'}}/>
                <input value={inv.client} onChange={e=>upd(inv.id,'client',e.target.value)} placeholder="Client name..." style={cS}/>
                <input type="text" inputMode="decimal" value={inv.amount||''} placeholder="0" onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(inv.id,'amount',parseFloat(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                <input type="date" value={inv.dueDate||''} onChange={e=>upd(inv.id,'dueDate',e.target.value)} style={{...cS,fontSize:10}}/>
                <select value={inv.status} onChange={e=>upd(inv.id,'status',e.target.value)} style={{...cS,color:sColor[inv.status]||'var(--txt)',fontWeight:600,cursor:'pointer'}}>
                  {STATUS.map(s=><option key={s}>{s}</option>)}
                </select>
                <input value={inv.notes||''} onChange={e=>upd(inv.id,'notes',e.target.value)} placeholder="Notes..." style={cS}/>
                <button onClick={()=>setInvoices(p=>p.filter(r=>r.id!==inv.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
          </div>
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)',marginBottom:4}}>Summary</div>
          {[
            {l:'Total invoices',v:invoices.length,c:'var(--txt)'},
            {l:'Paid',v:fmt(totalPaid, sym),c:'#1d9e75'},
            {l:'Outstanding',v:fmt(totalOutstanding, sym),c:'#ba7517'},
            {l:'Overdue',v:fmt(overdue.reduce((s,r, sym)=>s+r.amount,0)),c:'#e24b4a'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:10,marginTop:4}}>
            <div style={{fontSize:10,color:'var(--txt3)',marginBottom:8}}>By status</div>
            {STATUS.filter(s=>invoices.some(i=>i.status===s)).map(s=>{
              const count=invoices.filter(i=>i.status===s).length
              const pct=invoices.length>0?(count/invoices.length*100):0
              return(
                <div key={s} style={{marginBottom:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <span style={{fontSize:10,color:sColor[s],fontWeight:600}}>{s}</span>
                    <span style={{fontSize:10,color:'var(--txt2)'}}>{count}</span>
                  </div>
                  <div style={{height:3,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:sColor[s]||'var(--txt3)',borderRadius:2}}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SalesPipelineTool({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isLead=n.includes('lead')
  const isChurn=n.includes('churn')
  const isFollowUp=n.includes('follow')
  const STAGES=isLead?['New','Contacted','Qualified','Proposal','Won','Lost']:
    isChurn?['At risk','Engaged','Churned','Retained']:
    ['Lead','Contacted','Qualified','Proposal','Negotiation','Won','Lost']
  const sColor={'New':'var(--txt3)','Contacted':'#378add','Qualified':'#7f77dd','Proposal':'#ba7517','Negotiation':'#ef9f27','Won':'#1d9e75','Lost':'#e24b4a','At risk':'#e24b4a','Engaged':'#378add','Churned':'var(--txt3)','Retained':'#1d9e75','Lead':'var(--txt3)'}
  const [deals,setDeals]=useState([
    {id:1,company:'',contact:'',value:0,stage:STAGES[0],date:'',prob:50,notes:''},
  ])
  const upd=(id,k,v)=>{setDeals(p=>p.map(d=>d.id===id?{...d,[k]:v}:d));save({deals})}
  const add=()=>setDeals(p=>[...p,{id:Date.now(),company:'',contact:'',value:0,stage:STAGES[0],date:'',prob:50,notes:''}])
  const pipeline=deals.filter(d=>!['Won','Lost','Churned'].includes(d.stage)).reduce((s,d)=>s+d.value*(d.prob/100),0)
  const won=deals.filter(d=>d.stage==='Won').reduce((s,d)=>s+d.value,0)
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#7f77dd" icon="ti-topology-star" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<button onClick={add} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#7f77dd',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add deal
        </button>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {/* Stage columns mini */}
          <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(STAGES.length,6)},1fr)`,gap:6}}>
            {STAGES.slice(0,6).map(s=>{
              const count=deals.filter(d=>d.stage===s).length
              const val=deals.filter(d=>d.stage===s).reduce((a,d)=>a+d.value,0)
              return(
                <div key={s} style={{background:'var(--bg2)',border:`1px solid ${sColor[s]||'var(--bdr)'}44`,borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                  <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:sColor[s]||'var(--txt)'}}>{count}</div>
                  <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',marginBottom:2}}>{s}</div>
                  {val>0&&<div style={{fontSize:9,color:sColor[s]||'var(--txt2)'}}>{fmt(val, sym)}</div>}
                </div>
              )
            })}
          </div>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 120px 90px 110px 80px 60px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Company','Contact','Value','Stage','Close date','Prob%','Notes',''].map((h,i)=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {deals.map((d,i)=>(
              <div key={d.id} style={{display:'grid',gridTemplateColumns:'1fr 120px 90px 110px 80px 60px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<deals.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                <input value={d.company} onChange={e=>upd(d.id,'company',e.target.value)} placeholder="Company..." style={cS}/>
                <input value={d.contact} onChange={e=>upd(d.id,'contact',e.target.value)} placeholder="Contact..." style={cS}/>
                <input type="text" inputMode="decimal" value={d.value||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(d.id,'value',parseInt(e.target.value)||0)}} placeholder="0" style={{...cS,textAlign:'right'}}/>
                <select value={d.stage} onChange={e=>upd(d.id,'stage',e.target.value)} style={{...cS,color:sColor[d.stage]||'var(--txt)',fontWeight:600,cursor:'pointer'}}>
                  {STAGES.map(s=><option key={s}>{s}</option>)}
                </select>
                <input type="date" value={d.date||''} onChange={e=>upd(d.id,'date',e.target.value)} style={{...cS,fontSize:10}}/>
                <input type="text" inputMode="numeric" value={d.prob||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(d.id,'prob',parseInt(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                <input value={d.notes||''} onChange={e=>upd(d.id,'notes',e.target.value)} placeholder="Notes..." style={cS}/>
                <button onClick={()=>setDeals(p=>p.filter(x=>x.id!==d.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
          </div>
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:8}}>
          {[
            {l:'Total deals',v:deals.length,c:'var(--txt)'},
            {l:'Won',v:deals.filter(d=>d.stage==='Won').length,c:'#1d9e75'},
            {l:'Pipeline (weighted)',v:fmt(pipeline, sym),c:'var(--gold)'},
            {l:'Revenue won',v:fmt(won, sym),c:'#1d9e75'},
            {l:'Win rate',v:`${deals.length>0?(deals.filter(d=>d.stage==='Won').length/deals.filter(d=>['Won','Lost'].includes(d.stage)).length||0*100).toFixed(0):0}%`,c:'var(--txt2)'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EcommerceTool({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isSKU=n.includes('sku')
  const isOrder=n.includes('order')
  const isAmazon=n.includes('amazon')
  const isShopify=n.includes('shopify')
  const isSupplier=n.includes('supplier')

  const cols=isSupplier?
    ['Supplier','Category','Lead time','Min order','Cost £','Rating','Status','Notes']:
    isOrder?['Order ID','Customer','Product','Qty','Total £','Status','Date','Notes']:
    ['SKU','Product name','Category','Stock','Price £','Cost £','Margin%','Status']

  const STATUS=isOrder?['Pending','Processing','Shipped','Delivered','Returned','Cancelled']:
    isSupplier?['Active','On hold','Pending review','Inactive']:
    ['Active','Low stock','Out of stock','Discontinued']

  const sColor={Active:'#1d9e75','Low stock':'#ba7517','Out of stock':'#e24b4a',Discontinued:'var(--txt3)',Pending:'#378add',Processing:'#ba7517',Shipped:'#7f77dd',Delivered:'#1d9e75',Returned:'#d4537e',Cancelled:'var(--txt3)','On hold':'#ba7517','Pending review':'#378add',Inactive:'var(--txt3)'}

  const emptyRow=isOrder?{id:Date.now(),col0:'',col1:'',col2:'',col3:0,col4:0,col5:'Pending',col6:'',col7:''}:
    isSupplier?{id:Date.now(),col0:'',col1:'',col2:'',col3:0,col4:0,col5:'',col6:'Active',col7:''}:
    {id:Date.now(),col0:'',col1:'',col2:'',col3:0,col4:0,col5:0,col6:'',col7:'Active'}

  const [rows,setRows]=useState([{...emptyRow,id:1}])
  const upd=(id,k,v)=>{setRows(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));save({rows})}
  const add=()=>setRows(p=>[...p,{...emptyRow,id:Date.now()}])
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  const colKeys=['col0','col1','col2','col3','col4','col5','col6','col7']
  const isNum=(i)=>isOrder?[3,4].includes(i):isSupplier?[3,4].includes(i):[3,4,5,6].includes(i)
  const isDate=(i)=>isOrder&&i===6
  const isSelect=(i)=>isOrder?i===5:isSupplier?i===6:i===7
  const isStat=(r,i)=>isSelect(i)

  const totalValue=rows.reduce((s,r)=>s+(parseFloat(r.col4)||0)*(parseFloat(r.col3)||0),0)
  const activeCount=rows.filter(r=>['Active','Delivered','Processing'].includes(r.col7||r.col5||r.col6)).length

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#5dcaa5" icon={isAmazon?'ti-brand-amazon':isShopify?'ti-shopping-cart':'ti-package'} isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<div style={{display:'flex',gap:10,alignItems:'center'}}>
          <span style={{fontSize:11,color:'var(--txt2)'}}>{rows.length} items · {fmt(totalValue, sym)} value</span>
          <button onClick={add} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#5dcaa5',fontSize:11,fontWeight:600,color:'#0c0c12',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
            <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add
          </button>
        </div>}/>
      <div style={{flex:1,overflowY:'auto',padding:14}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:`repeat(${cols.length-1},1fr) 28px`,padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
            {cols.map((h,i)=><div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>)}
            <div/>
          </div>
          {rows.map((row,ri)=>(
            <div key={row.id} style={{display:'grid',gridTemplateColumns:`repeat(${cols.length-1},1fr) 28px`,gap:8,padding:'8px 14px',borderBottom:ri<rows.length-1?'1px solid var(--bdr)':'none',alignItems:'center',background:row.col7==='Out of stock'||row.col5==='Out of stock'?'rgba(226,75,74,.03)':'transparent'}}>
              {colKeys.slice(0,cols.length-1).map((k,i)=>(
                isDate(i)?(
                  <input key={k} type="date" value={row[k]||''} onChange={e=>upd(row.id,k,e.target.value)} style={{...cS,fontSize:10}}/>
                ):isSelect(i)?(
                  <select key={k} value={row[k]||STATUS[0]} onChange={e=>upd(row.id,k,e.target.value)} style={{...cS,color:sColor[row[k]]||'var(--txt)',fontWeight:600,cursor:'pointer'}}>
                    {STATUS.map(s=><option key={s}>{s}</option>)}
                  </select>
                ):isNum(i)?(
                  <input key={k} type="text" inputMode="decimal" value={row[k]||''} placeholder="0" onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(row.id,k,parseFloat(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                ):(
                  <input key={k} value={row[k]||''} onChange={e=>upd(row.id,k,e.target.value)} placeholder={cols[i]+'...'} style={cS}/>
                )
              ))}
              <button onClick={()=>setRows(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
          <div style={{padding:'8px 14px'}}>
            <button onClick={add} style={{fontSize:11,color:'#5dcaa5',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
              <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add row
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StartupTool({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isRunway=n.includes('runway')||n.includes('burn rate')
  const isValuation=n.includes('valuation')
  const isCost=n.includes('cost')
  const isModel=n.includes('model')

  const [cash,setCash]=useState(100000)
  const [monthlyBurn,setMonthlyBurn]=useState(15000)
  const [monthlyRev,setMonthlyRev]=useState(5000)
  const [growthRate,setGrowthRate]=useState(15)
  const [costs,setCosts]=useState([
    {id:1,name:'Salaries',amount:8000,type:'Fixed'},
    {id:2,name:'Office/Tools',amount:2000,type:'Fixed'},
    {id:3,name:'Marketing',amount:3000,type:'Variable'},
    {id:4,name:'Legal/Admin',amount:1000,type:'Variable'},
    {id:5,name:'Misc',amount:1000,type:'Variable'},
  ])

  const netBurn=monthlyBurn-monthlyRev
  const runway=netBurn>0?Math.floor(cash/netBurn):999
  const runwayYrs=Math.floor(runway/12)
  const runwayMo=runway%12
  const rColor=runway>=18?'#1d9e75':runway>=9?'#ba7517':'#e24b4a'
  const breakEvenMos=monthlyRev>0&&growthRate>0?Math.ceil(Math.log(monthlyBurn/monthlyRev)/Math.log(1+growthRate/100)):null

  const upd=(id,k,v)=>{setCosts(p=>p.map(c=>c.id===id?{...c,[k]:v}:c));save({cash,monthlyBurn,monthlyRev,growthRate,costs})}
  const inp=(l,v,set,suf)=>(
    <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 14px',marginBottom:8}}>
      <div style={{fontSize:11,color:'var(--txt2)',marginBottom:5}}>{l}</div>
      <div style={{position:'relative'}}>
        {!suf&&<span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--txt3)'}}>{sym}</span>}
        <input type="text" inputMode="decimal" value={v===0?'':v} placeholder="0"
          onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value)){set(parseFloat(e.target.value)||0);save({cash,monthlyBurn,monthlyRev,growthRate,costs})}}}
          onFocus={e=>e.target.select()}
          style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:7,padding:`8px ${suf?'32px':'10px'} 8px ${suf?'10px':'24px'}`,fontSize:13,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
        {suf&&<span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--txt3)'}}>{suf}</span>}
      </div>
    </div>
  )

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#d4537e" icon="ti-rocket" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'280px 1fr',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,borderRight:'1px solid var(--bdr)'}}>
          {inp('Cash / bank balance',cash,setCash)}
          {inp('Monthly burn rate',monthlyBurn,setMonthlyBurn)}
          {inp('Monthly revenue',monthlyRev,setMonthlyRev)}
          {inp('Monthly revenue growth',growthRate,setGrowthRate,'%')}
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'9px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Cost breakdown</div>
            {costs.map(c=>(
              <div key={c.id} style={{display:'flex',gap:8,padding:'7px 14px',borderBottom:'1px solid var(--bdr)',alignItems:'center'}}>
                <input value={c.name} onChange={e=>upd(c.id,'name',e.target.value)} style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:12,color:'var(--txt)',fontFamily:'inherit'}}/>
                <select value={c.type} onChange={e=>upd(c.id,'type',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:10,color:c.type==='Fixed'?'#378add':'#ba7517',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
                  <option>Fixed</option><option>Variable</option>
                </select>
                <div style={{position:'relative',width:90,flexShrink:0}}>
                  <span style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',fontSize:10,color:'var(--txt3)'}}>{sym}</span>
                  <input type="text" inputMode="decimal" value={c.amount||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(c.id,'amount',parseInt(e.target.value)||0)}} style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'5px 5px 5px 18px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                </div>
              </div>
            ))}
            <div style={{padding:'6px 14px'}}>
              <button onClick={()=>setCosts(p=>[...p,{id:Date.now(),name:'',amount:0,type:'Variable'}])} style={{fontSize:11,color:'#d4537e',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
                <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add cost
              </button>
            </div>
          </div>
        </div>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:`${rColor}14`,border:`2px solid ${rColor}55`,borderRadius:12,padding:18,textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:6}}>Runway</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:36,fontWeight:700,color:rColor}}>
              {runway>=999?'Profitable':runwayYrs>0?`${runwayYrs}y ${runwayMo}m`:`${runway} months`}
            </div>
            <div style={{fontSize:11,color:'var(--txt2)',marginTop:4}}>
              {netBurn>0?`Burning ${fmt(netBurn, sym)}/mo net`:'Revenue exceeds burn'}
            </div>
          </div>
          {[
            {l:'Monthly burn',v:fmt(monthlyBurn, sym),c:'#d4537e'},
            {l:'Monthly revenue',v:fmt(monthlyRev, sym),c:'#1d9e75'},
            {l:'Net burn/mo',v:fmt(netBurn, sym),c:netBurn>0?'#e24b4a':'#1d9e75'},
            {l:'Break-even',v:breakEvenMos?`~${breakEvenMos} months`:'—',c:'var(--gold)'},
            {l:'Fixed costs',v:fmt(costs.filter(c=>c.type==='Fixed', sym).reduce((s,c)=>s+c.amount,0)),c:'#378add'},
            {l:'Variable costs',v:fmt(costs.filter(c=>c.type==='Variable', sym).reduce((s,c)=>s+c.amount,0)),c:'#ba7517'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'var(--bg3)',borderRadius:9,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function OKRTool({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isKPI=n.includes('kpi')||n.includes('dashboard')
  const [objectives,setObjectives]=useState([
    {id:1,objective:'Grow monthly revenue',owner:'CEO',quarter:'Q1',progress:65,krs:[
      {id:1,name:'Reach £50k MRR',target:50000,current:32500,unit:'£'},
      {id:2,name:'Acquire 20 new clients',target:20,current:13,unit:''},
      {id:3,name:'Reduce churn to <5%',target:5,current:7.2,unit:'%',invert:true},
    ]},
    {id:2,objective:'Improve product quality',owner:'CTO',quarter:'Q1',progress:40,krs:[
      {id:4,name:'NPS score >50',target:50,current:38,unit:''},
      {id:5,name:'Reduce bugs by 80%',target:80,current:55,unit:'%'},
    ]},
  ])
  const avgProgress=objectives.length>0?Math.round(objectives.reduce((s,o)=>s+o.progress,0)/objectives.length):0
  const addObj=()=>setObjectives(p=>[...p,{id:Date.now(),objective:'',owner:'',quarter:'Q1',progress:0,krs:[]}])
  const addKR=(objId)=>setObjectives(p=>p.map(o=>o.id===objId?{...o,krs:[...o.krs,{id:Date.now(),name:'',target:0,current:0,unit:''}]}:o))
  const updObj=(id,k,v)=>{setObjectives(p=>p.map(o=>o.id===id?{...o,[k]:v}:o));save({objectives})}
  const updKR=(objId,krId,k,v)=>{setObjectives(p=>p.map(o=>o.id===objId?{...o,krs:o.krs.map(kr=>kr.id===krId?{...kr,[k]:v}:kr)}:o));save({objectives})}
  const QUARTERS=['Q1','Q2','Q3','Q4']
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="var(--gold)" icon="ti-target" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:'var(--gold)'}}>{avgProgress}%</div>
            <div style={{fontSize:9,color:'var(--txt3)'}}>Avg progress</div>
          </div>
          <button onClick={addObj} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'var(--gold)',fontSize:11,fontWeight:600,color:'#0c0c12',cursor:'pointer',fontFamily:'Syne,sans-serif'}}>
            + Add OKR
          </button>
        </div>}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:12}}>
        {objectives.map(obj=>{
          const krProgress=obj.krs.length>0?obj.krs.reduce((s,kr)=>{
            const p=kr.target>0?(kr.invert?Math.max(0,(2-kr.current/kr.target)*100):kr.current/kr.target*100):0
            return s+Math.min(100,p)
          },0)/obj.krs.length:0
          return(
            <div key={obj.id} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:13,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <i className="ti ti-flag" style={{fontSize:14,color:'var(--gold)',flexShrink:0}} aria-hidden="true"/>
                  <input value={obj.objective} onChange={e=>updObj(obj.id,'objective',e.target.value)} placeholder="Objective..."
                    style={{flex:1,fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--txt)',background:'transparent',border:'none',outline:'none'}}/>
                  <select value={obj.quarter} onChange={e=>updObj(obj.id,'quarter',e.target.value)} style={{background:'var(--bg4)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
                    {QUARTERS.map(q=><option key={q}>{q}</option>)}
                  </select>
                  <input value={obj.owner} onChange={e=>updObj(obj.id,'owner',e.target.value)} placeholder="Owner" style={{width:90,background:'var(--bg4)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}/>
                  <button onClick={()=>setObjectives(p=>p.filter(o=>o.id!==obj.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:12,color:'var(--txt3)'}} aria-hidden="true"/></button>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,height:6,background:'var(--bg4)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${krProgress}%`,background:'var(--gold)',borderRadius:3,transition:'width .5s'}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--gold)',width:35,textAlign:'right'}}>{Math.round(krProgress)}%</span>
                </div>
              </div>
              <div style={{padding:'10px 16px',display:'flex',flexDirection:'column',gap:8}}>
                {obj.krs.map(kr=>{
                  const pct=kr.target>0?Math.min(100,(kr.invert?Math.max(0,(2-kr.current/kr.target)*100):kr.current/kr.target*100)):0
                  const c=pct>=70?'#1d9e75':pct>=40?'#ba7517':'#e24b4a'
                  return(
                    <div key={kr.id} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:c,flexShrink:0}}/>
                      <input value={kr.name} onChange={e=>updKR(obj.id,kr.id,'name',e.target.value)} placeholder="Key result..." style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:12,color:'var(--txt)',fontFamily:'inherit'}}/>
                      <input type="text" inputMode="decimal" value={kr.current||''} placeholder="0" onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))updKR(obj.id,kr.id,'current',parseFloat(e.target.value)||0)}} style={{width:70,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:11,color:c,fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                      <span style={{fontSize:11,color:'var(--txt3)'}}>/</span>
                      <input type="text" inputMode="decimal" value={kr.target||''} placeholder="0" onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))updKR(obj.id,kr.id,'target',parseFloat(e.target.value)||0)}} style={{width:70,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                      <input value={kr.unit||''} onChange={e=>updKR(obj.id,kr.id,'unit',e.target.value)} placeholder="unit" style={{width:40,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 5px',fontSize:10,color:'var(--txt3)',fontFamily:'inherit',outline:'none'}}/>
                      <div style={{width:50,height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden',flexShrink:0}}>
                        <div style={{height:'100%',width:`${pct}%`,background:c,borderRadius:2}}/>
                      </div>
                      <button onClick={()=>setObjectives(p=>p.map(o=>o.id===obj.id?{...o,krs:o.krs.filter(k=>k.id!==kr.id)}:o))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:10,color:'var(--txt3)'}} aria-hidden="true"/></button>
                    </div>
                  )
                })}
                <button onClick={()=>addKR(obj.id)} style={{fontSize:11,color:'var(--gold)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4,marginLeft:14}}>
                  <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add key result
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FreelanceTool({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isRetainer=n.includes('retainer')
  const isBilling=n.includes('billing')||n.includes('invoice')
  const isIncome=n.includes('income')
  const STATUS=['Active','On hold','Completed','Cancelled']
  const sColor={Active:'#1d9e75','On hold':'#ba7517',Completed:'var(--txt3)',Cancelled:'#e24b4a'}
  const [projects,setProjects]=useState([
    {id:1,client:'',project:'',type:isRetainer?'Retainer':'Fixed price',rate:0,hours:0,status:'Active',dueDate:'',invoiced:false,notes:''},
  ])
  const upd=(id,k,v)=>{setProjects(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));save({projects})}
  const add=()=>setProjects(p=>[...p,{id:Date.now(),client:'',project:'',type:isRetainer?'Retainer':'Fixed price',rate:0,hours:0,status:'Active',dueDate:'',invoiced:false,notes:''}])
  const TYPES=['Fixed price','Hourly','Retainer','Milestone']
  const totalValue=projects.reduce((s,p)=>s+(p.type==='Hourly'?p.rate*p.hours:p.rate),0)
  const totalActive=projects.filter(p=>p.status==='Active').reduce((s,p)=>s+(p.type==='Hourly'?p.rate*p.hours:p.rate),0)
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#378add" icon="ti-briefcase" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,color:'#1d9e75'}}>{fmt(totalActive, sym)}</div>
            <div style={{fontSize:9,color:'var(--txt3)'}}>Active revenue</div>
          </div>
          <button onClick={add} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#378add',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
            <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add project
          </button>
        </div>}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[{l:'Total projects',v:projects.length,c:'var(--txt)'},{l:'Active',v:projects.filter(p=>p.status==='Active').length,c:'#1d9e75'},{l:'Total value',v:fmt(totalValue, sym),c:'var(--gold)'},{l:'Invoiced',v:projects.filter(p=>p.invoiced).length+'/'+projects.length,c:'#378add'}].map(s=>(
            <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 100px 80px 80px 110px 90px 50px 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
            {['Client','Project','Type','Rate £','Hours','Status','Due date','Invoiced',''].map(h=>(
              <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
            ))}
          </div>
          {projects.map((p,i)=>(
            <div key={p.id} style={{display:'grid',gridTemplateColumns:'1fr 1fr 100px 80px 80px 110px 90px 50px 28px',gap:8,padding:'8px 14px',borderBottom:i<projects.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
              <input value={p.client} onChange={e=>upd(p.id,'client',e.target.value)} placeholder="Client..." style={cS}/>
              <input value={p.project} onChange={e=>upd(p.id,'project',e.target.value)} placeholder="Project..." style={cS}/>
              <select value={p.type} onChange={e=>upd(p.id,'type',e.target.value)} style={{...cS,cursor:'pointer'}}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
              <input type="text" inputMode="decimal" value={p.rate||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(p.id,'rate',parseInt(e.target.value)||0)}} placeholder="0" style={{...cS,textAlign:'right'}}/>
              <input type="text" inputMode="decimal" value={p.hours||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(p.id,'hours',parseFloat(e.target.value)||0)}} placeholder="0" style={{...cS,textAlign:'right'}}/>
              <select value={p.status} onChange={e=>upd(p.id,'status',e.target.value)} style={{...cS,color:sColor[p.status]||'var(--txt)',fontWeight:600,cursor:'pointer'}}>
                {STATUS.map(s=><option key={s}>{s}</option>)}
              </select>
              <input type="date" value={p.dueDate||''} onChange={e=>upd(p.id,'dueDate',e.target.value)} style={{...cS,fontSize:10}}/>
              <div style={{display:'flex',justifyContent:'center'}}>
                <input type="checkbox" checked={p.invoiced} onChange={e=>upd(p.id,'invoiced',e.target.checked)} style={{cursor:'pointer',accentColor:'#1d9e75'}}/>
              </div>
              <button onClick={()=>setProjects(prev=>prev.filter(r=>r.id!==p.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
          <div style={{padding:'8px 14px'}}>
            <button onClick={add} style={{fontSize:11,color:'#378add',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
              <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add project
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OperationsTool({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isAsset=n.includes('asset')||n.includes('equipment')
  const isVendor=n.includes('vendor')
  const isWorkOrder=n.includes('work order')
  const isSupply=n.includes('supply')||n.includes('office supply')
  const STATUS=isWorkOrder?['Open','In progress','On hold','Complete','Cancelled']:
    isAsset?['Active','In maintenance','Retired','Lost']:
    isVendor?['Preferred','Approved','Pending','Inactive']:
    ['In stock','Low','Ordered','Out of stock']
  const sColor={Active:'#1d9e75',Open:'#378add','In progress':'#ba7517','On hold':'var(--txt3)',Complete:'#1d9e75',Cancelled:'#e24b4a',Preferred:'#1d9e75',Approved:'#378add',Pending:'#ba7517',Inactive:'var(--txt3)','In maintenance':'#ba7517',Retired:'var(--txt3)',Lost:'#e24b4a','In stock':'#1d9e75',Low:'#ba7517',Ordered:'#378add','Out of stock':'#e24b4a'}
  const COLS=isWorkOrder?['WO #','Description','Assigned to','Priority','Status','Due date','Cost £','Notes']:
    isAsset?['Asset ID','Asset name','Category','Location','Purchase date','Value £','Status','Notes']:
    isVendor?['Vendor','Category','Contact','Lead time','Min order','Cost £','Status','Notes']:
    ['Item','Category','Quantity','Unit','Reorder at','Cost £','Status','Notes']
  const [rows,setRows]=useState([{id:1,...Object.fromEntries(COLS.map((_,i)=>['c'+i,'']))}])
  const upd=(id,k,v)=>{setRows(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));save({rows})}
  const isNumCol=(i)=>isWorkOrder?[6].includes(i):isAsset?[5].includes(i):isVendor?[4,5].includes(i):[2,4,5].includes(i)
  const isDateCol=(i)=>isAsset&&i===4
  const isSelectCol=(i)=>isWorkOrder?i===4:isAsset?i===6:isVendor?i===6:i===6
  const isPrioCol=(i)=>isWorkOrder&&i===3
  const PRIO=['Low','Medium','High','Critical']
  const pColor={Low:'var(--txt3)',Medium:'#378add',High:'#ba7517',Critical:'#e24b4a'}
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#ba7517" icon={isAsset?'ti-tool':isVendor?'ti-building-store':isWorkOrder?'ti-clipboard-check':'ti-package'} isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<button onClick={()=>setRows(p=>[...p,{id:Date.now(),...Object.fromEntries(COLS.map((_,i)=>['c'+i,'']))}])} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#ba7517',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add row
        </button>}/>
      <div style={{flex:1,overflowY:'auto',padding:14}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:`repeat(${COLS.length-1},1fr) 28px`,padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
            {COLS.map((h,i)=><div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>)}
            <div/>
          </div>
          {rows.map((row,ri)=>(
            <div key={row.id} style={{display:'grid',gridTemplateColumns:`repeat(${COLS.length-1},1fr) 28px`,gap:8,padding:'8px 14px',borderBottom:ri<rows.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
              {COLS.slice(0,-1).map((_,i)=>{
                const k='c'+i
                if(isDateCol(i)) return <input key={k} type="date" value={row[k]||''} onChange={e=>upd(row.id,k,e.target.value)} style={{...cS,fontSize:10}}/>
                if(isSelectCol(i)) return <select key={k} value={row[k]||STATUS[0]} onChange={e=>upd(row.id,k,e.target.value)} style={{...cS,color:sColor[row[k]]||'var(--txt)',fontWeight:600,cursor:'pointer'}}>{STATUS.map(s=><option key={s}>{s}</option>)}</select>
                if(isPrioCol(i)) return <select key={k} value={row[k]||'Medium'} onChange={e=>upd(row.id,k,e.target.value)} style={{...cS,color:pColor[row[k]]||'var(--txt)',fontWeight:600,cursor:'pointer'}}>{PRIO.map(p=><option key={p}>{p}</option>)}</select>
                if(isNumCol(i)) return <input key={k} type="text" inputMode="decimal" value={row[k]||''} placeholder="0" onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(row.id,k,parseFloat(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                return <input key={k} value={row[k]||''} onChange={e=>upd(row.id,k,e.target.value)} placeholder={COLS[i]+'...'} style={cS}/>
              })}
              <button onClick={()=>setRows(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
          <div style={{padding:'8px 14px'}}>
            <button onClick={()=>setRows(p=>[...p,{id:Date.now(),...Object.fromEntries(COLS.map((_,i)=>['c'+i,'']))}])} style={{fontSize:11,color:'#ba7517',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
              <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add row
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// INVESTING & WEALTH — SPECIFIC COMPONENTS
// ═══════════════════════════════════════════════════════════════

export function TradingJournal({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isOptions=n.includes('option')
  const isForex=n.includes('forex')||n.includes('fx')
  const isCrypto=n.includes('crypto')

  const ASSETS=isOptions?['Call','Put']:isForex?['EUR/USD','GBP/USD','USD/JPY','AUD/USD','Other']:isCrypto?['BTC','ETH','SOL','XRP','Other']:['Stock','ETF','Bond','Commodity','Other']
  const [trades,setTrades]=useState([
    {id:1,date:'',symbol:'',asset:ASSETS[0],direction:'Long',entry:0,exit:0,qty:0,fees:0,setup:'',outcome:'Win',notes:''},
  ])
  const upd=(id,k,v)=>{setTrades(p=>p.map(t=>t.id===id?{...t,[k]:v}:t));save({trades})}
  const add=()=>setTrades(p=>[...p,{id:Date.now(),date:'',symbol:'',asset:ASSETS[0],direction:'Long',entry:0,exit:0,qty:0,fees:0,setup:'',outcome:'Win',notes:''}])

  const enriched=trades.map(t=>{
    const gross=(t.direction==='Long'?t.exit-t.entry:t.entry-t.exit)*t.qty
    const net=gross-t.fees
    return{...t,gross,net}
  })
  const wins=enriched.filter(t=>t.net>0)
  const losses=enriched.filter(t=>t.net<0)
  const totalPnL=enriched.reduce((s,t)=>s+t.net,0)
  const winRate=trades.length>0?(wins.length/trades.length*100):0
  const avgWin=wins.length>0?wins.reduce((s,t)=>s+t.net,0)/wins.length:0
  const avgLoss=losses.length>0?Math.abs(losses.reduce((s,t)=>s+t.net,0)/losses.length):0
  const rr=avgLoss>0?(avgWin/avgLoss):0

  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#378add" icon="ti-chart-candle" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 240px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {/* Stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {[
              {l:'Total P&L',v:fmt(totalPnL, sym),c:totalPnL>=0?'#1d9e75':'#e24b4a'},
              {l:'Win rate',v:`${winRate.toFixed(1)}%`,c:winRate>=50?'#1d9e75':'#ba7517'},
              {l:'Avg win',v:fmt(avgWin, sym),c:'#1d9e75'},
              {l:'Risk/reward',v:`${rr.toFixed(2)}:1`,c:rr>=2?'#1d9e75':rr>=1?'#ba7517':'#e24b4a'},
            ].map(s=>(
              <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Trade table */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'100px 80px 80px 70px 80px 80px 60px 70px 70px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:6}}>
              {['Date','Symbol','Asset','Dir','Entry','Exit','Qty','Fees','P&L','Notes',''].map(h=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {enriched.map((t,i)=>(
              <div key={t.id} style={{display:'grid',gridTemplateColumns:'100px 80px 80px 70px 80px 80px 60px 70px 70px 1fr 28px',gap:6,padding:'7px 14px',borderBottom:i<trades.length-1?'1px solid var(--bdr)':'none',alignItems:'center',background:t.net>0?'rgba(29,158,117,.02)':t.net<0?'rgba(226,75,74,.02)':'transparent'}}>
                <input type="date" value={t.date||''} onChange={e=>upd(t.id,'date',e.target.value)} style={{...cS,fontSize:10}}/>
                <input value={t.symbol||''} onChange={e=>upd(t.id,'symbol',e.target.value)} placeholder="AAPL..." style={{...cS,fontWeight:600}}/>
                <select value={t.asset} onChange={e=>upd(t.id,'asset',e.target.value)} style={{...cS,cursor:'pointer',fontSize:10}}>
                  {ASSETS.map(a=><option key={a}>{a}</option>)}
                </select>
                <select value={t.direction} onChange={e=>upd(t.id,'direction',e.target.value)} style={{...cS,color:t.direction==='Long'?'#1d9e75':'#e24b4a',fontWeight:600,cursor:'pointer',fontSize:10}}>
                  <option>Long</option><option>Short</option>
                </select>
                {['entry','exit','qty','fees'].map(k=>(
                  <input key={k} type="text" inputMode="decimal" value={t[k]||''} placeholder="0"
                    onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(t.id,k,parseFloat(e.target.value)||0)}}
                    style={{...cS,textAlign:'right'}}/>
                ))}
                <span style={{fontSize:11,fontWeight:700,color:t.net>=0?'#1d9e75':'#e24b4a',textAlign:'right'}}>{t.net>=0?'+':''}{fmt(t.net, sym)}</span>
                <input value={t.notes||''} onChange={e=>upd(t.id,'notes',e.target.value)} placeholder="Notes..." style={cS}/>
                <button onClick={()=>setTrades(p=>p.filter(x=>x.id!==t.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
            <div style={{padding:'8px 14px'}}>
              <button onClick={add} style={{fontSize:11,color:'#378add',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
                <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add trade
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Performance</div>
          {[
            {l:'Total trades',v:trades.length,c:'var(--txt)'},
            {l:'Wins',v:wins.length,c:'#1d9e75'},
            {l:'Losses',v:losses.length,c:'#e24b4a'},
            {l:'Avg loss',v:fmt(avgLoss, sym),c:'#e24b4a'},
            {l:'Total fees',v:fmt(trades.reduce((s,t, sym)=>s+t.fees,0)),c:'#ba7517'},
            {l:'Gross P&L',v:fmt(enriched.reduce((s,t, sym)=>s+t.gross,0)),c:'var(--txt)'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
          {/* Equity curve mini */}
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:12}}>
            <div style={{fontSize:11,fontWeight:500,color:'var(--txt)',marginBottom:8}}>Equity curve</div>
            {enriched.length>1&&(()=>{
              let cum=0
              const pts=enriched.map(t=>{cum+=t.net;return cum})
              const max=Math.max(...pts.map(Math.abs),1)
              return(
                <div style={{display:'flex',gap:2,alignItems:'flex-end',height:50}}>
                  {pts.map((p,i)=>{
                    const h=Math.max(2,Math.abs(p)/max*46)
                    return<div key={i} style={{flex:1,height:h,background:p>=0?'#1d9e75':'#e24b4a',borderRadius:2,opacity:.7}}/>
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CryptoTracker({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const [holdings,setHoldings]=useState([
    {id:1,coin:'Bitcoin',symbol:'BTC',qty:0.5,buyPrice:38000,currentPrice:67000,wallet:'Ledger'},
    {id:2,coin:'Ethereum',symbol:'ETH',qty:3.2,buyPrice:2100,currentPrice:3500,wallet:'MetaMask'},
    {id:3,coin:'Solana',symbol:'SOL',qty:50,buyPrice:95,currentPrice:172,wallet:'Phantom'},
  ])
  const [newRow,setNewRow]=useState({coin:'',symbol:'',qty:0,buyPrice:0,currentPrice:0,wallet:''})
  const [adding,setAdding]=useState(false)

  const enriched=holdings.map(h=>({
    ...h,
    value:h.qty*h.currentPrice,
    cost:h.qty*h.buyPrice,
    gain:h.qty*h.currentPrice-h.qty*h.buyPrice,
    gainPct:h.buyPrice>0?((h.currentPrice-h.buyPrice)/h.buyPrice*100):0
  }))
  const totalValue=enriched.reduce((s,h)=>s+h.value,0)
  const totalCost=enriched.reduce((s,h)=>s+h.cost,0)
  const totalGain=totalValue-totalCost
  const totalGainPct=totalCost>0?(totalGain/totalCost*100):0

  const upd=(id,k,v)=>{setHoldings(p=>p.map(h=>h.id===id?{...h,[k]:v}:h));save({holdings})}
  const addH=()=>{if(!newRow.coin)return;setHoldings(p=>[...p,{...newRow,id:Date.now()}]);setNewRow({coin:'',symbol:'',qty:0,buyPrice:0,currentPrice:0,wallet:''});setAdding(false)}
  const iS={background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',width:'100%',textAlign:'right'}

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#ef9f27" icon="ti-currency-bitcoin" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<button onClick={()=>setAdding(a=>!a)} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#ef9f27',fontSize:11,fontWeight:600,color:'#0c0c12',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add coin
        </button>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {/* Summary */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[
              {l:'Portfolio value',v:fmt(totalValue, sym),c:'var(--gold)'},
              {l:'Total gain/loss',v:fmt(totalGain, sym),c:totalGain>=0?'#1d9e75':'#e24b4a'},
              {l:'Return',v:`${totalGainPct>=0?'+':''}${totalGainPct.toFixed(2)}%`,c:totalGainPct>=0?'#1d9e75':'#e24b4a'},
            ].map(s=>(
              <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'11px 13px',textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Add form */}
          {adding&&(
            <div style={{background:'var(--bg2)',border:'1px solid var(--bdr2)',borderRadius:12,padding:14}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)',marginBottom:10}}>Add holding</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 80px 90px 100px 100px 1fr',gap:8,marginBottom:8}}>
                {[
                  {l:'Name',k:'coin',type:'text',placeholder:'Bitcoin'},
                  {l:'Symbol',k:'symbol',type:'text',placeholder:'BTC'},
                  {l:'Quantity',k:'qty',type:'num',placeholder:'0'},
                  {l:'Buy price £',k:'buyPrice',type:'num',placeholder:'0'},
                  {l:'Current £',k:'currentPrice',type:'num',placeholder:'0'},
                  {l:'Wallet',k:'wallet',type:'text',placeholder:'Ledger'},
                ].map(f=>(
                  <div key={f.k}>
                    <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',marginBottom:3}}>{f.l}</div>
                    <input type={f.type==='num'?'text':'text'} inputMode={f.type==='num'?'decimal':'text'} value={newRow[f.k]||''} placeholder={f.placeholder}
                      onChange={e=>{const v=e.target.value;if(f.type==='num'){if(/^[\d]*\.?[\d]*$/.test(v))setNewRow(p=>({...p,[f.k]:parseFloat(v)||0}))}else setNewRow(p=>({...p,[f.k]:v}))}}
                      style={{...iS,textAlign:f.type==='num'?'right':'left'}}/>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={addH} style={{padding:'7px 16px',borderRadius:7,border:'none',background:'#ef9f27',fontSize:11,fontWeight:600,color:'#0c0c12',cursor:'pointer',fontFamily:'Syne,sans-serif'}}>Add</button>
                <button onClick={()=>setAdding(false)} style={{padding:'7px 14px',borderRadius:7,border:'1px solid var(--bdr)',background:'transparent',fontSize:11,color:'var(--txt2)',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
              </div>
            </div>
          )}

          {/* Holdings table */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'80px 1fr 80px 90px 100px 80px 80px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Symbol','Name','Qty','Buy £','Current £','Value','Gain','Wallet',''].map(h=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {enriched.map((h,i)=>(
              <div key={h.id} style={{display:'grid',gridTemplateColumns:'80px 1fr 80px 90px 100px 80px 80px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<enriched.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                <span style={{fontFamily:'Syne,sans-serif',fontSize:11,fontWeight:700,color:'#ef9f27'}}>{h.symbol}</span>
                <input value={h.coin} onChange={e=>upd(h.id,'coin',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit'}}/>
                <input type="text" inputMode="decimal" value={h.qty||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(h.id,'qty',parseFloat(e.target.value)||0)}} style={{...iS}}/>
                <input type="text" inputMode="decimal" value={h.buyPrice||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(h.id,'buyPrice',parseFloat(e.target.value)||0)}} style={{...iS}}/>
                <input type="text" inputMode="decimal" value={h.currentPrice||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(h.id,'currentPrice',parseFloat(e.target.value)||0)}} style={{...iS}}/>
                <span style={{fontSize:11,fontWeight:500,textAlign:'right',color:'var(--txt)'}}>{fmt(h.value, sym)}</span>
                <span style={{fontSize:11,fontWeight:600,textAlign:'right',color:h.gain>=0?'#1d9e75':'#e24b4a'}}>{h.gainPct>=0?'+':''}{h.gainPct.toFixed(1)}%</span>
                <input value={h.wallet||''} onChange={e=>upd(h.id,'wallet',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt3)',fontFamily:'inherit'}}/>
                <button onClick={()=>setHoldings(p=>p.filter(x=>x.id!==h.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Allocation</div>
          {enriched.map(h=>{
            const pct=totalValue>0?(h.value/totalValue*100):0
            return(
              <div key={h.id} style={{marginBottom:6}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                  <span style={{fontSize:11,color:'var(--txt2)'}}>{h.symbol}</span>
                  <span style={{fontSize:11,fontWeight:600,color:'#ef9f27'}}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:'#ef9f27',borderRadius:2,opacity:.8}}/>
                </div>
                <div style={{fontSize:9,color:'var(--txt3)',textAlign:'right',marginTop:1}}>{fmt(h.value, sym)}</div>
              </div>
            )
          })}
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:10,marginTop:4}}>
            {[{l:'Total invested',v:fmt(totalCost, sym)},{l:'Current value',v:fmt(totalValue, sym)},{l:'Holdings',v:holdings.length}].map(r=>(
              <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--bdr)',fontSize:11}}>
                <span style={{color:'var(--txt3)'}}>{r.l}</span>
                <span style={{color:'var(--txt)',fontWeight:500}}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DividendTracker({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const [holdings,setHoldings]=useState([
    {id:1,ticker:'LLOY',name:'Lloyds Banking',shares:2000,divPerShare:0.028,frequency:'Semi-annual',sector:'Financials',nextPayment:''},
    {id:2,ticker:'NG.',name:'National Grid',shares:500,divPerShare:0.562,frequency:'Annual',sector:'Utilities',nextPayment:''},
    {id:3,ticker:'ULVR',name:'Unilever',shares:150,divPerShare:1.71,frequency:'Quarterly',sector:'Consumer',nextPayment:''},
  ])
  const [payments,setPayments]=useState([])

  const freqMult={Annual:1,Quarterly:4,'Semi-annual':2,Monthly:12}
  const enriched=holdings.map(h=>({
    ...h,
    annualDiv:h.shares*h.divPerShare*(freqMult[h.frequency]||1),
    yieldPct:h.divPerShare>0&&h.shares>0?((h.divPerShare*(freqMult[h.frequency]||1))/100*100):0
  }))
  const totalAnnual=enriched.reduce((s,h)=>s+h.annualDiv,0)
  const totalMonthly=totalAnnual/12

  const upd=(id,k,v)=>{setHoldings(p=>p.map(h=>h.id===id?{...h,[k]:v}:h));save({holdings,payments})}
  const iS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  const FREQS=['Annual','Semi-annual','Quarterly','Monthly']
  const SECTORS=['Financials','Utilities','Consumer','Healthcare','Energy','Technology','Real Estate','Industrials','Other']

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#1d9e75" icon="ti-cash" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<button onClick={()=>setHoldings(p=>[...p,{id:Date.now(),ticker:'',name:'',shares:0,divPerShare:0,frequency:'Annual',sector:'Other',nextPayment:''}])}
          style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#1d9e75',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add stock
        </button>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 240px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {/* Income summary */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[
              {l:'Annual income',v:fmt(totalAnnual, sym),c:'#1d9e75'},
              {l:'Monthly income',v:fmt(totalMonthly, sym),c:'var(--gold)'},
              {l:'Holdings',v:holdings.length,c:'var(--txt)'},
            ].map(s=>(
              <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'11px 13px',textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'70px 1fr 80px 90px 100px 80px 90px 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Ticker','Company','Shares','Div/share','Frequency','Sector','Annual £',''].map(h=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {enriched.map((h,i)=>(
              <div key={h.id} style={{display:'grid',gridTemplateColumns:'70px 1fr 80px 90px 100px 80px 90px 28px',gap:8,padding:'8px 14px',borderBottom:i<enriched.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                <input value={h.ticker} onChange={e=>upd(h.id,'ticker',e.target.value)} style={{...iS,fontFamily:'Syne,sans-serif',fontWeight:700,color:'#1d9e75'}}/>
                <input value={h.name} onChange={e=>upd(h.id,'name',e.target.value)} style={iS}/>
                <input type="text" inputMode="decimal" value={h.shares||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(h.id,'shares',parseInt(e.target.value)||0)}} style={{...iS,textAlign:'right'}}/>
                <input type="text" inputMode="decimal" value={h.divPerShare||''} placeholder="0.00" onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(h.id,'divPerShare',parseFloat(e.target.value)||0)}} style={{...iS,textAlign:'right'}}/>
                <select value={h.frequency} onChange={e=>upd(h.id,'frequency',e.target.value)} style={{...iS,cursor:'pointer',fontSize:10}}>
                  {FREQS.map(f=><option key={f}>{f}</option>)}
                </select>
                <select value={h.sector} onChange={e=>upd(h.id,'sector',e.target.value)} style={{...iS,cursor:'pointer',fontSize:10}}>
                  {SECTORS.map(s=><option key={s}>{s}</option>)}
                </select>
                <span style={{fontSize:11,fontWeight:600,color:'#1d9e75',textAlign:'right'}}>{fmt(h.annualDiv, sym)}</span>
                <button onClick={()=>setHoldings(p=>p.filter(x=>x.id!==h.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Right - income by month/sector */}
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>By sector</div>
          {SECTORS.filter(s=>enriched.some(h=>h.sector===s)).map(s=>{
            const val=enriched.filter(h=>h.sector===s).reduce((sum,h)=>sum+h.annualDiv,0)
            const pct=totalAnnual>0?(val/totalAnnual*100):0
            return(
              <div key={s} style={{marginBottom:4}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                  <span style={{fontSize:10,color:'var(--txt2)'}}>{s}</span>
                  <span style={{fontSize:10,fontWeight:600,color:'#1d9e75'}}>{fmt(val, sym)}</span>
                </div>
                <div style={{height:3,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:'#1d9e75',borderRadius:2,opacity:.8}}/>
                </div>
              </div>
            )
          })}
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:10,marginTop:4}}>
            <div style={{fontSize:11,fontWeight:500,color:'var(--txt)',marginBottom:6}}>Income target</div>
            {[{l:'Monthly',v:fmt(totalMonthly, sym)},{l:'Quarterly',v:fmt(totalAnnual/4, sym)},{l:'Annual',v:fmt(totalAnnual, sym)}].map(r=>(
              <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--bdr)',fontSize:11}}>
                <span style={{color:'var(--txt3)'}}>{r.l}</span>
                <span style={{color:'#1d9e75',fontWeight:600}}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function InvestmentAnalytics({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isScreener=n.includes('screener')
  const isValuation=n.includes('valuation')||n.includes('dcf')
  const isRatio=n.includes('ratio')

  const [stocks,setStocks]=useState([
    {id:1,ticker:'AAPL',name:'Apple Inc',sector:'Tech',pe:28.5,pb:45.2,ps:7.8,roe:160,debtEq:1.8,divYield:0.5,rating:'Buy',notes:''},
    {id:2,ticker:'MSFT',name:'Microsoft',sector:'Tech',pe:32.1,pb:12.3,ps:11.2,roe:38,debtEq:0.6,divYield:0.7,rating:'Buy',notes:''},
    {id:3,ticker:'LLOY',name:'Lloyds',sector:'Finance',pe:7.2,pb:0.6,ps:1.1,roe:11,debtEq:2.1,divYield:6.2,rating:'Hold',notes:''},
  ])
  const RATINGS=['Strong buy','Buy','Hold','Sell','Strong sell']
  const rColor={'Strong buy':'#1d9e75','Buy':'#5dcaa5','Hold':'#ba7517','Sell':'#d4537e','Strong sell':'#e24b4a'}
  const upd=(id,k,v)=>{setStocks(p=>p.map(s=>s.id===id?{...s,[k]:v}:s));save({stocks})}
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  const numS={...cS,textAlign:'right'}
  const SECTORS=['Tech','Finance','Healthcare','Energy','Consumer','Industrials','Real Estate','Utilities','Other']

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#7f77dd" icon="ti-chart-histogram" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<button onClick={()=>setStocks(p=>[...p,{id:Date.now(),ticker:'',name:'',sector:'Tech',pe:0,pb:0,ps:0,roe:0,debtEq:0,divYield:0,rating:'Hold',notes:''}])}
          style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#7f77dd',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add stock
        </button>}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        {/* Filter/screener summary */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            {l:'Stocks',v:stocks.length,c:'var(--txt)'},
            {l:'Buy rated',v:stocks.filter(s=>['Buy','Strong buy'].includes(s.rating)).length,c:'#1d9e75'},
            {l:'Avg P/E',v:(stocks.reduce((s,x)=>s+x.pe,0)/stocks.length||0).toFixed(1),c:'#7f77dd'},
            {l:'Avg dividend yield',v:`${(stocks.reduce((s,x)=>s+x.divYield,0)/stocks.length||0).toFixed(2)}%`,c:'var(--gold)'},
          ].map(s=>(
            <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'70px 1fr 100px 60px 60px 60px 60px 60px 60px 80px 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:6}}>
            {['Ticker','Name','Sector','P/E','P/B','P/S','ROE%','D/E','Div%','Rating',''].map(h=>(
              <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
            ))}
          </div>
          {stocks.map((s,i)=>(
            <div key={s.id} style={{display:'grid',gridTemplateColumns:'70px 1fr 100px 60px 60px 60px 60px 60px 60px 80px 28px',gap:6,padding:'7px 14px',borderBottom:i<stocks.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
              <input value={s.ticker} onChange={e=>upd(s.id,'ticker',e.target.value)} style={{...cS,fontFamily:'Syne,sans-serif',fontWeight:700,color:'#7f77dd'}}/>
              <input value={s.name} onChange={e=>upd(s.id,'name',e.target.value)} style={cS}/>
              <select value={s.sector} onChange={e=>upd(s.id,'sector',e.target.value)} style={{...cS,fontSize:10,cursor:'pointer'}}>
                {SECTORS.map(x=><option key={x}>{x}</option>)}
              </select>
              {['pe','pb','ps','roe','debtEq','divYield'].map(k=>(
                <input key={k} type="text" inputMode="decimal" value={s[k]||''} placeholder="0"
                  onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(s.id,k,parseFloat(e.target.value)||0)}}
                  style={numS}/>
              ))}
              <select value={s.rating} onChange={e=>upd(s.id,'rating',e.target.value)} style={{...cS,color:rColor[s.rating]||'var(--txt)',fontWeight:700,cursor:'pointer',fontSize:10}}>
                {RATINGS.map(r=><option key={r}>{r}</option>)}
              </select>
              <button onClick={()=>setStocks(p=>p.filter(x=>x.id!==s.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
        </div>

        <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:10,padding:12,fontSize:11,color:'var(--txt2)',lineHeight:1.7}}>
          💡 <strong>P/E</strong> Price/Earnings · <strong>P/B</strong> Price/Book · <strong>P/S</strong> Price/Sales · <strong>ROE</strong> Return on Equity · <strong>D/E</strong> Debt/Equity · <strong>Div%</strong> Dividend Yield
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTIVITY & LIFE — SPECIFIC COMPONENTS
// ═══════════════════════════════════════════════════════════════

export function FitnessTracker({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isRun=n.includes('run')||n.includes('cardio')
  const isStrength=n.includes('strength')||n.includes('weight')||n.includes('gym')
  const isBody=n.includes('body')||n.includes('weight loss')||n.includes('bmi')
  const isSteps=n.includes('steps')||n.includes('walking')

  const [logs,setLogs]=useState([
    {id:1,date:new Date().toISOString().split('T')[0],exercise:'',sets:0,reps:0,weight:0,duration:0,distance:0,calories:0,notes:''},
  ])
  const [stats,setStats]=useState({weight:0,height:0,targetWeight:0,weeklyGoal:4})

  const upd=(id,k,v)=>{setLogs(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));save({logs,stats})}
  const add=()=>setLogs(p=>[...p,{id:Date.now(),date:new Date().toISOString().split('T')[0],exercise:'',sets:0,reps:0,weight:0,duration:0,distance:0,calories:0,notes:''}])

  const bmi=stats.height>0?(stats.weight/((stats.height/100)**2)):0
  const bmiLabel=bmi<18.5?'Underweight':bmi<25?'Normal':bmi<30?'Overweight':'Obese'
  const bmiColor=bmi<18.5?'#378add':bmi<25?'#1d9e75':bmi<30?'#ba7517':'#e24b4a'

  const thisWeek=logs.filter(l=>{const d=new Date(l.date),now=new Date();return(now-d)/86400000<=7}).length
  const totalCals=logs.reduce((s,l)=>s+(l.calories||0),0)

  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  const cols=isBody?['Date','Metric','Value','Unit','Notes']:
    isRun?['Date','Activity','Duration (min)','Distance (km)','Pace','Calories','Notes']:
    isStrength?['Date','Exercise','Sets','Reps','Weight (kg)','Volume','Notes']:
    ['Date','Exercise','Duration (min)','Distance','Calories','Intensity','Notes']

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#d4537e" icon={isRun?'ti-run':isStrength?'ti-barbell':isBody?'ti-scale':'ti-activity'} isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {[
              {l:'This week',v:`${thisWeek}/${stats.weeklyGoal} sessions`,c:thisWeek>=stats.weeklyGoal?'#1d9e75':'#ba7517'},
              {l:'Total sessions',v:logs.length,c:'var(--txt)'},
              {l:'Total calories',v:totalCals.toLocaleString(),c:'#d4537e'},
              {l:'BMI',v:bmi>0?bmi.toFixed(1):'—',c:bmiColor},
            ].map(s=>(
              <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Log table */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${cols.length-1},1fr) 1fr 28px`,padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:6}}>
              {cols.map(h=><div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>)}
              <div/>
            </div>
            {logs.map((row,i)=>(
              <div key={row.id} style={{display:'grid',gridTemplateColumns:`repeat(${cols.length-1},1fr) 1fr 28px`,gap:6,padding:'7px 14px',borderBottom:i<logs.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                <input type="date" value={row.date} onChange={e=>upd(row.id,'date',e.target.value)} style={{...cS,fontSize:10}}/>
                <input value={row.exercise} onChange={e=>upd(row.id,'exercise',e.target.value)} placeholder="Exercise..." style={cS}/>
                {isStrength&&<>
                  <input type="text" inputMode="decimal" value={row.sets||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'sets',parseInt(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                  <input type="text" inputMode="decimal" value={row.reps||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'reps',parseInt(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                  <input type="text" inputMode="decimal" value={row.weight||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(row.id,'weight',parseFloat(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                  <span style={{fontSize:11,color:'var(--txt3)',textAlign:'right'}}>{((row.sets||0)*(row.reps||0)*(row.weight||0)).toLocaleString()} kg</span>
                </>}
                {(isRun||(!isStrength&&!isBody))&&<>
                  <input type="text" inputMode="decimal" value={row.duration||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'duration',parseInt(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                  <input type="text" inputMode="decimal" value={row.distance||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(row.id,'distance',parseFloat(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                  <input type="text" inputMode="decimal" value={row.calories||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(row.id,'calories',parseInt(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                </>}
                <input value={row.notes||''} onChange={e=>upd(row.id,'notes',e.target.value)} placeholder="Notes..." style={cS}/>
                <button onClick={()=>setLogs(p=>p.filter(r=>r.id!==row.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
            <div style={{padding:'8px 14px'}}>
              <button onClick={add} style={{fontSize:11,color:'#d4537e',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
                <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Log session
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Body stats</div>
          {[
            {l:'Weight (kg)',k:'weight'},{l:'Height (cm)',k:'height'},{l:'Target weight',k:'targetWeight'},{l:'Sessions/week goal',k:'weeklyGoal'},
          ].map(f=>(
            <div key={f.k} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:8,padding:'8px 10px'}}>
              <div style={{fontSize:10,color:'var(--txt3)',marginBottom:4}}>{f.l}</div>
              <input type="text" inputMode="decimal" value={stats[f.k]||''} placeholder="0"
                onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value)){const v=parseFloat(e.target.value)||0;setStats(p=>({...p,[f.k]:v}));save({logs,stats:{...stats,[f.k]:v}})}}}
                style={{width:'100%',background:'transparent',border:'none',outline:'none',fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:'var(--gold)',textAlign:'right'}}/>
            </div>
          ))}
          {bmi>0&&(
            <div style={{background:`${bmiColor}14`,border:`1px solid ${bmiColor}44`,borderRadius:9,padding:12,textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:28,fontWeight:700,color:bmiColor}}>{bmi.toFixed(1)}</div>
              <div style={{fontSize:12,color:bmiColor,fontWeight:600}}>{bmiLabel}</div>
              <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>BMI score</div>
            </div>
          )}
          {stats.weight>0&&stats.targetWeight>0&&(
            <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:10}}>
              <div style={{fontSize:10,color:'var(--txt3)',marginBottom:4}}>To target weight</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:'var(--gold)'}}>{Math.abs(stats.weight-stats.targetWeight).toFixed(1)} kg {stats.weight>stats.targetWeight?'to lose':'to gain'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function MealPlanner({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isGrocery=n.includes('grocery')||n.includes('shopping')
  const isMacro=n.includes('macro')||n.includes('calorie')||n.includes('nutrition')
  const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  const MEALS=['Breakfast','Lunch','Dinner','Snack']

  const [plan,setPlan]=useState(()=>{
    const p={}
    DAYS.forEach(d=>{p[d]={};MEALS.forEach(m=>{p[d][m]={meal:'',calories:0,protein:0,carbs:0,fat:0}})})
    return p
  })
  const [grocery,setGrocery]=useState([
    {id:1,item:'',category:'Produce',qty:'',unit:'',done:false},
  ])

  const totals=DAYS.reduce((acc,d)=>{
    MEALS.forEach(m=>{
      acc.calories+=(plan[d]?.[m]?.calories||0)
      acc.protein+=(plan[d]?.[m]?.protein||0)
      acc.carbs+=(plan[d]?.[m]?.carbs||0)
      acc.fat+=(plan[d]?.[m]?.fat||0)
    })
    return acc
  },{calories:0,protein:0,carbs:0,fat:0})

  const updMeal=(day,meal,k,v)=>{
    setPlan(p=>{const n={...p,[day]:{...p[day],[meal]:{...p[day]?.[meal],[k]:v}}};save({plan:n,grocery});return n})
  }
  const CAT=['Produce','Meat & Fish','Dairy','Grains','Frozen','Canned','Snacks','Drinks','Other']
  const CATS_COLOR={Produce:'#1d9e75','Meat & Fish':'#d4537e',Dairy:'#378add',Grains:'#ba7517',Frozen:'#7f77dd',Canned:'#5dcaa5',Snacks:'#ef9f27',Drinks:'#378add',Other:'var(--txt3)'}

  if(isGrocery) return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#1d9e75" icon="ti-shopping-cart" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<div style={{fontSize:11,color:'var(--txt2)'}}>{grocery.filter(g=>g.done).length}/{grocery.length} done</div>}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setGrocery(p=>[...p,{id:Date.now(),item:'',category:'Produce',qty:'',unit:'',done:false}])}
            style={{padding:'8px 14px',borderRadius:8,border:'none',background:'#1d9e75',fontSize:12,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:5}}>
            <i className="ti ti-plus" style={{fontSize:12}} aria-hidden="true"/> Add item
          </button>
          <button onClick={()=>setGrocery(p=>p.filter(g=>!g.done))}
            style={{padding:'8px 14px',borderRadius:8,border:'1px solid var(--bdr)',background:'transparent',fontSize:12,color:'var(--txt2)',cursor:'pointer',fontFamily:'inherit'}}>
            Clear done
          </button>
        </div>
        {CAT.filter(c=>grocery.some(g=>g.category===c)).map(cat=>(
          <div key={cat} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',fontSize:12,fontWeight:600,color:CATS_COLOR[cat]||'var(--txt)',display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:CATS_COLOR[cat]||'var(--txt3)'}}/>
              {cat} ({grocery.filter(g=>g.category===cat).length})
            </div>
            {grocery.filter(g=>g.category===cat).map((item,i,arr)=>(
              <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:i<arr.length-1?'1px solid var(--bdr)':'none',opacity:item.done?.6:1}}>
                <div onClick={()=>setGrocery(p=>p.map(g=>g.id===item.id?{...g,done:!g.done}:g))}
                  style={{width:20,height:20,borderRadius:6,border:`2px solid ${item.done?'#1d9e75':'var(--bdr2)'}`,background:item.done?'#1d9e75':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                  {item.done&&<i className="ti ti-check" style={{fontSize:11,color:'#fff'}} aria-hidden="true"/>}
                </div>
                <input value={item.item} onChange={e=>setGrocery(p=>p.map(g=>g.id===item.id?{...g,item:e.target.value}:g))}
                  placeholder="Item..." style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:12,color:item.done?'var(--txt3)':'var(--txt)',fontFamily:'inherit',textDecoration:item.done?'line-through':'none'}}/>
                <input value={item.qty||''} onChange={e=>setGrocery(p=>p.map(g=>g.id===item.id?{...g,qty:e.target.value}:g))}
                  placeholder="Qty" style={{width:50,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                <select value={item.category} onChange={e=>setGrocery(p=>p.map(g=>g.id===item.id?{...g,category:e.target.value}:g))}
                  style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:10,color:'var(--txt)',fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
                  {CAT.map(c=><option key={c}>{c}</option>)}
                </select>
                <button onClick={()=>setGrocery(p=>p.filter(g=>g.id!==item.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
                  <i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/>
                </button>
              </div>
            ))}
          </div>
        ))}
        {grocery.every(g=>g.category!==CAT[0])&&grocery.length===0&&(
          <div style={{textAlign:'center',padding:'60px 20px',color:'var(--txt3)'}}>
            <i className="ti ti-shopping-cart" style={{fontSize:36,display:'block',marginBottom:12}} aria-hidden="true"/>
            <div style={{fontSize:13,fontWeight:500,color:'var(--txt)'}}>Your list is empty</div>
            <div style={{fontSize:11,marginTop:4}}>Click "Add item" to get started</div>
          </div>
        )}
      </div>
    </div>
  )

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#5dcaa5" icon="ti-salad" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {DAYS.map(day=>(
            <div key={day} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>{day}</div>
              {MEALS.map((meal,mi)=>(
                <div key={meal} style={{display:'grid',gridTemplateColumns:'90px 1fr 80px 70px 70px 60px',gap:8,padding:'6px 14px',borderBottom:mi<MEALS.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                  <span style={{fontSize:10,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{meal}</span>
                  <input value={plan[day]?.[meal]?.meal||''} onChange={e=>updMeal(day,meal,'meal',e.target.value)}
                    placeholder="What are you eating?" style={{background:'transparent',border:'none',outline:'none',fontSize:12,color:'var(--txt)',fontFamily:'inherit'}}/>
                  {isMacro&&<>
                    <input type="text" inputMode="decimal" value={plan[day]?.[meal]?.calories||''} placeholder="kcal" onChange={e=>{if(/^\d*$/.test(e.target.value))updMeal(day,meal,'calories',parseInt(e.target.value)||0)}} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:10,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                    <input type="text" inputMode="decimal" value={plan[day]?.[meal]?.protein||''} placeholder="P(g)" onChange={e=>{if(/^\d*$/.test(e.target.value))updMeal(day,meal,'protein',parseInt(e.target.value)||0)}} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:10,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                    <input type="text" inputMode="decimal" value={plan[day]?.[meal]?.carbs||''} placeholder="C(g)" onChange={e=>{if(/^\d*$/.test(e.target.value))updMeal(day,meal,'carbs',parseInt(e.target.value)||0)}} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:10,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                    <input type="text" inputMode="decimal" value={plan[day]?.[meal]?.fat||''} placeholder="F(g)" onChange={e=>{if(/^\d*$/.test(e.target.value))updMeal(day,meal,'fat',parseInt(e.target.value)||0)}} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:10,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                  </>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Weekly totals</div>
          {[
            {l:'Calories',v:`${totals.calories.toLocaleString()} kcal`,c:'var(--gold)'},
            {l:'Protein',v:`${totals.protein}g`,c:'#378add'},
            {l:'Carbs',v:`${totals.carbs}g`,c:'#ba7517'},
            {l:'Fat',v:`${totals.fat}g`,c:'#d4537e'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:10,marginTop:4,fontSize:11,color:'var(--txt2)',lineHeight:1.6}}>
            💡 Daily avg: {Math.round(totals.calories/7)} kcal · {Math.round(totals.protein/7)}g protein
          </div>
        </div>
      </div>
    </div>
  )
}

export function WellnessTracker({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isSleep=n.includes('sleep')
  const isMood=n.includes('mood')
  const isMindful=n.includes('mindful')||n.includes('meditation')
  const isStress=n.includes('stress')||n.includes('anxiety')
  const isGratitude=n.includes('gratitude')

  const MOODS=['😴','😟','😐','🙂','😊','😄','🤩']
  const SLEEP_Q=['Poor','Fair','Good','Great','Perfect']
  const sqColor={Poor:'#e24b4a',Fair:'#ba7517',Good:'#ba7517',Great:'#1d9e75',Perfect:'#1d9e75'}

  const [entries,setEntries]=useState([
    {id:1,date:new Date().toISOString().split('T')[0],mood:'😊',moodScore:5,sleepHours:7.5,sleepQuality:'Good',stress:3,energy:6,meditation:0,gratitude:'',notes:''},
  ])
  const add=()=>setEntries(p=>[{id:Date.now(),date:new Date().toISOString().split('T')[0],mood:'😊',moodScore:5,sleepHours:7.5,sleepQuality:'Good',stress:3,energy:6,meditation:0,gratitude:'',notes:''},...p])
  const upd=(id,k,v)=>{setEntries(p=>p.map(e=>e.id===id?{...e,[k]:v}:e));save({entries})}

  const avgMood=entries.length>0?(entries.reduce((s,e)=>s+e.moodScore,0)/entries.length):0
  const avgSleep=entries.length>0?(entries.reduce((s,e)=>s+e.sleepHours,0)/entries.length):0
  const avgStress=entries.length>0?(entries.reduce((s,e)=>s+e.stress,0)/entries.length):0

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#7f77dd" icon={isSleep?'ti-moon':isMood?'ti-mood-smile':isMindful?'ti-brain':'ti-heart'} isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<button onClick={add} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#7f77dd',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Log today
        </button>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {/* Avg stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[
              {l:'Avg mood',v:`${avgMood.toFixed(1)}/7`,c:'#7f77dd'},
              {l:'Avg sleep',v:`${avgSleep.toFixed(1)}h`,c:'#378add'},
              {l:'Avg stress',v:`${avgStress.toFixed(1)}/10`,c:avgStress<5?'#1d9e75':'#e24b4a'},
            ].map(s=>(
              <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          {entries.map(entry=>(
            <div key={entry.id} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,padding:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <input type="date" value={entry.date} onChange={e=>upd(entry.id,'date',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--txt)',cursor:'pointer'}}/>
                <div style={{display:'flex',gap:3,marginLeft:'auto'}}>
                  {MOODS.map((m,mi)=>(
                    <button key={m} onClick={()=>upd(entry.id,'mood',m)||upd(entry.id,'moodScore',mi+1)}
                      style={{fontSize:18,background:'none',border:`2px solid ${entry.mood===m?'#7f77dd':'transparent'}`,borderRadius:6,cursor:'pointer',padding:1,opacity:entry.mood===m?1:.4,transition:'all .15s'}}>
                      {m}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setEntries(p=>p.filter(e=>e.id!==entry.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2,marginLeft:4}}>
                  <i className="ti ti-x" style={{fontSize:12,color:'var(--txt3)'}} aria-hidden="true"/>
                </button>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
                {/* Sleep */}
                <div>
                  <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
                    <i className="ti ti-moon" style={{fontSize:11}} aria-hidden="true"/> Sleep
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <input type="text" inputMode="decimal" value={entry.sleepHours||''} placeholder="7.5"
                      onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(entry.id,'sleepHours',parseFloat(e.target.value)||0)}}
                      style={{width:60,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'5px 8px',fontSize:13,fontWeight:600,color:'#378add',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                    <span style={{fontSize:11,color:'var(--txt3)'}}>hrs</span>
                    <select value={entry.sleepQuality} onChange={e=>upd(entry.id,'sleepQuality',e.target.value)}
                      style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'5px 8px',fontSize:11,color:sqColor[entry.sleepQuality],fontWeight:600,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
                      {SLEEP_Q.map(q=><option key={q}>{q}</option>)}
                    </select>
                  </div>
                </div>

                {/* Stress & Energy */}
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {[{l:'Stress level',k:'stress',c:'#d4537e'},{l:'Energy level',k:'energy',c:'#1d9e75'}].map(f=>(
                    <div key={f.k} style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:10,color:'var(--txt3)',width:70,flexShrink:0}}>{f.l}</span>
                      <input type="range" min="1" max="10" value={entry[f.k]||5} onChange={e=>upd(entry.id,f.k,parseInt(e.target.value))} style={{flex:1,accentColor:f.c}}/>
                      <span style={{fontSize:11,fontWeight:600,color:f.c,width:20,textAlign:'right'}}>{entry[f.k]}</span>
                    </div>
                  ))}
                </div>

                {/* Meditation & gratitude */}
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <i className="ti ti-brain" style={{fontSize:12,color:'#7f77dd'}} aria-hidden="true"/>
                  <span style={{fontSize:11,color:'var(--txt3)'}}>Meditation</span>
                  <input type="text" inputMode="decimal" value={entry.meditation||''} placeholder="0"
                    onChange={e=>{if(/^\d*$/.test(e.target.value))upd(entry.id,'meditation',parseInt(e.target.value)||0)}}
                    style={{width:50,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 6px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                  <span style={{fontSize:10,color:'var(--txt3)'}}>min</span>
                </div>

                <div>
                  <input value={entry.gratitude||''} onChange={e=>upd(entry.id,'gratitude',e.target.value)}
                    placeholder="I'm grateful for..."
                    style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 10px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}/>
                </div>
              </div>

              {entry.notes!==undefined&&(
                <input value={entry.notes||''} onChange={e=>upd(entry.id,'notes',e.target.value)} placeholder="Notes for today..."
                  style={{width:'100%',marginTop:10,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 10px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}/>
              )}
            </div>
          ))}
        </div>

        {/* Trends sidebar */}
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Trends</div>
          {entries.length>1&&(
            <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:12}}>
              <div style={{fontSize:11,fontWeight:500,color:'var(--txt)',marginBottom:8}}>Mood (last {Math.min(entries.length,7)} days)</div>
              <div style={{display:'flex',gap:3,alignItems:'flex-end',height:40}}>
                {entries.slice(0,7).reverse().map((e,i)=>{
                  const h=Math.max(4,e.moodScore/7*36)
                  return<div key={e.id} style={{flex:1,height:h,background:'#7f77dd',borderRadius:2,opacity:.5+i/7*.5}} title={e.mood}/>
                })}
              </div>
            </div>
          )}
          {[
            {l:'Entries logged',v:entries.length,c:'var(--txt)'},
            {l:'Best mood',v:MOODS[Math.max(0,Math.round(Math.max(...entries.map(e=>e.moodScore||1))-1))],c:'var(--txt)'},
            {l:'Avg meditation',v:`${Math.round(entries.reduce((s,e)=>s+e.meditation,0)/entries.length)}min`,c:'#7f77dd'},
            {l:'Best sleep',v:`${Math.max(...entries.map(e=>e.sleepHours||0)).toFixed(1)}h`,c:'#378add'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HomeManager({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isChore=n.includes('chore')||n.includes('clean')
  const isBill=n.includes('bill')||n.includes('utilities')
  const isInventory=n.includes('inventory')||n.includes('household item')
  const isFamily=n.includes('family')||n.includes('kid')

  const FREQ=['Daily','Weekly','Bi-weekly','Monthly','Quarterly','Annually']
  const CATS=isChore?['Kitchen','Bathroom','Bedroom','Living room','Garden','Laundry','Other']:
    isBill?['Utilities','Rent/Mortgage','Internet','Phone','Insurance','Subscriptions','Other']:
    ['Food','Cleaning','Electronics','Furniture','Garden','Kids','Other']

  const STATUS_CHK=['To do','In progress','Done','Skip']
  const sColor={'To do':'var(--txt3)','In progress':'#ba7517','Done':'#1d9e75','Skip':'var(--txt3)','Paid':'#1d9e75','Unpaid':'#e24b4a','Pending':'#ba7517'}

  const [items,setItems]=useState([
    {id:1,name:'',category:CATS[0],frequency:isChore?'Weekly':isInventory?'':isFamily?'Weekly':'Monthly',assignee:'',amount:0,dueDate:'',status:isChore?'To do':isBill?'Unpaid':'In stock',notes:''},
  ])
  const upd=(id,k,v)=>{setItems(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));save({items})}
  const add=()=>setItems(p=>[...p,{id:Date.now(),name:'',category:CATS[0],frequency:isChore?'Weekly':'Monthly',assignee:'',amount:0,dueDate:'',status:isChore?'To do':isBill?'Unpaid':'In stock',notes:''}])
  const STATUS=isChore?STATUS_CHK:isBill?['Unpaid','Paid','Pending']:['In stock','Low','Out of stock','Disposed']
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}

  const totalBills=isBill?items.reduce((s,r)=>s+(r.amount||0),0):0
  const unpaid=isBill?items.filter(r=>r.status==='Unpaid').reduce((s,r)=>s+(r.amount||0),0):0

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#5dcaa5" icon={isChore?'ti-home-check':isBill?'ti-receipt':isFamily?'ti-users':'ti-home'} isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<div style={{display:'flex',gap:8,alignItems:'center'}}>
          {isBill&&<span style={{fontSize:11,color:'#e24b4a',fontWeight:600}}>Unpaid: {fmt(unpaid, sym)}</span>}
          <button onClick={add} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#5dcaa5',fontSize:11,fontWeight:600,color:'#0c0c12',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
            <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add
          </button>
        </div>}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        {isBill&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[{l:'Monthly total',v:fmt(totalBills, sym),c:'var(--txt)'},{l:'Unpaid',v:fmt(unpaid, sym),c:'#e24b4a'},{l:'Paid',v:fmt(totalBills-unpaid, sym),c:'#1d9e75'}].map(s=>(
              <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'11px 13px',textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:`${isBill?'1fr 100px 90px 100px 80px 1fr':'1fr 100px 100px 100px 110px 1fr'} 28px`,padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
            {(isBill?['Name','Category','Amount £','Due date','Status','Notes']:
              isChore?['Task','Category','Frequency','Assignee','Status','Notes']:
              ['Item','Category','Quantity','Location','Status','Notes']).map(h=>(
              <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
            ))}
            <div/>
          </div>
          {items.map((item,i)=>(
            <div key={item.id} style={{display:'grid',gridTemplateColumns:`${isBill?'1fr 100px 90px 100px 80px 1fr':'1fr 100px 100px 100px 110px 1fr'} 28px`,gap:8,padding:'7px 14px',borderBottom:i<items.length-1?'1px solid var(--bdr)':'none',alignItems:'center',background:item.status==='Unpaid'||item.status==='Out of stock'?'rgba(226,75,74,.03)':'transparent'}}>
              <input value={item.name} onChange={e=>upd(item.id,'name',e.target.value)} placeholder="Name..." style={cS}/>
              <select value={item.category} onChange={e=>upd(item.id,'category',e.target.value)} style={{...cS,cursor:'pointer',fontSize:10}}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
              {isBill?(
                <input type="text" inputMode="decimal" value={item.amount||''} onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(item.id,'amount',parseFloat(e.target.value)||0)}} placeholder="0" style={{...cS,textAlign:'right'}}/>
              ):(
                <select value={item.frequency||FREQ[0]} onChange={e=>upd(item.id,'frequency',e.target.value)} style={{...cS,cursor:'pointer',fontSize:10}}>
                  {FREQ.map(f=><option key={f}>{f}</option>)}
                </select>
              )}
              <input type={isBill?'date':'text'} value={isBill?(item.dueDate||''):(item.assignee||'')} onChange={e=>upd(item.id,isBill?'dueDate':'assignee',e.target.value)} placeholder={isBill?'':'Who...'} style={{...cS,fontSize:isBill?10:11}}/>
              <select value={item.status||STATUS[0]} onChange={e=>upd(item.id,'status',e.target.value)} style={{...cS,color:sColor[item.status]||'var(--txt)',fontWeight:600,cursor:'pointer',fontSize:10}}>
                {STATUS.map(s=><option key={s}>{s}</option>)}
              </select>
              <input value={item.notes||''} onChange={e=>upd(item.id,'notes',e.target.value)} placeholder="Notes..." style={cS}/>
              <button onClick={()=>setItems(p=>p.filter(r=>r.id!==item.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
            </div>
          ))}
          <div style={{padding:'8px 14px'}}>
            <button onClick={add} style={{fontSize:11,color:'#5dcaa5',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
              <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add row
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TimeTracker({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const [sessions,setSessions]=useState([
    {id:1,date:new Date().toISOString().split('T')[0],task:'',category:'Deep work',duration:0,notes:''},
  ])
  const [active,setActive]=useState(null)
  const [elapsed,setElapsed]=useState(0)
  const CATS=['Deep work','Meetings','Admin','Learning','Creative','Exercise','Personal','Other']
  const catColor={'Deep work':'#7f77dd','Meetings':'#378add','Admin':'var(--txt3)','Learning':'#5dcaa5','Creative':'#d4537e','Exercise':'#1d9e75','Personal':'var(--gold)','Other':'var(--txt3)'}

  useEffect(()=>{
    if(!active) return
    const t=setInterval(()=>setElapsed(e=>e+1),1000)
    return()=>clearInterval(t)
  },[active])

  const startTimer=(id)=>{setActive(id);setElapsed(0)}
  const stopTimer=(id)=>{
    setSessions(p=>p.map(s=>s.id===id?{...s,duration:s.duration+Math.round(elapsed/60)}:s))
    save({sessions})
    setActive(null);setElapsed(0)
  }

  const upd=(id,k,v)=>{setSessions(p=>p.map(s=>s.id===id?{...s,[k]:v}:s));save({sessions})}
  const add=()=>setSessions(p=>[...p,{id:Date.now(),date:new Date().toISOString().split('T')[0],task:'',category:'Deep work',duration:0,notes:''}])
  const totalMins=sessions.reduce((s,r)=>s+r.duration,0)
  const totalHrs=(totalMins/60).toFixed(1)
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}

  const fmtTime=s=>`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#7f77dd" icon="ti-clock-hour-3" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {/* Active timer */}
          {active&&(
            <div style={{background:'rgba(127,119,221,.1)',border:'2px solid #7f77dd44',borderRadius:12,padding:14,textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:36,fontWeight:700,color:'#7f77dd',letterSpacing:'0.05em'}}>{fmtTime(elapsed)}</div>
              <div style={{fontSize:11,color:'var(--txt2)',marginTop:4}}>{sessions.find(s=>s.id===active)?.task||'Timing...'}</div>
              <button onClick={()=>stopTimer(active)} style={{marginTop:10,padding:'8px 20px',borderRadius:8,border:'none',background:'#e24b4a',fontSize:12,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif'}}>
                Stop & save
              </button>
            </div>
          )}

          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'100px 1fr 110px 80px 1fr 60px 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Date','Task','Category','Minutes','Notes','Timer',''].map(h=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {sessions.map((s,i)=>(
              <div key={s.id} style={{display:'grid',gridTemplateColumns:'100px 1fr 110px 80px 1fr 60px 28px',gap:8,padding:'7px 14px',borderBottom:i<sessions.length-1?'1px solid var(--bdr)':'none',alignItems:'center',background:active===s.id?'rgba(127,119,221,.05)':'transparent'}}>
                <input type="date" value={s.date} onChange={e=>upd(s.id,'date',e.target.value)} style={{...cS,fontSize:10}}/>
                <input value={s.task} onChange={e=>upd(s.id,'task',e.target.value)} placeholder="Task..." style={cS}/>
                <select value={s.category} onChange={e=>upd(s.id,'category',e.target.value)} style={{...cS,color:catColor[s.category]||'var(--txt)',fontWeight:600,cursor:'pointer',fontSize:10}}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
                <input type="text" inputMode="decimal" value={s.duration||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(s.id,'duration',parseInt(e.target.value)||0)}} placeholder="0" style={{...cS,textAlign:'right'}}/>
                <input value={s.notes||''} onChange={e=>upd(s.id,'notes',e.target.value)} placeholder="Notes..." style={cS}/>
                <button onClick={()=>active===s.id?stopTimer(s.id):startTimer(s.id)}
                  style={{padding:'5px 8px',borderRadius:6,border:'none',background:active===s.id?'#e24b4a':'rgba(127,119,221,.15)',fontSize:10,fontWeight:600,color:active===s.id?'#fff':'#7f77dd',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:3}}>
                  <i className={`ti ${active===s.id?'ti-player-stop':'ti-player-play'}`} style={{fontSize:10}} aria-hidden="true"/>
                  {active===s.id?'Stop':'Start'}
                </button>
                <button onClick={()=>setSessions(p=>p.filter(r=>r.id!==s.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
            <div style={{padding:'8px 14px'}}>
              <button onClick={add} style={{fontSize:11,color:'#7f77dd',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
                <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add session
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Summary</div>
          <div style={{background:'rgba(127,119,221,.1)',border:'1px solid #7f77dd44',borderRadius:12,padding:14,textAlign:'center'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:30,fontWeight:700,color:'#7f77dd'}}>{totalHrs}h</div>
            <div style={{fontSize:11,color:'var(--txt2)',marginTop:2}}>{totalMins} minutes total</div>
          </div>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:11,fontWeight:600,color:'var(--txt)'}}>By category</div>
          {CATS.filter(c=>sessions.some(s=>s.category===c)).map(cat=>{
            const mins=sessions.filter(s=>s.category===cat).reduce((a,s)=>a+s.duration,0)
            const pct=totalMins>0?(mins/totalMins*100):0
            return(
              <div key={cat} style={{marginBottom:4}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                  <span style={{fontSize:10,color:catColor[cat]||'var(--txt2)',fontWeight:600}}>{cat}</span>
                  <span style={{fontSize:10,color:'var(--txt2)'}}>{(mins/60).toFixed(1)}h</span>
                </div>
                <div style={{height:3,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:catColor[cat]||'#7f77dd',borderRadius:2}}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function DailyPlannerTool({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isWeekly=n.includes('weekly')
  const isMonthly=n.includes('monthly')
  const today=new Date().toISOString().split('T')[0]
  const [date,setDate]=useState(today)
  const [tasks,setTasks]=useState([
    {id:1,time:'09:00',task:'',priority:'High',category:'Work',done:false},
    {id:2,time:'10:00',task:'',priority:'Medium',category:'Work',done:false},
    {id:3,time:'12:00',task:'',priority:'Low',category:'Personal',done:false},
  ])
  const [topThree,setTopThree]=useState(['','',''])
  const [notes,setNotes]=useState('')
  const PRIO=['Low','Medium','High','Critical']
  const CATS=['Work','Personal','Health','Finance','Learning','Other']
  const pColor={Low:'var(--txt3)',Medium:'#378add',High:'#ba7517',Critical:'#e24b4a'}
  const done=tasks.filter(t=>t.done).length
  const pct=tasks.length>0?Math.round(done/tasks.length*100):0

  const upd=(id,k,v)=>{setTasks(p=>p.map(t=>t.id===id?{...t,[k]:v}:t));save({tasks,topThree,notes,date})}
  const add=()=>setTasks(p=>[...p,{id:Date.now(),time:'09:00',task:'',priority:'Medium',category:'Work',done:false}])

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#7f77dd" icon="ti-sun" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<div style={{display:'flex',alignItems:'center',gap:10}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:7,padding:'5px 10px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',cursor:'pointer'}}/>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:pct===100?'#1d9e75':'var(--gold)'}}>{pct}%</div>
        </div>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'240px 1fr',overflow:'hidden',minHeight:0}}>
        {/* Left sidebar */}
        <div style={{borderRight:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:10,padding:12}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:11,fontWeight:700,color:'var(--txt)',marginBottom:8}}>🎯 Top 3 priorities</div>
            {topThree.map((p,i)=>(
              <input key={i} value={p} onChange={e=>setTopThree(prev=>{const n=[...prev];n[i]=e.target.value;save({tasks,topThree:n,notes,date});return n})}
                placeholder={`Priority ${i+1}...`}
                style={{width:'100%',background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',marginBottom:6}}/>
            ))}
          </div>
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:10,padding:12}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:11,fontWeight:700,color:'var(--txt)',marginBottom:6}}>Progress</div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:11}}>
              <span style={{color:'var(--txt2)'}}>{done}/{tasks.length} tasks</span>
              <span style={{color:pct===100?'#1d9e75':'var(--gold)',fontWeight:700}}>{pct}%</span>
            </div>
            <div style={{height:6,background:'var(--bg4)',borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:pct===100?'#1d9e75':'#7f77dd',borderRadius:3,transition:'width .4s'}}/>
            </div>
          </div>
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:10,padding:12}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:11,fontWeight:700,color:'var(--txt)',marginBottom:6}}>📝 Notes</div>
            <textarea value={notes} onChange={e=>{setNotes(e.target.value);save({tasks,topThree,notes:e.target.value,date})}} rows={4}
              style={{width:'100%',background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:6,padding:'7px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',resize:'none'}}/>
          </div>
        </div>
        {/* Right - task list */}
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:8}}>
          {[...tasks].sort((a,b)=>a.time.localeCompare(b.time)).map(task=>(
            <div key={task.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:task.done?'var(--bg3)':'var(--bg2)',border:`1px solid ${task.done?'var(--bdr)':'var(--bdr2)'}`,borderRadius:10,opacity:task.done?.65:1}}>
              <div onClick={()=>upd(task.id,'done',!task.done)}
                style={{width:20,height:20,borderRadius:6,border:`2px solid ${task.done?'#7f77dd':'var(--bdr2)'}`,background:task.done?'#7f77dd':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                {task.done&&<i className="ti ti-check" style={{fontSize:11,color:'#fff'}} aria-hidden="true"/>}
              </div>
              <input type="time" value={task.time} onChange={e=>upd(task.id,'time',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt3)',fontFamily:'inherit',width:52,flexShrink:0}}/>
              <input value={task.task} onChange={e=>upd(task.id,'task',e.target.value)} placeholder="Task..."
                style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:12,color:task.done?'var(--txt3)':'var(--txt)',fontFamily:'inherit',textDecoration:task.done?'line-through':'none'}}/>
              <select value={task.category} onChange={e=>upd(task.id,'category',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:10,color:'var(--txt3)',cursor:'pointer',fontFamily:'inherit'}}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
              <select value={task.priority} onChange={e=>upd(task.id,'priority',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:10,color:pColor[task.priority],cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
                {PRIO.map(p=><option key={p}>{p}</option>)}
              </select>
              <button onClick={()=>setTasks(p=>p.filter(t=>t.id!==task.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
                <i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/>
              </button>
            </div>
          ))}
          <button onClick={add}
            style={{display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,border:'1px dashed var(--bdr)',background:'transparent',fontSize:11,color:'var(--txt3)',cursor:'pointer',fontFamily:'inherit'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#7f77dd';e.currentTarget.style.color='#7f77dd'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bdr)';e.currentTarget.style.color='var(--txt3)'}}>
            <i className="ti ti-plus" style={{fontSize:12}} aria-hidden="true"/> Add task
          </button>
        </div>
      </div>
    </div>
  )
}

export function HabitTrackerTool({tool}){
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const [habits,setHabits]=useState([
    {id:1,name:'Exercise 30min',icon:'🏋️',color:'#1d9e75',completions:{}},
    {id:2,name:'Read 20 pages',icon:'📚',color:'#378add',completions:{}},
    {id:3,name:'Drink 2L water',icon:'💧',color:'#5dcaa5',completions:{}},
    {id:4,name:'Meditate 10min',icon:'🧘',color:'#7f77dd',completions:{}},
    {id:5,name:'No social media',icon:'📵',color:'#d4537e',completions:{}},
  ])
  const [newHabit,setNewHabit]=useState('')
  const COLORS=['#1d9e75','#378add','#7f77dd','#d4537e','#ba7517','var(--gold)','#5dcaa5','#ef9f27']
  const ICONS=['⭐','🎯','💪','🌟','✅','🔥','📚','💧','🏋️','🧘','📵','🚶','😴','🥗','💻']

  const now=new Date()
  const weekStart=new Date(now)
  weekStart.setDate(now.getDate()-((now.getDay()+6)%7))
  const weekDates=Array.from({length:7},(_,i)=>{
    const d=new Date(weekStart);d.setDate(weekStart.getDate()+i)
    return d.toISOString().split('T')[0]
  })

  const toggle=(hid,date)=>{
    setHabits(p=>{const n=p.map(h=>h.id===hid?{...h,completions:{...h.completions,[date]:!h.completions[date]}}:h);save({habits:n});return n})
  }
  const addHabit=()=>{
    if(!newHabit.trim())return
    const h={id:Date.now(),name:newHabit.trim(),icon:ICONS[habits.length%ICONS.length],color:COLORS[habits.length%COLORS.length],completions:{}}
    setHabits(p=>{const n=[...p,h];save({habits:n});return n})
    setNewHabit('')
  }
  const getStreak=(habit)=>{
    let s=0
    for(let i=0;i<30;i++){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().split('T')[0];if(habit.completions[k])s++;else break}
    return s
  }
  const todayKey=now.toISOString().split('T')[0]

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#1d9e75" icon="ti-repeat" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:12}}>
        {/* Add habit */}
        <div style={{display:'flex',gap:8}}>
          <input value={newHabit} onChange={e=>setNewHabit(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addHabit()}
            placeholder="Add new habit... (press Enter)"
            style={{flex:1,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:8,padding:'9px 12px',fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}
            onFocus={e=>e.target.style.borderColor='var(--bdr2)'} onBlur={e=>e.target.style.borderColor='var(--bdr)'}/>
          <button onClick={addHabit} style={{padding:'9px 16px',borderRadius:8,border:'none',background:'#1d9e75',fontSize:12,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif'}}>Add</button>
        </div>

        {/* Summary */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[
            {l:'Active habits',v:habits.length,c:'var(--txt)'},
            {l:'Done today',v:habits.filter(h=>h.completions[todayKey]).length,c:'#1d9e75'},
            {l:'Best streak',v:`${Math.max(0,...habits.map(h=>getStreak(h)))} days 🔥`,c:'var(--gold)'},
          ].map(s=>(
            <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Habit grid */}
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr repeat(7,44px) 70px 28px',padding:'9px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:4}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>Habit</div>
            {DAYS.map((d,i)=>(
              <div key={d} style={{fontSize:10,fontWeight:600,color:i===((now.getDay()+6)%7)?'var(--gold)':'var(--txt3)',textTransform:'uppercase',textAlign:'center'}}>{d}</div>
            ))}
            <div style={{fontSize:10,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase',textAlign:'center'}}>Streak</div>
            <div/>
          </div>
          {habits.map((h,hi)=>{
            const streak=getStreak(h)
            const weekDone=weekDates.filter(d=>h.completions[d]).length
            return(
              <div key={h.id} style={{display:'grid',gridTemplateColumns:'1fr repeat(7,44px) 70px 28px',padding:'10px 14px',borderBottom:hi<habits.length-1?'1px solid var(--bdr)':'none',alignItems:'center',gap:4}}>
                <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                  <span style={{fontSize:16,flexShrink:0}}>{h.icon}</span>
                  <input value={h.name} onChange={e=>setHabits(p=>{const n=p.map(x=>x.id===h.id?{...x,name:e.target.value}:x);save({habits:n});return n})}
                    style={{background:'transparent',border:'none',outline:'none',fontSize:12,fontWeight:500,color:'var(--txt)',fontFamily:'inherit',minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}/>
                </div>
                {weekDates.map((date,di)=>{
                  const done=!!h.completions[date]
                  const isToday=date===todayKey
                  return(
                    <div key={date} onClick={()=>toggle(h.id,date)}
                      style={{width:32,height:32,borderRadius:8,margin:'0 auto',cursor:'pointer',background:done?h.color:'var(--bg3)',border:`2px solid ${isToday?h.color+'88':done?h.color:'var(--bdr)'}`,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
                      {done&&<i className="ti ti-check" style={{fontSize:12,color:'#fff'}} aria-hidden="true"/>}
                    </div>
                  )
                })}
                <div style={{textAlign:'center'}}>
                  {streak>0?<span style={{fontSize:12,fontWeight:700,color:h.color}}>🔥{streak}</span>:<span style={{fontSize:10,color:'var(--txt3)'}}>{weekDone}/7</span>}
                </div>
                <button onClick={()=>setHabits(p=>{const n=p.filter(x=>x.id!==h.id);save({habits:n});return n})} style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
                  <i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROPERTY & REAL ESTATE — SPECIFIC COMPONENTS
// ═══════════════════════════════════════════════════════════════





export function PropertyManagerTool({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isTenant=n.includes('tenant')
  const isMaint=n.includes('maintenance')||n.includes('repair')
  const isRent=n.includes('rent collection')||n.includes('rent tracker')
  const isLease=n.includes('lease')
  const [properties,setProperties]=useState([
    {id:1,address:'',type:'Flat',bedrooms:2,rent:1200,tenant:'',leaseStart:'',leaseEnd:'',status:'Occupied',notes:''},
  ])
  const [expenses,setExpenses]=useState([
    {id:1,property:'',date:'',category:'Maintenance',amount:0,notes:'',paid:false},
  ])
  const [tab,setTab]=useState('properties')
  const TYPES=['Flat','House','Studio','Terraced','Semi-detached','Detached','Commercial','Other']
  const STATUS=['Occupied','Vacant','Maintenance','For sale','Other']
  const sColor={Occupied:'#1d9e75',Vacant:'#e24b4a',Maintenance:'#ba7517','For sale':'#7f77dd',Other:'var(--txt3)'}
  const EXP_CATS=['Maintenance','Repairs','Insurance','Agent fees','Mortgage','Utilities','Cleaning','Legal','Other']
  const upd=(id,k,v,setter)=>setter(p=>p.map(r=>r.id===id?{...r,[k]:v}:r))
  const totalRent=properties.filter(p=>p.status==='Occupied').reduce((s,p)=>s+p.rent,0)
  const totalExp=expenses.reduce((s,e)=>s+e.amount,0)
  const netIncome=totalRent*12-totalExp
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#5dcaa5" icon="ti-building" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<div style={{display:'flex',gap:5}}>
          {['properties','expenses'].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${tab===t?'#5dcaa5':'var(--bdr)'}`,background:tab===t?'rgba(93,202,165,.12)':'transparent',fontSize:11,color:tab===t?'#5dcaa5':'var(--txt2)',cursor:'pointer',fontFamily:'inherit',textTransform:'capitalize'}}>
              {t}
            </button>
          ))}
        </div>}/>

      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {tab==='properties'?(
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                {[{l:'Properties',v:properties.length,c:'var(--txt)'},{l:'Occupied',v:properties.filter(p=>p.status==='Occupied').length,c:'#1d9e75'},{l:'Vacant',v:properties.filter(p=>p.status==='Vacant').length,c:'#e24b4a'},{l:'Monthly rent',v:fmt(totalRent, sym),c:'var(--gold)'}].map(s=>(
                  <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 80px 60px 90px 1fr 90px 90px 80px 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
                  {['Address','Type','Beds','Rent £/mo','Tenant','Lease start','Lease end','Status',''].map(h=>(
                    <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
                  ))}
                </div>
                {properties.map((p,i)=>(
                  <div key={p.id} style={{display:'grid',gridTemplateColumns:'1fr 80px 60px 90px 1fr 90px 90px 80px 28px',gap:8,padding:'8px 14px',borderBottom:i<properties.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                    <input value={p.address} onChange={e=>upd(p.id,'address',e.target.value,setProperties)} placeholder="Address..." style={cS}/>
                    <select value={p.type} onChange={e=>upd(p.id,'type',e.target.value,setProperties)} style={{...cS,cursor:'pointer',fontSize:10}}>
                      {TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                    <input type="text" inputMode="decimal" value={p.bedrooms||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(p.id,'bedrooms',parseInt(e.target.value)||0,setProperties)}} style={{...cS,textAlign:'right'}}/>
                    <input type="text" inputMode="decimal" value={p.rent||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(p.id,'rent',parseInt(e.target.value)||0,setProperties)}} style={{...cS,textAlign:'right'}}/>
                    <input value={p.tenant||''} onChange={e=>upd(p.id,'tenant',e.target.value,setProperties)} placeholder="Tenant..." style={cS}/>
                    <input type="date" value={p.leaseStart||''} onChange={e=>upd(p.id,'leaseStart',e.target.value,setProperties)} style={{...cS,fontSize:10}}/>
                    <input type="date" value={p.leaseEnd||''} onChange={e=>upd(p.id,'leaseEnd',e.target.value,setProperties)} style={{...cS,fontSize:10}}/>
                    <select value={p.status} onChange={e=>upd(p.id,'status',e.target.value,setProperties)} style={{...cS,color:sColor[p.status],fontWeight:600,cursor:'pointer',fontSize:10}}>
                      {STATUS.map(s=><option key={s}>{s}</option>)}
                    </select>
                    <button onClick={()=>setProperties(p=>p.filter(r=>r.id!==p.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
                  </div>
                ))}
                <div style={{padding:'8px 14px'}}><button onClick={()=>setProperties(p=>[...p,{id:Date.now(),address:'',type:'Flat',bedrooms:2,rent:0,tenant:'',leaseStart:'',leaseEnd:'',status:'Vacant',notes:''}])} style={{fontSize:11,color:'#5dcaa5',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add property</button></div>
              </div>
            </>
          ):(
            <>
              <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 100px 110px 100px 1fr 50px 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
                  {['Property','Date','Category','Amount £','Notes','Paid',''].map(h=>(
                    <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
                  ))}
                </div>
                {expenses.map((e,i)=>(
                  <div key={e.id} style={{display:'grid',gridTemplateColumns:'1fr 100px 110px 100px 1fr 50px 28px',gap:8,padding:'8px 14px',borderBottom:i<expenses.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                    <input value={e.property||''} onChange={ev=>upd(e.id,'property',ev.target.value,setExpenses)} placeholder="Property..." style={cS}/>
                    <input type="date" value={e.date||''} onChange={ev=>upd(e.id,'date',ev.target.value,setExpenses)} style={{...cS,fontSize:10}}/>
                    <select value={e.category} onChange={ev=>upd(e.id,'category',ev.target.value,setExpenses)} style={{...cS,cursor:'pointer',fontSize:10}}>
                      {EXP_CATS.map(c=><option key={c}>{c}</option>)}
                    </select>
                    <input type="text" inputMode="decimal" value={e.amount||''} onChange={ev=>{if(/^[\d]*\.?[\d]*$/.test(ev.target.value))upd(e.id,'amount',parseFloat(ev.target.value)||0,setExpenses)}} style={{...cS,textAlign:'right'}}/>
                    <input value={e.notes||''} onChange={ev=>upd(e.id,'notes',ev.target.value,setExpenses)} placeholder="Notes..." style={cS}/>
                    <div style={{display:'flex',justifyContent:'center'}}><input type="checkbox" checked={e.paid} onChange={ev=>upd(e.id,'paid',ev.target.checked,setExpenses)} style={{cursor:'pointer',accentColor:'#1d9e75'}}/></div>
                    <button onClick={()=>setExpenses(p=>p.filter(r=>r.id!==e.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
                  </div>
                ))}
                <div style={{padding:'8px 14px'}}><button onClick={()=>setExpenses(p=>[...p,{id:Date.now(),property:'',date:'',category:'Maintenance',amount:0,notes:'',paid:false}])} style={{fontSize:11,color:'#5dcaa5',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add expense</button></div>
              </div>
            </>
          )}
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Portfolio summary</div>
          {[{l:'Annual rent',v:fmt(totalRent*12, sym),c:'#1d9e75'},{l:'Annual expenses',v:fmt(totalExp, sym),c:'#d4537e'},{l:'Net income',v:fmt(netIncome, sym),c:netIncome>=0?'#1d9e75':'#e24b4a'},{l:'Avg rent',v:fmt(properties.length>0?totalRent/properties.filter(p=>p.status==='Occupied', sym).length||0:0),c:'var(--gold)'}].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AirbnbTracker({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const [bookings,setBookings]=useState([
    {id:1,guest:'',checkIn:'',checkOut:'',nights:0,rate:0,platform:'Airbnb',status:'Confirmed',cleaning:50,notes:''},
  ])
  const [property,setProperty]=useState({name:'',address:'',bedrooms:2,bathrooms:1,cleaningFee:50,baseRate:120})
  const upd=(id,k,v)=>{setBookings(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));save({bookings,property})}
  const PLATFORMS=['Airbnb','Booking.com','VRBO','Direct','Other']
  const STATUS=['Inquiry','Confirmed','Checked in','Completed','Cancelled','No-show']
  const sColor={Inquiry:'var(--txt3)',Confirmed:'#378add','Checked in':'#ba7517',Completed:'#1d9e75',Cancelled:'#e24b4a','No-show':'#e24b4a'}
  const totalRevenue=bookings.filter(b=>b.status==='Completed').reduce((s,b)=>s+(b.rate*b.nights),0)
  const totalNights=bookings.filter(b=>b.status==='Completed').reduce((s,b)=>s+b.nights,0)
  const avgRate=totalNights>0?(totalRevenue/totalNights):0
  const occupancyDays=totalNights
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#ef9f27" icon="ti-home-heart" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<button onClick={()=>setBookings(p=>[...p,{id:Date.now(),guest:'',checkIn:'',checkOut:'',nights:0,rate:property.baseRate,platform:'Airbnb',status:'Confirmed',cleaning:property.cleaningFee,notes:''}])}
          style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#ef9f27',fontSize:11,fontWeight:600,color:'#0c0c12',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add booking
        </button>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {[{l:'Total bookings',v:bookings.length,c:'var(--txt)'},{l:'Revenue',v:fmt(totalRevenue, sym),c:'#1d9e75'},{l:'Avg nightly rate',v:fmt(avgRate, sym),c:'var(--gold)'},{l:'Total nights',v:occupancyDays,c:'#378add'}].map(s=>(
              <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 100px 100px 60px 80px 100px 90px 1fr 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:8}}>
              {['Guest','Check-in','Check-out','Nights','Rate £','Platform','Status','Notes',''].map(h=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {bookings.map((b,i)=>(
              <div key={b.id} style={{display:'grid',gridTemplateColumns:'1fr 100px 100px 60px 80px 100px 90px 1fr 28px',gap:8,padding:'8px 14px',borderBottom:i<bookings.length-1?'1px solid var(--bdr)':'none',alignItems:'center'}}>
                <input value={b.guest} onChange={e=>upd(b.id,'guest',e.target.value)} placeholder="Guest name..." style={cS}/>
                <input type="date" value={b.checkIn||''} onChange={e=>upd(b.id,'checkIn',e.target.value)} style={{...cS,fontSize:10}}/>
                <input type="date" value={b.checkOut||''} onChange={e=>upd(b.id,'checkOut',e.target.value)} style={{...cS,fontSize:10}}/>
                <input type="text" inputMode="decimal" value={b.nights||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(b.id,'nights',parseInt(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                <input type="text" inputMode="decimal" value={b.rate||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(b.id,'rate',parseInt(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                <select value={b.platform} onChange={e=>upd(b.id,'platform',e.target.value)} style={{...cS,cursor:'pointer',fontSize:10}}>
                  {PLATFORMS.map(p=><option key={p}>{p}</option>)}
                </select>
                <select value={b.status} onChange={e=>upd(b.id,'status',e.target.value)} style={{...cS,color:sColor[b.status],fontWeight:600,cursor:'pointer',fontSize:10}}>
                  {STATUS.map(s=><option key={s}>{s}</option>)}
                </select>
                <input value={b.notes||''} onChange={e=>upd(b.id,'notes',e.target.value)} placeholder="Notes..." style={cS}/>
                <button onClick={()=>setBookings(p=>p.filter(r=>r.id!==b.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
          </div>
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Property settings</div>
          {[{l:'Base nightly rate',k:'baseRate'},{l:'Cleaning fee',k:'cleaningFee'}].map(f=>(
            <div key={f.k} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:8,padding:'9px 12px'}}>
              <div style={{fontSize:10,color:'var(--txt3)',marginBottom:4}}>{f.l}</div>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'var(--txt3)'}}>{sym}</span>
                <input type="text" inputMode="decimal" value={property[f.k]||''} onChange={e=>{if(/^\d*$/.test(e.target.value)){setProperty(p=>({...p,[f.k]:parseInt(e.target.value)||0}));save({bookings,property:{...property,[f.k]:parseInt(e.target.value)||0}})}}} style={{width:'100%',background:'transparent',border:'none',outline:'none',fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:'var(--gold)',textAlign:'right',paddingLeft:18}}/>
              </div>
            </div>
          ))}
          {[{l:'Total cleaning fees',v:fmt(bookings.filter(b=>b.status==='Completed', sym).reduce((s,b)=>s+b.cleaning,0)),c:'var(--txt2)'},{l:'By platform',v:''}].map((r,i)=>i===0?(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ):null)}
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:10}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--txt)',marginBottom:6}}>By platform</div>
            {PLATFORMS.filter(p=>bookings.some(b=>b.platform===p)).map(p=>{
              const rev=bookings.filter(b=>b.platform===p&&b.status==='Completed').reduce((s,b)=>s+b.rate*b.nights,0)
              return <div key={p} style={{display:'flex',justifyContent:'space-between',fontSize:10,padding:'3px 0',borderBottom:'1px solid var(--bdr)'}}>
                <span style={{color:'var(--txt2)'}}>{p}</span><span style={{color:'#1d9e75',fontWeight:600}}>{fmt(rev, sym)}</span>
              </div>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function RenovationTracker({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const [tasks,setTasks]=useState([
    {id:1,room:'Kitchen',task:'',trade:'General',estimated:0,actual:0,contractor:'',startDate:'',endDate:'',status:'Planned',notes:''},
  ])
  const [budget,setBudget]=useState(0)
  const ROOMS=['Kitchen','Bathroom','Bedroom','Living room','Garden','Exterior','Loft','Basement','Whole house','Other']
  const TRADES=['General','Plumber','Electrician','Plasterer','Painter','Carpenter','Roofer','Tiler','Landscaper','Other']
  const STATUS=['Planned','In progress','Complete','On hold','Cancelled']
  const sColor={Planned:'var(--txt3)','In progress':'#ba7517',Complete:'#1d9e75','On hold':'#378add',Cancelled:'#e24b4a'}
  const upd=(id,k,v)=>{setTasks(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));save({tasks,budget})}
  const totalEst=tasks.reduce((s,t)=>s+t.estimated,0)
  const totalActual=tasks.reduce((s,t)=>s+t.actual,0)
  const variance=totalEst-totalActual
  const pct=tasks.length>0?Math.round(tasks.filter(t=>t.status==='Complete').length/tasks.length*100):0
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#ba7517" icon="ti-tools" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:pct===100?'#1d9e75':'var(--gold)'}}>{pct}% done</div>
          <button onClick={()=>setTasks(p=>[...p,{id:Date.now(),room:'Kitchen',task:'',trade:'General',estimated:0,actual:0,contractor:'',startDate:'',endDate:'',status:'Planned',notes:''}])}
            style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#ba7517',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
            <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add task
          </button>
        </div>}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 220px',overflow:'hidden',minHeight:0}}>
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {[{l:'Total tasks',v:tasks.length,c:'var(--txt)'},{l:'Complete',v:tasks.filter(t=>t.status==='Complete').length,c:'#1d9e75'},{l:'Estimated',v:fmt(totalEst, sym),c:'var(--gold)'},{l:'Actual spent',v:fmt(totalActual, sym),c:totalActual>totalEst?'#e24b4a':'var(--txt)'}].map(s=>(
              <div key={s.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'90px 1fr 90px 90px 80px 1fr 90px 90px 80px 28px',padding:'8px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',gap:6}}>
              {['Room','Task','Trade','Contractor','Estimated £','Notes','Start','End','Status',''].map(h=>(
                <div key={h} style={{fontSize:9,fontWeight:600,color:'var(--txt3)',textTransform:'uppercase'}}>{h}</div>
              ))}
            </div>
            {tasks.map((t,i)=>(
              <div key={t.id} style={{display:'grid',gridTemplateColumns:'90px 1fr 90px 90px 80px 1fr 90px 90px 80px 28px',gap:6,padding:'7px 14px',borderBottom:i<tasks.length-1?'1px solid var(--bdr)':'none',alignItems:'center',background:t.status==='Complete'?'rgba(29,158,117,.02)':'transparent'}}>
                <select value={t.room} onChange={e=>upd(t.id,'room',e.target.value)} style={{...cS,cursor:'pointer',fontSize:10}}>{ROOMS.map(r=><option key={r}>{r}</option>)}</select>
                <input value={t.task} onChange={e=>upd(t.id,'task',e.target.value)} placeholder="Task..." style={cS}/>
                <select value={t.trade} onChange={e=>upd(t.id,'trade',e.target.value)} style={{...cS,cursor:'pointer',fontSize:10}}>{TRADES.map(tr=><option key={tr}>{tr}</option>)}</select>
                <input value={t.contractor||''} onChange={e=>upd(t.id,'contractor',e.target.value)} placeholder="Name..." style={cS}/>
                <input type="text" inputMode="decimal" value={t.estimated||''} onChange={e=>{if(/^\d*$/.test(e.target.value))upd(t.id,'estimated',parseInt(e.target.value)||0)}} style={{...cS,textAlign:'right'}}/>
                <input value={t.notes||''} onChange={e=>upd(t.id,'notes',e.target.value)} placeholder="Notes..." style={cS}/>
                <input type="date" value={t.startDate||''} onChange={e=>upd(t.id,'startDate',e.target.value)} style={{...cS,fontSize:10}}/>
                <input type="date" value={t.endDate||''} onChange={e=>upd(t.id,'endDate',e.target.value)} style={{...cS,fontSize:10}}/>
                <select value={t.status} onChange={e=>upd(t.id,'status',e.target.value)} style={{...cS,color:sColor[t.status],fontWeight:600,cursor:'pointer',fontSize:10}}>{STATUS.map(s=><option key={s}>{s}</option>)}</select>
                <button onClick={()=>setTasks(p=>p.filter(r=>r.id!==t.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:11,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
            ))}
          </div>
        </div>
        <div style={{borderLeft:'1px solid var(--bdr)',overflowY:'auto',padding:14,background:'var(--bg2)',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Budget</div>
          <div style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:9,padding:12}}>
            <div style={{fontSize:10,color:'var(--txt3)',marginBottom:4}}>Total budget</div>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--txt3)'}}>{sym}</span>
              <input type="text" inputMode="decimal" value={budget||''} onChange={e=>{if(/^\d*$/.test(e.target.value)){setBudget(parseInt(e.target.value)||0);save({tasks,budget:parseInt(e.target.value)||0})}}} style={{width:'100%',background:'transparent',border:'none',outline:'none',fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:'var(--gold)',textAlign:'right',paddingLeft:20}}/>
            </div>
          </div>
          {[{l:'Estimated total',v:fmt(totalEst, sym),c:'var(--txt)'},{l:'Actual spent',v:fmt(totalActual, sym),c:totalActual>totalEst?'#e24b4a':'var(--txt)'},{l:'Variance',v:`${variance>=0?'+':''}${fmt(Math.abs(variance, sym))}`,c:variance>=0?'#1d9e75':'#e24b4a'},{l:'Budget remaining',v:fmt(Math.max(0,budget-totalActual, sym)),c:'var(--gold)'}].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bdr)'}}>
              <span style={{fontSize:11,color:'var(--txt2)'}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
          <div style={{fontFamily:'Syne,sans-serif',fontSize:11,fontWeight:600,color:'var(--txt)',marginTop:4}}>By room</div>
          {ROOMS.filter(r=>tasks.some(t=>t.room===r)).map(room=>{
            const est=tasks.filter(t=>t.room===room).reduce((s,t)=>s+t.estimated,0)
            const done=tasks.filter(t=>t.room===room&&t.status==='Complete').length
            const total=tasks.filter(t=>t.room===room).length
            return(
              <div key={room} style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:8,padding:'8px 10px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:11,color:'var(--txt)'}}>{room}</span>
                  <span style={{fontSize:10,color:'var(--gold)',fontWeight:600}}>{fmt(est, sym)}</span>
                </div>
                <div style={{height:3,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${total>0?done/total*100:0}%`,background:'#1d9e75',borderRadius:2}}/>
                </div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{done}/{total} tasks done</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function HomeBuyingTool({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const n=(tool?.name||'').toLowerCase()
  const isAfford=n.includes('affordability')||n.includes('budget')
  const isViewing=n.includes('viewing')||n.includes('viewing tracker')
  const isOffer=n.includes('offer')
  const [income,setIncome]=useState(55000)
  const [deposit,setDeposit]=useState(40000)
  const [term,setTerm]=useState(25)
  const [rate,setRate]=useState(4.8)
  const [properties,setProperties]=useState([
    {id:1,address:'',price:0,bedrooms:0,rating:0,pros:'',cons:'',viewed:false,offer:0,status:'Viewing'},
  ])
  const STATUS=['Shortlist','Viewing','Offer made','Under offer','Sold STC','Rejected','Withdrawn']
  const sColor={Shortlist:'var(--txt3)',Viewing:'#378add','Offer made':'#ba7517','Under offer':'#7f77dd','Sold STC':'#1d9e75',Rejected:'#e24b4a',Withdrawn:'var(--txt3)'}
  const upd=(id,k,v)=>{setProperties(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));save({income,deposit,term,rate,properties})}

  // Affordability calc
  const maxBorrow=income*4.5
  const maxPrice=maxBorrow+deposit
  const monthlyRate=rate/100/12
  const monthlyPayment=maxBorrow>0&&monthlyRate>0?maxBorrow*(monthlyRate*Math.pow(1+monthlyRate,term*12))/(Math.pow(1+monthlyRate,term*12)-1):0
  // Stamp duty (UK 2024)
  const stampDuty=(price)=>{
    if(price<=250000)return 0
    if(price<=925000)return(price-250000)*0.05
    if(price<=1500000)return(925000-250000)*0.05+(price-925000)*0.1
    return(925000-250000)*0.05+(1500000-925000)*0.1+(price-1500000)*0.12
  }
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#378add" icon="ti-home-move" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'280px 1fr',overflow:'hidden',minHeight:0}}>
        {/* Left - affordability */}
        <div style={{overflowY:'auto',padding:14,borderRight:'1px solid var(--bdr)',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Affordability calculator</div>
          {[{l:'Annual income (£)',v:income,set:setIncome},{l:'Deposit saved (£)',v:deposit,set:setDeposit},{l:'Mortgage term (yrs)',v:term,set:setTerm,suf:'yrs'},{l:'Interest rate (%)',v:rate,set:setRate,suf:'%'}].map(f=>(
            <div key={f.l} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 14px'}}>
              <div style={{fontSize:11,color:'var(--txt2)',marginBottom:5}}>{f.l}</div>
              <div style={{position:'relative'}}>
                {!f.suf&&<span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--txt3)'}}>{sym}</span>}
                <input type="text" inputMode="decimal" value={f.v===0?'':f.v} placeholder="0"
                  onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value)){f.set(parseFloat(e.target.value)||0);save({income,deposit,term,rate,properties})}}}
                  onFocus={e=>e.target.select()}
                  style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:7,padding:`8px ${f.suf?'32px':'10px'} 8px ${f.suf?'10px':'24px'}`,fontSize:13,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                {f.suf&&<span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'var(--txt3)'}}>{f.suf}</span>}
              </div>
            </div>
          ))}
          <div style={{background:'rgba(55,138,221,.08)',border:'1px solid rgba(55,138,221,.3)',borderRadius:12,padding:14}}>
            <div style={{fontSize:10,color:'var(--txt3)',textTransform:'uppercase',marginBottom:8}}>Affordability summary</div>
            {[{l:'Max borrow (4.5x)',v:fmt(maxBorrow, sym)},{l:'Max property price',v:fmt(maxPrice, sym)},{l:'Monthly payment',v:fmt(monthlyPayment, sym)},{l:'Stamp duty',v:fmt(stampDuty(maxPrice, sym))}].map(r=>(
              <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--bdr)',fontSize:11}}>
                <span style={{color:'var(--txt2)'}}>{r.l}</span>
                <span style={{color:'#378add',fontWeight:600}}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right - property list */}
        <div style={{overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:'var(--txt)'}}>Properties shortlist</div>
            <button onClick={()=>setProperties(p=>[...p,{id:Date.now(),address:'',price:0,bedrooms:0,rating:0,pros:'',cons:'',viewed:false,offer:0,status:'Shortlist'}])}
              style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#378add',fontSize:11,fontWeight:600,color:'#fff',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
              <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add property
            </button>
          </div>
          {properties.map(prop=>(
            <div key={prop.id} style={{background:'var(--bg2)',border:`1px solid ${sColor[prop.status]||'var(--bdr)'}44`,borderRadius:12,padding:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <input value={prop.address||''} onChange={e=>upd(prop.id,'address',e.target.value)} placeholder="Property address..."
                  style={{flex:1,fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:600,color:'var(--txt)',background:'transparent',border:'none',outline:'none'}}/>
                <select value={prop.status} onChange={e=>upd(prop.id,'status',e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:10,color:sColor[prop.status],fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  {STATUS.map(s=><option key={s}>{s}</option>)}
                </select>
                <button onClick={()=>setProperties(p=>p.filter(r=>r.id!==prop.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:12,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8}}>
                {[{l:'Price',k:'price',pre:'£'},{l:'Bedrooms',k:'bedrooms'},{l:'Offer',k:'offer',pre:'£'}].map(f=>(
                  <div key={f.k}>
                    <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',marginBottom:3}}>{f.l}</div>
                    <div style={{position:'relative'}}>
                      {f.pre&&<span style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--txt3)'}}>{sym}</span>}
                      <input type="text" inputMode="decimal" value={prop[f.k]||''} placeholder="0"
                        onChange={e=>{if(/^\d*$/.test(e.target.value))upd(prop.id,f.k,parseInt(e.target.value)||0)}}
                        style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:`5px ${f.pre?'5px 5px 18px':'5px'}`,fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <input value={prop.pros||''} onChange={e=>upd(prop.id,'pros',e.target.value)} placeholder="✅ Pros..." style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}/>
                <input value={prop.cons||''} onChange={e=>upd(prop.id,'cons',e.target.value)} placeholder="❌ Cons..." style={{background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none'}}/>
              </div>
              {prop.price>0&&(
                <div style={{marginTop:8,fontSize:10,color:'var(--txt3)'}}>
                  Stamp duty: {fmt(stampDuty(prop.price, sym))} · Total cost: {fmt(prop.price+stampDuty(prop.price, sym)+2500)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RealEstateInvestTool({tool}){
  const { currency } = useCurrency()
  const sym = currency.symbol
  const {save,isSaving,lastSaved,clearSave}=useToolSave(tool?.id)
  const [deals,setDeals]=useState([
    {id:1,address:'',purchasePrice:0,deposit:0,mortgageRate:4.5,term:25,monthlyRent:0,annualExpenses:0,appreciationRate:3,notes:''},
  ])
  const upd=(id,k,v)=>{setDeals(p=>p.map(d=>d.id===id?{...d,[k]:v}:d));save({deals})}
  const calc=(d)=>{
    const loanAmt=d.purchasePrice-d.deposit
    const mr=d.mortgageRate/100/12
    const n=d.term*12
    const mortgage=loanAmt>0&&mr>0?loanAmt*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1):0
    const annualRent=d.monthlyRent*12
    const annualMortgage=mortgage*12
    const netIncome=annualRent-annualMortgage-d.annualExpenses
    const grossYield=d.purchasePrice>0?(annualRent/d.purchasePrice*100):0
    const netYield=d.purchasePrice>0?(netIncome/d.purchasePrice*100):0
    const coc=d.deposit>0?(netIncome/d.deposit*100):0
    const projValue5=d.purchasePrice*Math.pow(1+d.appreciationRate/100,5)
    return{mortgage,annualRent,annualMortgage,netIncome,grossYield,netYield,coc,projValue5}
  }
  const cS={background:'transparent',border:'none',outline:'none',fontSize:11,color:'var(--txt)',fontFamily:'inherit',width:'100%'}
  const numInp=(val,set)=><input type="text" inputMode="decimal" value={val||''} placeholder="0" onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))set(parseFloat(e.target.value)||0)}} style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:12,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
      <ToolHeader tool={tool} color="#5dcaa5" icon="ti-building-estate" isSaving={isSaving} lastSaved={lastSaved} clearSave={clearSave}
        extra={<button onClick={()=>setDeals(p=>[...p,{id:Date.now(),address:'',purchasePrice:0,deposit:0,mortgageRate:4.5,term:25,monthlyRent:0,annualExpenses:0,appreciationRate:3,notes:''}])}
          style={{padding:'6px 12px',borderRadius:7,border:'none',background:'#5dcaa5',fontSize:11,fontWeight:600,color:'#0c0c12',cursor:'pointer',fontFamily:'Syne,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <i className="ti ti-plus" style={{fontSize:11}} aria-hidden="true"/> Add deal
        </button>}/>
      <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:12}}>
        {deals.map(d=>{
          const r=calc(d)
          return(
            <div key={d.id} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:13,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',background:'var(--bg3)',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',gap:10}}>
                <input value={d.address||''} onChange={e=>upd(d.id,'address',e.target.value)} placeholder="Property address..."
                  style={{flex:1,fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--txt)',background:'transparent',border:'none',outline:'none'}}/>
                <button onClick={()=>setDeals(p=>p.filter(x=>x.id!==d.id))} style={{background:'none',border:'none',cursor:'pointer',padding:2}}><i className="ti ti-x" style={{fontSize:12,color:'var(--txt3)'}} aria-hidden="true"/></button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
                {/* Inputs */}
                <div style={{padding:'12px 16px',borderRight:'1px solid var(--bdr)'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--txt)',marginBottom:8}}>Inputs</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {[{l:'Purchase price £',k:'purchasePrice'},{l:'Deposit £',k:'deposit'},{l:'Monthly rent £',k:'monthlyRent'},{l:'Annual expenses £',k:'annualExpenses'},{l:'Mortgage rate %',k:'mortgageRate'},{l:'Appreciation %/yr',k:'appreciationRate'}].map(f=>(
                      <div key={f.k}>
                        <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',marginBottom:3}}>{f.l}</div>
                        <input type="text" inputMode="decimal" value={d[f.k]||''} placeholder="0"
                          onChange={e=>{if(/^[\d]*\.?[\d]*$/.test(e.target.value))upd(d.id,f.k,parseFloat(e.target.value)||0)}}
                          style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:6,padding:'6px 8px',fontSize:11,color:'var(--txt)',fontFamily:'inherit',outline:'none',textAlign:'right'}}/>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Results */}
                <div style={{padding:'12px 16px'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--txt)',marginBottom:8}}>Returns</div>
                  {[
                    {l:'Monthly mortgage',v:fmt(r.mortgage, sym),c:'#d4537e'},
                    {l:'Gross yield',v:`${r.grossYield.toFixed(2)}%`,c:r.grossYield>=7?'#1d9e75':r.grossYield>=5?'#ba7517':'#e24b4a'},
                    {l:'Net yield',v:`${r.netYield.toFixed(2)}%`,c:r.netYield>=5?'#1d9e75':r.netYield>=3?'#ba7517':'#e24b4a'},
                    {l:'Cash-on-cash return',v:`${r.coc.toFixed(2)}%`,c:r.coc>=8?'#1d9e75':r.coc>=5?'#ba7517':'#e24b4a'},
                    {l:'Net annual income',v:fmt(r.netIncome, sym),c:r.netIncome>=0?'#1d9e75':'#e24b4a'},
                    {l:'5yr projected value',v:fmt(r.projValue5, sym),c:'var(--gold)'},
                  ].map(row=>(
                    <div key={row.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--bdr)',fontSize:11}}>
                      <span style={{color:'var(--txt2)'}}>{row.l}</span>
                      <span style={{fontWeight:600,color:row.c}}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
