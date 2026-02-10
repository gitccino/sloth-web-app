import { create } from 'zustand'

type NavStore = {
  display: boolean
  toggleDisplay: () => void
  showDisplay: () => void
  hideDisplay: () => void
}

export const useNavStore = create<NavStore>((set) => ({
  display: true,
  toggleDisplay: () => {
    set((state) => ({ display: !state.display }))
  },
  showDisplay: () => {
    set(() => ({ display: true }))
  },
  hideDisplay: () => {
    set(() => ({ display: false }))
  },
}))
