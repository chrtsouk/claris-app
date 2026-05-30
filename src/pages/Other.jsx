import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { ALL_TOOLS, searchTools } from '../data/tools'
import { CATEGORIES } from '../data/categories'

// ── TOOL DETAIL PAGE ──────────────────────────────────────────
export function ToolDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tool = ALL_TOOLS.find(t => t.id === id)
  if (!tool) return <div className="page-content" style={{ textAlign: 'center', paddingTop: 60 }}>Tool not found</div>
  navigate(`/tools/personal-finance/${id}`)
  return null
}

// ── FAVOURITES PAGE ───────────────────────────────────────────
export function FavouritesPage() {
  const navigate = useNavigate()
  const { favourites, isFavourite, toggleFavourite } = useAuth()
  const { t } = useLang()

  const favTools = ALL_TOOLS.filter(t => favourites.includes(t.id))

  const CAT_SLUGS = {
    'Personal Finance':'personal-finance','Business & Entrepreneurship':'business',
    'Investing & Wealth':'investing','Productivity & Life':'productivity',
    'Property & Real Estate':'real-estate','Project Management':'projects',
    'Marketing & Growth':'marketing','HR & Workforce':'hr',
    'Operations & Assets':'operations','Dashboards & AI':'dashboards',
    'Events & Travel':'events','Education & Students':'education',
    'Creator Economy':'creator','Healthcare & Care':'healthcare','Legal & Admin':'legal',
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">{t.favourites} <span style={{ fontSize: 12, color: 'var(--txt3)', fontWeight: 400 }}>({favTools.length})</span></div>
      </div>
      <div className="page-content">
        {favTools.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 15, background: 'var(--gold3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-heart" style={{ fontSize: 28, color: 'var(--gold)' }} aria-hidden="true" />
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--txt)' }}>No favourites yet</div>
            <div style={{ fontSize: 13, color: 'var(--txt2)', textAlign: 'center', maxWidth: 300 }}>
              Star any tool to save it here for quick access
            </div>
            <button onClick={() => navigate('/tools')}
              style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: 'var(--gold)', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#0c0c12', cursor: 'pointer', marginTop: 8 }}>
              Browse tools →
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {favTools.map(tool => {
              const cat = CATEGORIES.find(c => c.name === tool.category)
              const slug = CAT_SLUGS[tool.category] || 'tools'
              const fav = isFavourite(tool.id)
              return (
                <div key={tool.id} onClick={() => navigate(`/tools/${slug}/${tool.id}`)}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: '13px 14px', cursor: 'pointer', transition: 'all .2s', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bdr2)'; e.currentTarget.style.background = 'var(--bg3)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--bg2)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: (cat?.color || 'var(--gold)') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`ti ${cat?.icon || 'ti-tool'}`} style={{ fontSize: 13, color: cat?.color || 'var(--gold)' }} aria-hidden="true" />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '.06em' }}>{tool.id}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleFavourite(tool.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <i className="ti ti-star-filled" style={{ fontSize: 14, color: 'var(--gold)' }} aria-hidden="true" />
                    </button>
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 2, lineHeight: 1.3 }}>{tool.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 8 }}>{tool.subcategory}</div>
                  <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--bg4)', border: '1px solid var(--bdr)', borderRadius: 20, color: 'var(--txt3)' }}>{tool.type}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ── SEARCH PAGE ───────────────────────────────────────────────
