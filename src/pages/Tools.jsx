import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES } from '../data/categories'
import { ALL_TOOLS, COMPLEXITY } from '../data/tools'
import { ToolCard, CategoryCard, SearchBar, EmptyState, Badge, ComplexityBadge } from '../components/UI'

// ── ALL TOOLS PAGE ─────────────────────────────────────────────
const CAT_SLUGS = {'Personal Finance': 'personal-finance', 'Business & Entrepreneurship': 'business', 'Investing & Wealth': 'investing', 'Productivity & Life': 'productivity', 'Property & Real Estate': 'real-estate', 'Project Management': 'projects', 'Marketing & Growth': 'marketing', 'HR & Workforce': 'hr', 'Operations & Assets': 'operations', 'Dashboards & AI': 'dashboards', 'Events & Travel': 'events', 'Education & Students': 'education', 'Creator Economy': 'creator', 'Healthcare & Care': 'healthcare', 'Legal & Admin': 'legal'}

export function AllToolsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [activeComp, setActiveComp] = useState('all')
  const [mvpOnly, setMvpOnly] = useState(false)
  const [view, setView] = useState('grid') // grid | list

  const filtered = useMemo(() => {
    return ALL_TOOLS.filter(t => {
      // activeCat stores category NAME (not id) — 'all' means no filter
      if (activeCat !== 'all' && t.category !== activeCat) return false
      // complexity filter
      if (activeComp !== 'all' && t.complexity !== activeComp) return false
      // MVP filter — priority field is string 'P0 MVP'
      if (mvpOnly && t.priority !== 'P0 MVP') return false
      // search query
      if (query && !t.name.toLowerCase().includes(query.toLowerCase()) &&
          !t.category.toLowerCase().includes(query.toLowerCase()) &&
          !t.subcategory.toLowerCase().includes(query.toLowerCase()) &&
          !t.type.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [query, activeCat, activeComp, mvpOnly])

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">All Tools</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className={`icon-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')} aria-label="Grid view" style={{ borderColor: view === 'grid' ? 'var(--bdr2)' : undefined }}><i className="ti ti-layout-grid" aria-hidden="true" /></button>
          <button className={`icon-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} aria-label="List view" style={{ borderColor: view === 'list' ? 'var(--bdr2)' : undefined }}><i className="ti ti-list" aria-hidden="true" /></button>
        </div>
      </div>

      <div className="page-content">
        {/* Search */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r2)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search 3,560 tools by name, category or type..." />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--txt3)', alignSelf: 'center' }}>CATEGORY:</span>
            {[{ id: 'all', name: 'All', count: 3560 }, ...CATEGORIES].map(c => (
              <span key={c.id ?? 'all'} className={`chip${activeCat === (c.id === undefined ? 'all' : c.name) ? ' active' : ''}`}
                onClick={() => setActiveCat(c.id === undefined ? 'all' : c.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {c.id !== undefined && <i className={`ti ${c.icon}`} style={{ fontSize: 11, color: c.color }} aria-hidden="true" />}
                <span>{c.name === 'All' ? 'All' : c.name.split(' ')[0]}</span>
                <span style={{ opacity: .6, fontSize: 10 }}>{c.count ?? 3560}</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--txt3)', alignSelf: 'center' }}>COMPLEXITY:</span>
            {['all', 'Simple', 'Standard', 'Advanced', 'Professional'].map(c => (
              <span key={c} className={`chip${activeComp === c ? ' active' : ''}`} onClick={() => setActiveComp(c)}
                style={c !== 'all' ? { color: COMPLEXITY[c]?.color, borderColor: COMPLEXITY[c]?.border } : {}}>
                {c === 'all' ? 'All levels' : c}
              </span>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--bdr)', alignSelf: 'center' }} />
            <span className={`chip${mvpOnly ? ' active' : ''}`} onClick={() => setMvpOnly(!mvpOnly)}>
              <i className="ti ti-star" aria-hidden="true" /> P0 MVP only
            </span>
          </div>
        </div>

        {/* Results info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: 'var(--txt2)' }}>
            Showing <strong style={{ color: 'var(--txt)' }}>{filtered.length}</strong> of <strong style={{ color: 'var(--txt)' }}>3,560</strong> tools
            {query && <span style={{ color: 'var(--txt3)' }}> for "{query}"</span>}
          </div>
        </div>

        {/* Grid / List */}
        {filtered.length === 0
          ? <EmptyState icon="ti-search" title="No tools found" sub="Try a different search term or clear your filters." />
          : view === 'grid'
            ? <div className="grid-3">{filtered.map(t => <ToolCard key={t.id} tool={t} onClick={tool => navigate(`/tools/${CAT_SLUGS[tool.category] || 'tools'}/${tool.id}`)} />)}</div>
            : <div className="panel">{filtered.map(t => (
                <div key={t.id} className="list-row" onClick={() => navigate(`/tools/${CAT_SLUGS[t.category] || 'tools'}/${t.id}`)}>
                  <div className="list-dot" style={{ background: CATEGORIES.find(c => c.name === t.category)?.color ?? 'var(--gold)' }} />
                  <span className="list-name">{t.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--txt3)', flex: 1 }}>{t.category} → {t.subcategory}</span>
                  <ComplexityBadge complexity={t.complexity} />
                  <i className="ti ti-arrow-right list-arrow" aria-hidden="true" />
                </div>
              ))}
            </div>
        }
      </div>
    </>
  )
}

// ── CATEGORIES PAGE ────────────────────────────────────────────
export function CategoriesPage() {
  const navigate = useNavigate()
  return (
    <>
      <div className="topbar"><div className="topbar-title">Categories</div></div>
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: 'var(--txt2)' }}>15 categories · 81 subcategories · 3,560 tools</div>
        </div>
        <div className="grid-3">
          {CATEGORIES.map(cat => <CategoryCard key={cat.id} cat={cat} onClick={() => navigate(`/categories/${CAT_SLUGS[cat.name] || cat.id}`)} />)}
        </div>
      </div>
    </>
  )
}

// ── CATEGORY DETAIL PAGE ───────────────────────────────────────
export function CategoryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeSub, setActiveSub] = useState('all')

  // Redirect all dedicated category pages
  const ALL_SLUGS = ['personal-finance','business','investing','productivity','real-estate',
    'projects','marketing','hr','operations','dashboards','events','education','creator','healthcare','legal']
  if (ALL_SLUGS.includes(id)) {
    navigate(`/categories/${id}`, { replace: true })
    return null
  }

  const cat = CATEGORIES.find(c => c.id === id)

  if (!cat) return <div className="page-content"><EmptyState icon="ti-folder-off" title="Category not found" /></div>

  const tools = ALL_TOOLS.filter(t => t.category === cat.name)
  const filtered = activeSub === 'all' ? tools : tools.filter(t => t.subcategory === activeSub)

  return (
    <>
      <div className="topbar">
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>Dashboard</span>
          <i className="ti ti-chevron-right" aria-hidden="true" />
          <span onClick={() => navigate('/categories')}>Categories</span>
          <i className="ti ti-chevron-right" aria-hidden="true" />
          <span className="curr">{cat.name}</span>
        </div>
      </div>

      <div className="page-content">
        {/* Hero */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r2)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: cat.colorBg, border: '1px solid var(--bdr2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${cat.icon}`} style={{ fontSize: 24, color: cat.color }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="font-syne" style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{cat.name}</div>
            <div style={{ fontSize: 12, color: 'var(--txt2)' }}>{cat.subcategories.map(s => s.name).join(' · ')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ val: cat.count, lbl: 'tools' }, { val: cat.subcategories.length, lbl: 'subcategories' }, { val: '100%', lbl: 'offline' }].map(s => (
              <div key={s.lbl} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '8px 14px', textAlign: 'center' }}>
                <div className="font-syne" style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategory tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className={`chip${activeSub === 'all' ? ' active' : ''}`} onClick={() => setActiveSub('all')}>
            All <span style={{ opacity: .6, fontSize: 10 }}>{cat.count}</span>
          </span>
          {cat.subcategories.map(sub => (
            <span key={sub.name} className={`chip${activeSub === sub.name ? ' active' : ''}`} onClick={() => setActiveSub(sub.name)}>
              {sub.name} <span style={{ opacity: .6, fontSize: 10 }}>{sub.count}</span>
            </span>
          ))}
        </div>

        {/* Tools */}
        {filtered.length === 0
          ? <EmptyState icon="ti-tool" title="Tools coming soon" sub={`${cat.count} tools will be loaded here. Check back soon!`} />
          : <div className="grid-3">{filtered.map(t => <ToolCard key={t.id} tool={t} onClick={tool => navigate(`/tools/${CAT_SLUGS[tool.category] || 'tools'}/${tool.id}`)} />)}</div>
        }

        {/* Coming soon notice */}
        {cat.count > filtered.length && (
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r2)' }}>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 4 }}>
              Showing {filtered.length} of <strong style={{ color: 'var(--txt)' }}>{cat.count}</strong> tools
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Full tool library loading soon — {cat.count - filtered.length} more tools on the way</div>
          </div>
        )}
      </div>
    </>
  )
}
