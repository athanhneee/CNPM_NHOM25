import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Building2,
  CalendarDays,
  ChartColumnBig,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  Home,
  IdCard,
  LockKeyhole,
  Mail,
  MapPinHouse,
  PhoneCall,
  School,
  ShieldAlert,
  CircleHelp,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SystemWindowCard } from '@/components/shared/SystemWindowCard'
import { formatDateTime } from '@/lib/date'
import { authApiService } from '@/services/auth.api'
import {
  getRelevantLogs,
  getRoleDashboardMetrics,
  ROLE_LABELS,
  getStudentAttendanceBreakdown,
  getStudentInstructorContacts,
  getStudentPerformanceSeries,
} from '@/lib/selectors'
import type { UserRole } from '@/types/auth'
import type { User } from '@/types/user'

function getPrimaryRole(user: User | null): UserRole {
  return (user?.roles[0] ?? 'STUDENT') as UserRole
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatShortDate(value?: string) {
  if (!value) {
    return 'Chưa cập nhật'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatProfileValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return 'Chưa cập nhật'
  }

  return String(value)
}

function getCodeLabelByRole(role: UserRole) {
  switch (role) {
    case 'LECTURER':
      return 'Mã giảng viên'
    case 'ACADEMIC_OFFICE':
      return 'Mã cán bộ'
    case 'ADMIN':
      return 'Mã quản trị'
    default:
      return 'Mã sinh viên'
  }
}

function getDashboardIcon(role: string, index: number) {
  if (role === 'STUDENT') {
    return [
      <GraduationCap className="h-5 w-5" key="1" />,
      <BookOpenText className="h-5 w-5" key="2" />,
      <Clock3 className="h-5 w-5" key="3" />,
      <CalendarDays className="h-5 w-5" key="4" />,
    ][index]
  }
  if (role === 'LECTURER') {
    return [
      <School className="h-5 w-5" key="1" />,
      <UsersRound className="h-5 w-5" key="2" />,
      <Clock3 className="h-5 w-5" key="3" />,
      <MapPinHouse className="h-5 w-5" key="4" />,
    ][index]
  }
  if (role === 'ACADEMIC_OFFICE') {
    return [
      <BookOpenText className="h-5 w-5" key="1" />,
      <ChartColumnBig className="h-5 w-5" key="2" />,
      <UsersRound className="h-5 w-5" key="3" />,
      <Building2 className="h-5 w-5" key="4" />,
    ][index]
  }
  if (role === 'ADMIN') {
    return [
      <UserRound className="h-5 w-5" key="1" />,
      <ShieldAlert className="h-5 w-5" key="2" />,
      <LockKeyhole className="h-5 w-5" key="3" />,
      <ChartColumnBig className="h-5 w-5" key="4" />,
    ][index]
  }
  return <CircleHelp className="h-5 w-5" key="fallback" />
}

interface QuickLink {
  label: string
  description: string
  to: string
}

function DashboardQuickLinks({ links }: { links: QuickLink[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {links.map((link) => (
        <Link
          key={`${link.to}-${link.label}`}
          className="interactive-press rounded-2xl border border-slate-200 bg-white/90 px-4 py-3.5 shadow-[0_14px_32px_rgba(15,23,42,0.05)] transition hover:border-cyan-200 hover:bg-cyan-50/80"
          to={link.to}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{link.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{link.description}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
          </div>
        </Link>
      ))}
    </div>
  )
}

function StudentAttendanceCard({ user }: { user: User }) {
  const breakdown = getStudentAttendanceBreakdown(user)

  return (
    <Card
      title="Điểm danh học tập"
      description="Theo dõi tỉ lệ hiện diện trong các học phần đang đăng ký."
    >
      <div className="grid gap-6 lg:grid-cols-[0.52fr_0.48fr] lg:items-center">
        <div className="flex justify-center">
          <div
            className="grid h-44 w-44 place-items-center rounded-full shadow-[inset_0_0_24px_rgba(255,255,255,0.22),0_24px_56px_rgba(8,145,178,0.14)]"
            style={{
              background: `conic-gradient(#0d9488 0 ${breakdown.present}%, #bae6fd ${breakdown.present}% 100%)`,
            }}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
              <div className="text-center">
                <p className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  {breakdown.present}%
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Hiện diện</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-600">Có mặt</span>
              <span className="text-sm font-semibold text-teal-700">{breakdown.present}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-teal-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-500"
                style={{ width: `${breakdown.present}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-600">Vắng mặt</span>
              <span className="text-sm font-semibold text-cyan-700">{breakdown.absent}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-cyan-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-300"
                style={{ width: `${breakdown.absent}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm leading-7 text-slate-600">
            Hệ thống tổng hợp điểm danh từ các lớp đang học trong học kỳ hiện tại để bạn dễ theo
            dõi tiến độ và chủ động điều chỉnh lịch học.
          </div>
        </div>
      </div>
    </Card>
  )
}

function StudentPerformanceCard({ user }: { user: User }) {
  const performance = getStudentPerformanceSeries(user)

  return (
    <Card
      title="Hiệu suất học tập"
      description="Biểu diễn nhanh mức độ tiến bộ theo nhóm học phần đang theo dõi."
    >
      <div className="grid gap-6">
        <div className="grid h-[13rem] grid-cols-4 gap-4">
          {performance.map((point, index) => (
            <div className="flex h-full flex-col items-center justify-end gap-2" key={point.courseLabel}>
              <span className="text-xs font-semibold text-slate-700">
                {point.value}%
              </span>
              <div className="relative flex w-12 flex-1 flex-col justify-end rounded-full bg-slate-100 p-1">
                <div
                  className={`w-full rounded-full ${
                    index % 2 === 0
                      ? 'bg-gradient-to-t from-teal-600 to-cyan-400'
                      : 'bg-gradient-to-t from-cyan-500 to-sky-400'
                  } shadow-sm transition-all duration-500`}
                  style={{ height: `${point.value}%` }}
                />
              </div>
              <div className="mt-1 text-center">
                <p className="text-[13px] font-semibold leading-tight text-slate-900">{point.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{point.courseLabel}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3.5">
            <p className="text-xs font-medium text-slate-500">GPA hiện tại</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {(user.gpa ?? 3.1).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3.5">
            <p className="text-xs font-medium text-slate-500">Tín chỉ đã tích lũy</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {user.completedCredits ?? 0}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function StudentInstructorCard({ instructors }: { instructors: User[] }) {
  return (
    <Card
      title="Giảng viên phụ trách"
      description="Danh bạ nhanh các giảng viên đang phụ trách lớp học phần của bạn."
    >
      {instructors.length ? (
        <div className="grid gap-3">
          {instructors.map((lecturer) => (
            <div
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              key={lecturer.id}
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-semibold text-white">
                {getInitials(lecturer.fullName)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{lecturer.fullName}</p>
                <p className="text-sm text-slate-500">
                  {lecturer.title ? `${lecturer.title} • ` : ''}
                  {lecturer.position ?? 'Giảng viên'}
                </p>
                <p className="mt-1 truncate text-sm text-cyan-700">{lecturer.email}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có giảng viên hiển thị"
          description="Danh bạ giảng viên sẽ xuất hiện khi bạn có lớp học phần đang theo học."
        />
      )}
    </Card>
  )
}

function RecentLogsCard({
  logs,
  title = 'Nhật ký gần đây',
  description = 'Các bản ghi hoạt động mới nhất liên quan đến vai trò hiện tại.',
}: {
  logs: ReturnType<typeof getRelevantLogs>
  title?: string
  description?: string
}) {
  return (
    <Card title={title} description={description}>
      {logs.length ? (
        <div className="grid gap-3">
          {logs.map((log) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              key={log.id}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                <span className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{log.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có bản ghi nổi bật"
          description="Nhật ký liên quan sẽ xuất hiện tại đây sau khi có thao tác mới."
        />
      )}
    </Card>
  )
}

function StudentProfileCard({ user }: { user: User }) {
  return (
    <Card
      title="Hồ sơ học tập"
      description="Thông tin nhanh để bạn theo dõi học kỳ và định hướng học tập."
    >
      <div className="grid gap-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-500">Sinh viên</p>
          <p className="mt-1 text-xl font-semibold text-slate-950">{user.fullName}</p>
          <p className="mt-1 text-sm text-slate-500">{user.code}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Chuyên ngành</p>
            <p className="mt-1 font-semibold text-slate-900">{user.program ?? user.department}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Khóa học</p>
            <p className="mt-1 font-semibold text-slate-900">{user.cohort ?? 'K23'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">Mối quan tâm</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(user.interests ?? []).map((interest) => (
              <span
                className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-cyan-700 shadow-sm"
                key={interest}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function AdminTeamCard({ team }: { team: User[] }) {
  return (
    <Card
      title="Nhóm quản trị PTIT HCM"
      description="Các quản trị viên chịu trách nhiệm vận hành, phân quyền và bảo trì hệ thống."
    >
      <div className="grid gap-3">
        {team.map((member) => (
          <div
            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            key={member.id}
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-600 to-cyan-500 text-sm font-semibold text-white">
              {getInitials(member.fullName)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{member.fullName}</p>
              <p className="text-sm text-slate-500">{member.position ?? 'Quản trị hệ thống'}</p>
              <p className="mt-1 text-sm text-cyan-700">{member.email}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AcademicLeadershipCard({ leaders }: { leaders: User[] }) {
  return (
    <Card
      title="Ban điều phối đào tạo"
      description="Thông tin lãnh đạo và đầu mối xử lý học vụ, lịch học, waitlist và override."
    >
      <div className="grid gap-3">
        {leaders.map((leader) => (
          <div
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
            key={leader.id}
          >
            <p className="font-semibold text-slate-900">{leader.fullName}</p>
            <p className="mt-1 text-sm text-slate-500">
              {leader.title ? `${leader.title} • ` : ''}
              {leader.position ?? 'Phòng Đào tạo'}
            </p>
            <p className="mt-1 text-sm text-cyan-700">{leader.email}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

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
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.18),_transparent_28%),linear-gradient(180deg,_#f4feff_0%,_#f8fafc_50%,_#eefdfb_100%)] px-4 py-8 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.18),_transparent_58%)]" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden xl:block">
          <div className="absolute -left-10 top-16 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="absolute bottom-4 right-12 h-60 w-60 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/88 px-5 py-2 text-sm font-semibold tracking-[0.22em] text-cyan-700 shadow-[0_18px_40px_rgba(8,145,178,0.12)]">
              <GraduationCap className="h-4 w-4" />
              CỔNG HỌC VỤ PTIT HCM
            </div>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950">
                Đăng nhập để tiếp tục quản lý đăng ký tín chỉ tại Học Viện Công Nghệ Bưu Chính
                Viễn Thông cơ sở Hồ Chí Minh.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Truy cập cổng sinh viên, giảng viên, phòng đào tạo và quản trị trên cùng một hệ
                thống, với dữ liệu mô phỏng đầy đủ cho đăng ký, chờ xếp lớp, báo cáo và nhật ký
                thao tác.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <StatCard
                hint="Toàn bộ giao diện ưu tiên diễn đạt học vụ rõ ràng, có dấu."
                icon={<BookOpenText className="h-5 w-5" />}
                label="Ngôn ngữ hiển thị"
                value="Tiếng Việt"
              />
              <StatCard
                hint="Sinh viên, giảng viên, phòng đào tạo và quản trị."
                icon={<UsersRound className="h-5 w-5" />}
                label="Tài khoản dùng thử"
                value={`${demoAccounts.length} vai trò`}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                'Tài khoản demo theo 4 vai trò',
                'Dữ liệu học phần có waitlist và tiên quyết',
                'Audit log hỗ trợ đối chiếu sau demo',
              ].map((item) => (
                <div
                  className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-[0_16px_34px_rgba(15,23,42,0.05)]"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>

          </div>
        </section>

        <section className="surface-panel relative overflow-hidden border border-white/80 px-5 py-5 shadow-[0_30px_90px_rgba(8,145,178,0.16)] sm:px-7 sm:py-7 md:px-9 md:py-9">
          <div className="absolute inset-x-10 top-0 h-32 rounded-b-[44px] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_70%)]" />
          <div className="relative mx-auto max-w-xl space-y-7">
            <div className="space-y-3 text-center">
              <img
                alt="Logo Học Viện Công Nghệ Bưu Chính Viễn Thông"
                className="mx-auto h-24 w-24 rounded-2xl border border-cyan-100 bg-white p-3 shadow-[0_18px_42px_rgba(8,145,178,0.12)]"
                src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp"
              />
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">
                  PTIT HCM
                </p>
                <h2 className="text-3xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  Đăng nhập tài khoản
                </h2>
                <p className="mx-auto max-w-lg text-base leading-8 text-slate-500 sm:text-lg">
                  Đăng nhập để tiếp tục tra cứu học phần, quản lý thời khóa biểu, theo dõi điều
                  kiện học vụ và vận hành cổng đào tạo tập trung.
                </p>
              </div>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Input
                hint="Bạn có thể dùng MSSV, username hoặc email PTIT HCM."
                label="Email hoặc tên đăng nhập"
                leftIcon={<Mail className="h-5 w-5" strokeWidth={1.5} />}
                placeholder="n23dccn001@student.ptithcm.edu.vn"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
              <Input
                hint="Mật khẩu mẫu mặc định là ptithcm2026."
                label="Mật khẩu"
                leftIcon={<LockKeyhole className="h-5 w-5" strokeWidth={1.5} />}
                placeholder="Nhập mật khẩu"
                rightAdornment={
                  <button
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="interactive-press rounded-full p-1 text-slate-400 transition hover:text-cyan-700"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <Checkbox
                  checked={rememberMe}
                  hint="Giữ phiên mô phỏng lâu hơn trên thiết bị này."
                  label="Ghi nhớ đăng nhập"
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <button
                  className="interactive-press pt-2 text-sm font-semibold text-cyan-700 transition hover:text-teal-700"
                  onClick={() =>
                    pushToast({
                      tone: 'info',
                      title: 'Khôi phục mật khẩu đang ở chế độ mô phỏng',
                      description:
                        'Bạn có thể dùng lại tài khoản demo mặc định hoặc cập nhật mật khẩu trong phần hồ sơ sau khi đăng nhập.',
                    })
                  }
                  type="button"
                >
                  Quên mật khẩu
                </button>
              </div>

              {error ? (
                <div className="rounded-[26px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <Button
                className="w-full rounded-2xl py-4 text-base"
                loading={loading}
                rightIcon={<ArrowRight className="h-5 w-5" />}
                type="submit"
              >
                Đăng nhập
              </Button>
            </form>

            <Card
              description="Chạm vào một thẻ để điền nhanh tài khoản theo vai trò."
              title="Tài khoản demo PTIT HCM"
            >
              <div className="grid gap-3">
                {demoAccounts.map((account) => (
                  <button
                    key={account.username}
                    className="interactive-press rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:border-cyan-200 hover:bg-cyan-50/70"
                    onClick={() => {
                      setIdentifier(account.email)
                      setPassword(account.password)
                      setRememberMe(true)
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{account.username}</p>
                        <p className="text-xs text-slate-500">{account.email}</p>
                      </div>
                      <ArrowRight className="mt-0.5 h-4 w-4 text-slate-400" />
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-500">{account.note}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}

export function DashboardPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const snapshot = useDataStore((state) => state)
  const stats = useMemo(
    () => (currentUser ? getRoleDashboardMetrics(snapshot, currentUser) : []),
    [currentUser, snapshot],
  )
  const logs = useMemo(
    () => (currentUser ? getRelevantLogs(snapshot, currentUser) : []),
    [currentUser, snapshot],
  )
  const primaryRole = getPrimaryRole(currentUser)
  const studentInstructors = useMemo(
    () => (currentUser ? getStudentInstructorContacts(snapshot, currentUser.id) : []),
    [currentUser, snapshot],
  )
  const adminTeam = useMemo(
    () => snapshot.users.filter((user) => user.roles.includes('ADMIN')).slice(0, 3),
    [snapshot.users],
  )
  const academicLeadership = useMemo(
    () => snapshot.users.filter((user) => user.roles.includes('ACADEMIC_OFFICE')).slice(0, 5),
    [snapshot.users],
  )

  const quickLinksByRole: Record<UserRole, QuickLink[]> = {
    STUDENT: [
      {
        label: 'Học phần mở',
        description: 'Tra cứu lớp học phần đang mở và kiểm tra điều kiện đăng ký.',
        to: '/student/open-sections',
      },
      {
        label: 'Đăng ký học phần',
        description: 'Gửi yêu cầu đăng ký hoặc vào danh sách chờ khi lớp đã đầy.',
        to: '/student/register',
      },
      {
        label: 'Thời khóa biểu',
        description: 'Theo dõi lịch học theo tuần hoặc theo toàn bộ học kỳ.',
        to: '/student/schedule/week',
      },
      {
        label: 'Lịch sử đăng ký',
        description: 'Xem timeline thay đổi trạng thái học phần trong học kỳ.',
        to: '/student/history',
      },
    ],
    LECTURER: [
      {
        label: 'Lớp được phân công',
        description: 'Xem toàn bộ lớp đang phụ trách trong học kỳ hiện tại.',
        to: '/lecturer/sections',
      },
      {
        label: 'TKB giảng dạy',
        description: 'Theo dõi lịch dạy tuần và học kỳ theo phòng học cụ thể.',
        to: '/lecturer/schedule/week',
      },
      {
        label: 'Danh sách sinh viên',
        description: 'Đi đến trang danh sách sinh viên của từng lớp phụ trách.',
        to: '/lecturer/sections',
      },
      {
        label: 'Thông tin cá nhân',
        description: 'Cập nhật hồ sơ liên hệ và thông tin công tác.',
        to: '/profile',
      },
    ],
    ACADEMIC_OFFICE: [
      {
        label: 'Quản lý đăng ký',
        description: 'Theo dõi sĩ số, waitlist và trạng thái lớp học phần.',
        to: '/academic/registrations',
      },
      {
        label: 'Tạo lớp học phần',
        description: 'Mở thêm lớp mới, cấu hình lịch và số lượng tối đa.',
        to: '/academic/sections/create',
      },
      {
        label: 'Lịch học và phòng',
        description: 'Kiểm tra xung đột giảng viên, phòng học và tiết học.',
        to: '/academic/schedule-rooms',
      },
      {
        label: 'Báo cáo',
        description: 'Tổng hợp tỉ lệ lấp đầy, lớp full và nhu cầu mở thêm lớp.',
        to: '/academic/reports',
      },
    ],
    ADMIN: [
      {
        label: 'Quản lý tài khoản',
        description: 'Theo dõi người dùng, khóa/mở khóa và cập nhật trạng thái.',
        to: '/admin/users',
      },
      {
        label: 'Phân quyền hệ thống',
        description: 'Cập nhật vai trò và đối chiếu ma trận quyền truy cập.',
        to: '/admin/roles',
      },
      {
        label: 'Tham số hệ thống',
        description: 'Điều chỉnh cửa sổ đăng ký, giới hạn tín chỉ và bảo trì.',
        to: '/admin/settings',
      },
      {
        label: 'Nhật ký hệ thống',
        description: 'Tra cứu log đăng nhập, đăng ký, override và cấu hình.',
        to: '/admin/audit-logs',
      },
    ],
  }

  if (!currentUser) {
    return (
      <EmptyState
        title="Chưa có phiên đăng nhập"
        description="Vui lòng đăng nhập lại để đổi mật khẩu."
      />
    )
  }

  return (
    <div className="grid gap-6">

      {primaryRole === 'STUDENT' ? (
        <>
          <section className="surface-panel relative overflow-hidden border border-cyan-100 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 px-6 py-5 text-white shadow-[0_28px_70px_rgba(8,145,178,0.2)]">
            <div className="pointer-events-none absolute -right-12 top-6 h-40 w-40 rounded-full bg-white/12 blur-2xl" />
            <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr] lg:items-center">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-medium text-white/90">
                  <CalendarDays className="h-4 w-4" />
                  {formatLongDate(snapshot.settings.simulationNow)}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white lg:text-3xl">
                    Chào mừng quay lại, {currentUser.fullName}!
                  </h2>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-white/82">
                    Hôm nay là thời điểm phù hợp để theo dõi điểm danh, hiệu suất học tập và trạng thái đăng ký học phần trong học kỳ hiện tại.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-white">
                    GPA {(currentUser.gpa ?? 3.1).toFixed(2)}
                  </div>
                  <div className="rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-white">
                    {currentUser.completedCredits ?? 0} tín chỉ tích lũy
                  </div>
                  <div className="rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-white">
                    {currentUser.yearLevel ?? currentUser.cohort ?? 'PTIT HCM'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/14 px-4 py-3 backdrop-blur">
                  <p className="text-sm text-white/72">Mã sinh viên</p>
                  <p className="mt-1 text-xl font-semibold">{currentUser.code}</p>
                </div>
                <div className="rounded-2xl bg-white/14 px-4 py-3 backdrop-blur">
                  <p className="text-sm text-white/72">Chuyên ngành</p>
                  <p className="mt-1 text-base font-semibold">{currentUser.program ?? 'CNTT'}</p>
                </div>
                <div className="rounded-2xl bg-white/14 px-4 py-3 backdrop-blur">
                  <p className="text-sm text-white/72">Email học vụ</p>
                  <p className="mt-1 break-all text-sm font-semibold">{currentUser.email}</p>
                </div>
                <div className="rounded-2xl bg-white/14 px-4 py-3 backdrop-blur">
                  <p className="text-sm text-white/72">Cơ sở</p>
                  <p className="mt-1 text-base font-semibold">{currentUser.campus}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard
                hint={stat.hint}
                icon={getDashboardIcon(primaryRole, index)}
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-[0.4fr_0.6fr]">
            <StudentAttendanceCard user={currentUser} />
            <StudentPerformanceCard user={currentUser} />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-[0.55fr_0.45fr]">
            <div className="grid gap-6">
              <StudentProfileCard user={currentUser} />
              <Card
                title="Lối tắt dành cho sinh viên"
                description="Đi thẳng tới các màn hình quan trọng nhất trong quá trình đăng ký tín chỉ."
              >
                <DashboardQuickLinks links={quickLinksByRole.STUDENT} />
              </Card>
              <SystemWindowCard settings={snapshot.settings} />
            </div>
            <div className="grid gap-6">
              <StudentInstructorCard instructors={studentInstructors} />
              <RecentLogsCard
                logs={logs}
                title="Nhật ký học vụ"
                description="Các thao tác đăng ký, chờ xếp lớp và cập nhật gần đây của bạn."
              />
            </div>
          </div>
        </>
      ) : null}

      {primaryRole === 'LECTURER' ? (
        <>
          <section className="surface-panel overflow-hidden border border-cyan-100 bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 px-6 py-5 text-white shadow-[0_28px_70px_rgba(8,145,178,0.16)]">
            <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/90">
                  <Clock3 className="h-4 w-4" />
                  Lịch dạy học kỳ hiện tại
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.05em] lg:text-3xl">
                  Xin chào {currentUser.fullName}, chào mừng trở lại không gian giảng dạy.
                </h2>
                <p className="max-w-3xl text-base leading-8 text-white/82">
                  Quản lý toàn diện các lớp học phần được phân công. Dễ dàng theo dõi sĩ số, tra cứu lịch trình và cập nhật tức thời mọi diễn biến mới nhất.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/14 px-4 py-3">
                  <p className="text-sm text-white/72">Giảng viên</p>
                  <p className="mt-1 font-semibold">{currentUser.fullName}</p>
                </div>
                <div className="rounded-2xl bg-white/14 px-4 py-3">
                  <p className="text-sm text-white/72">Học vị</p>
                  <p className="mt-1 font-semibold">{currentUser.title ?? 'Giảng viên'}</p>
                </div>
                <div className="rounded-2xl bg-white/14 px-4 py-3">
                  <p className="text-sm text-white/72">Đơn vị</p>
                  <p className="mt-1 font-semibold">{currentUser.department}</p>
                </div>
                <div className="rounded-2xl bg-white/14 px-4 py-3">
                  <p className="text-sm text-white/72">Email</p>
                  <p className="mt-1 break-all text-sm font-semibold">{currentUser.email}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard
                hint={stat.hint}
                icon={getDashboardIcon(primaryRole, index)}
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-[0.55fr_0.45fr]">
            <Card title="Lối tắt dành cho giảng viên" description="Đi tới lớp được phân công, lịch dạy và danh sách sinh viên.">
              <DashboardQuickLinks links={quickLinksByRole.LECTURER} />
            </Card>
            <RecentLogsCard
              logs={logs}
              title="Hoạt động lớp học"
              description="Nhật ký liên quan đến các lớp học phần bạn đang phụ trách."
            />
          </div>
        </>
      ) : null}

      {primaryRole === 'ACADEMIC_OFFICE' ? (
        <>
          <section className="surface-panel overflow-hidden border border-cyan-100 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 px-6 py-5 text-white shadow-[0_28px_70px_rgba(15,118,110,0.18)]">
            <div className="grid gap-6 lg:grid-cols-[0.58fr_0.42fr]">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/90">
                  <UsersRound className="h-4 w-4" />
                  Điều phối đào tạo học kỳ hiện tại
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.05em] lg:text-3xl">
                  Khu vực điều hành dành cho phòng đào tạo PTIT HCM.
                </h2>
                <p className="max-w-3xl text-base leading-8 text-white/82">
                  Theo dõi tình trạng mở lớp, sĩ số, waitlist, điều phối giảng viên và các thay đổi học vụ quan trọng trong một bức tranh tổng quan duy nhất.
                </p>
              </div>
              <div className="rounded-2xl bg-white/14 px-5 py-5 backdrop-blur">
                <p className="text-sm font-medium text-white/76">Đầu mối hiện tại</p>
                <p className="mt-3 text-2xl font-semibold">{currentUser.fullName}</p>
                <p className="mt-1 text-sm text-white/82">{currentUser.position ?? 'Phòng Đào tạo'}</p>
                <p className="mt-3 break-all text-sm text-white/82">{currentUser.email}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard
                hint={stat.hint}
                icon={getDashboardIcon(primaryRole, index)}
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-[0.55fr_0.45fr]">
            <div className="grid gap-6">
              {academicLeadership.length > 0 && <AcademicLeadershipCard leaders={academicLeadership} />}
              <Card title="Lối tắt điều phối" description="Chuyển nhanh tới các khu vực quản trị học vụ quan trọng.">
                <DashboardQuickLinks links={quickLinksByRole.ACADEMIC_OFFICE} />
              </Card>
            </div>
            <div className="grid gap-6">
              <SystemWindowCard settings={snapshot.settings} />
              <RecentLogsCard
                logs={logs}
                title="Nhật ký điều phối"
                description="Các bản ghi xử lý waitlist, mở lớp, phân công giảng viên và cập nhật lịch học."
              />
            </div>
          </div>
        </>
      ) : null}

      {primaryRole === 'ADMIN' ? (
        <>
          <section className="surface-panel overflow-hidden border border-cyan-100 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-6 py-5 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
            <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white/90">
                  <ShieldAlert className="h-4 w-4" />
                  Trung tâm điều phối hệ thống
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.05em] lg:text-3xl">
                  Quản trị toàn bộ nền tảng học vụ PTIT HCM từ một bảng điều khiển tập trung.
                </h2>
                <p className="max-w-3xl text-base leading-8 text-white/78">
                  Theo dõi người dùng, phân quyền, cửa sổ đăng ký, trạng thái bảo trì và các bản ghi audit quan trọng để hệ thống luôn ổn định trong mùa đăng ký cao điểm.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/12 px-4 py-3">
                  <p className="text-sm text-white/70">Quản trị viên hiện tại</p>
                  <p className="mt-1 font-semibold">{currentUser.fullName}</p>
                </div>
                <div className="rounded-2xl bg-white/12 px-4 py-3">
                  <p className="text-sm text-white/70">Email quản trị</p>
                  <p className="mt-1 break-all text-sm font-semibold">{currentUser.email}</p>
                </div>
                <div className="rounded-2xl bg-white/12 px-4 py-3">
                  <p className="text-sm text-white/70">Trạng thái hệ thống</p>
                  <p className="mt-1 font-semibold">
                    {snapshot.settings.maintenanceMode ? 'Đang bảo trì' : 'Đang hoạt động'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/12 px-4 py-3">
                  <p className="text-sm text-white/70">Mốc thời gian</p>
                  <p className="mt-1 font-semibold">{formatLongDate(snapshot.settings.simulationNow)}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard
                hint={stat.hint}
                icon={getDashboardIcon(primaryRole, index)}
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-[0.55fr_0.45fr]">
            <div className="grid gap-6">
              {adminTeam.length > 0 && <AdminTeamCard team={adminTeam} />}
              <Card title="Lối tắt quản trị" description="Đi tới các màn quan trọng để quản lý người dùng và cấu hình hệ thống.">
                <DashboardQuickLinks links={quickLinksByRole.ADMIN} />
              </Card>
            </div>
            <div className="grid gap-6">
              <SystemWindowCard settings={snapshot.settings} />
              <RecentLogsCard
                logs={logs}
                title="Nhật ký vận hành"
                description="Các bản ghi gần nhất liên quan đến tài khoản, phân quyền, cấu hình và audit."
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function ProfilePage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const pushToast = useUiStore((state) => state.pushToast)
  const [isEditing, setIsEditing] = useState(false)
  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [phone, setPhone] = useState(currentUser?.phone ?? '')
  const [secondaryEmail, setSecondaryEmail] = useState(currentUser?.secondaryEmail ?? '')
  const [address, setAddress] = useState(currentUser?.address ?? '')

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy hồ sơ" description="Vui lòng đăng nhập lại để tiếp tục." />
  }

  const user = currentUser
  const primaryRole = getPrimaryRole(user)
  const isStudent = primaryRole === 'STUDENT'
  const roleLabel = user.roles.map((role) => ROLE_LABELS[role] ?? role).join(' • ')
  const codeLabel = getCodeLabelByRole(primaryRole)
  const displayEmail = email
  const displayPhone = phone

  const personalColumns = [
    [
      { label: codeLabel, value: user.code },
      { label: 'Họ và tên', value: user.fullName },
      { label: 'Ngày sinh', value: formatShortDate(user.dateOfBirth) },
      { label: 'Giới tính', value: formatProfileValue(user.gender) },
      {
        label: isStudent ? 'Trạng thái học vụ' : 'Chức danh hiện tại',
        value: isStudent ? formatProfileValue(user.studentStatus) : formatProfileValue(user.position),
      },
    ],
    [
      { label: 'Số điện thoại', value: formatProfileValue(user.phone) },
      { label: 'Số CMND / CCCD', value: formatProfileValue(user.citizenId) },
      { label: 'Dân tộc', value: formatProfileValue(user.ethnicity) },
      { label: 'Tôn giáo', value: formatProfileValue(user.religion) },
      { label: 'Nơi sinh', value: formatProfileValue(user.birthPlace) },
    ],
    [
      { label: 'Quốc tịch', value: formatProfileValue(user.nationality) },
      { label: 'Email 1', value: formatProfileValue(user.email) },
      { label: 'Email 2', value: formatProfileValue(user.secondaryEmail) },
      { label: 'Quê quán', value: formatProfileValue(user.homeTown) },
      { label: 'Nơi ở hiện tại', value: formatProfileValue(user.address) },
    ],
  ]

  const profileColumns = isStudent
    ? [
        [
          { label: 'Lớp', value: formatProfileValue(user.studentClass) },
          { label: 'Ngành', value: formatProfileValue(user.program) },
          { label: 'Khoa', value: formatProfileValue(user.faculty ?? user.department) },
        ],
        [
          { label: 'Bậc hệ đào tạo', value: formatProfileValue(user.educationProgram) },
          { label: 'Niên khóa', value: formatProfileValue(user.academicPeriod) },
          { label: 'Khóa', value: formatProfileValue(user.cohort) },
        ],
      ]
    : [
        [
          { label: 'Đơn vị', value: formatProfileValue(user.department) },
          { label: 'Chức vụ', value: formatProfileValue(user.position) },
          { label: 'Học hàm / học vị', value: formatProfileValue(user.title) },
        ],
        [
          { label: 'Chuyên môn', value: formatProfileValue(user.specialization) },
          { label: 'Cơ sở công tác', value: formatProfileValue(user.campus) },
          { label: 'Mã cán bộ', value: formatProfileValue(user.code) },
        ],
      ]

  const overviewItems = isStudent
    ? [
        { label: 'GPA tích lũy', value: user.gpa ? user.gpa.toFixed(2) : 'Chưa cập nhật' },
        {
          label: 'Điểm danh',
          value: user.attendanceRate !== undefined ? `${Math.round(user.attendanceRate * 100)}%` : 'Chưa cập nhật',
        },
        { label: 'Tín chỉ hoàn thành', value: formatProfileValue(user.completedCredits) },
        { label: 'Năm học hiện tại', value: formatProfileValue(user.yearLevel) },
      ]
    : [
        { label: 'Vai trò', value: roleLabel },
        { label: 'Chuyên môn', value: formatProfileValue(user.specialization) },
        { label: 'Đơn vị', value: formatProfileValue(user.department) },
        { label: 'Cơ sở', value: formatProfileValue(user.campus) },
      ]

  const profileBadgeClass =
    'inline-flex min-h-[48px] px-6 py-2 items-center justify-center rounded-full text-center text-sm font-medium leading-6'

  function resetContactDraft() {
    setEmail(user.email)
    setSecondaryEmail(user.secondaryEmail ?? '')
    setPhone(user.phone)
    setAddress(user.address ?? '')
  }

  async function handleSave() {
    try {
      const updatedUser = await authApiService.updateProfile({ email, secondaryEmail, phone, address })

      useDataStore.setState((state) => {
        const users = state.users.some((item) => item.id === updatedUser.id)
          ? state.users.map((item) => (item.id === updatedUser.id ? updatedUser : item))
          : [...state.users, updatedUser]

        return { users }
      })

      useAuthStore.setState((state) => ({
        ...state,
        currentUser: state.currentUser?.id === updatedUser.id ? updatedUser : state.currentUser,
      }))
      setIsEditing(false)
      pushToast({
        tone: 'success',
        title: 'Cập nhật hồ sơ thành công',
        description: 'Thông tin liên hệ đã được lưu.',
      })
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Không thể cập nhật hồ sơ',
        description: error instanceof Error ? error.message : 'Hệ thống chưa thể lưu thay đổi lúc này.',
      })
    }
  }

  function handleStartEditing() {
    resetContactDraft()
    setIsEditing(true)
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Trang thông tin cá nhân"
        subtitle="Hiển thị và cho phép chỉnh sửa một phần thông tin hồ sơ của người dùng đang đăng nhập."
        actions={
          isEditing ? (
            <>
              <Button className="rounded-2xl px-5" onClick={handleSave} type="button">
                Lưu
              </Button>
              <Button
                className="rounded-2xl px-5"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false)
                  resetContactDraft()
                }}
                type="button"
              >
                Hủy
              </Button>
            </>
          ) : (
            <Button className="rounded-2xl px-5" onClick={handleStartEditing} type="button">
              Chỉnh sửa
            </Button>
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[0.65fr_0.35fr] xl:grid-cols-[0.7fr_0.3fr]">
        <div className="grid gap-6">
          <section className="surface-panel overflow-hidden border border-teal-100">
            <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 px-6 py-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/90">
                <BadgeCheck className="h-4 w-4" />
                Hồ sơ định danh PTIT HCM
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Hồ sơ cá nhân và học vụ</h2>
            </div>

            <div className="grid gap-6 px-6 py-5 lg:grid-cols-[170px_1fr] lg:items-center">
              <div className="rounded-3xl bg-gradient-to-br from-teal-50 via-cyan-50 to-white p-4">
                <div className="grid h-36 place-items-center rounded-[2rem] border border-white/80 bg-white text-3xl font-semibold tracking-[-0.06em] text-teal-700 shadow-[0_24px_60px_-36px_rgba(8,145,178,0.45)]">
                  {getInitials(user.fullName)}
                </div>
                <div className="mt-4 space-y-2 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">Mã nhận diện</p>
                  <p className="text-sm font-semibold text-slate-900">{user.code}</p>
                </div>
              </div>

              <div className="grid gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">{roleLabel}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{user.fullName}</h3>
                </div>

                <div className="flex flex-wrap items-stretch gap-3">
                  <span className={`${profileBadgeClass} border border-teal-200 bg-teal-50 text-teal-700`}>
                    {isStudent ? formatProfileValue(user.studentClass) : formatProfileValue(user.position)}
                  </span>
                  <span className={`${profileBadgeClass} border border-cyan-200 bg-cyan-50 text-cyan-700`}>
                    {formatProfileValue(isStudent ? user.program : user.specialization)}
                  </span>
                  <span className={`${profileBadgeClass} border border-slate-200 bg-slate-50 text-slate-700`}>
                    Cơ sở {formatProfileValue(user.campus)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <Card title="Thông tin cá nhân">
            <div className="grid items-start gap-6 xl:grid-cols-3">
              {personalColumns.map((column, columnIndex) => (
                <div
                  key={`personal-column-${columnIndex}`}
                  className={`space-y-3 ${columnIndex < personalColumns.length - 1 ? 'xl:border-r xl:border-slate-200 xl:pr-6' : ''}`}
                >
                  {column.map((item) => (
                    <div key={item.label} className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">{item.label}</p>
                      <p className="text-base font-medium text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <Card title={isStudent ? 'Thông tin khóa học' : 'Thông tin công tác'}>
            <div className="grid items-start gap-6 xl:grid-cols-2">
              {profileColumns.map((column, columnIndex) => (
                <div
                  key={`profile-column-${columnIndex}`}
                  className={`space-y-3 ${columnIndex < profileColumns.length - 1 ? 'xl:border-r xl:border-slate-200 xl:pr-6' : ''}`}
                >
                  {column.map((item) => (
                    <div key={item.label} className="grid gap-1 md:grid-cols-[190px_1fr] md:items-start">
                      <p className="text-sm font-medium text-slate-600">{item.label}</p>
                      <p className="text-base font-medium text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Thông tin liên hệ">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Email chính"
                value={email}
                disabled={!isEditing}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                label="Email phụ"
                value={secondaryEmail}
                disabled={!isEditing}
                onChange={(event) => setSecondaryEmail(event.target.value)}
              />
              <Input
                label="Số điện thoại"
                value={phone}
                disabled={!isEditing}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Input
                label="Địa chỉ liên hệ"
                value={address}
                disabled={!isEditing}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card title="Trạng thái tài khoản">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-teal-600" />
                  Vai trò
                </span>
                <span className="text-right font-semibold text-slate-900">{roleLabel}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-cyan-600" />
                  Trạng thái
                </span>
                <StatusBadge kind="account" status={currentUser.status} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Đăng nhập cuối
                </span>
                <span className="text-right font-medium text-slate-900">{formatDateTime(currentUser.lastLoginAt)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  Tài khoản
                </span>
                <span className="text-right font-medium text-slate-900">{user.username}</span>
              </div>
            </div>
          </Card>

          <Card title={isStudent ? 'Tổng quan học tập' : 'Tổng quan công việc'}>
            <div className="grid gap-3">
              {overviewItems.map((item, index) => (
                <div
                  key={item.label}
                  className={`rounded-2xl px-4 py-3 ${index === 0 ? 'border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50' : 'border border-slate-200 bg-white'}`}
                >
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title={isStudent ? 'Dấu mốc hồ sơ' : 'Thông tin chuyên môn'}>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                  <IdCard className="h-4 w-4 text-teal-600" />
                  Căn cước công dân
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatProfileValue(user.citizenId)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                  <PhoneCall className="h-4 w-4 text-cyan-600" />
                  Liên hệ nhanh
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatProfileValue(user.phone)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                  <MapPinHouse className="h-4 w-4 text-slate-500" />
                  Địa chỉ hiện tại
                </p>
                <p className="mt-1 text-base font-semibold leading-7 text-slate-900">{formatProfileValue(user.address)}</p>
              </div>
            </div>
          </Card>

          <Card
            title={isStudent ? 'Mối quan tâm học tập' : 'Giới thiệu chuyên môn'}
            description={isStudent ? 'Sở thích và định hướng học tập của sinh viên.' : 'Mô tả ngắn gọn về vai trò chuyên môn hiện tại.'}
          >
            <div className="space-y-3">
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600">
                {user.bio ??
                  'Chưa có phần giới thiệu. Bạn có thể bổ sung thêm nội dung này trong các phiên bản tiếp theo của hệ thống.'}
              </p>

              {user.interests?.length ? (
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                      <School className="h-4 w-4 text-teal-600" />
                      Đơn vị
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{formatProfileValue(user.department)}</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Building2 className="h-4 w-4 text-cyan-600" />
                      Chuyên môn
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{formatProfileValue(user.specialization)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="hidden lg:grid-cols-[0.68fr_0.32fr]">
        <Card title="Hồ sơ người dùng" description="Thông tin cơ bản và thông tin liên hệ">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Mã người dùng" value={user.code} disabled />
            <Input label="Họ và tên" value={user.fullName} disabled />
            <Input
              label="Email"
              value={displayEmail}
              disabled={!isEditing}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              label="Số điện thoại"
              value={displayPhone}
              disabled={!isEditing}
              onChange={(event) => setPhone(event.target.value)}
            />
            <Input label="Cơ sở" value={user.campus} disabled />
            <Input label="Khoa / đơn vị" value={user.department} disabled />
          </div>
        </Card>

        <div className="grid gap-6">
          <Card title="Trạng thái tài khoản" description="Thông tin vai trò và phiên sử dụng">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Vai trò</span>
                <span className="text-right font-semibold text-slate-900">
                  {currentUser.roles.join(' • ')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Trạng thái</span>
                <StatusBadge kind="account" status={currentUser.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Đăng nhập cuối</span>
                <span className="text-right">{formatDateTime(currentUser.lastLoginAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function ChangePasswordPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const changePassword = useAuthStore((state) => state.changePassword)
  const pushToast = useUiStore((state) => state.pushToast)
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (nextPassword.length < 8) {
      pushToast({
        tone: 'warning',
        title: 'Mật khẩu mới quá ngắn',
        description: 'Vui lòng nhập tối thiểu 8 ký tự cho mật khẩu mới.',
      })
      return
    }

    if (nextPassword !== confirmPassword) {
      pushToast({
        tone: 'error',
        title: 'Xác nhận mật khẩu không khớp',
        description: 'Hãy nhập lại xác nhận mật khẩu mới.',
      })
      return
    }

    setLoading(true)
    const result = await changePassword(currentPassword, nextPassword)
    setLoading(false)

    if (result.success) {
      pushToast({
        tone: 'success',
        title: 'Đổi mật khẩu thành công',
        description: 'Vui lòng đăng nhập lại với mật khẩu mới.',
      })
      navigate('/login')
    } else {
      pushToast({
        tone: 'error',
        title: 'Không thể đổi mật khẩu',
        description: result.message,
      })
    }
  }

  if (!currentUser) {
    return (
      <EmptyState title="Chưa có phiên đăng nhập" description="Vui lòng đăng nhập lại để đổi mật khẩu." />
    )
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Đổi mật khẩu" />

      <div className="grid items-start gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <section className="surface-panel overflow-hidden border border-cyan-100">
          <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 px-6 py-5 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/90">
              <ShieldAlert className="h-4 w-4" />
              Bảo mật tài khoản PTIT HCM
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              Tạo mật khẩu mới an toàn và dễ nhớ với bạn.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/82">
              Sau khi cập nhật thành công, phiên hiện tại sẽ được làm mới để bạn đăng nhập lại bằng
              mật khẩu mới và đối chiếu thao tác trong nhật ký hệ thống.
            </p>
          </div>

          <form className="grid gap-4 px-6 py-5" onSubmit={handleSubmit}>
            <Input
              label="Mật khẩu hiện tại"
              hint="Mật khẩu mặc định hiện tại là ptithcm2026."
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <Input
              label="Mật khẩu mới"
              hint="Mật khẩu mới cần có tối thiểu 8 ký tự."
              type="password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
            />
            <Input
              label="Xác nhận mật khẩu mới"
              hint="Nhập lại chính xác mật khẩu mới để hoàn tất cập nhật."
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button className="rounded-2xl px-6 py-3" loading={loading} type="submit">
                Cập nhật mật khẩu
              </Button>
              <Button
                className="rounded-2xl px-6 py-3"
                variant="ghost"
                onClick={() => {
                  setCurrentPassword('')
                  setNextPassword('')
                  setConfirmPassword('')
                }}
                type="button"
              >
                Làm mới biểu mẫu
              </Button>
            </div>
          </form>
        </section>

        <div className="grid gap-6">
          <Card title="Tài khoản đang thao tác" description="Thông tin hiện tại của phiên đăng nhập">
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Tài khoản</p>
                <p className="mt-1 font-semibold text-slate-900">{currentUser.username}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Email</p>
                <p className="mt-1 break-all font-semibold text-slate-900">{currentUser.email}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Vai trò</p>
                <p className="mt-1 font-semibold text-slate-900">{currentUser.roles.join(' • ')}</p>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}

export function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="surface-panel max-w-xl px-8 py-10 text-center">
        <div className="mx-auto mb-5 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-rose-100 text-rose-700">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Trang 403 - Không có quyền
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Bạn không có quyền truy cập vào chức năng này. Hãy quay về bảng điều khiển hoặc đăng nhập
          bằng tài khoản có vai trò phù hợp để tiếp tục.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.history.back()} type="button" variant="ghost">
            Quay lại
          </Button>
          <Link to="/">
            <Button leftIcon={<Home className="h-4 w-4" />} type="button">
              Về bảng điều khiển
            </Button>
          </Link>
        </div>

        <div className="hidden">
        <div className="mx-auto mb-5 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-rose-100 text-rose-700">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Trang 403 - Không có quyền
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Bạn không có quyền truy cập vào chức năng này. Hãy quay về bảng điều khiển hoặc đăng nhập
          bằng tài khoản có vai trò phù hợp để tiếp tục.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.history.back()} type="button" variant="ghost">
            Quay lại
          </Button>
          <Link to="/">
            <Button leftIcon={<Home className="h-4 w-4" />} type="button">
              Về bảng điều khiển
            </Button>
          </Link>
        </div>
        </div>
      </div>
    </main>
  )
}

export function NotFoundPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(20,184,166,0.15),_transparent_28%),linear-gradient(180deg,_#f4feff_0%,_#f8fafc_54%,_#eefdfb_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="relative flex justify-center xl:justify-start">
          <div className="absolute left-10 top-20 hidden h-64 w-64 rounded-full bg-cyan-200/35 blur-3xl md:block" />
          <div className="absolute bottom-6 right-6 hidden h-56 w-56 rounded-full bg-teal-200/35 blur-3xl md:block" />

          <div className="relative mx-auto w-full max-w-[640px]">
            <div className="absolute left-0 top-16 hidden h-[74%] w-[68%] rounded-2xl bg-teal-950/88 shadow-[0_32px_60px_rgba(13,148,136,0.18)] md:block" />
            <div className="absolute left-8 top-6 hidden h-[78%] w-[72%] rounded-[34px] bg-gradient-to-br from-cyan-500 to-teal-500 shadow-[0_34px_70px_rgba(6,182,212,0.18)] md:block" />

            <div className="surface-panel relative min-h-[520px] rounded-[38px] border-[5px] border-cyan-400 bg-white/92 px-6 py-5 shadow-[0_32px_84px_rgba(8,145,178,0.16)] sm:px-8">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full bg-cyan-400" />
                <span className="h-4 w-4 rounded-full bg-cyan-200" />
                <span className="h-4 w-4 rounded-full bg-teal-300" />
              </div>
              <div className="mt-6 h-4 w-36 rounded-full bg-cyan-100" />

              <div className="mt-12">
                <p className="bg-gradient-to-r from-cyan-500 via-cyan-500 to-teal-500 bg-clip-text text-[112px] font-semibold leading-none tracking-[-0.08em] text-transparent sm:text-[156px]">
                  404
                </p>
                <p className="mt-5 text-2xl font-semibold tracking-[0.24em] text-teal-900">LỖI</p>
                <p className="mt-4 text-sm font-semibold tracking-[0.36em] text-cyan-600">
                  TRANG KHÔNG TỒN TẠI
                </p>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4">
                <div className="h-20 rounded-[26px] bg-cyan-100/80" />
                <div className="h-20 rounded-[26px] bg-teal-100/80" />
                <div className="h-20 rounded-[26px] bg-cyan-100/80" />
              </div>

              <div className="mx-auto mt-14 h-16 w-44 rounded-[24px] bg-gradient-to-r from-cyan-500 to-teal-500 shadow-[0_20px_50px_rgba(13,148,136,0.18)]" />
              <div className="mx-auto mt-10 h-32 w-72 rounded-[38px] border-[5px] border-teal-700/70" />
            </div>
          </div>
        </section>

        <section className="relative space-y-7">
          <div className="flex flex-wrap items-center gap-4">
            <img
              alt="Logo Học Viện Công Nghệ Bưu Chính Viễn Thông"
              className="h-[4.5rem] w-[4.5rem] rounded-[24px] border border-cyan-100 bg-white p-2 shadow-[0_16px_40px_rgba(8,145,178,0.12)]"
              src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">
                PTIT HCM
              </p>
              <p className="text-sm font-medium text-slate-600">
                Học Viện Công Nghệ Bưu Chính Viễn Thông cơ sở Hồ Chí Minh
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-full border border-cyan-200 bg-white/90 px-5 py-2 text-sm font-semibold tracking-[0.28em] text-cyan-700 shadow-[0_16px_38px_rgba(8,145,178,0.1)]">
            404 / ĐIỀU HƯỚNG LẠC NHỊP
          </div>

          <div className="space-y-3">
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-6xl">
              Xin lỗi, chúng tôi không tìm thấy trang bạn cần.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              Liên kết này có thể đã thay đổi, bị xóa hoặc không còn tồn tại trong cổng học vụ.
              Bạn có thể quay về trang chủ, trở lại bước trước đó hoặc tiếp tục khám phá các phân
              hệ đang sẵn sàng sử dụng.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/">
              <Button className="rounded-2xl px-7 py-4" leftIcon={<Home className="h-4 w-4" />} type="button">
                Về trang chủ
              </Button>
            </Link>
            <Button
              className="rounded-2xl px-7 py-4"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => window.history.back()}
              type="button"
              variant="ghost"
            >
              Quay lại trang trước
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Mã lỗi" description="Trang hiện tại không có dữ liệu để hiển thị.">
              <p className="text-6xl font-semibold tracking-[-0.06em] text-cyan-600">404</p>
            </Card>
            <Card
              title="Gợi ý tiếp theo"
              description="Kiểm tra lại đường dẫn hoặc chuyển sang các khu vực chính của hệ thống."
            >
              <Link
                className="interactive-press inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-teal-700"
                to="/"
              >
                Khám phá bảng điều khiển
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}











