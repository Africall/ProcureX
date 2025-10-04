import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getFinanceKPIs } from '../../api'
import { useFormatCurrency } from '../../utils/currency'

interface FinanceKPIs {
  revenue: number
  expenses: number
  profit: number
  accounts_receivable: number
  accounts_payable: number
  cash_on_hand: number
}

export default function FinanceDashboard() {
  const { data: kpis, isLoading } = useQuery<FinanceKPIs>({
    queryKey: ['finance', 'kpis'],
    queryFn: () => getFinanceKPIs().then(res => res.data)
  })

  if (isLoading) return <div>Loading...</div>

  const formatCurrency = useFormatCurrency()

  const netCashflow = (kpis?.cash_on_hand || 0) + (kpis?.accounts_receivable || 0) - (kpis?.accounts_payable || 0)

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Smart Books - Finance Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/finance/smart-books/invoices" className="btn-primary">+ New Invoice</Link>
          <Link to="/finance/smart-books/bills" className="btn-primary">+ New Bill</Link>
          <Link to="/finance/smart-books/payments" className="btn-primary">+ Record Payment</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px', background: '#f0f9ff', borderLeft: '4px solid #93c5fd' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Cash</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(kpis?.cash_on_hand || 0)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>All accounts</div>
        </div>

        <div className="card" style={{ padding: '20px', background: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Receivables</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(kpis?.accounts_receivable || 0)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Outstanding AR</div>
        </div>

        <div className="card" style={{ padding: '20px', background: '#fef2f2', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Payables</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(kpis?.accounts_payable || 0)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Outstanding AP</div>
        </div>

        <div className="card" style={{ padding: '20px', background: '#faf5ff', borderLeft: '4px solid #a855f7' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Net Cashflow</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: netCashflow >= 0 ? '#22c55e' : '#ef4444' }}>
            {formatCurrency(netCashflow)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Cash + AR - AP</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <Link to="/finance/smart-books/banking" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏦</div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Banking</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Manage accounts, reconcile</div>
        </Link>

        <Link to="/finance/smart-books/invoices" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Invoices</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Create & send invoices</div>
        </Link>

        <Link to="/finance/smart-books/bills" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Bills</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Manage vendor bills</div>
        </Link>

        <Link to="/finance/smart-books/payments" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💳</div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Payments</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Record payments</div>
        </Link>

        <Link to="/finance/smart-books/expenses" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Expenses</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Track expenses</div>
        </Link>

        <Link to="/finance/smart-books/reports" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Reports</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>P&L, Balance Sheet</div>
        </Link>

        <Link to="/finance/smart-books/settings" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚙️</div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Settings</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Configure Smart Books</div>
        </Link>
      </div>

      {/* Info Box */}
      <div className="card" style={{ padding: '20px', background: '#fffbeb', borderLeft: '2px solid #fcd34d' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>🎉 Welcome to Smart Books!</h3>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>
          Your integrated finance & accounting solution. Smart Books is tightly integrated with Procurement, Vendors, Inventory, and Contracts for seamless financial management.
        </p>
        <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px', color: '#64748b' }}>
          <li>Create invoices for customers and track receivables</li>
          <li>Convert Purchase Orders directly into bills with one click</li>
          <li>Record payments via M-PESA, Bank, Cash or Card</li>
          <li>Run comprehensive financial reports (P&L, Balance Sheet, Aging)</li>
          <li>Bank reconciliation with statement upload</li>
        </ul>
      </div>
    </div>
  )
}
