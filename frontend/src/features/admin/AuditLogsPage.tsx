import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { FileSpreadsheet, KeyRound, Upload, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { PermissionMatrix } from '@/components/shared/PermissionMatrix'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminService } from '@/services/admin.api'
import { logService } from '@/services/log.api'
import { settingsService } from '@/services/settings.api'
import { getMajorMappingFromStudentCode } from '@/mocks/seed/ptit-helpers'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { SystemWindowCard } from '@/components/shared/SystemWindowCard'
import { formatDateTime } from '@/lib/date'
import { ApiError } from '@/lib/api-client'
import type { SystemSettings } from '@/types/settings'
import {
  parseStudentImportFile,
  parseStudentText,
  STUDENT_IMPORT_ACCEPT,
  STUDENT_IMPORT_DEFAULT_PASSWORD,
  type StudentImportPreview,
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

function toValidIsoDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function settingsToForm(settings: SystemSettings) {
  return {
    simulationNow: settings.simulationNow,
    registrationStart: settings.registrationStart,
    registrationEnd: settings.registrationEnd,
    adjustmentStart: settings.adjustmentStart,
    adjustmentEnd: settings.adjustmentEnd,
    withdrawalDeadline: settings.withdrawalDeadline,
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

  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'timestamp', header: 'Thời gian', render: (row) => formatDateTime(row.timestamp) },
    { key: 'actorId', header: 'Người thực hiện', render: (row) => row.actorId },
    { key: 'role', header: 'Vai trò', render: (row) => row.actorRole },
    { key: 'action', header: 'Chức năng', render: (row) => row.action },
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
      <Table columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  )
}

export default AuditLogsPage;
