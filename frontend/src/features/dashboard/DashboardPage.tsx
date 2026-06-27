import { useMemo, useState, useEffect } from 'react'
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/shared/StatCard'
import { SystemWindowCard } from '@/components/shared/SystemWindowCard'
import { formatDateTime } from '@/lib/date'
import {
  getRelevantLogs,
  getRoleDashboardMetrics,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

function LiveTimeMarker() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {formatLongDate(time.toISOString())} {time.toLocaleTimeString('vi-VN')}
    </>
  )
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
          className="interactive-press rounded-3xl border border-[var(--color-hairline)] bg-white/90 px-4 py-3.5 shadow-[0_14px_32px_rgba(15,23,42,0.05)] transition hover:border-cyan-200 hover:bg-cyan-50/80"
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

function StudentInstructorCard({ instructors }: { instructors: User[] }) {
  return (
    <Card
      className="flex flex-col h-full"
      contentClassName="flex-1 flex flex-col justify-center"
      title="Giảng viên phụ trách"
      description="Danh bạ nhanh các giảng viên đang phụ trách lớp học phần của bạn."
    >
      {instructors.length ? (
        <div className="grid gap-3 flex-1 justify-start">
          {instructors.map((lecturer) => (
            <div
              className="flex items-start gap-4 rounded-3xl border border-[var(--color-hairline)] bg-white px-5 py-3.5"
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
          className="bg-transparent border-none shadow-none py-6"
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
  description = 'Các hoạt động mới nhất liên quan đến vai trò hiện tại.',
}: {
  logs: ReturnType<typeof getRelevantLogs>
  title?: string
  description?: string
}) {
  return (
    <Card
      className="flex flex-col h-full"
      contentClassName="flex-1 flex flex-col justify-center"
      title={title}
      description={description}
    >
      {logs.length ? (
        <div className="grid gap-3 flex-1 justify-start">
          {logs.map((log) => (
            <div
              className="rounded-3xl border border-[var(--color-hairline)] bg-white px-5 py-3.5"
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
          className="bg-transparent border-none shadow-none py-6"
          title="Chưa có thông tin nổi bật"
          description="Nhật ký liên quan sẽ xuất hiện tại đây."
        />
      )}
    </Card>
  )
}

function StudentProfileCard({ user }: { user: User }) {
  const hasInterests = user.interests && user.interests.length > 0

  return (
    <Card
      className="flex flex-col h-full"
      contentClassName="flex-1 flex flex-col justify-between"
      title="Hồ sơ học tập"
      description="Thông tin nhanh để bạn theo dõi học kỳ và định hướng học tập."
    >
      <div className="flex flex-col gap-3 flex-1 h-full">
        <div className="flex flex-col gap-3">
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
        </div>

        {hasInterests && (
          <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 mt-auto">
            <p className="text-sm font-medium text-slate-700">Mối quan tâm</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {user.interests?.map((interest) => (
                <span
                  className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-cyan-700 shadow-sm"
                  key={interest}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
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
            className="flex items-start gap-4 rounded-3xl border border-[var(--color-hairline)] bg-white px-5 py-3.5"
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
            className="rounded-3xl border border-[var(--color-hairline)] bg-white px-5 py-3.5"
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
                  {formatLongDate(new Date().toISOString())}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white lg:text-3xl">
                    Chào mừng quay lại, {currentUser.fullName}!
                  </h2>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-white/82">
                    Hôm nay là thời điểm phù hợp để theo dõi điểm danh, hiệu suất học tập và trạng thái đăng ký học phần trong học kỳ hiện tại.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
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
                <div className="rounded-3xl bg-white/14 px-4 py-3 backdrop-blur">
                  <p className="text-sm text-white/72">Mã sinh viên</p>
                  <p className="mt-1 text-xl font-semibold">{currentUser.code}</p>
                </div>
                <div className="rounded-3xl bg-white/14 px-4 py-3 backdrop-blur">
                  <p className="text-sm text-white/72">Chuyên ngành</p>
                  <p className="mt-1 text-base font-semibold">{currentUser.program ?? 'CNTT'}</p>
                </div>
                <div className="rounded-3xl bg-white/14 px-4 py-3 backdrop-blur">
                  <p className="text-sm text-white/72">Email học vụ</p>
                  <p className="mt-1 break-all text-sm font-semibold">{currentUser.email}</p>
                </div>
                <div className="rounded-3xl bg-white/14 px-4 py-3 backdrop-blur">
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

          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <StudentAttendanceCard user={currentUser} />
            <StudentPerformanceCard user={currentUser} />
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <StudentProfileCard user={currentUser} />
            <StudentInstructorCard instructors={studentInstructors} />

            <Card
              className="flex flex-col h-full"
              contentClassName="flex-1 flex flex-col justify-between"
              title="Lối tắt dành cho sinh viên"
              description="Đi thẳng tới các màn hình quan trọng nhất trong quá trình đăng ký tín chỉ."
            >
              <DashboardQuickLinks links={quickLinksByRole.STUDENT} />
            </Card>

            <RecentLogsCard
              logs={logs}
              title="Nhật ký học vụ"
              description="Các thao tác đăng ký, chờ xếp lớp và cập nhật gần đây của bạn."
            />

            <div className="lg:col-span-2">
              <SystemWindowCard settings={snapshot.settings} />
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
                <div className="rounded-3xl bg-white/14 px-4 py-3">
                  <p className="text-sm text-white/72">Giảng viên</p>
                  <p className="mt-1 font-semibold">{currentUser.fullName}</p>
                </div>
                <div className="rounded-3xl bg-white/14 px-4 py-3">
                  <p className="text-sm text-white/72">Học vị</p>
                  <p className="mt-1 font-semibold">{currentUser.title ?? 'Giảng viên'}</p>
                </div>
                <div className="rounded-3xl bg-white/14 px-4 py-3">
                  <p className="text-sm text-white/72">Đơn vị</p>
                  <p className="mt-1 font-semibold">{currentUser.department}</p>
                </div>
                <div className="rounded-3xl bg-white/14 px-4 py-3">
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

          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <Card
              className="flex flex-col h-full"
              contentClassName="flex-1 flex flex-col justify-between"
              title="Lối tắt dành cho giảng viên"
              description="Đi tới lớp được phân công, lịch dạy và danh sách sinh viên."
            >
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
              <div className="rounded-3xl bg-white/14 px-5 py-5 backdrop-blur">
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

          <div className="grid items-start gap-6 lg:grid-cols-2">
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
                description="Xử lý waitlist, mở lớp, phân công giảng viên và cập nhật lịch học."
              />
            </div>
          </div>
        </>
      ) : null}

      {primaryRole === 'ADMIN' ? (
        <>
          <section className="surface-panel overflow-hidden border border-indigo-100 bg-gradient-to-br from-indigo-50 to-sky-50 px-6 py-5 text-slate-900 shadow-[0_28px_70px_rgba(15,23,42,0.05)]">
            <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100/50 px-4 py-2 text-sm font-medium text-indigo-900">
                  <ShieldAlert className="h-4 w-4" />
                  Trung tâm điều phối hệ thống
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.05em] lg:text-3xl">
                  Quản trị toàn bộ nền tảng học vụ PTIT HCM từ một bảng điều khiển tập trung.
                </h2>
                <p className="max-w-3xl text-base leading-8 text-slate-600">
                  Theo dõi người dùng, phân quyền, cửa sổ đăng ký, trạng thái bảo trì.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-white/60 px-4 py-3">
                  <p className="text-sm text-slate-500">Quản trị viên hiện tại</p>
                  <p className="mt-1 font-semibold">{currentUser.fullName}</p>
                </div>
                <div className="rounded-3xl bg-white/60 px-4 py-3">
                  <p className="text-sm text-slate-500">Email quản trị</p>
                  <p className="mt-1 break-all text-sm font-semibold">{currentUser.email}</p>
                </div>
                <div className="rounded-3xl bg-white/60 px-4 py-3">
                  <p className="text-sm text-slate-500">Trạng thái hệ thống</p>
                  <p className="mt-1 font-semibold">
                    {snapshot.settings.maintenanceMode ? 'Đang bảo trì' : 'Đang hoạt động'}
                  </p>
                </div>
                <div className="rounded-3xl bg-white/60 px-4 py-3">
                  <p className="text-sm text-slate-500">Mốc thời gian</p>
                  <p className="mt-1 font-semibold"><LiveTimeMarker /></p>
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

          <div className="grid items-start gap-6 lg:grid-cols-2">
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
                description="Các thông tin gần nhất liên quan đến tài khoản, phân quyền, cấu hình và audit."
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default DashboardPage;
