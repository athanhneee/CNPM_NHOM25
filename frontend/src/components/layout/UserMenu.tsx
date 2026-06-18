import { useEffect, useRef, useState } from 'react'
import { ChevronDown, KeyRound, LogOut, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/app/store/auth.store'
import { ROLE_LABELS } from '@/lib/selectors'

export function UserMenu() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.currentUser)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  if (!user) {
    return null
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        className="brand-ring interactive-press flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-semibold text-white">
          {user.fullName.slice(0, 1)}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
          <p className="text-sm text-slate-500">{ROLE_LABELS[user.roles[0] ?? 'STUDENT']}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 grid min-w-64 gap-2 rounded-2xl border border-[var(--color-hairline)] bg-white p-3 shadow-2xl">
          <div className="rounded-full bg-slate-50 px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">{user.code}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <Link to="/profile" className="interactive-press rounded-full px-3 py-3 text-sm text-slate-700 hover:bg-slate-50">
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              Thông tin cá nhân
            </span>
          </Link>
          <Link
            to="/change-password"
            className="interactive-press rounded-full px-3 py-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Đổi mật khẩu
            </span>
          </Link>
          <Button
            variant="ghost"
            className="justify-start"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            type="button"
          >
            Đăng xuất
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default UserMenu