export function SearchPage() {
  const navigate = useNavigate()
  const { isFavourite, toggleFavourite } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeComp, setActiveComp] = useState('all')

  const CAT_SLUGS = {
    'Personal Finance':'personal-finance','Business & Entrepreneurship':'business',
    'Investing & Wealth':'investing','Productivity & Life':'productivity',
    'Property & Real Estate':'real-estate','Project Management':'projects',
    'Marketing & Growth':'marketing','HR & Workforce':'hr',
    'Operations & Assets':'operations','Dashboards & AI':'dashboards',
    'Events & Travel':'events','Education & Students':'education',
    'Creator Economy':'creator','Healthcare & Care':'healthcare','Legal & Admin':'legal',
  }

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    let res = searchTools(query)
    if (activeComp !== 'all') res = res.filter(t => t.complexity === activeComp)
    setResults(res.slice(0, 48))
  }, [query, activeComp])

  return (
    <>
      <div className="topbar">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 9, padding: '8px 14px' }}>
          <i className="ti ti-search" style={{ fontSize: 16, color: 'var(--txt3)' }} aria-hidden="true" />
          <input value={query} onChange={e => setQuery(e.target.value)} autoFocus
            placeholder="Search by name, ID (CL-XXXX), category, type..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--txt)', fontFamily: 'inherit' }} />
          {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', padding: 0 }}>
            <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
          </button>}
        </div>
      </div>
      <div className="page-content">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all','Simple','Standard','Advanced','Professional'].map(c => (
            <span key={c} onClick={() => setActiveComp(c)}
              style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all .15s',
                background: activeComp === c ? 'var(--gold3)' : 'var(--bg2)',
                border: `1px solid ${activeComp === c ? 'var(--bdr2)' : 'var(--bdr)'}`,
                color: activeComp === c ? 'var(--gold)' : 'var(--txt2)' }}>
              {c === 'all' ? 'All levels' : c}
            </span>
          ))}
        </div>

        {query.length < 2 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="ti ti-search" style={{ fontSize: 40, color: 'var(--txt3)', display: 'block', marginBottom: 14 }} aria-hidden="true" />
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 6 }}>Search 3,560 tools</div>
            <div style={{ fontSize: 12, color: 'var(--txt2)' }}>Try "budget", "CL-0001", "invoice", "tracker"...</div>
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--txt3)', fontSize: 14 }}>
            No tools found for "<strong style={{ color: 'var(--txt)' }}>{query}</strong>"
          </div>
        )}

        {results.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: 'var(--txt2)' }}>
              <strong style={{ color: 'var(--txt)' }}>{results.length}</strong> results for "{query}"
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {results.map(tool => {
                const cat = CATEGORIES.find(c => c.name === tool.category)
                const slug = CAT_SLUGS[tool.category] || 'tools'
                return (
                  <div key={tool.id} onClick={() => navigate(`/tools/${slug}/${tool.id}`)}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '13px 14px', cursor: 'pointer', transition: 'all .2s', position: 'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bdr2)'; e.currentTarget.style.background = 'var(--bg3)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--bg2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--txt3)', letterSpacing: '.06em' }}>{tool.id}</span>
                      <button onClick={e => { e.stopPropagation(); toggleFavourite(tool.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                        <i className={isFavourite(tool.id) ? 'ti ti-star-filled' : 'ti ti-star'} style={{ fontSize: 12, color: isFavourite(tool.id) ? 'var(--gold)' : 'var(--txt3)' }} aria-hidden="true" />
                      </button>
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 2, lineHeight: 1.3 }}>{tool.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 6 }}>{tool.category} · {tool.subcategory}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--bg4)', border: '1px solid var(--bdr)', borderRadius: 20, color: 'var(--txt3)' }}>{tool.complexity}</span>
                      {tool.priority === 'P0 MVP' && <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(201,169,110,.10)', border: '1px solid rgba(201,169,110,.24)', borderRadius: 20, color: 'var(--gold)' }}>P0</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── NOTIFICATIONS PAGE ────────────────────────────────────────
export function NotificationsPage() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([
    { id: 1, type: 'tip', icon: 'ti-star', color: 'var(--gold)', title: 'Welcome to CLARIS! 🎉', body: 'You now have access to all 3,560 professional tools. Start by exploring the categories or searching for a specific tool.', read: false, time: 'Just now' },
    { id: 2, type: 'new_tools', icon: 'ti-apps', color: '#378add', title: '18 interactive tools now live', body: 'Budget Planner, Savings Goal Tracker, Expense Tracker, Debt Snowball and more are now fully interactive with live calculations and export.', read: false, time: '1h ago' },
    { id: 3, type: 'update', icon: 'ti-rocket', color: '#1d9e75', title: 'CLARIS v20 — Major update', body: '718 P0 MVP tools are now interactive. New generic templates: Tracker Table, Checklist, Calculator, Planner, Dashboard, Journal.', read: true, time: '2h ago' },
    { id: 4, type: 'tip', icon: 'ti-lightbulb', color: '#ba7517', title: 'Pro tip: Use filters', body: 'Filter tools by Complexity (Simple → Professional) or use P0 MVP only to see the most essential tools for each category.', read: true, time: 'Yesterday' },
    { id: 5, type: 'tip', icon: 'ti-download', color: '#d4537e', title: 'Export your work', body: 'Every interactive tool supports CSV, Excel, PDF Plain and PDF Premium export — with CLARIS watermark and copyright protection.', read: true, time: '2 days ago' },
  ])

  const unread = notifs.filter(n => !n.read).length
  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, read: true })))
  const markRead = (id) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n))
  const deleteNotif = (id) => setNotifs(p => p.filter(n => n.id !== id))

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Notifications
          {unread > 0 && <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--gold)', color: '#0c0c12', fontWeight: 700 }}>{unread}</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--txt2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Mark all read
          </button>
        )}
      </div>
      <div className="page-content">
        {notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <i className="ti ti-bell-off" style={{ fontSize: 40, color: 'var(--txt3)', display: 'block', marginBottom: 14 }} aria-hidden="true" />
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>All caught up!</div>
          </div>
        ) : (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, overflow: 'hidden' }}>
            {notifs.map((n, i) => (
              <div key={n.id} onClick={() => markRead(n.id)}
                style={{ display: 'flex', gap: 14, padding: '16px 18px', borderBottom: i < notifs.length - 1 ? '1px solid var(--bdr)' : 'none', cursor: 'pointer', background: n.read ? 'transparent' : `${n.color}06`, transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : `${n.color}06`}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: n.color + '18', border: `1px solid ${n.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <i className={`ti ${n.icon}`} style={{ fontSize: 16, color: n.color }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {n.title}
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: n.color, flexShrink: 0 }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: 'var(--txt3)', whiteSpace: 'nowrap' }}>{n.time}</span>
                      <button onClick={e => { e.stopPropagation(); deleteNotif(n.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--txt3)' }}>
                        <i className="ti ti-x" style={{ fontSize: 12 }} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.55 }}>{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── EXPORT PAGE ───────────────────────────────────────────────
export function ExportPage() {
  const navigate = useNavigate()
  return (
    <>
      <div className="topbar"><div className="topbar-title">Export</div></div>
      <div className="page-content">
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, padding: '32px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ width: 60, height: 60, borderRadius: 15, background: 'var(--gold3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <i className="ti ti-download" style={{ fontSize: 28, color: 'var(--gold)' }} aria-hidden="true" />
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 10 }}>Export from inside each tool</div>
          <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.65, marginBottom: 24 }}>
            Open any interactive tool, fill in your data, then click the <strong style={{ color: 'var(--gold)' }}>Export</strong> button to download in CSV, Excel, PDF Plain or PDF Premium format — with optional password protection.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[['ti-file-text','#378add','CSV','Spreadsheet compatible'],['ti-file-spreadsheet','#1d9e75','Excel (.xls)','Open in Microsoft Excel'],['ti-file-type-pdf','#d85a30','PDF Plain','Clean black & white'],['ti-crown','var(--gold)','PDF Premium','CLARIS dark branded']].map(([icon,color,label,sub]) => (
              <div key={label} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                <i className={`ti ${icon}`} style={{ fontSize: 24, color, display: 'block', marginBottom: 8 }} aria-hidden="true" />
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{sub}</div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/tools')}
            style={{ padding: '12px 28px', borderRadius: 9, border: 'none', background: 'var(--gold)', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#0c0c12', cursor: 'pointer' }}>
            Browse interactive tools →
          </button>
        </div>
      </div>
    </>
  )
}

// ── HELP PAGE ─────────────────────────────────────────────────
export function HelpPage() {
  const [open, setOpen] = useState(null)
  const faqs = [
    { q: 'How do I use an interactive tool?', a: 'Open any tool from the categories, click "Open tool" (gold button) to launch the interactive version. Fill in your data and see live results on the right panel.' },
    { q: 'How do I export my data?', a: 'Inside any interactive tool, click the Export button. Choose CSV, Excel, PDF Plain or PDF Premium. You can optionally add password protection.' },
    { q: 'Can I add custom rows to a tool?', a: 'Yes! Inside any section of the Budget Planner (or similar tools), scroll to the bottom and click "+ Add custom row". Enter a name, confirm with the Save button, then add your value.' },
    { q: 'How do I save my favourite tools?', a: 'Click the star icon (★) on any tool card to add it to Favourites. Access all saved tools from the Favourites page in the sidebar.' },
    { q: 'How does the draggable divider work?', a: 'In interactive tools, there is a thin bar between the input panel and results panel. Drag it left or right to resize the panels to your preference.' },
    { q: 'What is a P0 MVP tool?', a: 'P0 MVP (Priority 0 Minimum Viable Product) tools are the most essential and commonly used tools in each category. All P0 tools are fully interactive in CLARIS.' },
    { q: 'How do I change the app language?', a: 'Go to Settings or Profile → Language. Choose from English, Ελληνικά, Español, Français, or Deutsch. The UI updates immediately without a page reload.' },
    { q: 'How do I change the theme?', a: 'Go to Settings → Appearance. Choose from Obsidian Gold (default), Slate & Steel, Midnight Copper, or Carbon Platinum.' },
    { q: 'Is my data stored securely?', a: 'Yes. Data is stored in Supabase with Row Level Security — only you can access your data. Passwords are hashed, and all connections use HTTPS.' },
    { q: 'Can I use CLARIS offline?', a: 'The web app requires internet to load. Offline-capable downloads (PWA, native apps) are coming soon for iOS, Android, Windows, macOS and Linux.' },
  ]

  return (
    <>
      <div className="topbar"><div className="topbar-title">Help & Support</div></div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 12 }}>Frequently asked questions</div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 13, overflow: 'hidden' }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid var(--bdr)' : 'none' }}>
                  <div onClick={() => setOpen(open === i ? null : i)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', gap: 10 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)' }}>{faq.q}</span>
                    <i className={`ti ti-chevron-${open === i ? 'up' : 'down'}`} style={{ fontSize: 13, color: 'var(--txt3)', flexShrink: 0 }} aria-hidden="true" />
                  </div>
                  {open === i && (
                    <div style={{ padding: '0 16px 14px', fontSize: 12, color: 'var(--txt2)', lineHeight: 1.65 }}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 2 }}>Contact support</div>
            {[
              { icon: 'ti-mail', label: 'Email support', sub: 'support@claris.app', color: '#378add' },
              { icon: 'ti-brand-twitter', label: 'Twitter / X', sub: '@clarisapp', color: '#1d9e75' },
              { icon: 'ti-file-text', label: 'Documentation', sub: 'docs.claris.app', color: 'var(--gold)' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: c.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${c.icon}`} style={{ fontSize: 16, color: c.color }} aria-hidden="true" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{c.sub}</div>
                </div>
              </div>
            ))}
            <div style={{ background: 'var(--gold3)', border: '1px solid var(--bdr2)', borderRadius: 12, padding: '16px', marginTop: 4 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>CLARIS Pro — What's included</div>
              {['All 3,560 professional tools','All 15 categories & 81 subcategories','Interactive tools with live calculations','PDF, Excel & CSV export with protection','iOS, Android, Windows, Mac & Linux','Regular new tools and updates'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--txt2)', marginBottom: 5 }}>
                  <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 12, flexShrink: 0 }} aria-hidden="true" />{f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


