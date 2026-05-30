import { useParams, useNavigate } from 'react-router-dom'
import { INVESTING_TOOLS, INVESTING_SUBCATEGORIES, getInvestingToolById } from '../data/investing'
import { CategoryPageTemplate, ToolDetailTemplate } from '../components/CategoryTemplate'

const CAT = {
  id: 'investing',
  name: 'Investing & Wealth',
  icon: 'ti-trending-up',
  color: '#378add',
  colorBg: 'rgba(55,138,221,0.10)',
}

export function InvestingPage() {
  return (
    <CategoryPageTemplate
      cat={CAT}
      tools={INVESTING_TOOLS}
      subcategories={INVESTING_SUBCATEGORIES}
      basePath="investing"
    />
  )
}

export function InvestingToolPage() {
  const { toolId } = useParams()
  const navigate = useNavigate()
  const tool = getInvestingToolById(toolId)

  if (!tool) return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <i className="ti ti-tool" style={{ fontSize: 36, color: 'var(--txt3)' }} aria-hidden="true" />
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>Tool not found</div>
      <button onClick={() => navigate('/categories/investing')}
        style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--bdr)', background: 'transparent', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>
        ← Back to Investing & Wealth
      </button>
    </div>
  )

  const related = INVESTING_TOOLS
    .filter(t => t.subcategory === tool.subcategory && t.id !== tool.id)
    .slice(0, 6)

  return (
    <ToolDetailTemplate
      cat={CAT}
      tool={tool}
      basePath="investing"
      relatedTools={related}
    />
  )
}
