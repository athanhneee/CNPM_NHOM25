import {
  ArrowRight,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BadgeCheck,
  BookOpenText,
  Building2,
  CalendarDays,
  ChartColumnBig,
  Clock3,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Eye,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  EyeOff,
  GraduationCap,
  Home,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  IdCard,
  LockKeyhole,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Mail,
  MapPinHouse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PhoneCall,
  School,
  ShieldAlert,
  CircleHelp,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/lib/date'
import {
  getRelevantLogs,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRoleDashboardMetrics,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ROLE_LABELS,
  getStudentAttendanceBreakdown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStudentInstructorContacts,
  getStudentPerformanceSeries,
} from '@/lib/selectors'
import type { UserRole } from '@/types/auth'
import type { User } from '@/types/user'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getPrimaryRole(user: User | null): UserRole {
  return (user?.roles[0] ?? 'STUDENT') as UserRole
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatProfileValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return 'Chưa cập nhật'
  }

  return String(value)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DashboardQuickLinks({ links }: { links: QuickLink[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {links.map((link) => (
        <Link
          key={`${link.to}-${link.label}`}
          className="interactive-press rounded-2xl border border-[var(--color-hairline)] bg-white/90 px-4 py-3.5 shadow-[0_14px_32px_rgba(15,23,42,0.05)] transition hover:border-cyan-200 hover:bg-cyan-50/80"
          to={link.to}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{link.label}</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">{link.description}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
          </div>
        </Link>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                <p className="mt-0.5 text-sm text-slate-500">Hiện diện</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-3xl bg-slate-50 px-4 py-3">
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

          <div className="rounded-3xl bg-slate-50 px-4 py-3">
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

          <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm leading-7 text-slate-600">
            Hệ thống tổng hợp điểm danh từ các lớp đang học trong học kỳ hiện tại để bạn dễ theo
            dõi tiến độ và chủ động điều chỉnh lịch học.
          </div>
        </div>
      </div>
    </Card>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
              <span className="text-sm font-semibold text-slate-700">
                {point.value}%
              </span>
              <div className="relative flex w-12 flex-1 flex-col justify-end rounded-full bg-slate-100 p-1">
                <div
                  className={`w-full rounded-full ${index % 2 === 0
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
          <div className="rounded-3xl bg-slate-50 px-4 py-3.5">
            <p className="text-sm font-medium text-slate-500">GPA hiện tại</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {(user.gpa ?? 3.1).toFixed(2)}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3.5">
            <p className="text-sm font-medium text-slate-500">Tín chỉ đã tích lũy</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {user.completedCredits ?? 0}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
              className="flex items-start gap-4 rounded-2xl border border-[var(--color-hairline)] bg-white px-5 py-3.5"
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
              className="rounded-2xl border border-[var(--color-hairline)] bg-white px-5 py-3.5"
              key={log.id}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                <span className="text-sm text-slate-500">{formatDateTime(log.timestamp)}</span>
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StudentProfileCard({ user }: { user: User }) {
  return (
    <Card
      title="Hồ sơ học tập"
      description="Thông tin nhanh để bạn theo dõi học kỳ và định hướng học tập."
    >
      <div className="grid gap-3">
        <div className="rounded-3xl bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-500">Sinh viên</p>
          <p className="mt-1 text-xl font-semibold text-slate-950">{user.fullName}</p>
          <p className="mt-1 text-sm text-slate-500">{user.code}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Chuyên ngành</p>
            <p className="mt-1 font-semibold text-slate-900">{user.program ?? user.department}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Khóa học</p>
            <p className="mt-1 font-semibold text-slate-900">{user.cohort ?? 'K23'}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">Mối quan tâm</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(user.interests ?? []).map((interest) => (
              <span
                className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-cyan-700 shadow-sm"
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AdminTeamCard({ team }: { team: User[] }) {
  return (
    <Card
      title="Nhóm quản trị PTIT HCM"
      description="Các quản trị viên chịu trách nhiệm vận hành, phân quyền và bảo trì hệ thống."
    >
      <div className="grid gap-3">
        {team.map((member) => (
          <div
            className="flex items-start gap-4 rounded-2xl border border-[var(--color-hairline)] bg-white px-5 py-3.5"
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AcademicLeadershipCard({ leaders }: { leaders: User[] }) {
  return (
    <Card
      title="Ban điều phối đào tạo"
      description="Thông tin lãnh đạo và đầu mối xử lý học vụ, lịch học, waitlist và override."
    >
      <div className="grid gap-3">
        {leaders.map((leader) => (
          <div
            className="rounded-2xl border border-[var(--color-hairline)] bg-white px-5 py-3.5"
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

export function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="surface-panel max-w-xl px-8 py-10 text-center">
        <div className="mx-auto mb-5 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-amber-100 text-amber-700">
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
          <div className="mx-auto mb-5 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-amber-100 text-amber-700">
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

export default ForbiddenPage;
