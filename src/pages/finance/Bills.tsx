import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBills, getCounterparties, getTaxRates, createBill, recordBillPayment } from '../../api'

interface BillItemDraft {
  description: string
  quantity: number
  unit_price: number
  tax_rate_id?: string
  discount?: number
  tax_amount?: number
}

interface Vendor {
  id: string
  name: string
  email?: string
  type: string
}

interface Bill {
  id: string
  number: string
  vendor_name: string
  bill_date: string
  due_date: string
  status: string
  total: number
  balance: number
  subtotal: number
  tax_total: number
}

interface TaxRate {
  id: string
  name: string
  rate_percent: number
}

export default function Bills() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = React.useState(false)
  const [selectedBill, setSelectedBill] = React.useState<Bill | null>(null)
  const [showPaymentForm, setShowPaymentForm] = React.useState(false)
  const [paymentDraft, setPaymentDraft] = React.useState({
    amount: 0,
    payment_date: new Date().toISOString().slice(0, 10),
    account_id: '',
    reference: '',
    memo: ''
  })
  const [draft, setDraft] = React.useState({
    vendor_id: '',
    bill_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    items: [{ description: '', quantity: 1, unit_price: 0 }] as BillItemDraft[],
    memo: ''
  })

  const { data: bills, isLoading } = useQuery<Bill[]>({
    queryKey: ['finance', 'bills'],
    queryFn: () => getBills().then(res => res.data)
  })

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ['finance', 'vendors'],
    queryFn: () => getCounterparties('vendor').then(res => res.data)
  })

  const { data: taxRates } = useQuery<TaxRate[]>({
    queryKey: ['finance', 'taxRates'],
    queryFn: () => getTaxRates().then(res => res.data)
  })

  const createBillMutation = useMutation({
    mutationFn: () => {
      const billNumber = `BILL-${Date.now()}`
      const payload = {
        ...draft,
        number: billNumber,
        items: draft.items.map(item => ({
          ...item,
          tax_amount: item.tax_rate_id ? 
            (item.quantity * item.unit_price * (taxRates?.find(t => t.id === item.tax_rate_id)?.rate_percent || 0) / 100) : 0
        }))
      }
      return createBill(payload).then(res => res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'bills'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'kpis'] })
      setShowForm(false)
      setDraft({
        vendor_id: '',
        bill_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        items: [{ description: '', quantity: 1, unit_price: 0 }],
        memo: ''
      })
    }
  })

  const recordPaymentMutation = useMutation({
    mutationFn: () => {
      if (!selectedBill) throw new Error('No bill selected')
      return recordBillPayment(selectedBill.id, paymentDraft).then(res => res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'bills'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'kpis'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'payments'] })
      setShowPaymentForm(false)
      setSelectedBill(null)
      setPaymentDraft({
        amount: 0,
        payment_date: new Date().toISOString().slice(0, 10),
        account_id: '',
        reference: '',
        memo: ''
      })
    }
  })

  const addRow = () => setDraft(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }] }))
  const updateItem = (index: number, key: keyof BillItemDraft, value: any) => {
    setDraft(prev => ({
      ...prev,
      items: prev.items.map((item, idx) => idx === index ? { ...item, [key]: value } : item)
    }))
  }

  const subtotal = draft.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const tax = draft.items.reduce((sum, item) => {
    if (!item.tax_rate_id) return sum
    const rate = taxRates?.find(t => t.id === item.tax_rate_id)
    return sum + (rate ? (item.quantity * item.unit_price) * (rate.rate_percent / 100) : 0)
  }, 0)
  const total = subtotal + tax

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Vendor Bills (Accounts Payable)</h1>
          <p style={{ color: '#475569', marginTop: 4 }}>Track vendor bills and schedule payments.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Bill</button>
        </div>
      </div>

      {isLoading ? <div>Loading bills...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Vendor</th>
              <th>Bill Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills?.length ? bills.map(bill => (
              <tr key={bill.id}>
                <td>{bill.number}</td>
                <td>{bill.vendor_name}</td>
                <td>{new Date(bill.bill_date).toLocaleDateString()}</td>
                <td>{new Date(bill.due_date).toLocaleDateString()}</td>
                <td><span className={`status-pill status-${bill.status.replace(/_/g, '-')}`}>{bill.status.toUpperCase()}</span></td>
                <td>{formatCurrency(bill.total)}</td>
                <td>{formatCurrency(bill.balance)}</td>
                <td>
                  {bill.balance > 0 && (
                    <button 
                      className="btn-link" 
                      onClick={() => {
                        setSelectedBill(bill)
                        setPaymentDraft(prev => ({ ...prev, amount: bill.balance }))
                        setShowPaymentForm(true)
                      }}
                    >
                      Record Payment
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No bills recorded yet. Create your first bill to track payables.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: 900, width: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Create Bill</h2>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Close</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createBillMutation.mutate() }} className="form-grid">
              <label>
                <span>Vendor</span>
                <select value={draft.vendor_id} onChange={e => setDraft(prev => ({ ...prev, vendor_id: e.target.value }))} required>
                  <option value="" disabled>Select vendor</option>
                  {vendors?.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Bill Date</span>
                <input type="date" value={draft.bill_date} onChange={e => setDraft(prev => ({ ...prev, bill_date: e.target.value }))} required />
              </label>

              <label>
                <span>Due Date</span>
                <input type="date" value={draft.due_date} onChange={e => setDraft(prev => ({ ...prev, due_date: e.target.value }))} required />
              </label>

              <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>Bill Items</h3>
                  <button type="button" className="btn-secondary" onClick={addRow}>+ Add Line</button>
                </div>

                <div className="card" style={{ padding: 12 }}>
                  {draft.items.map((item, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                      <input placeholder="Description" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} required />
                      <input type="number" min={1} value={item.quantity} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} />
                      <input type="number" min={0} step="0.01" value={item.unit_price} onChange={e => updateItem(index, 'unit_price', Number(e.target.value))} />
                      <select value={item.tax_rate_id || ''} onChange={e => updateItem(index, 'tax_rate_id', e.target.value || undefined)}>
                        <option value="">No Tax</option>
                        {taxRates?.map(rate => (
                          <option key={rate.id} value={rate.id}>{rate.name} ({rate.rate_percent}%)</option>
                        ))}
                      </select>
                      <div style={{ alignSelf: 'center', fontWeight: 600, textAlign: 'right' }}>
                        {formatCurrency(item.quantity * item.unit_price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label style={{ gridColumn: '1 / -1' }}>
                <span>Notes (optional)</span>
                <textarea value={draft.memo} onChange={e => setDraft(prev => ({ ...prev, memo: e.target.value }))} rows={3} />
              </label>

              <div style={{ gridColumn: '1 / -1', background: '#f8fafc', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Tax</span>
                  <span>{tax.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, gridColumn: '1 / -1' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createBillMutation.isPending || !draft.vendor_id}>Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentForm && selectedBill && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2>Record Payment</h2>
              <button className="btn-secondary" onClick={() => { setShowPaymentForm(false); setSelectedBill(null) }}>Close</button>
            </div>

            <div className="card" style={{ padding: 16, marginBottom: 20, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Bill:</span>
                <span style={{ fontWeight: 600 }}>{selectedBill.number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Vendor:</span>
                <span>{selectedBill.vendor_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Total:</span>
                <span>{formatCurrency(selectedBill.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Balance Due:</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatCurrency(selectedBill.balance)}</span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); recordPaymentMutation.mutate() }} className="form-grid">
              <label>
                <span>Payment Date</span>
                <input 
                  type="date" 
                  value={paymentDraft.payment_date} 
                  onChange={e => setPaymentDraft(prev => ({ ...prev, payment_date: e.target.value }))} 
                  required 
                />
              </label>

              <label>
                <span>Amount</span>
                <input 
                  type="number" 
                  min={0} 
                  max={selectedBill.balance} 
                  step="0.01" 
                  value={paymentDraft.amount} 
                  onChange={e => setPaymentDraft(prev => ({ ...prev, amount: Number(e.target.value) }))} 
                  required 
                />
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                <span>Payment Account</span>
                <select 
                  value={paymentDraft.account_id} 
                  onChange={e => setPaymentDraft(prev => ({ ...prev, account_id: e.target.value }))} 
                  required
                >
                  <option value="">Select account...</option>
                  <option value="bank">Main Bank</option>
                  <option value="mpesa">M-PESA</option>
                  <option value="cash">Petty Cash</option>
                </select>
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                <span>Reference (optional)</span>
                <input 
                  type="text" 
                  value={paymentDraft.reference} 
                  onChange={e => setPaymentDraft(prev => ({ ...prev, reference: e.target.value }))} 
                  placeholder="Check number, transaction ID, etc."
                />
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                <span>Memo (optional)</span>
                <textarea 
                  value={paymentDraft.memo} 
                  onChange={e => setPaymentDraft(prev => ({ ...prev, memo: e.target.value }))} 
                  rows={2}
                  placeholder="Additional notes..."
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, gridColumn: '1 / -1' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowPaymentForm(false); setSelectedBill(null) }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={recordPaymentMutation.isPending}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
