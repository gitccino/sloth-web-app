import { create } from 'zustand'

const MOBILE_BREAKPOINT = 768

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

type MobileStore = {
  isMobile: boolean
  setMobile: (value: boolean) => void
  init: () => void
}

let mobileListenerInitialized = false

export const useMobileStore = create<MobileStore>((set) => ({
  isMobile: false,
  setMobile: (value) => set({ isMobile: value }),
  init: () => {
    if (mobileListenerInitialized || typeof window === 'undefined') return
    mobileListenerInitialized = true

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      set({ isMobile: window.innerWidth < MOBILE_BREAKPOINT })
    }
    mql.addEventListener('change', onChange)
    set({ isMobile: window.innerWidth < MOBILE_BREAKPOINT })
  },
}))


