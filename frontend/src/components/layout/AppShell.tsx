import { Outlet, useLocation } from 'react-router-dom'
import { useDataStore } from '@/app/store/data.store'
import { useSessionStore } from '@/app/store/session.store'
import { useUiStore } from '@/app/store/ui.store'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { TopHeader } from '@/components/layout/TopHeader'
import { Button } from '@/components/ui/Button'

export function AppShell() {
  const settings = useDataStore((state) => state.settings)
  const apiStatus = useDataStore((state) => state.apiStatus)
  const apiError = useDataStore((state) => state.apiError)
  const maintenanceDismissed = useSessionStore((state) => state.maintenanceDismissed)
  const dismissMaintenance = useSessionStore((state) => state.dismissMaintenance)
  const warningVisible = useSessionStore((state) => state.warningVisible)
  const remainingSeconds = useSessionStore((state) => state.remainingSeconds)
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const location = useLocation()
  const isDemoMode = import.meta.env.VITE_APP_MODE === 'demo'

  return (
    <div className="min-h-screen bg-transparent text-slate-900 overflow-x-hidden">
      <SidebarNav />
      <div className="transition-all xl:ml-[312px]">
        <TopHeader />
        <main className="px-4 py-6 xl:px-6">
          <div className="mx-auto max-w-[1600px] space-y-6">
            {isDemoMode && (
              <div className="flex items-center justify-center rounded-2xl bg-teal-100 px-5 py-2 text-sm font-medium text-teal-800">
                Chế độ Demo (Offline) - Không kết nối với backend thực.
              </div>
            )}

            {apiStatus === 'error' && !isDemoMode && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800">
                <p className="font-semibold">Mất kết nối backend hoặc phiên đăng nhập đã hết hạn</p>
                {apiError && <p className="text-sm mt-1">{apiError}</p>}
              </div>
            )}

            {settings.maintenanceMode && !maintenanceDismissed ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
                <div>
                  <p className="font-semibold">Hệ thống đang ở chế độ bảo trì</p>
                  <p className="text-sm">{settings.maintenanceMessage}</p>
                </div>
                <Button variant="ghost" onClick={dismissMaintenance} type="button">
                  Đã hiểu
                </Button>
              </div>
            ) : null}

            {warningVisible ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800">
                Phiên đăng nhập sẽ hết hạn sau {remainingSeconds} giây nếu không có tương tác.
              </div>
            ) : null}

            <Breadcrumbs />
            <div key={location.pathname} className="app-route-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppShell


