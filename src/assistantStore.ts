import { create } from 'zustand'

type AssistantState = {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
}

export const useAssistant = create<AssistantState>((set, get) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
  toggle: () => set({ open: !get().open }),
}))
