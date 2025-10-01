import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api'

interface Expense {
  id: number
  payee: string
  categoryAccountId: number
  amount: number
  date: string
  description: string
  status: string
}

interface Vendor {
  id: number
  name: string
}

interface Account {
  id: number
  name: string
  type: string
}

interface ChartAccount {
  id: number
  code: string
  name: string
  type: string
}

export default function Expenses() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = React.useState(false)
  const [categoryAccountId, setCategoryAccountId] = React.useState<number | ''>('')
  const [vendorId, setVendorId] = React.useState<number | ''>('')
  const [payee, setPayee] = React.useState('')
  const [amount, setAmount] = React.useState(0)
  const [accountId, setAccountId] = React.useState<number | ''>('')
  const [description, setDescription] = React.useState('')
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10))

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['finance', 'expenses'],
    queryFn: () => api.get('/finance/expenses').then(res => res.data)
  })

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: () => api.get('/suppliers').then(res => res.data)
  })

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['finance', 'accounts'],
    queryFn: () => api.get('/finance/accounts').then(res => res.data)
  })

  const { data: chartOfAccounts } = useQuery<ChartAccount[]>({
    queryKey: ['finance', 'chart-of-accounts'],
    queryFn: () => api.get('/finance/chart-of-accounts').then(res => res.data)
  })

  const expenseAccounts = React.useMemo(
    () => (chartOfAccounts ?? []).filter(account => account.type === 'expense'),
    [chartOfAccounts]
  )

  React.useEffect(() => {
    if (vendorId) {
      const vendor = vendors?.find(v => v.id === vendorId)
      if (vendor) {
        setPayee(vendor.name)
      }
    }
  }, [vendorId, vendors])

  const createExpense = useMutation({
    mutationFn: () => {
      if (categoryAccountId === '' || accountId === '') {
        return Promise.reject(new Error('Select category and account'))
      }
      return api.post('/finance/expenses', {
        payee: payee || vendors?.find(v => v.id === vendorId)?.name || 'Miscellaneous',
        categoryAccountId: Number(categoryAccountId),
        amount: Number(amount),
        date,
        description,
        accountId: Number(accountId)
      }).then(res => res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      setShowForm(false)
      setCategoryAccountId('')
      setVendorId('')
      setPayee('')
      setAmount(0)
      setAccountId('')
      setDescription('')
    }
  })

  const resolveCategoryName = React.useCallback((id: number) => {
    return expenseAccounts.find(acc => acc.id === id)?.name || 'Expense'
  }, [expenseAccounts])

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Expenses</h1>
          <p style={{ color: '#475569', marginTop: 4 }}>Track operating expenses, assign categories, and sync them with your general ledger.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Capture Expense</button>
      </div>

      {isLoading ? <div>Loading expenses...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Payee</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {expenses?.length ? expenses.map(expense => (
              <tr key={expense.id}>
                <td>{new Date(expense.date).toLocaleDateString()}</td>
                <td>{expense.payee || '-'}</td>
                <td>{expense.amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td>
                <td>{resolveCategoryName(expense.categoryAccountId)}</td>
                <td style={{ textTransform: 'capitalize' }}>{expense.status}</td>
                <td>{expense.description}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No expenses captured yet.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Capture Expense</h2>
            <form onSubmit={(e) => { e.preventDefault(); createExpense.mutate() }} className="form-grid">
              <label>
                <span>Payee</span>
                <input value={payee} onChange={e => setPayee(e.target.value)} placeholder="Name of vendor or recipient" required />
              </label>

              <label>
                <span>Linked Vendor</span>
                <select value={vendorId} onChange={e => setVendorId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">No vendor</option>
                  {vendors?.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Category (Expense Account)</span>
                <select value={categoryAccountId} onChange={e => setCategoryAccountId(e.target.value ? Number(e.target.value) : '')} required>
                  <option value="" disabled>Select account</option>
                  {expenseAccounts.map(account => (
                    <option key={account.id} value={account.id}>{account.code} • {account.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Amount</span>
                <input type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} required />
              </label>

              <label>
                <span>Paid From Account</span>
                <select value={accountId} onChange={e => setAccountId(e.target.value ? Number(e.target.value) : '')} required>
                  <option value="" disabled>Select account</option>
                  {accounts?.map(account => (
                    <option key={account.id} value={account.id}>{account.name} ({account.type})</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Date</span>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                <span>Description</span>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What was this expense for?" rows={3} />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, gridColumn: '1 / -1' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createExpense.isPending || !categoryAccountId || !payee}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
