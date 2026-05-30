import { useNavigate } from 'react-router-dom'
import { CATEGORIES, TOTAL_TOOLS } from '../data/categories'
import { ALL_TOOLS } from '../data/tools'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { TOOL_TEMPLATE_MAP } from '../components/ToolEngine'
import { useState, useEffect } from 'react'

const CAT_SLUGS = {
  'Personal Finance':            'personal-finance',
  'Business & Entrepreneurship': 'business',
  'Investing & Wealth':          'investing',
  'Productivity & Life':         'productivity',
  'Property & Real Estate':      'real-estate',
  'Project Management':          'projects',
  'Marketing & Growth':          'marketing',
  'HR & Workforce':              'hr',
  'Operations & Assets':         'operations',
  'Dashboards & AI':             'dashboards',
  'Events & Travel':             'events',
  'Education & Students':        'education',
  'Creator Economy':             'creator',
  'Healthcare & Care':           'healthcare',
  'Legal & Admin':               'legal',
}

// Featured P0 tools (hand-picked variety)
const FEATURED_IDS = ['CL-0001','CL-0032','CL-0042','CL-0681','CL-0682','CL-1621','CL-2081','CL-2442','CL-2617','CL-2771','CL-3112','CL-3268']
const FEATURED = FEATURED_IDS.map(id => ALL_TOOLS.find(t => t.id === id)).filter(Boolean)

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile, favourites } = useAuth()
  const { t } = useLang()

  const [recentIds, setRecentIds] = useState([])

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('claris-recent') || '[]')
      setRecentIds(ids)
    } catch(e) {}
  }, [])

  const recentTools = recentIds.slice(0, 4).map(id => ALL_TOOLS.find(t => t.id === id)).filter(Boolean)
  const firstName = profile?.first_name || user?.email?.split('@')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const interactiveCount = Object.keys(TOOL_TEMPLATE_MAP).length

  const statsData = [
    { icon: 'ti-apps',        label: 'Total tools',      value: TOTAL_TOOLS.toLocaleString(), color: 'var(--gold)',  sub: 'across 15 categories' },
    { icon: 'ti-star',        label: 'Interactive tools', value: Object.keys(TOOL_TEMPLATE_MAP).length.toLocaleString(),  color: '#1d9e75',     sub: 'All 3,560 tools live' },
    { icon: 'ti-heart-filled',label: 'Favourites',        value: favourites.length.toString(), color: '#d4537e',     sub: favourites.length === 0 ? 'Add your first' : 'tools saved' },
    { icon: 'ti-folder',      label: 'Categories',        value: '15',                         color: '#378add',     sub: '81 subcategories' },
  ]

  return (
    <>
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>
            {greeting}, <span style={{ color: 'var(--gold)' }}>{firstName}</span> 👋
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <button onClick={() => navigate('/search')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--bdr)', background: 'var(--bg3)', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <i className="ti ti-search" style={{ fontSize: 13 }} aria-hidden="true" />
          Search {TOTAL_TOOLS.toLocaleString()} tools...
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--bg4)', color: 'var(--txt3)' }}>⌘K</span>
        </button>
      </div>

      <div className="page-content">

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {statsData.map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: s.color }} aria-hidden="true" />
                </div>
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { icon: 'ti-apps', label: 'Browse all tools', sub: `${TOTAL_TOOLS.toLocaleString()} tools`, path: '/tools', color: 'var(--gold)' },
            { icon: 'ti-folder', label: 'All categories', sub: '15 categories', path: '/categories', color: '#378add' },
            { icon: 'ti-heart', label: 'My favourites', sub: `${favourites.length} saved`, path: '/favourites', color: '#d4537e' },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, border: '1px solid var(--bdr)', background: 'var(--bg2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color + '55'; e.currentTarget.style.background = 'var(--bg3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--bg2)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: a.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${a.icon}`} style={{ fontSize: 18, color: a.color }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{a.sub}</div>
              </div>
              <i className="ti ti-arrow-right" style={{ fontSize: 13, color: 'var(--txt3)', marginLeft: 'auto' }} aria-hidden="true" />
            </button>
          ))}
        </div>

        {/* Featured interactive tools */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>
                ⚡ Featured interactive tools
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>Live calculators — open and start using immediately</div>
            </div>
            <button onClick={() => navigate('/tools')} style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {FEATURED.slice(0,8).map(tool => {
              const cat = CATEGORIES.find(c => c.name === tool.category)
              const slug = CAT_SLUGS[tool.category] || 'tools'
              return (
                <div key={tool.id} onClick={() => navigate(`/tools/${slug}/${tool.id}`)}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '13px 14px', cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = (cat?.color || 'var(--gold)') + '55'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: (cat?.color || 'var(--gold)') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`ti ${cat?.icon || 'ti-tool'}`} style={{ fontSize: 13, color: cat?.color || 'var(--gold)' }} aria-hidden="true" />
                    </div>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(29,158,117,.10)', color: '#1d9e75', border: '1px solid rgba(29,158,117,.18)', fontWeight: 600 }}>LIVE</span>
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--txt)', marginBottom: 3, lineHeight: 1.3 }}>{tool.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{tool.subcategory}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recently viewed */}
        {recentTools.length > 0 && (
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 12 }}>
              🕐 Recently viewed
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {recentTools.map(tool => {
                const cat = CATEGORIES.find(c => c.name === tool.category)
                const slug = CAT_SLUGS[tool.category] || 'tools'
                return (
                  <div key={tool.id} onClick={() => navigate(`/tools/${slug}/${tool.id}`)}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 11, padding: '12px 14px', cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bdr2)'; e.currentTarget.style.background = 'var(--bg3)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--bg2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: (cat?.color || 'var(--gold)') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`ti ${cat?.icon || 'ti-tool'}`} style={{ fontSize: 12, color: cat?.color || 'var(--gold)' }} aria-hidden="true" />
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--txt3)', letterSpacing: '.06em' }}>{tool.id}</span>
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--txt)', lineHeight: 1.3, marginBottom: 3 }}>{tool.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{tool.subcategory}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Categories grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>All categories</div>
            <button onClick={() => navigate('/categories')} style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
            {CATEGORIES.map(cat => {
              const slug = CAT_SLUGS[cat.name] || cat.id
              return (
                <button key={cat.id} onClick={() => navigate(`/categories/${slug}`)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '14px', borderRadius: 12, border: '1px solid var(--bdr)', background: 'var(--bg2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + '55'; e.currentTarget.style.background = 'var(--bg3)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--bg2)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: cat.color + '18', border: `1px solid ${cat.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <i className={`ti ${cat.icon}`} style={{ fontSize: 16, color: cat.color }} aria-hidden="true" />
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--txt)', marginBottom: 3, lineHeight: 1.3 }}>{cat.name}</div>
                  <div style={{ fontSize: 10, color: cat.color, fontWeight: 600 }}>{cat.count} tools</div>
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </>
  )
}
