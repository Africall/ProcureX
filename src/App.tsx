import React from 'react'
import { Routes, Route, Link, Outlet, Navigate } from 'react-router-dom'
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Inventory = React.lazy(() => import('./pages/Inventory'))
const Suppliers = React.lazy(() => import('./pages/Suppliers'))
const SupplierDetail = React.lazy(() => import('./pages/SupplierDetail'))
const Marketplace = React.lazy(() => import('./pages/Marketplace'))
const FinanceDashboard = React.lazy(() => import('./pages/finance/FinanceDashboard'))
const Banking = React.lazy(() => import('./pages/finance/Banking'))
const Invoices = React.lazy(() => import('./pages/finance/Invoices'))
const Bills = React.lazy(() => import('./pages/finance/Bills'))
const Payments = React.lazy(() => import('./pages/finance/Payments'))
const Expenses = React.lazy(() => import('./pages/finance/Expenses'))
const Reports = React.lazy(() => import('./pages/finance/Reports'))
const Settings = React.lazy(() => import('./pages/finance/Settings'))
const AppSettings = React.lazy(() => import('./pages/Settings'))
const Profile = React.lazy(() => import('./pages/Profile'))
import { ToastProvider, useToast } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import ConfirmModal from './components/ConfirmModal'
import { setGlobalNotifier } from './notify'
import { useTheme } from './theme'
import AssistantPanel from './components/AssistantPanel'
import { useAssistant } from './assistantStore'
import ProfileMenu from './components/ProfileMenu'
import CurrencySelector from './components/CurrencySelector'

function Header(){
  const { theme, toggle } = useTheme()
  const { toggle: toggleAssistant } = useAssistant()
  return (
    <header className="header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div>ProcureX Inventory</div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <CurrencySelector />
        <button className="btn-secondary" onClick={toggle} title={`Switch to ${theme==='dark'?'light':'dark'} mode`}>{theme==='dark' ? '🌙' : '☀️'}</button>
        <button className="btn-secondary" onClick={toggleAssistant} title="Open AI Assistant">🤖</button>
        <ProfileMenu userName="Admin User" userEmail="admin@procurex.com" userRole="Administrator" />
      </div>
    </header>
  )
}

function MainLayout(){
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">ProcureX</div>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/inventory">Inventory</Link>
          <Link to="/suppliers">Suppliers</Link>
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/finance/smart-books">💰 Smart Books</Link>
          <Link to="/settings">⚙️ Settings</Link>
        </nav>
      </aside>
      <main className="main">
        <Header />
        <div className="content">
          <Outlet />
        </div>
      </main>
      <AssistantPanel />
    </div>
  )
}

// Optional fallback for unknown routes
function NotFoundRedirect(){
  return <Navigate to="/" replace />
}

export default function App(){
  // Bridge Toast to global notifier once at app root
  function NotifierBridge(){
    const { push } = useToast()
    React.useEffect(()=>{
      setGlobalNotifier((message, type='error')=> push({ type, text: message }))
    }, [push])
    return null
  }

  return ( 
    <ToastProvider>
      <NotifierBridge />
      <ErrorBoundary>
        <React.Suspense fallback={<div style={{padding:16}}>Loading…</div>}>
          <Routes>
          <Route element={<MainLayout />}> 
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/:id" element={<SupplierDetail />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="finance/smart-books" element={<FinanceDashboard />} />
            <Route path="finance/smart-books/banking" element={<Banking />} />
            <Route path="finance/smart-books/invoices" element={<Invoices />} />
            <Route path="finance/smart-books/bills" element={<Bills />} />
            <Route path="finance/smart-books/payments" element={<Payments />} />
            <Route path="finance/smart-books/expenses" element={<Expenses />} />
            <Route path="finance/smart-books/reports" element={<Reports />} />
            <Route path="finance/smart-books/settings" element={<Settings />} />
            <Route path="settings" element={<AppSettings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFoundRedirect />} />
          </Route>
          </Routes>
        </React.Suspense>
      </ErrorBoundary>
    </ToastProvider>
  )
}
