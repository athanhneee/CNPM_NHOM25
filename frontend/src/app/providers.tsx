import { useEffect, useRef, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useSessionStore } from '@/app/store/session.store'
import { useUiStore } from '@/app/store/ui.store'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { settingsService } from '@/services/settings.api'
import type { AuthSession } from '@/types/auth'

function getLocalSessionExpiryMs(session: AuthSession, sessionTimeoutMinutes: number) {
  const refreshExpiryMs = new Date(session.expiresAt).getTime()
  const lastActivityMs = new Date(session.lastActivityAt).getTime()

  if (!Number.isFinite(lastActivityMs) || sessionTimeoutMinutes <= 0) {
    return refreshExpiryMs
  }

  const idleExpiryMs = lastActivityMs + sessionTimeoutMinutes * 60_000
  return Number.isFinite(refreshExpiryMs) ? Math.min(refreshExpiryMs, idleExpiryMs) : idleExpiryMs
}

function AppBootstrapper() {
  const initialize = useAuthStore((state) => state.initialize)
  const logout = useAuthStore((state) => state.logout)
  const touchSession = useAuthStore((state) => state.touchSession)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const session = useAuthStore((state) => state.session)
  const settings = useDataStore((state) => state.settings)
  const showWarning = useSessionStore((state) => state.showWarning)
  const hideWarning = useSessionStore((state) => state.hideWarning)
  const resetMaintenance = useSessionStore((state) => state.resetMaintenance)
  const pushToast = useUiStore((state) => state.pushToast)
  const lastTouchRef = useRef(0)

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    resetMaintenance()
  }, [resetMaintenance, settings.maintenanceMode])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    void settingsService.loadSettings().catch(() => undefined)
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !session) {
      hideWarning()
      return
    }

    const interval = window.setInterval(() => {
      const localExpiryMs = getLocalSessionExpiryMs(session, settings.sessionTimeoutMinutes)
      const secondsLeft = Math.max(0, Math.round((localExpiryMs - Date.now()) / 1000))
      if (secondsLeft <= 0) {
        hideWarning()
        pushToast({
          tone: 'warning',
          title: 'Phiên đăng nhập đã hết hạn',
          description: 'Hệ thống đã tự động đăng xuất vì không có tương tác.',
        })
        void logout()
        return
      }

      if (secondsLeft <= settings.warningBeforeLogoutSeconds) {
        showWarning(secondsLeft)
      } else {
        hideWarning()
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [
    hideWarning,
    isAuthenticated,
    logout,
    pushToast,
    session,
    settings.sessionTimeoutMinutes,
    settings.warningBeforeLogoutSeconds,
    showWarning,
  ])

  useEffect(() => {
    if (!isAuthenticated || !session) {
      return
    }

    const handler = () => {
      const now = Date.now()
      if (now - lastTouchRef.current < 20_000) {
        return
      }

      lastTouchRef.current = now
      void touchSession()
    }

    window.addEventListener('click', handler)
    window.addEventListener('keydown', handler)
    window.addEventListener('mousemove', handler)

    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('mousemove', handler)
    }
  }, [isAuthenticated, session, touchSession])

  return null
}

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      <AppBootstrapper />
      {children}
      <ToastProvider />
    </BrowserRouter>
  )
}

export default AppProviders

