import React from 'react'
import { useCurrencyStore } from '../stores/currencyStore'
import { fetchAndApplyRates, startFxAutoRefresh, stopFxAutoRefresh } from '../services/fxRates'

const options = [
  { value: 'KES', label: 'KES' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' }
]

export default function CurrencySelector() {
  const currency = useCurrencyStore(s => s.currency)
  const setCurrency = useCurrencyStore(s => s.setCurrency)
  const setRate = useCurrencyStore(s => s.setRate)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    // Load persisted currency if present and fetch rates
    try {
      const raw = localStorage.getItem('procurex_currency')
      if (raw) setCurrency(raw)
    } catch (e) {}

    setLoading(true)
    void fetchAndApplyRates().finally(() => setLoading(false))
    // start background refresh every hour
    startFxAutoRefresh(1000 * 60 * 60)
    return () => { stopFxAutoRefresh() }
  }, [setCurrency])

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const c = e.target.value
    setCurrency(c)
    setLoading(true)
    try {
      // refetch and apply rates, then persist selected currency
      const rates = await fetchAndApplyRates()
      const r = c === 'KES' ? 1 : (rates as any)[c] ?? 1
      setRate(r)
      try { localStorage.setItem('procurex_currency', c); localStorage.setItem('procurex_currency_rate', String(r)) } catch {}
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select value={currency} onChange={handleChange} className="btn-secondary" title="Select display currency">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {loading ? <span style={{ fontSize: 12, color: '#64748b' }}>⏳</span> : null}
    </div>
  )
}
