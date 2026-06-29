import { useEffect, useState } from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { PermissionMatrix } from '@/components/shared/PermissionMatrix'
import { adminService } from '@/services/admin.api'
import { settingsService } from '@/services/settings.api'
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
