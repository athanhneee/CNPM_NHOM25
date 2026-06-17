import { useEffect, useMemo, useState } from 'react'
import {
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
          <div className="rounded-2xl bg-slate-50 px-4 py-3.5">
            <p className="text-sm font-medium text-slate-500">GPA hiện tại</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {(user.gpa ?? 3.1).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3.5">
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

export function NotFoundPage() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-cyan-50 via-white to-cyan-50 font-sans text-slate-900">
      <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="absolute -right-20 bottom-12 h-64 w-64 rounded-full bg-cyan-200/25 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-14 px-6 py-10 lg:flex-row lg:gap-10 lg:px-10 xl:px-12">
        <div className="relative flex w-full max-w-[720px] items-end justify-center lg:flex-1" aria-hidden="true">
          <div className="absolute bottom-3 h-40 w-[88%] rounded-full bg-cyan-200/55 blur-2xl" />
          <div className="absolute left-[11%] top-6 h-10 w-20 rounded-full bg-cyan-200/80" />
          <div className="absolute left-[24%] top-16 h-8 w-14 rounded-full bg-cyan-200/70" />
          <div className="absolute right-[10%] top-[12%] flex h-24 w-24 rotate-12 items-center justify-center rounded-3xl border-2 border-cyan-300/70 bg-white/80 shadow-[0_18px_50px_rgba(13,148,136,0.16)] backdrop-blur">
            <span className="text-2xl font-black uppercase tracking-[0.32em] text-cyan-500">404</span>
          </div>

          <div className="relative w-full max-w-[620px] pb-24">
            <div className="absolute left-16 top-6 h-[380px] w-[76%] rounded-3xl bg-gradient-to-br from-cyan-400 to-cyan-500 shadow-[0_28px_70px_rgba(8,145,178,0.28)]" />
            <div className="absolute left-8 top-10 h-[380px] w-[76%] rounded-3xl bg-cyan-950/90 shadow-[0_20px_40px_rgba(15,118,110,0.24)]" />

            <div className="relative ml-auto w-[84%] rounded-3xl border-[10px] border-cyan-300 bg-white shadow-[0_35px_80px_rgba(8,145,178,0.22)]">
              <div className="rounded-3xl bg-gradient-to-b from-cyan-50 via-white to-cyan-50 p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-cyan-300" />
                  <span className="h-3 w-3 rounded-full bg-cyan-200" />
                  <span className="h-3 w-3 rounded-full bg-cyan-300" />
                </div>

                <div className="mt-5 h-3 w-24 rounded-full bg-cyan-100" />

                <div className="mt-8 flex items-end gap-1 sm:gap-2">
                  <span className="text-[5.5rem] font-black leading-none tracking-[-0.08em] text-cyan-400 sm:text-[7.5rem]">4</span>
                  <span className="text-[5.5rem] font-black leading-none tracking-[-0.08em] text-cyan-500 sm:text-[7.5rem]">0</span>
                  <span className="text-[5.5rem] font-black leading-none tracking-[-0.08em] text-cyan-500 sm:text-[7.5rem]">4</span>
                </div>

                <p className="mt-3 text-xl font-black uppercase tracking-[0.32em] text-cyan-800 sm:text-2xl">Error</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.32em] text-cyan-500 sm:text-base">
                  Page not found
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="h-14 rounded-3xl bg-cyan-100/80" />
                  <div className="h-14 rounded-3xl bg-cyan-100/80" />
                  <div className="h-14 rounded-3xl bg-cyan-100/80" />
                </div>
              </div>
            </div>

            <div className="relative mx-auto mt-[-4px] h-10 w-28 rounded-b-2xl bg-gradient-to-b from-cyan-400 to-cyan-500 shadow-[0_12px_24px_rgba(13,148,136,0.25)]" />
            <div className="mx-auto h-7 w-52 rounded-full bg-cyan-500/90 shadow-[0_16px_32px_rgba(13,148,136,0.18)]" />

            <div className="absolute bottom-2 left-[18%] h-24 w-72 rounded-full border-[4px] border-cyan-900/70" />
          </div>
        </div>

        <div className="w-full max-w-[560px] flex-1 text-center lg:text-left">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <img
              alt="Logo PTIT"
              className="h-14 w-14 rounded-2xl border border-cyan-100 bg-white p-2 shadow-sm"
              src="/Logo-Hoc-Vien-Cong-Nghe-Buu-Chinh-Vien-Thong-PTIT.webp"
            />
            <div className="text-left space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">PTIT HCM</p>
              <p className="text-[13px] font-medium text-slate-600">Học Viện Công Nghệ Bưu Chính Viễn Thông</p>
            </div>
          </div>

          <span className="inline-flex rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-600 shadow-sm">
            404 / Điều hướng lạc nhịp
          </span>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] text-cyan-950 sm:text-5xl xl:text-[4.2rem]">
            Xin lỗi, chúng tôi không tìm thấy trang bạn cần.
          </h1>

          <p className="mt-5 text-base leading-8 text-cyan-600/85 sm:text-lg">
            Liên kết này có thể đã thay đổi, bị xóa hoặc không còn tồn tại trong cổng học vụ. Bạn có thể quay về trang chủ hoặc tiếp tục khám phá các phân hệ đang mở để không bị ngắt mạch trải nghiệm.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-cyan-500 px-7 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(6,182,212,0.28)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Về trang chủ
            </Link>

            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white/85 px-7 py-4 text-base font-semibold text-cyan-600 shadow-[0_14px_32px_rgba(15,118,110,0.12)] transition-colors duration-200 hover:border-cyan-300 hover:bg-white"
            >
              Quay lại trang trước
            </button>
          </div>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-3xl border border-cyan-200/80 bg-white/75 p-5 shadow-[0_18px_40px_rgba(8,145,178,0.12)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-600">Mã lỗi</p>
              <p className="mt-3 text-4xl font-black text-cyan-500">404</p>
              <p className="mt-2 text-sm leading-6 text-cyan-600/80">Trang hiện tại không có dữ liệu để hiển thị.</p>
            </div>

            <div className="rounded-3xl border border-cyan-200/80 bg-white/75 p-5 shadow-[0_18px_40px_rgba(15,118,110,0.12)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-600">Gợi ý tiếp theo</p>
              <p className="mt-3 text-[15px] font-semibold leading-6 text-cyan-900">
                Kiểm tra lại đường dẫn hoặc chuyển sang bảng điều khiển.
              </p>
              <Link
                to="/"
                className="mt-4 inline-flex text-sm font-semibold text-cyan-500 transition-colors hover:text-cyan-600"
              >
                Khám phá bảng điều khiển
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage;
