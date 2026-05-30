import { NavLink, useNavigate } from 'react-router-dom'
import { CATEGORIES, TOTAL_TOOLS } from '../data/categories'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'

// Category slug map for dedicated pages
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

export default function Sidebar() {
  const { favourites, user, profile, signOut } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()

  const navItems = [
    { to: '/',           icon: 'ti-layout-dashboard', label: t.dashboard,     count: null },
    { to: '/tools',      icon: 'ti-apps',             label: t.allTools,      count: TOTAL_TOOLS.toLocaleString() },
    { to: '/categories', icon: 'ti-folder',           label: t.categories,    count: 15 },
    { to: '/favourites', icon: 'ti-heart',            label: t.favourites,    count: favourites.length || null },
  ]

  const accountItems = [
    { to: '/search',        icon: 'ti-search',      label: t.search },
    { to: '/notifications', icon: 'ti-bell',        label: t.notifications },
    { to: '/settings',      icon: 'ti-settings',    label: t.settings },
  ]

  const initials = (profile?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()
  const displayName = profile?.full_name || profile?.first_name || user?.email?.split('@')[0] || 'User'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sb-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="sb-logo-icon">
          <svg viewBox="0 0 16 16">
            <rect x="1" y="1" width="6" height="6" rx="1.4"/>
            <rect x="9" y="1" width="6" height="6" rx="1.4"/>
            <rect x="1" y="9" width="6" height="6" rx="1.4"/>
            <rect x="9" y="9" width="6" height="6" rx="1.4"/>
          </svg>
        </div>
        <div>
          <div className="sb-logo-name">CLARIS</div>
          <div className="sb-logo-badge">PRO</div>
        </div>
      </div>

      <div className="sb-scroll">
        {/* Main navigation */}
        <div className="sb-section">
          <div className="sb-section-label">Navigation</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count != null && item.count !== 0 && (
                <span className="nav-item-count">{item.count}</span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Categories */}
        <div className="sb-section">
          <div className="sb-section-label">{t.categories}</div>
          {CATEGORIES.map(cat => {
            const slug = CAT_SLUGS[cat.name] || cat.id
            return (
              <NavLink
                key={cat.id}
                to={`/categories/${slug}`}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <i className={`ti ${cat.icon}`} aria-hidden="true" style={{ color: 'inherit' }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.name.length > 18 ? cat.name.split(' ').slice(0,2).join(' ') : cat.name}
                </span>
                <span className="nav-item-count">{cat.count}</span>
              </NavLink>
            )
          })}
        </div>

        {/* Account */}
        <div className="sb-section">
          <div className="sb-section-label">Account</div>
          {accountItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              <span style={{ flex: 1 }}>{item.label}</span>
            </NavLink>
          ))}
          <div className="nav-item" style={{ cursor: 'pointer' }} onClick={signOut}>
            <i className="ti ti-logout" aria-hidden="true" style={{ color: '#e24b4a' }} />
            <span style={{ flex: 1, color: '#e24b4a' }}>{t.signOut}</span>
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="sb-footer">
        <NavLink to="/profile" className="user-pill" style={{ textDecoration: 'none' }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={initials} className="user-avatar" style={{ objectFit: 'cover', borderRadius: '50%' }} />
            : <div className="user-avatar">{initials}</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div className="user-plan">Pro · £10/mo</div>
          </div>
          <i className="ti ti-chevron-right" style={{ fontSize: 12, color: 'var(--txt3)', flexShrink: 0 }} aria-hidden="true" />
        </NavLink>
      </div>
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--bdr)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--txt3)', textAlign: 'center', letterSpacing: '.04em' }}>
          CLARIS v1.2.4
        </div>
      </div>
    </aside>
  )
}
