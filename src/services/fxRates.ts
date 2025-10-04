import { useCurrencyStore } from '../stores/currencyStore'

type Rates = Record<string, number>

const API = '/api/fx/latest'
const DEFAULT_SYMBOLS = ['USD', 'EUR', 'GBP']

let intervalHandle: number | null = null

async function fetchRatesFromApi(base: string = 'KES', symbols: string[] = DEFAULT_SYMBOLS): Promise<Rates> {
  const s = symbols.join(',')
  const url = `${API}?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(s)}`
  // retry a few times for transient proxy/backend errors
  const maxAttempts = 3
  let attempt = 0
  let lastErr: any = null
  let data: any = null
  while (attempt < maxAttempts) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`FX API returned ${res.status}`)
      data = await res.json()
      break
    } catch (err) {
      lastErr = err
      attempt++
      // small backoff
      await new Promise(r => setTimeout(r, 200 * attempt))
    }
  }
  if (!data) throw lastErr || new Error('Failed to fetch FX rates')
  // backend returns { base, rates, fetchedAt, source }
  return data.rates || {}
}

export async function fetchAndApplyRates() {
  try {
    const rates = await fetchRatesFromApi()
    // Persist full rates map
    try { localStorage.setItem('procurex_fx_rates', JSON.stringify(rates)) } catch (e) {}

    // Apply rate for currently selected display currency (store expects multiplier to convert base->display)
    const currency = useCurrencyStore.getState().currency
    if (currency === 'KES') {
      useCurrencyStore.getState().setRate(1)
    } else {
      const val = (rates as any)[currency]
      if (typeof val === 'number') useCurrencyStore.getState().setRate(val)
    }

    return rates
  } catch (err) {
    // Try to load persisted rates
    try {
      const raw = localStorage.getItem('procurex_fx_rates')
      if (raw) {
        const parsed = JSON.parse(raw) as Rates
        const currency = useCurrencyStore.getState().currency
        if (currency === 'KES') useCurrencyStore.getState().setRate(1)
        else if (parsed[currency]) useCurrencyStore.getState().setRate(parsed[currency])
        return parsed
      }
    } catch (e) {}
    // fallback to static example
    const fallback: Rates = { USD: 0.0073, EUR: 0.0068, GBP: 0.0054 }
    const currency = useCurrencyStore.getState().currency
    if (currency === 'KES') useCurrencyStore.getState().setRate(1)
    else if (fallback[currency]) useCurrencyStore.getState().setRate(fallback[currency])
    return fallback
  }
}

export function startFxAutoRefresh(intervalMs: number = 1000 * 60 * 60) {
  // default 1 hour
  if (intervalHandle) return
  // initial fetch
  void fetchAndApplyRates()
  intervalHandle = window.setInterval(() => { void fetchAndApplyRates() }, intervalMs)
}

export function stopFxAutoRefresh() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}

export { fetchRatesFromApi }
