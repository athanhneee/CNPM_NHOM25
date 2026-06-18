import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldAlert,
  UserRound,
  GraduationCap,
  Sparkles,
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
    <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.15),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] text-slate-900 overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-300/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-300/20 blur-[120px] pointer-events-none" />

      {/* Main Card Container */}
      <div className="relative w-full max-w-6xl bg-white rounded-[2rem] sm:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05),_0_0_0_1px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col lg:flex-row min-h-[750px]">
        
        {/* LEFT PANEL - Vibrant Gradient */}
        <section className="relative hidden lg:flex lg:w-5/12 flex-col justify-between p-12 text-white overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500">
          {/* Glass Overlay for depth */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
          
          {/* Decorative shapes inside gradient */}
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-12 -right-12 w-48 h-48 rounded-full bg-teal-300/30 blur-2xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-2xl shadow-lg">
              <img 
                alt="Logo PTIT" 
                src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp" 
                className="h-10 w-10 object-contain" 
              />
            </div>
            <span className="font-bold tracking-widest uppercase text-sm text-white drop-shadow-sm">PTIT HCM</span>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium shadow-sm">
              <Sparkles className="h-4 w-4 text-cyan-100" />
              Phiên bản hệ thống mới
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] tracking-tight text-white drop-shadow-sm">
              Trải nghiệm học vụ <br/> <span className="text-cyan-100">thông minh.</span>
            </h1>
            <p className="text-lg text-white/90 leading-relaxed font-medium">
              Quản lý tín chỉ, theo dõi lịch học và cập nhật tiến độ học tập chưa bao giờ dễ dàng và trực quan đến thế.
            </p>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl">
              <div className="bg-white/20 p-3 rounded-2xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Cổng thông tin đào tạo</p>
                <p className="text-xs text-white/80 mt-0.5">Dành cho sinh viên và giảng viên</p>
              </div>
            </div>
            <p className="mt-8 text-xs font-medium text-white/60">
              © {new Date().getFullYear()} Học Viện Công Nghệ Bưu Chính Viễn Thông.
            </p>
          </div>
        </section>

        {/* RIGHT PANEL - Login form */}
        <section className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 relative overflow-y-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 flex flex-col items-center gap-4">
            <div className="bg-white p-2 rounded-3xl shadow-[0_8px_24px_rgba(8,145,178,0.15)] border border-slate-100">
              <img 
                alt="Logo PTIT" 
                src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp" 
                className="h-16 w-16 object-contain" 
              />
            </div>
            <span className="font-bold tracking-widest text-cyan-800 text-sm uppercase">Cổng Học Vụ PTIT</span>
          </div>

          <div className="w-full max-w-[420px] space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Đăng nhập</h2>
              <p className="text-slate-500 font-medium">Vui lòng nhập thông tin tài khoản để tiếp tục</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <Input
                  label="Email hoặc tên đăng nhập"
                  leftIcon={<Mail className="h-5 w-5 text-slate-400" strokeWidth={2} />}
                  placeholder="MSSV hoặc Email PTIT"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
                <Input
                  label="Mật khẩu"
                  leftIcon={<LockKeyhole className="h-5 w-5 text-slate-400" strokeWidth={2} />}
                  placeholder="Nhập mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  rightAdornment={
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between pl-1">
                <Checkbox
                  checked={rememberMe}
                  label="Ghi nhớ tài khoản"
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <button
                  type="button"
                  className="text-sm font-bold text-teal-600 hover:text-teal-800 transition-colors"
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
                className="w-full rounded-full py-6 text-base font-bold shadow-lg shadow-teal-500/25 transition-all hover:-translate-y-0.5 hover:shadow-teal-500/40 bg-teal-600 hover:bg-teal-700 text-white"
                loading={loading}
                rightIcon={<ArrowRight className="h-5 w-5" />}
                type="submit"
              >
                Đăng nhập hệ thống
              </Button>
            </form>

            {/* Demo Accounts - Compact Slider */}
            <div className="pt-8">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tài khoản dùng thử</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              
              <div className="grid gap-3 max-h-[220px] overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {demoAccounts.map(account => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => { setIdentifier(account.email); setPassword(account.password); setRememberMe(true); }}
                    className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition-all hover:border-teal-200 hover:bg-teal-50 hover:shadow-md hover:shadow-teal-500/5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white border border-slate-100 text-slate-400 group-hover:border-teal-200 group-hover:text-teal-600 transition-colors shadow-sm">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-teal-900 transition-colors">{account.username}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">{account.note}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-teal-600 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
            
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage;
