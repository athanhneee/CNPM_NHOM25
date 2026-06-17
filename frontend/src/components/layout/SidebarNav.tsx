import {
  BadgeMinus,
  BookCopy,
  BookOpen,
  CalendarDays,
  CalendarFold,
  CalendarRange,
  ChartColumnBig,
  CircleSlash2,
  ClipboardCheck,
  FileClock,
  GitMerge,
  GraduationCap,
  History,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Logs,
  MapPinned,
  PlusSquare,
  ShieldCheck,
  ShieldPlus,
  SlidersHorizontal,
  Sparkles,
  TableProperties,
  UserCog,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getNavigationForRoles } from '@/app/config/navigation'
import { useAuthStore } from '@/app/store/auth.store'
import { useUiStore } from '@/app/store/ui.store'
import { ROLE_LABELS } from '@/lib/selectors'

const iconMap = {
  'layout-dashboard': LayoutDashboard,
  'user-round': UserRound,
  'key-round': KeyRound,
  'book-open': BookOpen,
  'clipboard-check': ClipboardCheck,
  'badge-minus': BadgeMinus,
  'circle-slash-2': CircleSlash2,
  'calendar-days': CalendarDays,
  'table-properties': TableProperties,
  history: History,
  'git-merge': GitMerge,
  sparkles: Sparkles,
  'list-checks': ListChecks,
  'graduation-cap': GraduationCap,
  'calendar-range': CalendarRange,
  'calendar-fold': CalendarFold,
  'book-copy': BookCopy,
  'plus-square': PlusSquare,
  'users-round': UsersRound,
  'file-clock': FileClock,
  'map-pinned': MapPinned,
  'chart-column-big': ChartColumnBig,
  'shield-plus': ShieldPlus,
  'user-cog': UserCog,
  'shield-check': ShieldCheck,
  'sliders-horizontal': SlidersHorizontal,
  logs: Logs,
} as const

export function SidebarNav() {
  const user = useAuthStore((state) => state.currentUser)
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)

  if (!user) {
    return null
  }

  const groups = getNavigationForRoles(user.roles)

  return (
    <>
      {sidebarOpen ? (
        <button
          className="fixed inset-0 z-20 bg-slate-950/25 xl:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-30 h-full w-[312px] border-r border-white/80 bg-white/92 px-4 py-5 text-slate-900 shadow-[0_24px_72px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-transform xl:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              alt="Logo Học Viện Công Nghệ Bưu Chính Viễn Thông"
              className="h-14 w-14 rounded-[20px] border border-cyan-100 bg-white object-contain p-2 shadow-[0_10px_24px_rgba(6,182,212,0.16)]"
              src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700/90">
                PTIT HCM
              </p>
              <p className="mt-1 max-w-[190px] text-sm font-semibold leading-5 text-slate-900">
                Học Viện Công Nghệ Bưu Chính Viễn Thông cơ sở Hồ Chí Minh
              </p>
            </div>
          </div>

          <button
            className="interactive-press rounded-[20px] bg-slate-100 p-2 text-slate-600 xl:hidden"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-cyan-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-4 shadow-[0_14px_34px_rgba(15,118,110,0.08)]">
          <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
          <p className="mt-1 text-xs text-slate-500">{user.email}</p>
          <p className="mt-3 inline-flex rounded-full bg-teal-500/12 px-3 py-1 text-xs font-medium text-teal-700 uppercase">
            {user.roles.map((r) => ROLE_LABELS[r] || r).join(' • ')}
          </p>
        </div>

        <nav className="h-[calc(100vh-210px)] overflow-y-auto pr-1">
          <div className="grid gap-6">
            {groups.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {group.title}
                </p>
                <div className="grid gap-1">
                  {group.items.map((item) => {
                    const Icon = iconMap[item.icon as keyof typeof iconMap]

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `interactive-press group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                            isActive
                              ? 'bg-gradient-to-r from-teal-50 via-cyan-50 to-white text-teal-700 ring-1 ring-teal-100 shadow-[0_12px_26px_rgba(13,148,136,0.10)]'
                              : 'text-slate-600 hover:bg-cyan-50/80 hover:text-slate-900'
                          }`
                        }
                      >
                        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.65} />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{item.label}</span>
                        </span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  )
}

export default SidebarNav

