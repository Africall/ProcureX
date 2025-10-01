import axios from 'axios'
import { notifyError } from './notify'

// Prefer relative base in dev via Vite proxy; in preview/prod set VITE_API_ORIGIN to backend origin (e.g., http://127.0.0.1:4001)
const base = (import.meta as any).env.VITE_API_ORIGIN || ''
const api = axios.create({
  baseURL: `${base}/api`,
  withCredentials: true,
  timeout: 10000,
})

function getCsrf(){
  if (typeof document === 'undefined') return ''
  const entry = document.cookie.split(';').map(s=>s.trim()).find(s=> s.startsWith('csrf_token='))
  return entry ? decodeURIComponent(entry.split('=')[1]) : ''
}

// Attach CSRF token automatically for mutating requests
api.interceptors.request.use((config)=>{
  const method = (config.method || 'get').toUpperCase()
  if(!['GET','HEAD','OPTIONS'].includes(method)){
    config.headers = config.headers || {}
    ;(config.headers as any)['X-CSRF-Token'] = getCsrf()
  }
  return config
})

// Global error mapping: let callers opt-out by catching and handling explicitly
api.interceptors.response.use(
  (res)=> res,
  (error)=>{
    // Enhanced error handling with connection diagnostics
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      console.warn('🔄 API connection failed - ensure backend is running on port 4001')
      notifyError(new Error('Cannot reach API service. Please ensure the backend is running.'))
    } else {
      // Avoid duplicate toasts: if caller will handle, they can catch
      notifyError(error)
    }
    return Promise.reject(error)
  }
)

export type ItemPayload = {
  name: string
  sku?: string
  quantity: number
  location?: string
}

export const getItems = () => api.get('/items')
export const createItem = (payload: ItemPayload) => api.post('/items', payload)
export const updateItem = (id: number, payload: ItemPayload) => api.put(`/items/${id}`, payload)
export const deleteItem = (id: number) => api.delete(`/items/${id}`)

export default api

export type ServerListResponse = { items: ItemPayload[] | any[], total: number }

export const fetchItems = (params?: { q?: string, page?: number, limit?: number, sort?: string, location?: string }) =>
  api.get<ServerListResponse>('/items', { params })

// Enterprise Dashboard API endpoints
export const getDashboardKPIs = () => api.get('/dashboard/kpis')
export const getLowStockItems = () => api.get('/dashboard/low-stock')
export const getPOPipeline = () => api.get('/dashboard/po-pipeline')
export const getStockTrends = () => api.get('/dashboard/stock-trends')
export const getTechUsage = () => api.get('/dashboard/tech-usage')
export const getSupplierPerformance = () => api.get('/dashboard/supplier-performance')
export const getDashboardAlerts = () => api.get('/dashboard/alerts')
export const getActivityTimeline = () => api.get('/dashboard/activity')
export const getPredictiveInsights = () => api.get('/dashboard/insights')

// Account profile
export const getProfile = () => api.get('/account/profile')
export const updateProfile = (payload: { displayName: string; email: string }) => api.put('/account/profile', payload)

// ============================================================================
// FINANCE API (PostgreSQL-backed Smart Books)
// ============================================================================

// Chart of Accounts
export const getChartOfAccounts = () => api.get('/finance/chart-of-accounts')

// Financial Accounts (Bank, M-PESA, Cash)
export const getFinanceAccounts = () => api.get('/finance/accounts')

// Tax Rates
export const getTaxRates = () => api.get('/finance/tax-rates')

// Counterparties (Customers/Vendors)
export const getCounterparties = (type?: 'customer' | 'vendor' | 'staff') => 
  api.get('/finance/counterparties', { params: type ? { type } : {} })
export const createCounterparty = (payload: { name: string; type: 'customer' | 'vendor' | 'staff'; email?: string; phone?: string; address?: string; tax_id?: string }) =>
  api.post('/finance/counterparties', payload)

// Invoices (AR)
export const getInvoices = (params?: { status?: string; customer_id?: string }) =>
  api.get('/finance/invoices', { params })
export const getInvoice = (id: string) => api.get(`/finance/invoices/${id}`)
export const createInvoice = (payload: { customer_id: string; number: string; invoice_date: string; due_date: string; items: any[]; memo?: string }) =>
  api.post('/finance/invoices', payload)
export const updateInvoice = (id: string, payload: { status?: string; memo?: string }) =>
  api.put(`/finance/invoices/${id}`, payload)
export const recordInvoicePayment = (id: string, payload: { amount: number; payment_date: string; account_id: string; reference?: string; memo?: string }) =>
  api.post(`/finance/invoices/${id}/record-payment`, payload)

// Bills (AP)
export const getBills = (params?: { status?: string; vendor_id?: string }) =>
  api.get('/finance/bills', { params })
export const getBill = (id: string) => api.get(`/finance/bills/${id}`)
export const createBill = (payload: { vendor_id: string; number: string; bill_date: string; due_date: string; items: any[]; memo?: string }) =>
  api.post('/finance/bills', payload)
export const recordBillPayment = (id: string, payload: { amount: number; payment_date: string; account_id: string; reference?: string; memo?: string }) =>
  api.post(`/finance/bills/${id}/record-payment`, payload)

// Payments
export const getPayments = (params?: { type?: string; account_id?: string }) =>
  api.get('/finance/payments', { params })
export const createPayment = (payload: { payment_date: string; amount: number; account_id: string; counterparty_id?: string; reference?: string; memo?: string; type?: string }) =>
  api.post('/finance/payments', payload)

// Expenses
export const getExpenses = () => api.get('/finance/expenses')
export const createExpense = (payload: { expense_date: string; amount: number; account_id: string; category?: string; payee?: string; reference?: string; memo?: string }) =>
  api.post('/finance/expenses', payload)

// Reports
export const getFinanceKPIs = () => api.get('/finance/reports/kpis')
export const getTrialBalance = (params?: { startDate?: string; endDate?: string }) => api.get('/finance/reports/trial-balance', { params })
export const getProfitAndLoss = (params?: { startDate?: string; endDate?: string }) => api.get('/finance/reports/pnl', { params })
export const getBalanceSheet = (params?: { asOfDate?: string }) => api.get('/finance/reports/balance-sheet', { params })
