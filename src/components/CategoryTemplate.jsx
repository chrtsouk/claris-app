import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { COMPLEXITY } from '../data/tools'
import { ToolEngine, TOOL_TEMPLATE_MAP } from './ToolEngine'

// ── BADGE ─────────────────────────────────────────────────────
export function Badge({ type, children }) {
  const styles = {
    simple:       { color: '#1d9e75', bg: 'rgba(29,158,117,.10)',  border: 'rgba(29,158,117,.18)' },
    standard:     { color: '#378add', bg: 'rgba(55,138,221,.10)',  border: 'rgba(55,138,221,.18)' },
    advanced:     { color: '#ba7517', bg: 'rgba(186,117,23,.10)',  border: 'rgba(186,117,23,.18)' },
    professional: { color: '#d4537e', bg: 'rgba(212,83,126,.10)', border: 'rgba(212,83,126,.18)' },
    mvp:          { color: '#a07840', bg: 'rgba(201,169,110,.10)', border: 'rgba(201,169,110,.24)' },
    type:         { color: 'var(--txt2)', bg: 'var(--bg4)', border: 'var(--bdr)' },
    offline:      { color: '#1d9e75', bg: 'rgba(29,158,117,.08)', border: 'rgba(29,158,117,.18)' },
  }
  const s = styles[type?.toLowerCase()] ?? styles.type
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {children}
    </span>
  )
}

// ── TOOL CARD ─────────────────────────────────────────────────
export function ToolCard({ tool, onClick, catColor = 'var(--gold)' }) {
  const { isFavourite, toggleFavourite } = useAuth()
  const fav = isFavourite(tool.id)
  return (
    <div onClick={() => onClick(tool)}
      style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: '13px 14px 12px', cursor: 'pointer', transition: 'all .2s', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bdr2)'; e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '.06em' }}>{tool.id}</span>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Badge type={tool.complexity.toLowerCase()}>{tool.complexity}</Badge>
          {tool.priority === 'P0 MVP' && <Badge type="mvp">P0</Badge>}
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); toggleFavourite(tool.id) }}
        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2, zIndex: 1 }}
        aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}>
        <i className={fav ? 'ti ti-star-filled' : 'ti ti-star'} style={{ fontSize: 13, color: fav ? 'var(--gold)' : 'var(--txt3)' }} aria-hidden="true" />
      </button>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 2, lineHeight: 1.3, paddingRight: 18 }}>{tool.name}</div>
      <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 8 }}>{tool.subcategory}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--bg4)', border: '1px solid var(--bdr)', borderRadius: 20, color: 'var(--txt3)' }}>{tool.type}</span>
          {TOOL_TEMPLATE_MAP[tool.id] && (
            <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(29,158,117,.10)', border: '1px solid rgba(29,158,117,.2)', borderRadius: 20, color: '#1d9e75', fontWeight: 600 }}>LIVE</span>
          )}
        </div>
        <div style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--bdr)', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-arrow-right" style={{ fontSize: 11, color: 'var(--txt3)' }} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

