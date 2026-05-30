import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import './styles.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { LangProvider } from './context/LangContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import { AllToolsPage, CategoriesPage, CategoryDetailPage } from './pages/Tools'
import { ToolDetailPage, FavouritesPage, SearchPage, ExportPage, HelpPage, NotificationsPage } from './pages/Other'
import { SettingsPage, ProfilePage } from './pages/Settings'
import { PersonalFinancePage, PersonalFinanceToolPage } from './pages/PersonalFinance'
import { BusinessPage, BusinessToolPage } from './pages/Business'
import { InvestingPage, InvestingToolPage } from './pages/Investing'
import {
  ProductivityPage, ProductivityToolPage,
  RealEstatePage, RealEstateToolPage,
  ProjectsPage, ProjectsToolPage,
  MarketingPage, MarketingToolPage,
  HrPage, HrToolPage,
  OperationsPage, OperationsToolPage,
  DashboardsPage, DashboardsToolPage,
  EventsPage, EventsToolPage,
  EducationPage, EducationToolPage,
  CreatorPage, CreatorToolPage,
  HealthcarePage, HealthcareToolPage,
  LegalPage, LegalToolPage,
} from './pages/AllCategories'
import { OnboardingPage, SignUpPage, SignInPage, SubscribePage, ResetPasswordPage } from './pages/Auth'

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isLoggedIn) return <Navigate to="/welcome" replace />
  return children
}

function PublicRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (isLoggedIn) return <Navigate to="/" replace />
  return children
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 16 16" fill="#0c0c12">
          <rect x="1" y="1" width="6" height="6" rx="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.4"/>
          <rect x="1" y="9" width="6" height="6" rx="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.4"/>
        </svg>
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--txt)' }}>Loading CLARIS...</div>
    </div>
  )
}

function AppLayout() {
  const navigate = useNavigate()
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        navigate('/search')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-area">
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/tools"           element={<AllToolsPage />} />
          <Route path="/tools/:id"       element={<ToolDetailPage />} />
          <Route path="/categories"      element={<CategoriesPage />} />
          <Route path="/categories/:id"  element={<CategoryDetailPage />} />
          <Route path="/categories/personal-finance" element={<PersonalFinancePage />} />
          <Route path="/tools/personal-finance/:toolId" element={<PersonalFinanceToolPage />} />
          <Route path="/categories/business" element={<BusinessPage />} />
          <Route path="/tools/business/:toolId" element={<BusinessToolPage />} />
          <Route path="/categories/investing" element={<InvestingPage />} />
          <Route path="/tools/investing/:toolId" element={<InvestingToolPage />} />
          <Route path="/categories/productivity" element={<ProductivityPage />} />
          <Route path="/tools/productivity/:toolId" element={<ProductivityToolPage />} />
          <Route path="/categories/real-estate" element={<RealEstatePage />} />
          <Route path="/tools/real-estate/:toolId" element={<RealEstateToolPage />} />
          <Route path="/categories/projects" element={<ProjectsPage />} />
          <Route path="/tools/projects/:toolId" element={<ProjectsToolPage />} />
          <Route path="/categories/marketing" element={<MarketingPage />} />
          <Route path="/tools/marketing/:toolId" element={<MarketingToolPage />} />
          <Route path="/categories/hr" element={<HrPage />} />
          <Route path="/tools/hr/:toolId" element={<HrToolPage />} />
          <Route path="/categories/operations" element={<OperationsPage />} />
          <Route path="/tools/operations/:toolId" element={<OperationsToolPage />} />
          <Route path="/categories/dashboards" element={<DashboardsPage />} />
          <Route path="/tools/dashboards/:toolId" element={<DashboardsToolPage />} />
          <Route path="/categories/events" element={<EventsPage />} />
          <Route path="/tools/events/:toolId" element={<EventsToolPage />} />
          <Route path="/categories/education" element={<EducationPage />} />
          <Route path="/tools/education/:toolId" element={<EducationToolPage />} />
          <Route path="/categories/creator" element={<CreatorPage />} />
          <Route path="/tools/creator/:toolId" element={<CreatorToolPage />} />
          <Route path="/categories/healthcare" element={<HealthcarePage />} />
          <Route path="/tools/healthcare/:toolId" element={<HealthcareToolPage />} />
          <Route path="/categories/legal" element={<LegalPage />} />
          <Route path="/tools/legal/:toolId" element={<LegalToolPage />} />
          <Route path="/favourites"      element={<FavouritesPage />} />
          <Route path="/search"          element={<SearchPage />} />
          <Route path="/export"          element={<ExportPage />} />
          <Route path="/help"            element={<HelpPage />} />
          <Route path="/notifications"   element={<NotificationsPage />} />
          <Route path="/settings"        element={<SettingsPage />} />
          <Route path="/profile"         element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/welcome"   element={<PublicRoute><OnboardingPage /></PublicRoute>} />
      <Route path="/signup"    element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/signin"    element={<PublicRoute><SignInPage /></PublicRoute>} />
      <Route path="/subscribe" element={<SubscribePage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <LangProvider>
    <CurrencyProvider>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </CurrencyProvider>
    </LangProvider>
  )
}
