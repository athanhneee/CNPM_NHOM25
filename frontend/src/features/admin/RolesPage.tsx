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

export function RolesPage() {
  const { currentUser, snapshot, pushToast, actor } = useAdminContext()
  const [selectedUserId, setSelectedUserId] = useState(snapshot.users[0]?.id ?? '')
  const [nextRole, setNextRole] = useState('STUDENT')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy quản trị viên" description="Vui lòng đăng nhập lại." />
  }

  const selectedUser = snapshot.users.find((user) => user.id === selectedUserId) ?? snapshot.users[0]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Quản trị - Phân quyền hệ thống" subtitle="Gán vai trò cho người dùng và đối chiếu ma trận quyền theo từng phân hệ." />
      <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <Card title="Gán vai trò cho người dùng" description="Chọn người dùng và cập nhật vai trò chính">
          <div className="grid gap-4">
            <Input label="Mã người dùng" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} list="role-user-options" />
            <Input label="Vai trò mới" value={nextRole} onChange={(event) => setNextRole(event.target.value)} list="role-options" />
            <Button
              onClick={async () => {
                if (!selectedUser) {
                  return
                }
                await adminService.updateRoles(selectedUser.id, [nextRole as 'STUDENT' | 'LECTURER' | 'ACADEMIC_OFFICE' | 'ADMIN'], actor)
                pushToast({ tone: 'success', title: 'Đã cập nhật vai trò', description: `Người dùng ${selectedUser.username} đã được gán vai trò ${nextRole}.` })
              }}
              type="button"
            >
              Gán quyền
            </Button>
            <datalist id="role-user-options">
              {snapshot.users.map((user) => (
                <option key={user.id} value={user.id} />
              ))}
            </datalist>
            <datalist id="role-options">
              <option value="STUDENT" />
              <option value="LECTURER" />
              <option value="ACADEMIC_OFFICE" />
              <option value="ADMIN" />
            </datalist>
          </div>
        </Card>
        <Card title="Ma trận quyền" description="Bảng đối chiếu quyền hiện tại theo từng vai trò">
          <PermissionMatrix />
        </Card>
      </div>
    </div>
  )
}

export default RolesPage;
