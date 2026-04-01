import { create } from 'zustand'
import { ROLE_PERMISSIONS, type PermissionKey } from '@/app/config/permissions'
import { removeStorageKey, STORAGE_KEYS } from '@/lib/storage'
import { authService } from '@/mocks/services/auth.service'
import type { AuthCredentials, AuthSession } from '@/types/auth'
import type { User } from '@/types/user'

interface AuthStoreState {
  currentUser: User | null
  session: AuthSession | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  permissions: PermissionKey[]
  initialize: () => Promise<void>
  login: (
    credentials: AuthCredentials,
  ) => Promise<{ success: true } | { success: false; message: string }>
  logout: () => Promise<void>
  changePassword: (
    currentPassword: string,
    nextPassword: string,
  ) => Promise<{ success: true; message: string } | { success: false; message: string }>
  touchSession: () => Promise<void>
}

function derivePermissions(user: User | null) {
  if (!user) {
    return [] as PermissionKey[]
  }

  return Array.from(new Set(user.roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? [])))
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  currentUser: null,
  session: null,
  isAuthenticated: false,
  isBootstrapping: true,
  permissions: [],
  initialize: async () => {
    const restored = await authService.restoreSession()

    if (!restored) {
      removeStorageKey(STORAGE_KEYS.auth)
      set({
        currentUser: null,
        session: null,
        isAuthenticated: false,
        isBootstrapping: false,
        permissions: [],
      })
      return
    }

    set({
      currentUser: restored.user,
      session: restored.session,
      isAuthenticated: true,
      isBootstrapping: false,
      permissions: derivePermissions(restored.user),
    })
  },
  login: async (credentials) => {
    const result = await authService.login(credentials)

    if (!result.success) {
      return result
    }

    set({
      currentUser: result.user,
      session: result.session,
      isAuthenticated: true,
      isBootstrapping: false,
      permissions: derivePermissions(result.user),
    })

    return { success: true }
  },
  logout: async () => {
    await authService.logout(get().currentUser?.id)
    set({
      currentUser: null,
      session: null,
      isAuthenticated: false,
      permissions: [],
    })
  },
  changePassword: async (currentPassword, nextPassword) => {
    const user = get().currentUser
    if (!user) {
      return { success: false, message: 'Bạn cần đăng nhập để thực hiện thao tác này.' }
    }

    return authService.changePassword(user.id, currentPassword, nextPassword)
  },
  touchSession: async () => {
    const session = await authService.touchSession()
    if (!session) {
      set({
        currentUser: null,
        session: null,
        isAuthenticated: false,
        permissions: [],
      })
      return
    }

    set({ session })
  },
}))
