import { useState, useEffect } from 'react'
import {
  ArrowRight,
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
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime } from '@/lib/date'
import { authApiService } from '@/services/auth.api'
import {
  getRelevantLogs,
  getRoleDashboardMetrics,
  ROLE_LABELS,
  getStudentAttendanceBreakdown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStudentInstructorContacts,
  getStudentPerformanceSeries,
} from '@/lib/selectors'
import type { UserRole } from '@/types/auth'
import type { User, AcademicRecords } from '@/types/user'

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

function AcademicRecordsView({ records }: { records: AcademicRecords }) {
  const [activeTab, setActiveTab] = useState<'completed' | 'ongoing' | 'pending'>('completed')

  return (
    <Card title="Kết quả học tập & Chương trình đào tạo">
      <div className="flex gap-4 border-b border-slate-200 mb-4">
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2 font-medium ${activeTab === 'completed' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Đã học ({records.completedCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`pb-2 font-medium ${activeTab === 'ongoing' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Đang học ({records.ongoingCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 font-medium ${activeTab === 'pending' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Chưa học ({records.pendingCourses.length})
        </button>
      </div>

      <div className="overflow-x-auto">
        {activeTab === 'completed' && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 font-medium">Mã HP</th>
                <th className="pb-2 font-medium">Tên học phần</th>
                <th className="pb-2 font-medium">Tín chỉ</th>
                <th className="pb-2 font-medium">Điểm số</th>
                <th className="pb-2 font-medium">Điểm chữ</th>
                <th className="pb-2 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {records.completedCourses.length > 0 ? (
                records.completedCourses.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">{c.courseCode}</td>
                    <td className="py-2">{c.courseName}</td>
                    <td className="py-2">{c.credits}</td>
                    <td className="py-2">{c.numericGrade ?? '-'}</td>
                    <td className="py-2 font-semibold text-slate-700">{c.letterGrade ?? '-'}</td>
                    <td className="py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.passed ? 'Đạt' : 'Chưa đạt'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'ongoing' && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 font-medium">Mã lớp HP</th>
                <th className="pb-2 font-medium">Mã HP</th>
                <th className="pb-2 font-medium">Tên học phần</th>
                <th className="pb-2 font-medium">Tín chỉ</th>
                <th className="pb-2 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {records.ongoingCourses.length > 0 ? (
                records.ongoingCourses.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">{c.sectionCode}</td>
                    <td className="py-2">{c.courseCode}</td>
                    <td className="py-2">{c.courseName}</td>
                    <td className="py-2">{c.credits}</td>
                    <td className="py-2">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'pending' && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 font-medium">Mã HP</th>
                <th className="pb-2 font-medium">Tên học phần</th>
                <th className="pb-2 font-medium">Tín chỉ</th>
              </tr>
            </thead>
            <tbody>
              {records.pendingCourses.length > 0 ? (
                records.pendingCourses.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">{c.courseCode}</td>
                    <td className="py-2">{c.courseName}</td>
                    <td className="py-2">{c.credits}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-500">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}

export function ProfilePage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const snapshot = useDataStore((state) => state)
  const pushToast = useUiStore((state) => state.pushToast)
  const [isEditing, setIsEditing] = useState(false)
  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [phone, setPhone] = useState(currentUser?.phone ?? '')
  const [secondaryEmail, setSecondaryEmail] = useState(currentUser?.secondaryEmail ?? '')
  const [address, setAddress] = useState(currentUser?.address ?? '')
  const [academicRecords, setAcademicRecords] = useState<AcademicRecords | null>(null)

  const isStudent = getPrimaryRole(currentUser) === 'STUDENT'

  useEffect(() => {
    if (isStudent && currentUser) {
      authApiService
        .getAcademicRecords()
        .then((res) => {
          setAcademicRecords(res)
        })
        .catch(console.error)
    }
  }, [isStudent, currentUser])

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy hồ sơ" description="Vui lòng đăng nhập lại để tiếp tục." />
  }

  const user = currentUser
  const primaryRole = getPrimaryRole(user)
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

  const overviewItems = (() => {
    if (isStudent) {
      return [
        { label: 'GPA tích lũy', value: user.gpa ? user.gpa.toFixed(2) : 'Chưa cập nhật' },
        {
          label: 'Điểm danh',
          value: user.attendanceRate !== undefined ? `${Math.round(user.attendanceRate * 100)}%` : 'Chưa cập nhật',
        },
        { label: 'Tín chỉ hoàn thành', value: formatProfileValue(user.completedCredits) },
        { label: 'Năm học hiện tại', value: formatProfileValue(user.yearLevel) },
      ]
    }

    const metrics = getRoleDashboardMetrics(snapshot, user)
    return metrics.map((m) => ({
      label: m.label,
      value: m.value,
    }))
  })()

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
              <Button className="rounded-3xl px-5" onClick={handleSave} type="button">
                Lưu
              </Button>
              <Button
                className="rounded-3xl px-5"
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
            <Button className="rounded-3xl px-5" onClick={handleStartEditing} type="button">
              Chỉnh sửa
            </Button>
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[0.65fr_0.35fr] xl:grid-cols-[0.7fr_0.3fr]">
        <div className="grid gap-6">
          {academicRecords?.warnings && academicRecords.warnings.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-3">
                <ShieldAlert className="h-5 w-5" />
                <span>Cảnh báo học vụ</span>
              </div>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1.5 ml-1">
                {academicRecords.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <section className="surface-panel overflow-hidden border border-teal-100">
            <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 px-6 py-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/90">
                <BadgeCheck className="h-4 w-4" />
                Hồ sơ định danh PTIT HCM
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Hồ sơ cá nhân và học vụ</h2>
            </div>

            <div className="grid gap-6 px-6 py-5 md:grid-cols-[170px_1fr] md:items-center">
              <div className="w-full max-w-[170px] mx-auto rounded-3xl bg-gradient-to-br from-teal-50 via-cyan-50 to-white p-4">
                <div className="grid h-36 w-36 mx-auto place-items-center rounded-full border border-white/80 bg-white text-3xl font-semibold tracking-[-0.06em] text-teal-700 shadow-[0_24px_60px_-36px_rgba(8,145,178,0.45)]">
                  {getInitials(user.fullName)}
                </div>
                <div className="mt-4 space-y-2 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">Mã nhận diện</p>
                  <p className="text-sm font-semibold text-slate-900">{user.code}</p>
                </div>
              </div>

              <div className="grid gap-5 text-center md:text-left">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">{roleLabel}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{user.fullName}</h3>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
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
            <div className="grid items-start gap-6 md:grid-cols-3">
              {personalColumns.map((column, columnIndex) => (
                <div
                  key={`personal-column-${columnIndex}`}
                  className={`space-y-3 ${columnIndex < personalColumns.length - 1 ? 'md:border-r md:border-slate-200 md:pr-6' : ''}`}
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
            <div className="grid items-start gap-6 md:grid-cols-2">
              {profileColumns.map((column, columnIndex) => (
                <div
                  key={`profile-column-${columnIndex}`}
                  className={`space-y-3 ${columnIndex < profileColumns.length - 1 ? 'md:border-r md:border-slate-200 md:pr-6' : ''}`}
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

          {isStudent && academicRecords && (
            <AcademicRecordsView records={academicRecords} />
          )}
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
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-2">
              {overviewItems.map((item, index) => (
                <div
                  key={item.label}
                  className={`rounded-3xl px-4 py-3 ${index === 0 ? 'border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50' : 'border border-slate-200 bg-white'}`}
                >
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title={isStudent ? 'Mối quan tâm học tập' : 'Giới thiệu chuyên môn'}
            description={isStudent ? 'Sở thích và định hướng học tập của sinh viên.' : 'Mô tả ngắn gọn về vai trò chuyên môn hiện tại.'}
          >
            <div className="space-y-3">
              <p className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600">
                {user.bio ??
                  'Chưa có phần giới thiệu. Bạn có thể bổ sung thêm nội dung này trong các phiên bản tiếp theo của hệ thống.'}
              </p>

              {user.interests?.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {user.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : null}
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

export default ProfilePage;
