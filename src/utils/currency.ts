import { useCurrencyStore } from '../stores/currencyStore'

export function formatCurrencyRaw(amount: number | undefined, currency?: string): string {
  if (amount === undefined || amount === null) return ''
  const c = currency || 'KES'
  try {
    return new Intl.NumberFormat(c === 'USD' ? 'en-US' : c === 'EUR' ? 'de-DE' : 'en-KE', { style: 'currency', currency: c }).format(amount)
  } catch (e) {
    return `${c} ${amount.toFixed(2)}`
  }
}

// Reactive formatter that converts stored amounts (assumed base KES) to selected currency
export function useFormatCurrency() {
  const { currency, rateToBase } = useCurrencyStore()
  return (amount?: number) => {
    if (amount === undefined || amount === null) return `${currency} 0.00`
    const converted = amount * rateToBase
    return formatCurrencyRaw(converted, currency)
  }
}
