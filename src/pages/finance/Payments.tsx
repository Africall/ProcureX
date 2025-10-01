import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPayments, getFinanceAccounts, createPayment, getCounterparties } from '../../api'

interface Payment {
  id: string
  payment_date: string
  amount: number
  account_id: string
  account_name?: string
  counterparty_id?: string
  counterparty_name?: string
  reference?: string
  memo?: string
  type: string
  created_at: string
}

interface Account {
  id: string
  name: string
  kind: string
  currency: string
  opening_balance: number
}

interface Counterparty {
  id: string
  name: string
  type: string
  email?: string
}

export default function Payments() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = React.useState(false)
  const [draft, setDraft] = React.useState({
    payment_date: new Date().toISOString().slice(0, 10),
    amount: 0,
    account_id: '',
    counterparty_id: '',
    reference: '',
    memo: '',
    type: 'other'
  })

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['finance', 'payments'],
    queryFn: () => getPayments().then(res => res.data)
  })

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['finance', 'accounts'],
    queryFn: () => getFinanceAccounts().then(res => res.data)
  })

  const { data: counterparties } = useQuery<Counterparty[]>({
    queryKey: ['finance', 'counterparties'],
    queryFn: () => getCounterparties().then(res => res.data)
  })

  const createPaymentMutation = useMutation({
    mutationFn: () => createPayment(draft).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'kpis'] })
      setShowForm(false)
      setDraft({
        payment_date: new Date().toISOString().slice(0, 10),
        amount: 0,
        account_id: '',
        counterparty_id: '',
        reference: '',
        memo: '',
        type: 'other'
      })
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount)
  }

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'receipt': return '#22c55e'
      case 'disbursement': return '#ef4444'
      case 'transfer': return '#3b82f6'
      default: return '#64748b'
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Payments</h1>
          <p style={{ color: '#475569', marginTop: 4 }}>Record all money movements - receipts, disbursements, and transfers.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Record Payment</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Account</th>
            <th>Counterparty</th>
            <th>Amount</th>
            <th>Reference</th>
            <th>Memo</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>}
          {!isLoading && payments?.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>No payments recorded</td></tr>}
          {payments?.map(payment => (
            <tr key={payment.id}>
              <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
              <td>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  backgroundColor: getPaymentTypeColor(payment.type) + '20',
                  color: getPaymentTypeColor(payment.type),
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  {payment.type.toUpperCase()}
                </span>
              </td>
              <td>{payment.account_name || '-'}</td>
              <td>{payment.counterparty_name || '-'}</td>
              <td>{formatCurrency(payment.amount)}</td>
              <td>{payment.reference || '-'}</td>
              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {payment.memo || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Record Payment</h2>
            <form onSubmit={(e) => { e.preventDefault(); createPaymentMutation.mutate() }} className="form-grid">
              <label>
                <span>Payment Date</span>
                <input type="date" value={draft.payment_date} onChange={e => setDraft({ ...draft, payment_date: e.target.value })} required />
              </label>

              <label>
                <span>Payment Type</span>
                <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })} required>
                  <option value="receipt">Receipt (Money In)</option>
                  <option value="disbursement">Disbursement (Money Out)</option>
                  <option value="transfer">Transfer (Between Accounts)</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label>
                <span>Account</span>
                <select value={draft.account_id} onChange={e => setDraft({ ...draft, account_id: e.target.value })} required>
                  <option value="">Select account</option>
                  {accounts?.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.kind.toUpperCase()}) - {account.currency}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Counterparty (Optional)</span>
                <select value={draft.counterparty_id} onChange={e => setDraft({ ...draft, counterparty_id: e.target.value })}>
                  <option value="">None</option>
                  {counterparties?.map(cp => (
                    <option key={cp.id} value={cp.id}>
                      {cp.name} ({cp.type})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Amount</span>
                <input type="number" min={0} step="0.01" value={draft.amount} onChange={e => setDraft({ ...draft, amount: Number(e.target.value) })} required />
              </label>

              <label>
                <span>Reference</span>
                <input value={draft.reference} onChange={e => setDraft({ ...draft, reference: e.target.value })} placeholder="Transaction reference" />
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                <span>Memo</span>
                <textarea value={draft.memo} onChange={e => setDraft({ ...draft, memo: e.target.value })} rows={3} placeholder="Payment notes" />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, gridColumn: '1 / -1' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createPaymentMutation.isPending || !draft.account_id || draft.amount <= 0}>
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
