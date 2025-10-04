import { create } from 'zustand'

type CurrencyState = {
  currency: string
  rateToBase: number // multiplier to convert from base currency (stored amounts) to display currency
  setCurrency: (c: string) => void
  setRate: (r: number) => void
}

// default: amounts stored in KES and displayed as KES by default
export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: 'KES',
  rateToBase: 1,
  setCurrency: (c: string) => set({ currency: c }),
  setRate: (r: number) => set({ rateToBase: r })
}))
