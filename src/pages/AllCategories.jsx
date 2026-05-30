import { useParams, useNavigate } from 'react-router-dom'
import { CategoryPageTemplate, ToolDetailTemplate } from '../components/CategoryTemplate'

// ── DATA IMPORTS ───────────────────────────────────────────────
import { PRODUCTIVITY_TOOLS, PRODUCTIVITY_SUBCATEGORIES, getProductivityToolById } from '../data/productivity'
import { REAL_ESTATE_TOOLS, REAL_ESTATE_SUBCATEGORIES, getRealEstateToolById } from '../data/real_estate'
import { PROJECTS_TOOLS, PROJECTS_SUBCATEGORIES, getProjectsToolById } from '../data/projects'
import { MARKETING_TOOLS, MARKETING_SUBCATEGORIES, getMarketingToolById } from '../data/marketing'
import { HR_TOOLS, HR_SUBCATEGORIES, getHrToolById } from '../data/hr'
import { OPERATIONS_TOOLS, OPERATIONS_SUBCATEGORIES, getOperationsToolById } from '../data/operations'
import { DASHBOARDS_TOOLS, DASHBOARDS_SUBCATEGORIES, getDashboardsToolById } from '../data/dashboards'
import { EVENTS_TOOLS, EVENTS_SUBCATEGORIES, getEventsToolById } from '../data/events'
import { EDUCATION_TOOLS, EDUCATION_SUBCATEGORIES, getEducationToolById } from '../data/education'
import { CREATOR_TOOLS, CREATOR_SUBCATEGORIES, getCreatorToolById } from '../data/creator'
import { HEALTHCARE_TOOLS, HEALTHCARE_SUBCATEGORIES, getHealthcareToolById } from '../data/healthcare'
import { LEGAL_TOOLS, LEGAL_SUBCATEGORIES, getLegalToolById } from '../data/legal'

// ── CATEGORY CONFIGS ──────────────────────────────────────────
const CATS = {
  productivity: { name: 'Productivity & Life',     icon: 'ti-list-check',    color: '#1d9e75', colorBg: 'rgba(29,158,117,0.10)'  },
  'real-estate':{ name: 'Property & Real Estate',  icon: 'ti-home',          color: '#d4537e', colorBg: 'rgba(212,83,126,0.10)'  },
  projects:     { name: 'Project Management',       icon: 'ti-layout-kanban', color: '#7f77dd', colorBg: 'rgba(127,119,221,0.10)' },
  marketing:    { name: 'Marketing & Growth',       icon: 'ti-speakerphone',  color: '#ba7517', colorBg: 'rgba(186,117,23,0.10)'  },
  hr:           { name: 'HR & Workforce',           icon: 'ti-users',         color: '#5dcaa5', colorBg: 'rgba(93,202,165,0.10)'  },
  operations:   { name: 'Operations & Assets',      icon: 'ti-settings-2',    color: '#ef9f27', colorBg: 'rgba(239,159,39,0.10)'  },
  dashboards:   { name: 'Dashboards & AI',          icon: 'ti-robot',         color: '#c9a96e', colorBg: 'rgba(201,169,110,0.10)' },
  events:       { name: 'Events & Travel',          icon: 'ti-plane',         color: '#85b7eb', colorBg: 'rgba(133,183,235,0.10)' },
  education:    { name: 'Education & Students',     icon: 'ti-school',        color: '#afa9ec', colorBg: 'rgba(175,169,236,0.10)' },
  creator:      { name: 'Creator Economy',          icon: 'ti-video',         color: '#f09595', colorBg: 'rgba(240,149,149,0.10)' },
  healthcare:   { name: 'Healthcare & Care',        icon: 'ti-heart',         color: '#d4537e', colorBg: 'rgba(212,83,126,0.08)'  },
  legal:        { name: 'Legal & Admin',            icon: 'ti-scale',         color: '#b4b2a9', colorBg: 'rgba(180,178,169,0.10)' },
}

