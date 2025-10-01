import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api'

interface FinanceSettings {
  companyName: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  baseCurrency: string
  fiscalYearStart: string
  invoiceNumberFormat: string
  billNumberFormat: string
  paymentNumberFormat: string
  defaultPaymentTerms: string
  defaultTaxRateId?: number
  mpesaConsumerKey?: string
  mpesaConsumerSecret?: string
  mpesaShortcode?: string
  mpesaPasskey?: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  updatedAt: string
}

export default function Settings() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery<FinanceSettings>({
    queryKey: ['finance', 'settings'],
    queryFn: () => api.get('/finance/settings').then(res => res.data)
  })

  const [formState, setFormState] = React.useState<FinanceSettings | null>(null)

  React.useEffect(() => {
    if (settings) {
      setFormState(settings)
    }
  }, [settings])

  const updateSettings = useMutation({
    mutationFn: (payload: FinanceSettings) => api.put('/finance/settings', payload).then(res => res.data as FinanceSettings),
    onSuccess: (data) => {
      setFormState(data)
      queryClient.invalidateQueries({ queryKey: ['finance', 'settings'] })
    }
  })

  const handleChange = (field: keyof FinanceSettings, value: string | number | undefined) => {
    setFormState(prev => prev ? { ...prev, [field]: value } as FinanceSettings : prev)
  }

  if (!formState) {
    return <div style={{ padding: 24 }}>Loading settings…</div>
  }

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      <header>
        <h1>Finance Settings</h1>
        <p style={{ color: '#475569', marginTop: 4 }}>Configure Smart Books defaults, M-PESA integration, and SMTP for statement delivery.</p>
      </header>

      <section style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Company Profile</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>This information appears on invoices, bills, and statements.</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => updateSettings.mutate(formState)}
            disabled={updateSettings.isPending}
          >Save</button>
        </header>

        <div className="form-grid" style={{ marginTop: 24 }}>
          <label>
            <span>Company Name</span>
            <input value={formState.companyName} onChange={e => handleChange('companyName', e.target.value)} />
          </label>
          <label>
            <span>Company Email</span>
            <input value={formState.companyEmail || ''} onChange={e => handleChange('companyEmail', e.target.value)} />
          </label>
          <label>
            <span>Company Phone</span>
            <input value={formState.companyPhone || ''} onChange={e => handleChange('companyPhone', e.target.value)} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span>Address</span>
            <textarea value={formState.companyAddress || ''} onChange={e => handleChange('companyAddress', e.target.value)} rows={2} />
          </label>
        </div>
      </section>

      <section style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
        <h2>Numbering &amp; Defaults</h2>
        <div className="form-grid" style={{ marginTop: 16 }}>
          <label>
            <span>Base Currency</span>
            <input value={formState.baseCurrency} maxLength={3} onChange={e => handleChange('baseCurrency', e.target.value.toUpperCase())} />
          </label>
          <label>
            <span>Default Payment Terms</span>
            <input value={formState.defaultPaymentTerms} onChange={e => handleChange('defaultPaymentTerms', e.target.value)} />
          </label>
          <label>
            <span>Fiscal Year Start (MM-DD)</span>
            <input value={formState.fiscalYearStart} onChange={e => handleChange('fiscalYearStart', e.target.value)} />
          </label>
          <label>
            <span>Invoice Number Format</span>
            <input value={formState.invoiceNumberFormat} onChange={e => handleChange('invoiceNumberFormat', e.target.value)} />
          </label>
          <label>
            <span>Bill Number Format</span>
            <input value={formState.billNumberFormat} onChange={e => handleChange('billNumberFormat', e.target.value)} />
          </label>
          <label>
            <span>Payment Number Format</span>
            <input value={formState.paymentNumberFormat} onChange={e => handleChange('paymentNumberFormat', e.target.value)} />
          </label>
        </div>
      </section>

      <section style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
        <h2>M-PESA STK Push</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>These credentials enable real-time push-to-pay for vendor bills and invoice collections.</p>
        <div className="form-grid">
          <label>
            <span>Consumer Key</span>
            <input value={formState.mpesaConsumerKey || ''} onChange={e => handleChange('mpesaConsumerKey', e.target.value)} />
          </label>
          <label>
            <span>Consumer Secret</span>
            <input value={formState.mpesaConsumerSecret || ''} onChange={e => handleChange('mpesaConsumerSecret', e.target.value)} />
          </label>
          <label>
            <span>Shortcode</span>
            <input value={formState.mpesaShortcode || ''} onChange={e => handleChange('mpesaShortcode', e.target.value)} />
          </label>
          <label>
            <span>Passkey</span>
            <input value={formState.mpesaPasskey || ''} onChange={e => handleChange('mpesaPasskey', e.target.value)} />
          </label>
        </div>
      </section>

      <section style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)' }}>
        <h2>SMTP Email</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>Send invoices, receipts, and statements directly from ProcureX.</p>
        <div className="form-grid">
          <label>
            <span>Host</span>
            <input value={formState.smtpHost || ''} onChange={e => handleChange('smtpHost', e.target.value)} />
          </label>
          <label>
            <span>Port</span>
            <input type="number" value={formState.smtpPort || ''} onChange={e => handleChange('smtpPort', e.target.value ? Number(e.target.value) : undefined)} />
          </label>
          <label>
            <span>SMTP User</span>
            <input value={formState.smtpUser || ''} onChange={e => handleChange('smtpUser', e.target.value)} />
          </label>
          <label>
            <span>SMTP Password</span>
            <input type="password" value={formState.smtpPassword || ''} onChange={e => handleChange('smtpPassword', e.target.value)} />
          </label>
        </div>
      </section>

      {updateSettings.isSuccess && formState && (
        <div style={{ background: '#ecfdf5', color: '#047857', padding: 12, borderRadius: 8 }}>
          Settings saved. Updated at {new Date(formState.updatedAt).toLocaleString()}.
        </div>
      )}
    </div>
  )
}
