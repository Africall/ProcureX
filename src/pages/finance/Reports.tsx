import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFinanceKPIs, getTrialBalance, getProfitAndLoss, getBalanceSheet } from '../../api'

type KPIs = {
  revenue: number
  expenses: number
  profit: number
  accounts_receivable: number
  accounts_payable: number
  cash_on_hand: number
}

type TrialBalanceEntry = {
  code: string
  name: string
  type: string
  total_debit: string
  total_credit: string
  balance: string
}

type ProfitLoss = {
  revenue: number
  cost_of_goods_sold: number
  gross_profit: number
  gross_profit_margin: number
  operating_expenses: number
  net_profit: number
  net_profit_margin: number
}

type BalanceSheet = {
  assets: {
    current_assets: { name: string; amount: number }[]
    fixed_assets: { name: string; amount: number }[]
    total_assets: number
  }
  liabilities: {
    current_liabilities: { name: string; amount: number }[]
    long_term_liabilities: { name: string; amount: number }[]
    total_liabilities: number
  }
  equity: {
    items: { name: string; amount: number }[]
    total_equity: number
  }
}

export default function Reports() {
  const [reportType, setReportType] = React.useState<'kpis' | 'trial-balance' | 'pl' | 'balance-sheet'>('kpis')
  const [startDate, setStartDate] = React.useState(() => {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return firstOfMonth.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().slice(0, 10))

  const { data: kpis } = useQuery<KPIs>({
    queryKey: ['finance', 'reports', 'kpis'],
    queryFn: () => getFinanceKPIs().then(res => res.data)
  })

  const { data: trialBalance } = useQuery<TrialBalanceEntry[]>({
    queryKey: ['finance', 'reports', 'trial-balance', startDate, endDate],
    queryFn: () => getTrialBalance({ startDate, endDate }).then(res => res.data)
  })

  const { data: profitLoss, refetch: refetchPL, isFetching: isFetchingPL } = useQuery<ProfitLoss>({
    queryKey: ['finance', 'reports', 'pl', startDate, endDate],
    queryFn: () => getProfitAndLoss({ startDate, endDate }).then(res => res.data)
  })

  const { data: balanceSheet } = useQuery<BalanceSheet>({
    queryKey: ['finance', 'reports', 'balance-sheet', endDate],
    queryFn: () => getBalanceSheet({ asOfDate: endDate }).then(res => res.data)
  })

  const currency = (value?: number) => value?.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }) ?? 'KES 0.00'

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Financial Reports</h1>
          <p style={{ color: '#475569', marginTop: 4 }}>Comprehensive financial statements and analysis</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#475569' }}>
            Report Type
            <select value={reportType} onChange={e => setReportType(e.target.value as any)} style={{ marginTop: 4 }}>
              <option value="kpis">KPIs Dashboard</option>
              <option value="trial-balance">Trial Balance</option>
              <option value="pl">Profit & Loss</option>
              <option value="balance-sheet">Balance Sheet</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#475569' }}>
            Start Date
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ marginTop: 4 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#475569' }}>
            End Date
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ marginTop: 4 }} />
          </label>
          <button className="btn-secondary" onClick={() => refetchPL()} disabled={isFetchingPL}>Refresh</button>
        </div>
      </header>

      {reportType === 'kpis' && (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[{
              label: 'Total Receivables',
              value: currency(kpis?.accounts_receivable),
              highlight: '#0ea5e9'
            }, {
              label: 'Total Payables',
              value: currency(kpis?.accounts_payable),
              highlight: '#ef4444'
            }, {
              label: 'Cash on Hand',
              value: currency(kpis?.cash_on_hand),
              highlight: '#22c55e'
            }, {
              label: 'Revenue',
              value: currency(kpis?.revenue),
              highlight: '#8b5cf6'
            }, {
              label: 'Expenses',
              value: currency(kpis?.expenses),
              highlight: '#f59e0b'
            }, {
              label: 'Profit',
              value: currency(kpis?.profit),
              highlight: kpis && kpis.profit >= 0 ? '#22c55e' : '#ef4444'
            }].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)', borderTop: `4px solid ${card.highlight}` }}>
            <p style={{ color: '#475569', fontSize: 14, marginBottom: 8 }}>{card.label}</p>
            <h2 style={{ fontSize: 24, fontWeight: 600 }}>{card.value}</h2>
          </div>
        ))}
          </section>
        </>
      )}

      {reportType === 'trial-balance' && (
        <section style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
          <h2 style={{ marginBottom: 16 }}>Trial Balance</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
            Period: {startDate} to {endDate}
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th style={{ textAlign: 'right' }}>Debit</th>
                <th style={{ textAlign: 'right' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance?.map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.code}</td>
                  <td>{entry.name}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {parseFloat(entry.total_debit) > 0 ? currency(parseFloat(entry.total_debit)) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {parseFloat(entry.total_credit) > 0 ? currency(parseFloat(entry.total_credit)) : '-'}
                  </td>
                </tr>
              ))}
              {trialBalance && trialBalance.length > 0 && (
                <tr style={{ borderTop: '2px solid #000', fontWeight: 700 }}>
                  <td colSpan={2}>Total</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {currency(trialBalance.reduce((sum, e) => sum + parseFloat(e.total_debit), 0))}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {currency(trialBalance.reduce((sum, e) => sum + parseFloat(e.total_credit), 0))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {reportType === 'pl' && (
        <section style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>Profit &amp; Loss Statement</h2>
            {isFetchingPL && <span style={{ color: '#6366f1' }}>Refreshing…</span>}
          </div>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
            Period: {startDate} to {endDate}
          </p>
          <table className="table">
            <tbody>
              <tr>
                <td>Revenue</td>
                <td style={{ textAlign: 'right' }}>{currency(profitLoss?.revenue)}</td>
                <td></td>
              </tr>
              <tr>
                <td>Cost of Goods Sold</td>
                <td style={{ textAlign: 'right' }}>{currency(profitLoss?.cost_of_goods_sold)}</td>
                <td></td>
              </tr>
              <tr style={{ borderTop: '1px solid #e2e8f0' }}>
                <td><strong>Gross Profit</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{currency(profitLoss?.gross_profit)}</strong></td>
                <td>{typeof profitLoss?.gross_profit_margin === 'number' ? `${profitLoss.gross_profit_margin.toFixed(1)}% margin` : ''}</td>
              </tr>
              <tr>
                <td>Operating Expenses</td>
                <td style={{ textAlign: 'right' }}>{currency(profitLoss?.operating_expenses)}</td>
                <td></td>
              </tr>
              <tr style={{ borderTop: '2px solid #000', fontWeight: 700 }}>
                <td><strong>Net Profit</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{currency(profitLoss?.net_profit)}</strong></td>
                <td>{typeof profitLoss?.net_profit_margin === 'number' ? `${profitLoss.net_profit_margin.toFixed(1)}% margin` : ''}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {reportType === 'balance-sheet' && (
        <section style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
          <h2 style={{ marginBottom: 16 }}>Balance Sheet</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
            As of: {endDate}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Assets</h3>
              <table className="table">
                <tbody>
                  <tr style={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>
                    <td colSpan={2}>Current Assets</td>
                  </tr>
                  {balanceSheet?.assets.current_assets.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingLeft: 20 }}>{item.name}</td>
                      <td style={{ textAlign: 'right' }}>{currency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>
                    <td colSpan={2}>Fixed Assets</td>
                  </tr>
                  {balanceSheet?.assets.fixed_assets.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingLeft: 20 }}>{item.name}</td>
                      <td style={{ textAlign: 'right' }}>{currency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #000', fontWeight: 700 }}>
                    <td>Total Assets</td>
                    <td style={{ textAlign: 'right' }}>{currency(balanceSheet?.assets.total_assets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Liabilities & Equity</h3>
              <table className="table">
                <tbody>
                  <tr style={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>
                    <td colSpan={2}>Current Liabilities</td>
                  </tr>
                  {balanceSheet?.liabilities.current_liabilities.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingLeft: 20 }}>{item.name}</td>
                      <td style={{ textAlign: 'right' }}>{currency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>
                    <td colSpan={2}>Long-term Liabilities</td>
                  </tr>
                  {balanceSheet?.liabilities.long_term_liabilities.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingLeft: 20 }}>{item.name}</td>
                      <td style={{ textAlign: 'right' }}>{currency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid #e2e8f0', fontWeight: 600 }}>
                    <td>Total Liabilities</td>
                    <td style={{ textAlign: 'right' }}>{currency(balanceSheet?.liabilities.total_liabilities)}</td>
                  </tr>
                  <tr style={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>
                    <td colSpan={2}>Equity</td>
                  </tr>
                  {balanceSheet?.equity.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingLeft: 20 }}>{item.name}</td>
                      <td style={{ textAlign: 'right' }}>{currency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid #e2e8f0', fontWeight: 600 }}>
                    <td>Total Equity</td>
                    <td style={{ textAlign: 'right' }}>{currency(balanceSheet?.equity.total_equity)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #000', fontWeight: 700 }}>
                    <td>Total Liabilities & Equity</td>
                    <td style={{ textAlign: 'right' }}>
                      {currency((balanceSheet?.liabilities.total_liabilities || 0) + (balanceSheet?.equity.total_equity || 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
