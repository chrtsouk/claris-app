import { useAuth } from '../context/AuthContext'

// ── BADGE ──────────────────────────────────────────
export function Badge({ type, children }) {
  const cls = {
    simple: 'badge-simple', standard: 'badge-standard',
    advanced: 'badge-advanced', professional: 'badge-professional',
    mvp: 'badge-mvp', offline: 'badge-offline', type: 'badge-type',
  }[type?.toLowerCase()] ?? 'badge-type'
  return <span className={`badge ${cls}`}>{children}</span>
}

export function ComplexityBadge({ complexity }) {
  return <Badge type={complexity?.toLowerCase()}>{complexity}</Badge>
}

export function MvpBadge({ priority }) {
  if (priority === 2) return <Badge type="mvp">P0</Badge>
  return null
}

// ── TOOL CARD ──────────────────────────────────────
export function ToolCard({ tool, onClick }) {
  const { isFavourite, toggleFavourite } = useAuth()
  const fav = isFavourite(tool.id)

  return (
    <div className="tool-card animate-fade-up" onClick={() => onClick?.(tool)}>
      <div className="tool-card-top">
        <span className="tool-card-id">{tool.id}</span>
        <div className="tool-card-badges">
          <ComplexityBadge complexity={tool.complexity} />
          <MvpBadge priority={tool.priority} />
        </div>
      </div>
      {/* Fav star */}
      <button
        onClick={e => { e.stopPropagation(); toggleFavourite(tool.id) }}
        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
      >
        <i className={fav ? 'ti ti-star-filled' : 'ti ti-star'} style={{ fontSize: 13, color: fav ? 'var(--gold)' : 'var(--txt3)' }} aria-hidden="true" />
      </button>
      <div className="tool-card-name" style={{ paddingRight: 20 }}>{tool.name}</div>
      <div className="tool-card-cat">{tool.subcategory}</div>
      <div className="tool-card-foot">
        <span className="tool-card-pill">{tool.type}</span>
        <div className="tool-card-arrow"><i className="ti ti-arrow-right" aria-hidden="true" /></div>
      </div>
    </div>
  )
}

// ── CATEGORY CARD ─────────────────────────────────
export function CategoryCard({ cat, onClick }) {
  const subcatNames = cat.subcategories.slice(0, 3).map(s => s.name).join(' · ')
  return (
    <div
      className="cat-card"
      style={{ '--cat-color': cat.color }}
      onClick={() => onClick?.(cat)}
    >
      <div className="cat-card-icon" style={{ background: cat.colorBg, color: cat.color }}>
        <i className={`ti ${cat.icon}`} aria-hidden="true" />
      </div>
      <div className="cat-card-name">{cat.name}</div>
      <div className="cat-card-desc truncate">{subcatNames}</div>
      <div className="progress-bar-bg">
        <div className="progress-bar" style={{ width: `${Math.round((cat.count / 520) * 100)}%`, background: cat.color }} />
      </div>
      <div className="cat-card-footer">
        <span className="cat-card-count">{cat.count} tools</span>
        <i className="ti ti-arrow-right cat-card-arrow" aria-hidden="true" />
      </div>
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────
export function StatCard({ label, value, sub, gold }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${gold ? ' gold' : ''}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

// ── SEARCH BAR ────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-bar">
      <i className="ti ti-search" aria-hidden="true" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', padding: 0 }}>
          <i className="ti ti-x" style={{ fontSize: 12 }} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────
export function EmptyState({ icon = 'ti-search', title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><i className={`ti ${icon}`} aria-hidden="true" /></div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  )
}
