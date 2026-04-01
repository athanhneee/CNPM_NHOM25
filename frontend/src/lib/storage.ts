export const STORAGE_KEYS = {
  auth: 'app_auth',
  users: 'app_users',
  courses: 'app_courses',
  sections: 'app_sections',
  enrollments: 'app_enrollments',
  logs: 'app_logs',
  settings: 'app_settings',
  wishes: 'app_wish_requests',
} as const

export function safeReadLocalStorage<T>(key: string, fallback: T) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) {
      return fallback
    }

    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

export function safeWriteLocalStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorageKey(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(key)
}
