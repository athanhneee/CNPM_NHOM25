import { create } from 'zustand'

interface SessionStoreState {
  warningVisible: boolean
  remainingSeconds: number
  maintenanceDismissed: boolean
  showWarning: (remainingSeconds: number) => void
  hideWarning: () => void
  dismissMaintenance: () => void
  resetMaintenance: () => void
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  warningVisible: false,
  remainingSeconds: 0,
  maintenanceDismissed: false,
  showWarning: (remainingSeconds) => set({ warningVisible: true, remainingSeconds }),
  hideWarning: () => set({ warningVisible: false, remainingSeconds: 0 }),
  dismissMaintenance: () => set({ maintenanceDismissed: true }),
  resetMaintenance: () => set({ maintenanceDismissed: false }),
}))
