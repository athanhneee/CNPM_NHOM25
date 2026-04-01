import { Bell, Menu } from 'lucide-react'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { getCurrentSemesterLabel } from '@/lib/selectors'
import { UserMenu } from '@/components/layout/UserMenu'

export function TopHeader() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const settings = useDataStore((state) => state.settings)
  const semesters = useDataStore((state) => state.semesters)

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/60 bg-white/70 px-4 py-4 backdrop-blur xl:px-6">
      <div className="flex items-center gap-3">
        <button
          className="brand-ring interactive-press inline-flex h-12 w-12 items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-sm"
          onClick={toggleSidebar}
          type="button"
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </button>
        <div>
          <p className="text-sm text-slate-500">Học kỳ đang xem</p>
          <p className="text-base font-semibold text-slate-900">
            {getCurrentSemesterLabel(settings, semesters)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-[24px] border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm text-cyan-700 md:flex">
          <Bell className="h-4 w-4" />
          Thời gian mô phỏng: {settings.simulationNow.slice(0, 16).replace('T', ' ')}
        </div>
        <UserMenu />
      </div>
    </header>
  )
}

export default TopHeader
