import { useParams, useNavigate } from 'react-router-dom'
import { BUSINESS_TOOLS, BUSINESS_SUBCATEGORIES, getBizToolById } from '../data/business'
import { CategoryPageTemplate, ToolDetailTemplate } from '../components/CategoryTemplate'

const CAT = {
  id: 'business',
  name: 'Business & Entrepreneurship',
  icon: 'ti-briefcase',
  color: '#639922',
  colorBg: 'rgba(99,153,34,0.10)',
}

export function BusinessPage() {
  return (
    <CategoryPageTemplate
      cat={CAT}
      tools={BUSINESS_TOOLS}
      subcategories={BUSINESS_SUBCATEGORIES}
      basePath="business"
    />
  )
}

export function BusinessToolPage() {
  const { toolId } = useParams()
  const navigate = useNavigate()
  const tool = getBizToolById(toolId)

  if (!tool) return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <i className="ti ti-tool" style={{ fontSize: 36, color: 'var(--txt3)' }} aria-hidden="true" />
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>Tool not found</div>
      <button onClick={() => navigate('/categories/business')}
        style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>
        ← Back to Business
      </button>
    </div>
  )

  const related = BUSINESS_TOOLS
    .filter(t => t.subcategory === tool.subcategory && t.id !== tool.id)
    .slice(0, 6)

  return (
    <ToolDetailTemplate
      cat={CAT}
      tool={tool}
      basePath="business"
      relatedTools={related}
    />
  )
}
