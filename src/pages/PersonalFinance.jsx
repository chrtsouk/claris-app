import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PERSONAL_FINANCE_TOOLS, PERSONAL_FINANCE_SUBCATEGORIES, getPFToolsBySubcat, searchPFTools, getPFToolById } from '../data/personalFinance'
import { ToolEngine, TOOL_TEMPLATE_MAP } from '../components/ToolEngine'
import { ToolDetailTemplate } from '../components/CategoryTemplate'
import { useAuth } from '../context/AuthContext'
import { COMPLEXITY } from '../data/tools'

// ── CONSTANTS ─────────────────────────────────────────────────
const CAT = {
  id: 'personal-finance',
  name: 'Personal Finance',
  icon: 'ti-wallet',
  color: '#c9a96e',
  colorBg: 'rgba(201,169,110,0.10)',
}

// ── SHARED UI ─────────────────────────────────────────────────
function Badge({ type, children }) {
  const styles = {
    simple:       { color: '#1d9e75', bg: 'rgba(29,158,117,.10)',  border: 'rgba(29,158,117,.18)' },
    standard:     { color: '#378add', bg: 'rgba(55,138,221,.10)',  border: 'rgba(55,138,221,.18)' },
    advanced:     { color: '#ba7517', bg: 'rgba(186,117,23,.10)',  border: 'rgba(186,117,23,.18)' },
    professional: { color: '#d4537e', bg: 'rgba(212,83,126,.10)', border: 'rgba(212,83,126,.18)' },
    mvp:          { color: '#a07840', bg: 'rgba(201,169,110,.10)', border: 'rgba(201,169,110,.24)' },
    type:         { color: 'var(--txt2)', bg: 'var(--bg4)', border: 'var(--bdr)' },
    offline:      { color: '#1d9e75', bg: 'rgba(29,158,117,.08)', border: 'rgba(29,158,117,.18)' },
  }
  const s = styles[type] ?? styles.type
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {children}
    </span>
  )
}

function ToolCard({ tool, onClick, onFav, isFav }) {
  return (
    <div onClick={() => onClick(tool)}
      style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: '13px 14px 12px', cursor: 'pointer', transition: 'all .2s', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bdr2)'; e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '.06em' }}>{tool.id}</span>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Badge type={tool.complexity.toLowerCase()}>{tool.complexity}</Badge>
          {tool.priority === 'P0 MVP' && <Badge type="mvp">P0</Badge>}
        </div>
      </div>

      {/* Fav button */}
      <button onClick={e => { e.stopPropagation(); onFav(tool.id) }}
        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2, zIndex: 1 }}
        aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}>
        <i className={isFav ? 'ti ti-star-filled' : 'ti ti-star'} style={{ fontSize: 13, color: isFav ? 'var(--gold)' : 'var(--txt3)' }} aria-hidden="true" />
      </button>

      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 2, lineHeight: 1.3, paddingRight: 18 }}>{tool.name}</div>
      <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 8 }}>{tool.subcategory}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--bg4)', border: '1px solid var(--bdr)', borderRadius: 20, color: 'var(--txt3)' }}>{tool.type}</span>
        <div style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--bdr)', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-arrow-right" style={{ fontSize: 11, color: 'var(--txt3)' }} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

