import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldAlert,
  UserRound,
  BookOpenText,
  UsersRound,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const demoAccounts = useDataStore((state) => state.demoAccounts)
  const pushToast = useUiStore((state) => state.pushToast)
  const [identifier, setIdentifier] = useState('n23dccn001@student.ptithcm.edu.vn')
  const [password, setPassword] = useState('ptithcm2026')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, location.state, navigate])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const result = await login({ identifier, password, rememberMe })
    setLoading(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="relative min-h-screen flex text-slate-900 bg-slate-50">
      {/* LEFT PANEL - Hidden on mobile, takes 55% on desktop */}
      <section className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between bg-teal-950 relative overflow-hidden p-12 text-white shadow-2xl z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-cyan-950 to-slate-900 opacity-90" />
        {/* Glow effects */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-400/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-400/20 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <img 
            alt="Logo PTIT" 
            src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp" 
            className="h-12 w-12 rounded-xl bg-white p-1 shadow-lg" 
          />
          <span className="font-semibold tracking-widest uppercase text-sm text-cyan-100">Cổng Học Vụ PTIT HCM</span>
        </div>

        <div className="relative z-10 space-y-8 max-w-xl">
          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight text-white">
            Hệ thống quản lý <br/> <span className="text-cyan-400">Đào tạo & Tín chỉ</span>
          </h1>
          <p className="text-lg text-cyan-100/80 leading-relaxed font-light">
            Truy cập cổng thông tin dành cho sinh viên, giảng viên và phòng đào tạo. 
            Trải nghiệm giao diện mới mẻ, tốc độ vượt trội và quy trình quản lý tối ưu.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <BookOpenText className="mb-3 h-6 w-6 text-cyan-300" />
              <p className="font-semibold text-white">Tra cứu học phần</p>
              <p className="mt-1 text-sm text-cyan-100/60 leading-relaxed">Dữ liệu thời gian thực được mô phỏng đầy đủ điều kiện.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <UsersRound className="mb-3 h-6 w-6 text-teal-300" />
              <p className="font-semibold text-white">Trải nghiệm đa dạng</p>
              <p className="mt-1 text-sm text-cyan-100/60 leading-relaxed">{demoAccounts.length} vai trò dùng thử luôn sẵn sàng để kiểm thử quy trình.</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-sm font-medium text-cyan-200/40">
          © {new Date().getFullYear()} Học Viện Công Nghệ Bưu Chính Viễn Thông Cơ Sở Hồ Chí Minh.
        </div>
      </section>

      {/* RIGHT PANEL - Login form */}
      <section className="flex w-full lg:w-1/2 xl:w-[45%] flex-col justify-center items-center p-6 sm:p-12 bg-white relative overflow-y-auto">
        {/* Mobile background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-50 via-white to-white lg:hidden pointer-events-none" />

        {/* Mobile Logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-3 relative z-10">
          <img 
            alt="Logo PTIT" 
            src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp" 
            className="h-16 w-16 rounded-2xl shadow-[0_8px_20px_rgba(8,145,178,0.12)] border border-slate-100 p-1.5 bg-white" 
          />
          <span className="font-semibold tracking-widest text-cyan-800 text-sm uppercase">Cổng Học Vụ PTIT HCM</span>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Chào mừng trở lại</h2>
            <p className="text-slate-500 font-medium">Đăng nhập vào tài khoản của bạn để tiếp tục</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Email hoặc tên đăng nhập"
                leftIcon={<Mail className="h-5 w-5 text-slate-400" strokeWidth={1.5} />}
                placeholder="MSSV hoặc Email PTIT"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
              <Input
                label="Mật khẩu"
                leftIcon={<LockKeyhole className="h-5 w-5 text-slate-400" strokeWidth={1.5} />}
                placeholder="Nhập mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                rightAdornment={
                  <button
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-full transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Checkbox
                checked={rememberMe}
                label="Ghi nhớ tài khoản"
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <button
                type="button"
                className="text-sm font-semibold text-cyan-600 hover:text-cyan-800 transition-colors"
                onClick={() => pushToast({ tone: 'info', title: 'Khôi phục mật khẩu', description: 'Tính năng đang ở chế độ mô phỏng. Mật khẩu demo là ptithcm2026.' })}
              >
                Quên mật khẩu?
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <Button
              className="w-full rounded-full py-6 text-base font-semibold shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5 hover:shadow-cyan-500/40"
              loading={loading}
              rightIcon={<ArrowRight className="h-5 w-5" />}
              type="submit"
            >
              Đăng nhập hệ thống
            </Button>
          </form>

          {/* Demo Accounts List */}
          <div className="mt-12 pt-8 border-t border-slate-200/80">
            <p className="text-sm font-semibold text-slate-800 mb-4 text-center lg:text-left">Tài khoản dùng thử</p>
            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {demoAccounts.map(account => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => { setIdentifier(account.email); setPassword(account.password); setRememberMe(true); }}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:shadow-md hover:shadow-cyan-500/5 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 group-hover:bg-white group-hover:border-cyan-200 group-hover:text-cyan-600 transition-colors shadow-sm">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-cyan-900 transition-colors">{account.username}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">{account.note}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-cyan-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage;
