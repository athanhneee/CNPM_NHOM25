import { useEffect, useState, useMemo } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, GraduationCap, ShieldAlert, MapPin, CloudRain, Droplets, Wind, Umbrella, CloudLightning, CloudDrizzle, ChevronDown, Sun, Cloud } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { useUiStore } from '@/app/store/ui.store'
import { fetchWeather, type RealWeather } from '@/services/weather.api'
import '@/styles/weather.css'

const DROPS = Array.from({ length: 60 }).map(() => ({
  left: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 2}s`,
  animationDuration: `${0.6 + Math.random() * 0.4}s`,
  opacity: 0.2 + Math.random() * 0.4,
  width: `${1 + Math.random() * 1.5}px`,
  height: `${10 + Math.random() * 15}px`
}))

function RainEffect() {

  return (
    <div className="weather-rain-container pointer-events-none z-0">
      {DROPS.map((drop, i) => (
        <div
          key={i}
          className="weather-raindrop"
          style={{
            left: drop.left,
            animationDelay: drop.animationDelay,
            animationDuration: drop.animationDuration,
            opacity: drop.opacity,
            width: drop.width,
            height: drop.height
          }}
        />
      ))}
    </div>
  )
}

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
  const [now, setNow] = useState(new Date())
  const [realWeather, setRealWeather] = useState<RealWeather | null>(null)

  useEffect(() => {
    fetchWeather().then(data => {
      if (data) setRealWeather(data)
    })
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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

  const formattedDate = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  // format returns e.g. "10:00 SA", handle some browser differences
  const formattedTime = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now).replace('AM', 'SA').replace('PM', 'CH')

  const daysOfWeek = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  
  const forecastData = realWeather?.forecast 
    ? realWeather.forecast.map((f) => ({
        day: daysOfWeek[f.day.getDay()],
        high: f.high,
        low: f.low,
        Icon: f.condition === 'rain' ? CloudRain : f.condition === 'sunny' ? Sun : Cloud
      }))
    : [
        { high: 27, low: 23, Icon: CloudDrizzle },
        { high: 28, low: 24, Icon: CloudRain },
        { high: 29, low: 24, Icon: CloudLightning },
        { high: 27, low: 23, Icon: CloudRain },
        { high: 28, low: 24, Icon: CloudRain },
        { high: 27, low: 23, Icon: CloudRain },
      ].map((item, index) => ({
        ...item,
        day: daysOfWeek[(now.getDay() + index + 1) % 7]
      }))

  const mockWeather = {
    condition: realWeather?.condition ?? 'rain',
    temp: realWeather?.temp ?? 28,
    label: realWeather?.label ?? 'Mưa to',
    humidity: realWeather?.humidity ?? 85,
    wind: realWeather?.wind ?? 15,
    rainChance: realWeather?.rainChance ?? 90,
  }

  const weatherAdvice = {
    rain: 'Trời có vẻ mưa lớn. Hãy lên kế hoạch trước và giữ an toàn.',
    sunny: 'Trời nắng đẹp và khá nóng. Nhớ uống đủ nước và bôi kem chống nắng.',
    cloudy: 'Trời nhiều mây râm mát. Thời tiết rất lý tưởng để ra ngoài.',
  }

  const WeatherMainIcon = mockWeather.condition === 'rain' ? CloudRain : mockWeather.condition === 'sunny' ? Sun : Cloud

  return (
    <main
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-teal-500/30 bg-slate-900 bg-cover bg-center"
      style={{ backgroundImage: "url('/Img/raining-day-2022-iphone-wallpaper-from-unsplash-img-2.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      {mockWeather.condition === 'rain' && <RainEffect />}

      <div className="relative z-10 w-full max-w-[1280px] grid lg:grid-cols-[1.2fr_1fr] gap-8 min-h-[760px] text-white">

        {/* LEFT PANEL - Weather Dashboard */}
        <section className="hidden lg:flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-sm font-medium w-fit drop-shadow-md">
              <MapPin className="w-4 h-4 text-slate-300" />
              Thành phố Hồ Chí Minh, Việt Nam
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            <div>
              <p className="text-slate-100 text-lg capitalize font-medium tracking-wide drop-shadow-md">
                {formattedDate} - {formattedTime}
              </p>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <h1 className="text-[7rem] font-medium leading-none tracking-tighter">
                {mockWeather.temp}<span className="text-5xl align-top">°C</span>
              </h1>
              <div className="flex flex-col items-center">
                <WeatherMainIcon className="w-20 h-20 text-slate-200" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-2xl font-medium mt-[-1rem]">{mockWeather.label}</p>

            <div className="flex items-center justify-between mt-6 w-full max-w-[560px]">
              <div className="flex items-center gap-3">
                <Droplets className="w-6 h-6 text-slate-400" />
                <div>
                  <p className="font-semibold text-lg leading-tight">{mockWeather.humidity}%</p>
                  <p className="text-xs text-slate-400">Độ ẩm</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wind className="w-6 h-6 text-slate-400" />
                <div>
                  <p className="font-semibold text-lg leading-tight">{mockWeather.wind} km/h</p>
                  <p className="text-xs text-slate-400">Gió</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Umbrella className="w-6 h-6 text-slate-400" />
                <div>
                  <p className="font-semibold text-lg leading-tight">{mockWeather.rainChance}%</p>
                  <p className="text-xs text-slate-400">Khả năng mưa</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4 w-full max-w-[560px]">
              <h3 className="text-sm font-semibold text-slate-300">Tiêu điểm hôm nay</h3>
              <div className="bg-black/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-4 shadow-lg">
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

            <div className="mt-8 space-y-4 w-full max-w-[560px]">
              <h3 className="text-sm font-semibold text-slate-300">Dự báo 6 ngày</h3>
              <div className="bg-black/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex justify-between gap-2 shadow-lg">
                {forecastData.map((forecast, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <p className="text-xs text-slate-400">{forecast.day}</p>
                    <forecast.Icon className="w-6 h-6 text-slate-300" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-200">{forecast.high}°</p>
                      <p className="text-xs text-slate-500">{forecast.low}°</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-300 mt-8">
            {weatherAdvice[mockWeather.condition]}
          </p>
        </section>

        {/* RIGHT PANEL - Glass Login Form */}
        <section className="flex flex-col justify-center">
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 w-full max-w-[520px] mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

            <div className="flex flex-col items-center text-center mb-10">
              <div className="bg-slate-950/50 p-3 rounded-full border border-white/5 mb-4 shadow-inner">
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
                      className="w-full bg-slate-950/40 border border-white/10 rounded-3xl px-11 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
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
                      className="w-full bg-slate-950/40 border border-white/10 rounded-3xl px-11 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
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
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="appearance-none w-4 h-4 rounded-full border border-white/20 bg-black/20 checked:bg-teal-500 checked:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-0 cursor-pointer peer transition-all"
                    />
                    <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
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
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold py-3.5 rounded-3xl shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_25px_rgba(20,184,166,0.4)] transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>

              <div className="flex items-center py-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="px-3 text-xs text-slate-400 font-medium uppercase tracking-widest">Hoặc</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300 text-center sm:text-left">Thử tài khoản demo</p>
                <div className="flex flex-nowrap overflow-x-auto gap-2 justify-start sm:justify-between w-full pb-1">
                  <button type="button" onClick={() => handleDemoClick('n23dccn001@student.ptithcm.edu.vn')} className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-3xl border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-medium hover:bg-teal-500/20 transition-colors">
                    <GraduationCap className="w-3.5 h-3.5" /> Sinh viên
                  </button>
                  <button type="button" onClick={() => handleDemoClick('nguyenvana@ptithcm.edu.vn')} className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-3xl border border-white/10 bg-white/5 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors">
                    <UserRound className="w-3.5 h-3.5" /> Giảng viên
                  </button>
                  <button type="button" onClick={() => handleDemoClick('admin@ptithcm.edu.vn')} className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-3xl border border-white/10 bg-white/5 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors">
                    <ShieldAlert className="w-3.5 h-3.5" /> Quản trị
                  </button>
                  <button type="button" onClick={() => handleDemoClick('giaovu@ptithcm.edu.vn')} className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-3xl border border-white/10 bg-white/5 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors">
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

export default LoginPage;