// ── CATEGORY PAGE TEMPLATE ────────────────────────────────────
export function CategoryPageTemplate({ cat, tools, subcategories, basePath }) {
  const navigate = useNavigate()
  const [activeSub, setActiveSub] = useState('all')
  const [activeComp, setActiveComp] = useState('all')
  const [mvpOnly, setMvpOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)
  const { isFavourite, toggleFavourite } = useAuth()
  const PER_PAGE = 24

  const filtered = useMemo(() => {
    let ts = tools
    if (activeSub !== 'all') ts = ts.filter(t => t.subcategory === activeSub)
    if (activeComp !== 'all') ts = ts.filter(t => t.complexity === activeComp)
    if (mvpOnly) ts = ts.filter(t => t.priority === 'P0 MVP')
    if (query.length > 1) {
      const q = query.toLowerCase().trim()
      ts = ts.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.subcategory.toLowerCase().includes(q) ||
        t.users.some(u => u.toLowerCase().includes(q))
      )
    }
    return ts
  }, [activeSub, activeComp, mvpOnly, query, tools])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const setFilter = useCallback((setter) => (val) => { setter(val); setPage(1) }, [])
  const mvpCount = tools.filter(t => t.priority === 'P0 MVP').length

  const chipStyle = (active, color) => ({
    fontSize: 11, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
    background: active ? `${color}18` : 'var(--bg3)',
    border: `1px solid ${active ? `${color}44` : 'var(--bdr)'}`,
    color: active ? color : 'var(--txt2)',
    fontWeight: active ? 500 : 400,
    display: 'inline-flex', alignItems: 'center', gap: 5,
  })

  const tabStyle = (active) => ({
    fontSize: 11, padding: '6px 14px', borderRadius: 9, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s', whiteSpace: 'nowrap',
    background: active ? `${cat.color}18` : 'var(--bg2)',
    border: `1px solid ${active ? `${cat.color}44` : 'var(--bdr)'}`,
    color: active ? cat.color : 'var(--txt2)',
    fontWeight: active ? 500 : 400,
  })

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--txt3)', flex: 1, minWidth: 0 }}>
          <span style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>Dashboard</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/categories')}>Categories</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ color: 'var(--txt)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => setView('grid')} className="icon-btn" aria-label="Grid" style={{ borderColor: view === 'grid' ? `${cat.color}66` : undefined, color: view === 'grid' ? cat.color : undefined }}><i className="ti ti-layout-grid" aria-hidden="true" /></button>
          <button onClick={() => setView('list')} className="icon-btn" aria-label="List" style={{ borderColor: view === 'list' ? `${cat.color}66` : undefined, color: view === 'list' ? cat.color : undefined }}><i className="ti ti-list" aria-hidden="true" /></button>
        </div>
      </div>

      <div className="page-content">

        {/* Hero */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: cat.colorBg, border: `1px solid ${cat.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${cat.icon}`} style={{ fontSize: 24, color: cat.color }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{cat.name}</div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subcategories.map(s => s.name).join(' · ')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {[{ val: tools.length, lbl: 'tools' }, { val: subcategories.length, lbl: 'subcategories' }, { val: mvpCount, lbl: 'P0 MVP' }].map(s => (
              <div key={s.lbl} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 9, padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: cat.color }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + filters */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '8px 12px', marginBottom: 10 }}>
            <i className="ti ti-search" style={{ fontSize: 13, color: 'var(--txt3)' }} aria-hidden="true" />
            <input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder={`Search ${tools.length} ${cat.name} tools...`}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit' }} />
            {query && <button onClick={() => { setQuery(''); setPage(1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', padding: 0 }}><i className="ti ti-x" style={{ fontSize: 12 }} aria-hidden="true" /></button>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--txt3)', alignSelf: 'center', letterSpacing: '.06em', flexShrink: 0 }}>COMPLEXITY:</span>
            {['all', 'Simple', 'Standard', 'Advanced', 'Professional'].map(c => (
              <span key={c} onClick={() => setFilter(setActiveComp)(c)}
                style={{ ...chipStyle(activeComp === c, 'var(--gold)'), color: activeComp === c ? 'var(--gold)' : c === 'all' ? 'var(--txt2)' : COMPLEXITY[c]?.color ?? 'var(--txt2)' }}>
                {c === 'all' ? 'All levels' : c}
              </span>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--bdr)', alignSelf: 'center' }} />
            <span onClick={() => setFilter(setMvpOnly)(!mvpOnly)} style={chipStyle(mvpOnly, 'var(--gold)')}>
              <i className="ti ti-star" style={{ fontSize: 11 }} aria-hidden="true" /> P0 MVP only
            </span>
          </div>
        </div>

        {/* Subcategory tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span onClick={() => setFilter(setActiveSub)('all')} style={tabStyle(activeSub === 'all')}>
            <i className="ti ti-apps" style={{ fontSize: 12 }} aria-hidden="true" />
            All <span style={{ opacity: .6, fontSize: 10 }}>{tools.length}</span>
          </span>
          {subcategories.map(sub => (
            <span key={sub.name} onClick={() => setFilter(setActiveSub)(sub.name)} style={tabStyle(activeSub === sub.name)}>
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
          {totalPages > 1 && <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Page {page} of {totalPages}</div>}
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
              <ToolCard key={t.id} tool={t} catColor={cat.color}
                onClick={tool => navigate(`/tools/${basePath}/${tool.id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, overflow: 'hidden' }}>
            {paginated.map((t, i) => (
              <div key={t.id} onClick={() => navigate(`/tools/${basePath}/${t.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < paginated.length - 1 ? '1px solid var(--bdr)' : 'none', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: 'var(--txt3)', letterSpacing: '.06em', width: 56, flexShrink: 0 }}>{t.id}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                <span style={{ fontSize: 10, color: 'var(--txt3)', width: 150, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subcategory}</span>
                <Badge type={t.complexity.toLowerCase()}>{t.complexity}</Badge>
                {t.priority === 'P0 MVP' && <Badge type="mvp">P0</Badge>}
                <button onClick={e => { e.stopPropagation(); toggleFavourite(t.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
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
                  style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${p === page ? `${cat.color}55` : 'var(--bdr)'}`, background: p === page ? `${cat.color}18` : 'transparent', fontSize: 12, color: p === page ? cat.color : 'var(--txt2)', cursor: 'pointer', fontWeight: p === page ? 600 : 400 }}>
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

// ── TOOL DETAIL TEMPLATE ──────────────────────────────────────
export function ToolDetailTemplate({ cat, tool, basePath, relatedTools, onOpenTool }) {
  const navigate = useNavigate()
  const { isFavourite, toggleFavourite } = useAuth()

  // Track recently viewed in localStorage
  useEffect(() => {
    if (!tool?.id) return
    try {
      const key = 'claris-recent'
      const prev = JSON.parse(localStorage.getItem(key) || '[]')
      const updated = [tool.id, ...prev.filter(id => id !== tool.id)].slice(0, 20)
      localStorage.setItem(key, JSON.stringify(updated))
    } catch(e) {}
  }, [tool?.id])
  const fav = isFavourite(tool.id)
  const [toolOpen, setToolOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const templateId = TOOL_TEMPLATE_MAP[tool.id]
  const handleOpenTool = onOpenTool || (templateId ? () => setToolOpen(true) : null)

  // Show interactive engine when Open tool clicked
  if (toolOpen && templateId) return (
    <div className="tool-engine-page">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--txt3)', flex: 1, minWidth: 0 }}>
          <span style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>Dashboard</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate(`/categories/${basePath}`)}>{cat.name}</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ cursor: 'pointer', color: 'var(--txt2)' }} onClick={() => setToolOpen(false)}>{tool.name}</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Interactive Tool</span>
        </div>
        <button onClick={() => setToolOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 11, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 12 }} aria-hidden="true" /> Back to info
        </button>
      </div>
      <ToolEngine templateId={templateId} tool={tool} />
    </div>
  )

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--txt3)', flex: 1, minWidth: 0 }}>
          <span style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>Dashboard</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate(`/categories/${basePath}`)}>{cat.name}</span>
          <i className="ti ti-chevron-right" style={{ fontSize: 11 }} aria-hidden="true" />
          <span style={{ color: 'var(--txt)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button className="icon-btn" aria-label="Share"><i className="ti ti-share" aria-hidden="true" /></button>
          <button className="icon-btn" onClick={() => toggleFavourite(tool.id)} aria-label="Favourite"
            style={{ borderColor: fav ? `${cat.color}66` : undefined, background: fav ? `${cat.color}18` : undefined, color: fav ? cat.color : undefined }}>
            <i className={fav ? 'ti ti-star-filled' : 'ti ti-star'} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="page-content">
        {previewOpen && templateId && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr2)', borderRadius: 13, overflow: 'hidden', height: 480, display: 'flex', flexDirection: 'column', marginBottom: 4 }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--bdr)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <i className="ti ti-eye" style={{ fontSize: 12, color: 'var(--gold)' }} aria-hidden="true" />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>Live preview — {tool.name}</span>
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: 'rgba(29,158,117,.1)', color: '#1d9e75', border: '1px solid rgba(29,158,117,.2)', marginLeft: 'auto' }}>LIVE</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <ToolEngine templateId={templateId} tool={tool} />
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Header */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: 20 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: cat.colorBg, border: `1px solid ${cat.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${cat.icon}`} style={{ fontSize: 24, color: cat.color }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', letterSpacing: '.06em', marginBottom: 4 }}>{tool.id} · {cat.name} → {tool.subcategory}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--txt)', lineHeight: 1.2, marginBottom: 8 }}>{tool.name}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <Badge type={tool.complexity.toLowerCase()}>{tool.complexity}</Badge>
                    {tool.priority === 'P0 MVP' && <Badge type="mvp">P0 MVP</Badge>}
                    {tool.offline && <Badge type="offline"><i className="ti ti-wifi-off" style={{ fontSize: 10, marginRight: 3 }} aria-hidden="true" />Offline</Badge>}
                    <Badge type="type">{tool.type}</Badge>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.65 }}>
                {tool.notes || `A professional ${tool.type.toLowerCase()} tool in the ${tool.subcategory} subcategory of ${cat.name}. Built for ${tool.users.slice(0, 3).join(', ')} and more. Available offline on all platforms.`}
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[['Tool type', tool.type], ['Complexity', tool.complexity], ['Priority', tool.priority], ['Template', templateId || 'coming soon']].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg3)', borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 5 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: k === 'Priority' && tool.priority === 'P0 MVP' ? 'var(--gold)' : 'var(--txt)' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Users */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(55,138,221,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-users" style={{ fontSize: 13, color: '#378add' }} aria-hidden="true" />
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600 }}>Who is this for</div>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tool.users.map(u => (
                  <span key={u} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'var(--bg3)', border: '1px solid var(--bdr)', color: 'var(--txt2)' }}>{u}</span>
                ))}
              </div>
            </div>

            {/* Export */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--gold3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-download" style={{ fontSize: 13, color: 'var(--gold)' }} aria-hidden="true" />
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600 }}>Export formats</div>
              </div>
              <div style={{ padding: 14, display: 'flex', gap: 8 }}>
                {[['ti-file-type-pdf', '#d85a30', 'PDF'], ['ti-file-spreadsheet', '#1d9e75', 'Excel (.xlsx)'], ['ti-file-text', '#378add', 'CSV']].map(([icon, color, label]) => (
                  <button key={label}
                    onClick={() => handleOpenTool ? handleOpenTool() : alert('CLARIS Protected Export - Open the interactive tool first to export your data.')}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 9, borderRadius: 9, border: '1px solid var(--bdr)', background: 'var(--bg3)', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.color = color }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--txt2)' }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 15, color }} aria-hidden="true" />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Related */}
            {relatedTools.length > 0 && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600 }}>Related tools in {tool.subcategory}</div>
                  <span style={{ fontSize: 11, color: 'var(--gold)', cursor: 'pointer' }} onClick={() => navigate(`/categories/${basePath}`)}>See all →</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 12 }}>
                  {relatedTools.map(t => (
                    <ToolCard key={t.id} tool={t} catColor={cat.color} onClick={t => navigate(`/tools/${basePath}/${t.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: 16 }}>
              <button
                onClick={() => handleOpenTool?.()}
                style={{ width: '100%', padding: 13, borderRadius: 9, background: handleOpenTool ? cat.color : 'var(--bg4)', border: `1px solid ${handleOpenTool ? cat.color : 'var(--bdr)'}`, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: handleOpenTool ? '#fff' : 'var(--txt3)', cursor: handleOpenTool ? 'pointer' : 'default', letterSpacing: '.02em', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'opacity .15s' }}
                onMouseEnter={e => { if(handleOpenTool) e.currentTarget.style.opacity = '.88' }}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <i className={handleOpenTool ? 'ti ti-external-link' : 'ti ti-clock'} aria-hidden="true" />
                {handleOpenTool ? 'Open tool' : 'Coming soon'}
              </button>
              <button
                onClick={() => alert('CLARIS Protected - Offline tools are encrypted and licensed exclusively to CLARIS subscribers. Redistribution or resale is prohibited. Your licence: Personal use only.')}
                style={{ width: '100%', padding: 9, borderRadius: 9, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <i className="ti ti-lock" style={{ color: 'var(--gold)', fontSize: 12 }} aria-hidden="true" /> Download offline
              </button>
              <div style={{ height: 1, background: 'var(--bdr)', margin: '10px 0' }} />
              {[['Category', cat.name], ['Subcategory', tool.subcategory], ['Tool ID', tool.id], ['Priority', tool.priority], ['Offline', 'Yes ✓'], ['Complexity', tool.complexity]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bdr)' }}>
                  <span style={{ fontSize: 11, color: 'var(--txt3)', flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: k === 'Priority' && v === 'P0 MVP' ? 'var(--gold)' : 'var(--txt)', textAlign: 'right', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bdr)', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 600 }}>Available on</div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['ti-brand-apple', 'iOS & iPadOS'], ['ti-brand-android', 'Android'], ['ti-brand-windows', 'Windows'], ['ti-brand-apple', 'macOS'], ['ti-brand-ubuntu', 'Linux']].map(([icon, name]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--txt2)' }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 14 }} aria-hidden="true" />{name}
                    <i className="ti ti-check" style={{ marginLeft: 'auto', fontSize: 12, color: '#1d9e75' }} aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
