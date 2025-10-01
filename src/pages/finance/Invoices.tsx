import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoices, getCounterparties, getTaxRates, createInvoice } from '../../api'

interface InvoiceItemDraft {
  description: string
  quantity: number
  unit_price: number
  tax_rate_id?: string
  discount?: number
  tax_amount?: number
}

interface Customer {
  id: string
  name: string
  email?: string
  type: string
}

interface Invoice {
  id: string
  number: string
  invoice_date: string
  due_date: string
  customer_name: string
  status: string
  total: number
  balance: number
  subtotal: number
  tax_total: number
  items?: InvoiceItemDraft[]
}

interface TaxRate {
  id: string
  name: string
  rate_percent: number
}

export default function Invoices() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = React.useState(false)
  const [draft, setDraft] = React.useState({
    customer_id: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    items: [{ description: '', quantity: 1, unit_price: 0 }] as InvoiceItemDraft[],
    memo: ''
  })

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['finance', 'invoices'],
    queryFn: () => getInvoices().then(res => res.data)
  })

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['finance', 'customers'],
    queryFn: () => getCounterparties('customer').then(res => res.data)
  })

  const { data: taxRates } = useQuery<TaxRate[]>({
    queryKey: ['finance', 'taxRates'],
    queryFn: () => getTaxRates().then(res => res.data)
  })

  const createInvoiceMutation = useMutation({
    mutationFn: () => {
      const invoiceNumber = `INV-${Date.now()}`
      const payload = {
        ...draft,
        number: invoiceNumber,
        items: draft.items.map(item => ({
          ...item,
          tax_amount: item.tax_rate_id ? 
            (item.quantity * item.unit_price * (taxRates?.find(t => t.id === item.tax_rate_id)?.rate_percent || 0) / 100) : 0
        }))
      }
      return createInvoice(payload).then(res => res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'kpis'] })
      setShowForm(false)
      setDraft({
        customer_id: '',
        invoice_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        items: [{ description: '', quantity: 1, unit_price: 0 }],
        memo: ''
      })
    }
  })

  const addRow = () => {
    setDraft(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }] }))
  }

  const updateItem = (index: number, key: keyof InvoiceItemDraft, value: any) => {
    setDraft(prev => ({
      ...prev,
      items: prev.items.map((item, idx) => idx === index ? { ...item, [key]: value } : item)
    }))
  }

  const subtotal = draft.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxValue = draft.items.reduce((sum, item) => {
    if (!item.tax_rate_id) return sum
    const rate = taxRates?.find(t => t.id === item.tax_rate_id)
    return sum + (rate ? (item.quantity * item.unit_price) * (rate.rate_percent / 100) : 0)
  }, 0)
  const total = subtotal + taxValue

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Invoices (Accounts Receivable)</h1>
          <p style={{ color: '#475569', marginTop: 4 }}>Create and track invoices, send PDF/emails, and accept M-PESA payments.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Invoice</button>
      </div>

      {isLoading ? <div>Loading invoices...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due</th>
              <th>Status</th>
              <th>Total</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.length ? invoices.map(inv => (
              <tr key={inv.id}>
                <td>{inv.number}</td>
                <td>{inv.customer_name}</td>
                <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                <td>{new Date(inv.due_date).toLocaleDateString()}</td>
                <td>
                  <span className={`status-pill status-${inv.status.replace(/_/g, '-')}`}>{inv.status.toUpperCase()}</span>
                </td>
                <td>{inv.total.toLocaleString()}</td>
                <td>{inv.balance.toLocaleString()}</td>
                <td>
                  <button className="btn-link">Send</button>
                  <button className="btn-link">Record Payment</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                  No invoices yet. Create your first invoice to start tracking receivables.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: 900, width: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Create Invoice</h2>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Close</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createInvoiceMutation.mutate() }} className="form-grid">
              <label>
                <span>Customer</span>
                <select value={draft.customer_id} onChange={e => setDraft(prev => ({ ...prev, customer_id: e.target.value }))} required>
                  <option value="" disabled>Select customer</option>
                  {customers?.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Invoice Date</span>
                <input type="date" value={draft.invoice_date} onChange={e => setDraft(prev => ({ ...prev, invoice_date: e.target.value }))} required />
              </label>

              <label>
                <span>Due Date</span>
                <input type="date" value={draft.due_date} onChange={e => setDraft(prev => ({ ...prev, due_date: e.target.value }))} required />
              </label>

              <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>Invoice Items</h3>
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
                        {(item.quantity * item.unit_price).toLocaleString()}
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
                  <span>{taxValue.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>{total.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, gridColumn: '1 / -1' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createInvoiceMutation.isPending || !draft.customer_id}>Save Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