// ── PERSONAL FINANCE CATEGORY PAGE ───────────────────────────
export function PersonalFinancePage() {
  const navigate = useNavigate()
  const { isFavourite, toggleFavourite } = useAuth()
  const [activeSub, setActiveSub] = useState('all')
  const [activeComp, setActiveComp] = useState('all')
  const [mvpOnly, setMvpOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)
  const PER_PAGE = 24

  const filtered = useMemo(() => {
    let tools = PERSONAL_FINANCE_TOOLS
    if (activeSub !== 'all') tools = tools.filter(t => t.subcategory === activeSub)
    if (activeComp !== 'all') tools = tools.filter(t => t.complexity === activeComp)
    if (mvpOnly) tools = tools.filter(t => t.priority === 'P0 MVP')
    if (query.length > 1) {
      const q = query.toLowerCase()
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.users.some(u => u.toLowerCase().includes(q))
      )
    }
    return tools
  }, [activeSub, activeComp, mvpOnly, query])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const setFilter = useCallback((setter) => (val) => { setter(val); setPage(1) }, [])

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--txt3)', flex: 1 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Dashboard</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/categories')}>Categories</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ color: 'var(--txt)', fontWeight: 500 }}>Personal Finance</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => setView('grid')} className="icon-btn" style={{ borderColor: view === 'grid' ? 'var(--bdr2)' : undefined, color: view === 'grid' ? 'var(--gold)' : undefined }} aria-label="Grid"><i className="ti ti-layout-grid" aria-hidden="true" /></button>
          <button onClick={() => setView('list')} className="icon-btn" style={{ borderColor: view === 'list' ? 'var(--bdr2)' : undefined, color: view === 'list' ? 'var(--gold)' : undefined }} aria-label="List"><i className="ti ti-list" aria-hidden="true" /></button>
        </div>
      </div>

      <div className="page-content">

        {/* Hero */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(201,169,110,.10)', border: '1px solid var(--bdr2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-wallet" style={{ fontSize: 24, color: 'var(--gold)' }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>Personal Finance</div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5 }}>
              {PERSONAL_FINANCE_SUBCATEGORIES.map(s => s.name).join(' · ')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: 420, lbl: 'tools' },
              { val: 8, lbl: 'subcategories' },
              { val: PERSONAL_FINANCE_TOOLS.filter(t => t.priority === 'P0 MVP').length, lbl: 'P0 MVP' },
            ].map(s => (
              <div key={s.lbl} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 9, padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '8px 12px', marginBottom: 10 }}
            onFocus={() => {}} >
            <i className="ti ti-search" style={{ fontSize: 13, color: 'var(--txt3)' }} aria-hidden="true" />
            <input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search 420 Personal Finance tools..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit' }} />
            {query && <button onClick={() => { setQuery(''); setPage(1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', padding: 0 }}>
              <i className="ti ti-x" style={{ fontSize: 12 }} aria-hidden="true" />
            </button>}
          </div>

          {/* Complexity */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--txt3)', alignSelf: 'center', letterSpacing: '.06em' }}>COMPLEXITY:</span>
            {['all', 'Simple', 'Standard', 'Advanced', 'Professional'].map(c => (
              <span key={c} onClick={() => setFilter(setActiveComp)(c)}
                style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
                  background: activeComp === c ? 'var(--gold3)' : 'var(--bg3)',
                  border: `1px solid ${activeComp === c ? 'var(--bdr2)' : 'var(--bdr)'}`,
                  color: activeComp === c ? 'var(--gold)' : c === 'all' ? 'var(--txt2)' : COMPLEXITY[c]?.color ?? 'var(--txt2)',
                  fontWeight: activeComp === c ? 500 : 400 }}>
                {c === 'all' ? 'All levels' : c}
              </span>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--bdr)', alignSelf: 'center' }} />
            <span onClick={() => setFilter(setMvpOnly)(!mvpOnly)}
              style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all .15s',
                background: mvpOnly ? 'var(--gold3)' : 'var(--bg3)',
                border: `1px solid ${mvpOnly ? 'var(--bdr2)' : 'var(--bdr)'}`,
                color: mvpOnly ? 'var(--gold)' : 'var(--txt2)', fontWeight: mvpOnly ? 500 : 400 }}>
              <i className="ti ti-star" style={{ fontSize: 11 }} aria-hidden="true" /> P0 MVP only
            </span>
          </div>
        </div>

        {/* Subcategory tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span onClick={() => setFilter(setActiveSub)('all')}
            style={{ fontSize: 11, padding: '6px 14px', borderRadius: 9, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s',
              background: activeSub === 'all' ? 'var(--gold3)' : 'var(--bg2)',
              border: `1px solid ${activeSub === 'all' ? 'var(--bdr2)' : 'var(--bdr)'}`,
              color: activeSub === 'all' ? 'var(--gold)' : 'var(--txt2)', fontWeight: activeSub === 'all' ? 500 : 400 }}>
            <i className="ti ti-apps" style={{ fontSize: 12 }} aria-hidden="true" />
            All <span style={{ opacity: .6, fontSize: 10 }}>420</span>
          </span>
          {PERSONAL_FINANCE_SUBCATEGORIES.map(sub => (
            <span key={sub.name} onClick={() => setFilter(setActiveSub)(sub.name)}
              style={{ fontSize: 11, padding: '6px 14px', borderRadius: 9, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s',
                background: activeSub === sub.name ? 'var(--gold3)' : 'var(--bg2)',
                border: `1px solid ${activeSub === sub.name ? 'var(--bdr2)' : 'var(--bdr)'}`,
                color: activeSub === sub.name ? 'var(--gold)' : 'var(--txt2)', fontWeight: activeSub === sub.name ? 500 : 400 }}>
              <i className={`ti ${sub.icon}`} style={{ fontSize: 12 }} aria-hidden="true" />
              {sub.name} <span style={{ opacity: .6, fontSize: 10 }}>{sub.count}</span>
            </span>
          ))}
        </div>

        {/* Results info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: 'var(--txt2)' }}>
            Showing <strong style={{ color: 'var(--txt)' }}>{Math.min(PER_PAGE, filtered.length)}</strong> of <strong style={{ color: 'var(--txt)' }}>{filtered.length}</strong> tools
            {activeSub !== 'all' && <span style={{ color: 'var(--txt3)' }}> in {activeSub}</span>}
            {query && <span style={{ color: 'var(--txt3)' }}> for "{query}"</span>}
          </div>
          {totalPages > 1 && (
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
              Page {page} of {totalPages}
            </div>
          )}
        </div>

        {/* Tools */}
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12 }}>
            <i className="ti ti-search" style={{ fontSize: 36, color: 'var(--txt3)' }} aria-hidden="true" />
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>No tools found</div>
            <div style={{ fontSize: 12, color: 'var(--txt2)' }}>Try adjusting your filters or search term</div>
            <button onClick={() => { setQuery(''); setActiveSub('all'); setActiveComp('all'); setMvpOnly(false); setPage(1) }}
              style={{ padding: '8px 20px', borderRadius: 7, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
              Clear all filters
            </button>
          </div>
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {paginated.map(t => (
              <ToolCard key={t.id} tool={t}
                onClick={tool => navigate(`/tools/personal-finance/${tool.id}`)}
                onFav={toggleFavourite}
                isFav={isFavourite(t.id)} />
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, overflow: 'hidden' }}>
            {paginated.map((t, i) => (
              <div key={t.id} onClick={() => navigate(`/tools/personal-finance/${t.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < paginated.length - 1 ? '1px solid var(--bdr)' : 'none', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: 'var(--txt3)', letterSpacing: '.06em', width: 56, flexShrink: 0 }}>{t.id}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>{t.name}</span>
                <span style={{ fontSize: 10, color: 'var(--txt3)', width: 130, flexShrink: 0 }}>{t.subcategory}</span>
                <Badge type={t.complexity.toLowerCase()}>{t.complexity}</Badge>
                {t.priority === 'P0 MVP' && <Badge type="mvp">P0</Badge>}
                <button onClick={e => { e.stopPropagation(); toggleFavourite(t.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <i className={isFavourite(t.id) ? 'ti ti-star-filled' : 'ti ti-star'} style={{ fontSize: 13, color: isFavourite(t.id) ? 'var(--gold)' : 'var(--txt3)' }} aria-hidden="true" />
                </button>
                <i className="ti ti-arrow-right" style={{ fontSize: 12, color: 'var(--txt3)' }} aria-hidden="true" />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: page === 1 ? 'var(--txt3)' : 'var(--txt2)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${p === page ? 'var(--bdr2)' : 'var(--bdr)'}`, background: p === page ? 'var(--gold3)' : 'transparent', fontSize: 12, color: p === page ? 'var(--gold)' : 'var(--txt2)', cursor: 'pointer', fontWeight: p === page ? 600 : 400 }}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: page === totalPages ? 'var(--txt3)' : 'var(--txt2)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  )
}


const PF_CAT = {
  id: 'personal-finance',
  name: 'Personal Finance',
  icon: 'ti-wallet',
  color: '#c9a96e',
  colorBg: 'rgba(201,169,110,0.10)',
}
// ── PERSONAL FINANCE TOOL DETAIL ──────────────────────────────
export function PersonalFinanceToolPage() {
  const { toolId } = useParams()
  const navigate = useNavigate()
  const { isFavourite, toggleFavourite } = useAuth()
  const tool = getPFToolById(toolId)
  const [toolOpen, setToolOpen] = useState(false)

  if (!tool) return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <i className="ti ti-tool" style={{ fontSize: 36, color: 'var(--txt3)' }} aria-hidden="true" />
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>Tool not found</div>
      <button onClick={() => navigate('/categories/personal-finance')}
        style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>
        ← Back to Personal Finance
      </button>
    </div>
  )

  const templateId = TOOL_TEMPLATE_MAP[tool.id]
  const related = PERSONAL_FINANCE_TOOLS.filter(t => t.subcategory === tool.subcategory && t.id !== tool.id).slice(0, 6)

  // Show interactive engine when Open tool clicked
  if (toolOpen && templateId) return (
    <div className="tool-engine-page">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--txt3)', flex: 1, minWidth: 0 }}>
          <span style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>Dashboard</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/categories/personal-finance')}>Personal Finance</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ cursor: 'pointer', color: 'var(--txt2)', flexShrink: 0 }} onClick={() => setToolOpen(false)}>{tool.name}</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Interactive</span>
        </div>
        <button onClick={() => setToolOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 11, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 12 }} aria-hidden="true" /> Back to info
        </button>
      </div>
      <ToolEngine templateId={TOOL_TEMPLATE_MAP[tool.id]} tool={tool} />
    </div>
  )

  return (
    <ToolDetailTemplate
      cat={PF_CAT}
      tool={tool}
      basePath="personal-finance"
      relatedTools={related}
      onOpenTool={templateId ? () => setToolOpen(true) : null}
    />
  )
}
