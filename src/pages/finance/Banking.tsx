import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFinanceAccounts, getPayments } from '../../api'

interface Account {
  id: string
  name: string
  kind: string
  currency: string
  opening_balance: number
  created_at: string
}

interface Payment {
  id: string
  payment_date: string
  amount: number
  account_id: string
  account_name?: string
  counterparty_name?: string
  reference?: string
  memo?: string
  type: string
}

export default function Banking() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = React.useState(false)
  const [showReconciliation, setShowReconciliation] = React.useState(false)
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null)
  const [reconciliationData, setReconciliationData] = React.useState({
    statement_date: new Date().toISOString().slice(0, 10),
    statement_balance: 0,
    unmatched_transactions: [] as Payment[]
  })
  const [formState, setFormState] = React.useState({
    name: '',
    kind: 'bank',
    currency: 'KES',
    opening_balance: 0
  })

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['finance', 'accounts'],
    queryFn: () => getFinanceAccounts().then(res => res.data)
  })

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['finance', 'payments'],
    queryFn: () => getPayments().then(res => res.data)
  })

  const accountMutation = useMutation({
    mutationFn: (payload: typeof formState) => {
      // For now, use the generic API since createFinanceAccount isn't available
      return fetch('/api/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => res.json())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] })
      setShowForm(false)
      setFormState({ name: '', kind: 'bank', currency: 'KES', opening_balance: 0 })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    accountMutation.mutate(formState)
  }

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(amount)
  }

  const getAccountTransactions = (accountId: string) => {
    return payments?.filter(p => p.account_id === accountId).slice(0, 5) || []
  }

  const getAllAccountTransactions = (accountId: string) => {
    return payments?.filter(p => p.account_id === accountId) || []
  }

  const getAccountBalance = (account: Account) => {
    const accountPayments = getAllAccountTransactions(account.id)
    return account.opening_balance + accountPayments.reduce((sum, p) => {
      if (p.type === 'receipt') return sum + p.amount
      if (p.type === 'disbursement') return sum - p.amount
      return sum
    }, 0)
  }

  const startReconciliation = (accountId: string) => {
    setSelectedAccountId(accountId)
    const account = accounts?.find(a => a.id === accountId)
    if (account) {
      const allTransactions = getAllAccountTransactions(accountId)
      setReconciliationData({
        statement_date: new Date().toISOString().slice(0, 10),
        statement_balance: getAccountBalance(account),
        unmatched_transactions: allTransactions
      })
      setShowReconciliation(true)
    }
  }

  const selectedAccount = accounts?.find(a => a.id === selectedAccountId)

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Banking & Cashflow</h1>
          <p style={{ color: '#475569', marginTop: 4 }}>Manage bank, M-PESA, and cash accounts. Monitor balances and start reconciliations.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Account</button>
      </div>

      {isLoading ? <div>Loading accounts...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {accounts?.map(account => {
            const accountPayments = getAccountTransactions(account.id)
            const balance = getAccountBalance(account)

            return (
              <div key={account.id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 20,
                backgroundColor: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{account.name}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>
                      {account.kind} • {account.currency}
                    </p>
                  </div>
                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: 12, padding: '4px 8px' }}
                    onClick={(e) => { e.stopPropagation(); startReconciliation(account.id) }}
                  >
                    Reconcile
                  </button>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                  {formatCurrency(balance, account.currency)}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Opening: {formatCurrency(account.opening_balance, account.currency)}
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Recent Transactions</div>
                  {accountPayments.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>No transactions yet</div>
                  ) : (
                    accountPayments.map(p => (
                      <div key={p.id} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#475569' }}>{p.counterparty_name || 'Internal'}</span>
                        <span style={{ fontWeight: 600, color: p.type === 'receipt' ? '#22c55e' : '#ef4444' }}>
                          {p.type === 'receipt' ? '+' : '-'}{formatCurrency(p.amount, account.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
          {accounts?.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#64748b' }}>
              No accounts yet. Add a bank, M-PESA, or cash account to get started.
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ marginBottom: 16 }}>Add Finance Account</h2>
            <form onSubmit={handleSubmit} className="form-grid">
              <label>
                <span>Name</span>
                <input value={formState.name} onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))} required />
              </label>

              <label>
                <span>Type</span>
                <select value={formState.kind} onChange={e => setFormState(prev => ({ ...prev, kind: e.target.value }))}>
                  <option value="bank">Bank</option>
                  <option value="mobile_money">Mobile Money (M-PESA)</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </label>

              <label>
                <span>Currency</span>
                <input value={formState.currency} onChange={e => setFormState(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))} maxLength={3} />
              </label>

              <label>
                <span>Opening Balance</span>
                <input type="number" step="0.01" value={formState.opening_balance} onChange={e => setFormState(prev => ({ ...prev, opening_balance: Number(e.target.value) }))} />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, gridColumn: '1 / -1' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={accountMutation.isPending}>Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReconciliation && selectedAccount && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: 800 }}>
            <h2 style={{ marginBottom: 8 }}>Reconcile {selectedAccount.name}</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
              Match your bank statement with recorded transactions
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Book Balance</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {formatCurrency(getAccountBalance(selectedAccount), selectedAccount.currency)}
                </div>
              </div>
              <div style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Statement Balance</div>
                <input 
                  type="number" 
                  step="0.01"
                  value={reconciliationData.statement_balance}
                  onChange={e => setReconciliationData(prev => ({ ...prev, statement_balance: Number(e.target.value) }))}
                  style={{ fontSize: 24, fontWeight: 700, border: 'none', backgroundColor: 'transparent', width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Transactions to Match</h3>
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  {reconciliationData.unmatched_transactions.length} transaction(s)
                </div>
              </div>
              
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {reconciliationData.unmatched_transactions.map(txn => (
                  <div key={txn.id} style={{ 
                    padding: 12, 
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>
                        {txn.counterparty_name || 'Internal Transaction'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {new Date(txn.payment_date).toLocaleDateString()} • {txn.reference || 'No reference'}
                      </div>
                    </div>
                    <div style={{ 
                      fontWeight: 600, 
                      color: txn.type === 'receipt' ? '#22c55e' : '#ef4444',
                      marginRight: 16
                    }}>
                      {txn.type === 'receipt' ? '+' : '-'}{formatCurrency(txn.amount, selectedAccount.currency)}
                    </div>
                    <input 
                      type="checkbox" 
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                      title="Mark as reconciled"
                    />
                  </div>
                ))}
                {reconciliationData.unmatched_transactions.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    No transactions to reconcile
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              padding: 16, 
              backgroundColor: Math.abs(getAccountBalance(selectedAccount) - reconciliationData.statement_balance) < 0.01 ? '#f0fdf4' : '#fef2f2',
              borderRadius: 8,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Difference:</span>
                <span style={{ 
                  fontSize: 18, 
                  fontWeight: 700,
                  color: Math.abs(getAccountBalance(selectedAccount) - reconciliationData.statement_balance) < 0.01 ? '#22c55e' : '#ef4444'
                }}>
                  {formatCurrency(Math.abs(getAccountBalance(selectedAccount) - reconciliationData.statement_balance), selectedAccount.currency)}
                </span>
              </div>
              {Math.abs(getAccountBalance(selectedAccount) - reconciliationData.statement_balance) < 0.01 && (
                <div style={{ marginTop: 8, fontSize: 14, color: '#16a34a' }}>
                  ✓ Account is reconciled!
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn-secondary" onClick={() => setShowReconciliation(false)}>Close</button>
              <button 
                type="button" 
                className="btn-primary"
                disabled={Math.abs(getAccountBalance(selectedAccount) - reconciliationData.statement_balance) >= 0.01}
              >
                Complete Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
