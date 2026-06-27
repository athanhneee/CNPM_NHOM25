import { useEffect, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, GraduationCap, ShieldAlert, MapPin, CloudRain, Droplets, Wind, Umbrella, CloudLightning, CloudDrizzle, ChevronDown } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { useUiStore } from '@/app/store/ui.store'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const pushToast = useUiStore((state) => state.pushToast)
  const [identifier, setIdentifier] = useState('n23dccn001@student.ptithcm.edu.vn')
  const [password, setPassword] = useState('ptithcm2026')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
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
    const result = await login({ identifier, password, rememberMe })
    setLoading(false)

    if (!result.success) {
      pushToast({ tone: 'error', title: 'Đăng nhập thất bại', description: result.message })
      return
    }
    navigate('/', { replace: true })
  }

  const handleDemoClick = (email: string) => {
    setIdentifier(email)
    setPassword('ptithcm2026')
  }

  return (
    <main 
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-teal-500/30 bg-slate-900 bg-cover bg-center"
      style={{ backgroundImage: "url('/rain-window.png')" }}
    >
      <div className="absolute inset-0 bg-slate-950/40 mix-blend-multiply pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1280px] grid lg:grid-cols-[1.2fr_1fr] gap-8 min-h-[760px] text-white">
        
        {/* LEFT PANEL - Weather Dashboard */}
        <section className="hidden lg:flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-slate-900/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-sm font-medium w-fit">
              <MapPin className="w-4 h-4 text-slate-300" />
              Thành phố Hồ Chí Minh, Việt Nam
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            <div>
              <p className="text-slate-300 text-lg">Thứ Hai, 5 tháng 4, 2026<br />10:00 SA</p>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <h1 className="text-[7rem] font-medium leading-none tracking-tighter">
                28<span className="text-5xl align-top">°C</span>
              </h1>
              <div className="flex flex-col items-center">
                <CloudRain className="w-20 h-20 text-slate-200" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-2xl font-medium mt-[-1rem]">Mưa to</p>

            <div className="flex items-center gap-8 mt-6">
              <div className="flex items-center gap-3">
                <Droplets className="w-6 h-6 text-slate-400" />
                <div>
                  <p className="font-semibold text-lg leading-tight">85%</p>
                  <p className="text-xs text-slate-400">Độ ẩm</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wind className="w-6 h-6 text-slate-400" />
                <div>
                  <p className="font-semibold text-lg leading-tight">15 km/h</p>
                  <p className="text-xs text-slate-400">Gió</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Umbrella className="w-6 h-6 text-slate-400" />
                <div>
                  <p className="font-semibold text-lg leading-tight">90%</p>
                  <p className="text-xs text-slate-400">Khả năng mưa</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4 max-w-md">
              <h3 className="text-sm font-semibold text-slate-300">Tiêu điểm hôm nay</h3>
              <div className="bg-slate-900/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <CloudRain className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Dự báo mưa to cả ngày.</p>
                    <p className="text-xs text-slate-400">Hãy mang theo ô và giữ an toàn.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CloudLightning className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Có thể có dông vào buổi chiều.</p>
                    <p className="text-xs text-slate-400">Chú ý thời tiết thay đổi bất ngờ.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4 max-w-lg">
              <h3 className="text-sm font-semibold text-slate-300">Dự báo 6 ngày</h3>
              <div className="bg-slate-900/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex justify-between gap-2">
                {[
                  { day: 'Thứ 3', high: 27, low: 23, Icon: CloudDrizzle },
                  { day: 'Thứ 4', high: 28, low: 24, Icon: CloudRain },
                  { day: 'Thứ 5', high: 29, low: 24, Icon: CloudLightning },
                  { day: 'Thứ 6', high: 27, low: 23, Icon: CloudRain },
                  { day: 'Thứ 7', high: 28, low: 24, Icon: CloudRain },
                  { day: 'CN', high: 27, low: 23, Icon: CloudRain },
                ].map((forecast, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <p className="text-xs text-slate-400">{forecast.day}</p>
                    <forecast.Icon className="w-6 h-6 text-slate-300" />
                    <div className="text-center">
                      <p className="text-sm font-semibold">{forecast.high}°</p>
                      <p className="text-xs text-slate-500">{forecast.low}°</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-300 mt-8">
            Trời có vẻ mưa lớn. Hãy lên kế hoạch trước và giữ an toàn.
          </p>
        </section>

        {/* RIGHT PANEL - Glass Login Form */}
        <section className="flex flex-col justify-center">
          <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 w-full max-w-[520px] mx-auto shadow-2xl">
            
            <div className="flex flex-col items-center text-center mb-10">
              <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5 mb-4 shadow-inner">
                <img
                  alt="Logo PTIT"
                  src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp"
                  className="h-12 w-12 object-contain"
                />
              </div>
              <h2 className="text-xl font-bold tracking-widest text-slate-100 uppercase">PTIT HCMC</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                Học viện Công nghệ Bưu chính Viễn thông<br />Cơ sở Hồ Chí Minh
              </p>
            </div>

            <div className="space-y-2 mb-8 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white">Chào mừng trở lại!</h1>
              <p className="text-slate-400 text-sm">Đăng nhập để truy cập nền tảng học tập của bạn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email hoặc Mã sinh viên</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-11 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                      placeholder="n23dccn001@student.ptithcm.edu.vn"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Mật khẩu</label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-11 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-slate-950/50 checked:bg-teal-500 checked:border-teal-500 focus:ring-teal-500/50 focus:ring-offset-0 text-teal-500 cursor-pointer"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => pushToast({ tone: 'info', title: 'Khôi phục mật khẩu', description: 'Tính năng đang được bảo trì.' })}
                  className="text-teal-400 hover:text-teal-300 transition-colors font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_25px_rgba(20,184,166,0.4)] transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-900/0 text-slate-500 uppercase tracking-widest backdrop-blur-md">HOẶC</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300 text-center sm:text-left">Thử tài khoản demo</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button type="button" onClick={() => handleDemoClick('n23dccn001@student.ptithcm.edu.vn')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-medium hover:bg-teal-500/20 transition-colors">
                    <GraduationCap className="w-3.5 h-3.5" /> Sinh viên
                  </button>
                  <button type="button" onClick={() => handleDemoClick('nguyenvana@ptithcm.edu.vn')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors">
                    <UserRound className="w-3.5 h-3.5" /> Giảng viên
                  </button>
                  <button type="button" onClick={() => handleDemoClick('admin@ptithcm.edu.vn')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors">
                    <ShieldAlert className="w-3.5 h-3.5" /> Quản trị viên
                  </button>
                  <button type="button" onClick={() => handleDemoClick('giaovu@ptithcm.edu.vn')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors">
                    <UserRound className="w-3.5 h-3.5" /> Giáo vụ
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} PTIT HCM. Đã đăng ký bản quyền.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
