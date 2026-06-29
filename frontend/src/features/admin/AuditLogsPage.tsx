import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Table, type TableColumn } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatCard } from '@/components/shared/StatCard'
import { adminService } from '@/services/admin.api'
import { logService } from '@/services/log.api'
import { settingsService } from '@/services/settings.api'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { formatDateTime } from '@/lib/date'
import type { SystemSettings } from '@/types/settings'
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parseStudentImportFile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parseStudentText,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  STUDENT_IMPORT_ACCEPT,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  STUDENT_IMPORT_DEFAULT_PASSWORD,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type StudentImportPreview,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type StudentImportSummary,
} from '@/lib/student-import'

function useAdminContext() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const snapshot = useDataStore((state) => state)
  const pushToast = useUiStore((state) => state.pushToast)

  useEffect(() => {
    if (!currentUser?.roles.includes('ADMIN')) {
      return
    }

    void adminService.listUsers()
    void settingsService.loadSettings().catch(() => undefined)
  }, [currentUser?.id, currentUser?.roles])

  return {
    currentUser,
    snapshot,
    pushToast,
    actor: currentUser ? { actorId: currentUser.id, actorRole: currentUser.roles[0] ?? 'ADMIN' } : null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toValidIsoDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function settingsToForm(settings: SystemSettings) {
  return {
    simulationNow: settings.simulationNow,
    registrationStart: settings.registrationStart,
    registrationEnd: settings.registrationEnd,
    adjustmentStart: settings.adjustmentStart,
    adjustmentEnd: settings.adjustmentEnd,
    maxCreditsMain: settings.maxCreditsMain ?? 24,
    maxCreditsSummer: settings.maxCreditsSummer ?? 12,
    minCredits: settings.minCredits ?? 12,
    maintenanceMode: settings.maintenanceMode ? 'true' : 'false',
    allowWaitlist: settings.allowWaitlist ? 'true' : 'false',
    sessionTimeoutMinutes: String(settings.sessionTimeoutMinutes),
    warningBeforeLogoutSeconds: String(settings.warningBeforeLogoutSeconds),
    currentSemesterId: settings.currentSemesterId,
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SettingsForm = ReturnType<typeof settingsToForm>

export function AuditLogsPage() {
  const { currentUser, snapshot } = useAdminContext()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentUserId = currentUser?.id

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    void logService
      .listLogs()
      .then(() => {
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải nhật ký từ hệ thống.')
        setLoading(false)
      })
  }, [currentUserId])

  const rows = useMemo(
    () =>
      snapshot.logs.filter((log) =>
        !query ||
        log.action.toLowerCase().includes(query.toLowerCase()) ||
        log.actorId.toLowerCase().includes(query.toLowerCase()) ||
        log.message.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, snapshot.logs],
  )

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy quản trị viên" description="Vui lòng đăng nhập lại." />
  }

  if (loading) {
    return <EmptyState title="Đang tải nhật ký..." description="Vui lòng chờ trong giây lát." />
  }

  if (error) {
    return <EmptyState title="Không thể tải nhật ký hệ thống" description={error} />
  }

  const actionLabels: Record<string, string> = {
    'LOGIN_SUCCESS': 'Đăng nhập',
    'LOGOUT': 'Đăng xuất',
    'LOGIN_FAILURE': 'Đăng nhập thất bại',
    'ENROLLMENT_REGISTER': 'Đăng ký học phần',
    'ENROLLMENT_CANCEL': 'Hủy đăng ký',
    'ENROLLMENT_WAITLIST': 'Vào danh sách chờ',
    'WAITLIST_PROMOTED': 'Duyệt danh sách chờ',
    'WAITLIST_OVERRIDE': 'Can thiệp danh sách chờ',
    'WISH_CREATED': 'Tạo nguyện vọng',
    'WISH_REVIEWED': 'Duyệt nguyện vọng',
    'WISH_REJECTED': 'Từ chối nguyện vọng',
    'WISH_APPROVED': 'Chấp nhận nguyện vọng',
    'SETTINGS_UPDATE': 'Cập nhật hệ thống',
    'USER_IMPORT': 'Nhập danh sách người dùng',
    'USER_CREATED': 'Tạo tài khoản',
    'USER_UPDATED': 'Cập nhật tài khoản',
    'ROLE_ASSIGNED': 'Phân quyền',
    'ROLE_REVOKED': 'Thu hồi quyền',
    'PASSWORD_CHANGED': 'Đổi mật khẩu',
    'PASSWORD_RESET': 'Đặt lại mật khẩu',
    'COURSE_CREATED': 'Tạo học phần',
    'COURSE_UPDATED': 'Cập nhật học phần',
    'SECTION_CREATED': 'Tạo lớp học phần',
    'SECTION_UPDATED': 'Cập nhật lớp học phần',
    'SECTION_DELETED': 'Xóa lớp học phần',
  }

  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'timestamp', header: 'Thời gian', render: (row) => formatDateTime(row.timestamp) },
    { key: 'actorId', header: 'Người thực hiện', render: (row) => row.actorId },
    { key: 'role', header: 'Vai trò', render: (row) => row.actorRole },
    { key: 'action', header: 'Chức năng', render: (row) => actionLabels[row.action] || row.action },
    { key: 'message', header: 'Nội dung', render: (row) => row.message },
    { key: 'result', header: 'Kết quả', render: (row) => <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{row.result}</span> },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Quản trị - Nhật ký hệ thống" subtitle="Theo dõi nhật ký cho các thao tác đăng nhập, đăng ký, danh sách chờ, can thiệp đặc biệt, cập nhật tham số và phân quyền." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tổng log" value={String(snapshot.logs.length)} hint="Dữ liệu từ backend" />
        <StatCard label="Đăng ký" value={String(snapshot.logs.filter((log) => log.action.includes('REGISTER')).length)} hint="Bao gồm danh sách chờ và can thiệp" />
        <StatCard label="Phân quyền" value={String(snapshot.logs.filter((log) => log.action.includes('ROLE') || log.action.includes('USER')).length)} hint="Tác động tới người dùng và vai trò" />
        <StatCard label="Tham số" value={String(snapshot.logs.filter((log) => log.action.includes('SETTINGS')).length)} hint="Thay đổi cấu hình hệ thống" />
      </div>
      <FilterBar
        actions={
          <ExportButtons
            fileName="audit-logs.csv"
            rows={rows.map((row) => ({
              thoi_gian: row.timestamp,
              actor_id: row.actorId,
              vai_tro: row.actorRole,
              chuc_nang: row.action,
              noi_dung: row.message,
              ket_qua: row.result,
            }))}
          />
        }
      >
        <SearchInput label="Lọc log" value={query} onChange={(event) => setQuery(event.target.value)} />
      </FilterBar>
      <Table columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
    </div>
  )
}

export default AuditLogsPage;