// ── DATA MAP ──────────────────────────────────────────────────
const DATA = {
  productivity: { tools: PRODUCTIVITY_TOOLS, subcats: PRODUCTIVITY_SUBCATEGORIES, getById: getProductivityToolById },
  'real-estate':{ tools: REAL_ESTATE_TOOLS,  subcats: REAL_ESTATE_SUBCATEGORIES,  getById: getRealEstateToolById  },
  projects:     { tools: PROJECTS_TOOLS,     subcats: PROJECTS_SUBCATEGORIES,     getById: getProjectsToolById    },
  marketing:    { tools: MARKETING_TOOLS,    subcats: MARKETING_SUBCATEGORIES,    getById: getMarketingToolById   },
  hr:           { tools: HR_TOOLS,           subcats: HR_SUBCATEGORIES,           getById: getHrToolById          },
  operations:   { tools: OPERATIONS_TOOLS,   subcats: OPERATIONS_SUBCATEGORIES,   getById: getOperationsToolById  },
  dashboards:   { tools: DASHBOARDS_TOOLS,   subcats: DASHBOARDS_SUBCATEGORIES,   getById: getDashboardsToolById  },
  events:       { tools: EVENTS_TOOLS,       subcats: EVENTS_SUBCATEGORIES,       getById: getEventsToolById      },
  education:    { tools: EDUCATION_TOOLS,    subcats: EDUCATION_SUBCATEGORIES,    getById: getEducationToolById   },
  creator:      { tools: CREATOR_TOOLS,      subcats: CREATOR_SUBCATEGORIES,      getById: getCreatorToolById     },
  healthcare:   { tools: HEALTHCARE_TOOLS,   subcats: HEALTHCARE_SUBCATEGORIES,   getById: getHealthcareToolById  },
  legal:        { tools: LEGAL_TOOLS,        subcats: LEGAL_SUBCATEGORIES,        getById: getLegalToolById       },
}

// ── GENERIC CATEGORY PAGE ─────────────────────────────────────
export function GenericCategoryPage({ slug }) {
  const cat = CATS[slug]
  const data = DATA[slug]
  if (!cat || !data) return null
  return (
    <CategoryPageTemplate
      cat={cat}
      tools={data.tools}
      subcategories={data.subcats}
      basePath={slug}
    />
  )
}

// ── GENERIC TOOL DETAIL PAGE ──────────────────────────────────
export function GenericToolPage({ slug }) {
  const { toolId } = useParams()
  const navigate = useNavigate()
  const cat = CATS[slug]
  const data = DATA[slug]
  if (!cat || !data) return null

  const tool = data.getById(toolId)

  if (!tool) return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <i className="ti ti-tool" style={{ fontSize: 36, color: 'var(--txt3)' }} aria-hidden="true" />
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>Tool not found</div>
      <div style={{ fontSize: 12, color: 'var(--txt2)' }}>This tool doesn't exist or hasn't loaded yet.</div>
      <button onClick={() => navigate(`/categories/${slug}`)}
        style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
        ← Back to {cat.name}
      </button>
    </div>
  )

  const related = data.tools
    .filter(t => t.subcategory === tool.subcategory && t.id !== tool.id)
    .slice(0, 6)

  return (
    <ToolDetailTemplate
      cat={cat}
      tool={tool}
      basePath={slug}
      relatedTools={related}
    />
  )
}

// ── NAMED EXPORTS per category (used in App.jsx routes) ───────
export const ProductivityPage     = () => <GenericCategoryPage slug="productivity" />
export const ProductivityToolPage = () => <GenericToolPage     slug="productivity" />
export const RealEstatePage       = () => <GenericCategoryPage slug="real-estate"  />
export const RealEstateToolPage   = () => <GenericToolPage     slug="real-estate"  />
export const ProjectsPage         = () => <GenericCategoryPage slug="projects"     />
export const ProjectsToolPage     = () => <GenericToolPage     slug="projects"     />
export const MarketingPage        = () => <GenericCategoryPage slug="marketing"    />
export const MarketingToolPage    = () => <GenericToolPage     slug="marketing"    />
export const HrPage               = () => <GenericCategoryPage slug="hr"           />
export const HrToolPage           = () => <GenericToolPage     slug="hr"           />
export const OperationsPage       = () => <GenericCategoryPage slug="operations"   />
export const OperationsToolPage   = () => <GenericToolPage     slug="operations"   />
export const DashboardsPage       = () => <GenericCategoryPage slug="dashboards"   />
export const DashboardsToolPage   = () => <GenericToolPage     slug="dashboards"   />
export const EventsPage           = () => <GenericCategoryPage slug="events"       />
export const EventsToolPage       = () => <GenericToolPage     slug="events"       />
export const EducationPage        = () => <GenericCategoryPage slug="education"    />
export const EducationToolPage    = () => <GenericToolPage     slug="education"    />
export const CreatorPage          = () => <GenericCategoryPage slug="creator"      />
export const CreatorToolPage      = () => <GenericToolPage     slug="creator"      />
export const HealthcarePage       = () => <GenericCategoryPage slug="healthcare"   />
export const HealthcareToolPage   = () => <GenericToolPage     slug="healthcare"   />
export const LegalPage            = () => <GenericCategoryPage slug="legal"        />
export const LegalToolPage        = () => <GenericToolPage     slug="legal"        />
