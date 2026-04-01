import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

interface UiStoreState {
  sidebarOpen: boolean
  toasts: ToastItem[]
  setSidebarOpen: (isOpen: boolean) => void
  toggleSidebar: () => void
  pushToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (toastId: string) => void
  clearToasts: () => void
}

export const useUiStore = create<UiStoreState>((set) => ({
  sidebarOpen: true,
  toasts: [],
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}-${state.toasts.length + 1}`,
          ...toast,
        },
      ],
    })),
  removeToast: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    })),
  clearToasts: () => set({ toasts: [] }),
}))
