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
  Zap,
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
  const [activeTab, setActiveTab] = useState<'SV' | 'GV' | 'QTV'>('SV')

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

  // Filter demo accounts by role for tabbed view
  const filteredDemoAccounts = demoAccounts.filter(acc => {
    if (activeTab === 'SV') return acc.role === 'STUDENT'
    if (activeTab === 'GV') return acc.role === 'LECTURER'
    if (activeTab === 'QTV') return acc.role === 'ADMIN' || acc.role === 'ACADEMIC_OFFICER'
    return true
  })

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-slate-100 text-slate-900 font-sans selection:bg-teal-500/30">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100/50 via-slate-100 to-slate-100"></div>

      <div className="relative z-10 w-full max-w-[1200px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[760px] border border-slate-200/60">
        
        {/* LEFT PANEL - Light Vibrant UI */}
        <section className="relative hidden lg:flex lg:w-5/12 bg-teal-50/50 flex-col justify-between p-12 overflow-hidden border-r border-teal-100/50">
          {/* Abstract glowing background shapes */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-teal-300/30 blur-[100px] rounded-full mix-blend-multiply" />
            <div className="absolute bottom-[0%] -right-[20%] w-[70%] h-[70%] bg-cyan-300/30 blur-[90px] rounded-full mix-blend-multiply" />
            <div className="absolute top-[40%] left-[20%] w-[50%] h-[50%] bg-sky-200/40 blur-[100px] rounded-full mix-blend-multiply" />
          </div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-2xl border border-teal-100 shadow-sm shrink-0">
              <img
                alt="Logo PTIT"
                src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp"
                className="h-9 w-9 object-contain"
              />
            </div>
            <span className="font-bold text-[13px] xl:text-sm text-teal-900 leading-snug uppercase tracking-wide whitespace-nowrap">
              Học viện Công nghệ Bưu chính Viễn thông<br />Cơ sở Hồ Chí Minh
            </span>
          </div>

          <div className="relative z-10 space-y-8 mt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-teal-200/60 text-teal-700 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
              <Zap className="h-3.5 w-3.5 text-teal-500" />
              <span>Hệ thống mới 2026</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] tracking-tight text-slate-900">
              Nền tảng học vụ <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-500">
                thông minh hơn.
              </span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed font-medium max-w-sm">
              Trải nghiệm hệ thống quản lý đào tạo hiện đại, trực quan và tối ưu cho toàn bộ sinh viên, giảng viên.
            </p>
          </div>

          <div className="relative z-10 mt-auto pt-16">
            <div className="flex items-center gap-5 bg-white/70 backdrop-blur-md border border-teal-100/60 p-5 rounded-3xl shadow-sm">
              <div className="bg-teal-100 p-3.5 rounded-full border border-teal-200/50 shadow-inner">
                <GraduationCap className="h-7 w-7 text-teal-700" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-teal-950">Cổng thông tin đào tạo</p>
                <p className="text-xs text-teal-800 mt-1 font-medium">Phiên bản dành cho PTIT Cơ sở miền Nam</p>
              </div>
            </div>
            <p className="mt-8 text-xs font-semibold text-slate-400 uppercase tracking-widest">
              © {new Date().getFullYear()} PTIT HCM
            </p>
          </div>
        </section>

        {/* RIGHT PANEL - Clean Login Form */}
        <section className="flex-1 flex flex-col justify-center p-8 sm:p-14 lg:p-16 relative bg-white overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Mobile Logo Header */}
          <div className="lg:hidden mb-10 flex flex-col items-center gap-4 text-center">
            <div className="bg-white p-3 rounded-3xl shadow-xl shadow-teal-500/10 border border-slate-100">
              <img
                alt="Logo PTIT"
                src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp"
                className="h-14 w-14 object-contain"
              />
            </div>
            <span className="font-extrabold tracking-widest text-teal-800 text-xs uppercase">Cổng Học Vụ PTIT</span>
          </div>

          <div className="w-full max-w-[440px] mx-auto space-y-8">
            <div className="space-y-3 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Đăng nhập</h2>
              <p className="text-slate-500 font-medium text-sm">Vui lòng điền thông tin để truy cập hệ thống</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="Email hoặc mã sinh viên"
                  leftIcon={<Mail className="h-5 w-5 text-slate-400" strokeWidth={2} />}
                  placeholder="Nhập email hoặc MSSV..."
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
                <Input
                  label="Mật khẩu"
                  leftIcon={<LockKeyhole className="h-5 w-5 text-slate-400" strokeWidth={2} />}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  rightAdornment={
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Checkbox
                  checked={rememberMe}
                  label="Ghi nhớ đăng nhập"
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <button
                  type="button"
                  className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
                  onClick={() => pushToast({ tone: 'info', title: 'Khôi phục mật khẩu', description: 'Hệ thống đang bảo trì chức năng này.' })}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3 animate-in fade-in zoom-in-95">
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <Button
                className="w-full py-6 text-base font-bold shadow-lg shadow-teal-500/25 transition-all hover:-translate-y-0.5 hover:shadow-teal-500/40 bg-teal-600 hover:bg-teal-700 text-white border-0"
                loading={loading}
                rightIcon={<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                type="submit"
              >
                Đăng nhập hệ thống
              </Button>
            </form>

            {/* Demo Accounts Section */}
            <div className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trải nghiệm Demo</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-2 rounded-full mb-4 flex gap-1">
                <button 
                  onClick={() => setActiveTab('SV')} 
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-full transition-all ${activeTab === 'SV' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  Sinh viên
                </button>
                <button 
                  onClick={() => setActiveTab('GV')} 
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-full transition-all ${activeTab === 'GV' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  Giảng viên
                </button>
                <button 
                  onClick={() => setActiveTab('QTV')} 
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-full transition-all ${activeTab === 'QTV' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  Quản trị
                </button>
              </div>

              <div 
                key={activeTab}
                className="grid gap-3 h-[180px] content-start overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-slate-200 animate-in fade-in zoom-in-[0.98] duration-300"
              >
                {filteredDemoAccounts.map(account => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => { setIdentifier(account.email); setPassword(account.password); setRememberMe(true); }}
                    className="group flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-3.5 text-left transition-all hover:border-teal-400 hover:shadow-md hover:shadow-teal-500/10 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-teal-800 transition-colors">{account.username}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{account.note}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-teal-600" />
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
