import { useDataStore } from '@/app/store/data.store'
import { STORAGE_KEYS, removeStorageKey, safeReadLocalStorage, safeWriteLocalStorage } from '@/lib/storage'
import { getRandomDelay, sleep, toDigest } from '@/lib/utils'
import type { AuthCredentials, AuthSession } from '@/types/auth'

function createSession(userId: string, rememberMe: boolean, timeoutMinutes: number): AuthSession {
  const now = new Date()
  const expiresAt = new Date(
    now.getTime() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : timeoutMinutes * 60_000),
  ).toISOString()

  return {
    userId,
    expiresAt,
    lastActivityAt: now.toISOString(),
    rememberMe,
  }
}

export const authService = {
  async login(credentials: AuthCredentials) {
    await sleep(getRandomDelay())

    const dataStore = useDataStore.getState()
    const user = dataStore.users.find(
      (item) =>
        item.username.toLowerCase() === credentials.identifier.trim().toLowerCase() ||
        item.email.toLowerCase() === credentials.identifier.trim().toLowerCase(),
    )

    if (!user || user.passwordDigest !== toDigest(credentials.password)) {
      if (user) {
        const failedLoginAttempts = user.failedLoginAttempts + 1
        dataStore.updateUser(
          user.id,
          {
            failedLoginAttempts,
            status: failedLoginAttempts >= 5 ? 'LOCKED' : user.status,
          },
          { actorId: user.id, actorRole: user.roles[0] ?? 'STUDENT' },
        )
        dataStore.appendAuditLog(
          'LOGIN_FAILED',
          user.id,
          'FAILURE',
          failedLoginAttempts >= 5
            ? 'Đăng nhập thất bại và tài khoản đã bị khóa trong môi trường mô phỏng.'
            : 'Sai thông tin đăng nhập.',
          { actorId: user.id, actorRole: user.roles[0] ?? 'STUDENT' },
        )
      }

      return { success: false as const, message: 'Sai tài khoản hoặc mật khẩu.' }
    }

    if (user.status !== 'ACTIVE') {
      dataStore.appendAuditLog(
        'LOGIN_FAILED',
        user.id,
        'FAILURE',
        'Tài khoản đang bị khóa hoặc tạm ngưng.',
        { actorId: user.id, actorRole: user.roles[0] ?? 'STUDENT' },
      )
      return { success: false as const, message: 'Tài khoản đang bị khóa hoặc tạm ngưng.' }
    }

    const session = createSession(user.id, credentials.rememberMe, dataStore.settings.sessionTimeoutMinutes)
    safeWriteLocalStorage(STORAGE_KEYS.auth, session)

    const updatedUser = dataStore.updateUser(
      user.id,
      {
        failedLoginAttempts: 0,
        lastLoginAt: new Date().toISOString(),
      },
      { actorId: user.id, actorRole: user.roles[0] ?? 'STUDENT' },
    )

    dataStore.appendAuditLog(
      'LOGIN_SUCCESS',
      user.id,
      'SUCCESS',
      'Đăng nhập thành công vào hệ thống.',
      { actorId: user.id, actorRole: user.roles[0] ?? 'STUDENT' },
    )

    return { success: true as const, user: updatedUser, session }
  },
  async restoreSession() {
    await sleep(80)
    const session = safeReadLocalStorage<AuthSession | null>(STORAGE_KEYS.auth, null)

    if (!session) {
      return null
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      removeStorageKey(STORAGE_KEYS.auth)
      return null
    }

    const dataStore = useDataStore.getState()
    const user = dataStore.users.find((item) => item.id === session.userId)

    if (!user || user.status !== 'ACTIVE') {
      removeStorageKey(STORAGE_KEYS.auth)
      return null
    }

    return { user, session }
  },
  async logout(userId?: string) {
    await sleep(80)
    removeStorageKey(STORAGE_KEYS.auth)

    if (userId) {
      const user = useDataStore.getState().users.find((item) => item.id === userId)
      if (user) {
        useDataStore.getState().appendAuditLog(
          'LOGOUT',
          userId,
          'INFO',
          'Đăng xuất khỏi hệ thống.',
          { actorId: userId, actorRole: user.roles[0] ?? 'STUDENT' },
        )
      }
    }
  },
  async touchSession() {
    await sleep(40)
    const session = safeReadLocalStorage<AuthSession | null>(STORAGE_KEYS.auth, null)
    if (!session) {
      return null
    }

    const timeoutMinutes = useDataStore.getState().settings.sessionTimeoutMinutes
    const nextSession = {
      ...session,
      lastActivityAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + timeoutMinutes * 60_000).toISOString(),
    }

    safeWriteLocalStorage(STORAGE_KEYS.auth, nextSession)
    return nextSession
  },
  async changePassword(userId: string, currentPassword: string, nextPassword: string) {
    await sleep(getRandomDelay())
    const dataStore = useDataStore.getState()
    const user = dataStore.users.find((item) => item.id === userId)

    if (!user) {
      return { success: false as const, message: 'Không tìm thấy tài khoản người dùng.' }
    }

    if (user.passwordDigest !== toDigest(currentPassword)) {
      return { success: false as const, message: 'Mật khẩu hiện tại không đúng.' }
    }

    dataStore.resetUserPassword(userId, nextPassword, {
      actorId: userId,
      actorRole: user.roles[0] ?? 'STUDENT',
    })

    dataStore.appendAuditLog(
      'CHANGE_PASSWORD',
      userId,
      'SUCCESS',
      'Người dùng đổi mật khẩu thành công.',
      { actorId: userId, actorRole: user.roles[0] ?? 'STUDENT' },
    )

    return { success: true as const, message: 'Cập nhật mật khẩu thành công.' }
  },
}
