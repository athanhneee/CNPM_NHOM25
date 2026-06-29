import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'

import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { adminService } from '@/services/admin.api'
import { settingsService } from '@/services/settings.api'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { SystemWindowCard } from '@/components/shared/SystemWindowCard'
import { ApiError } from '@/lib/api-client'
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

function toValidIsoDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toDatetimeLocalString(isoString: string) {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return isoString
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function settingsToForm(settings: SystemSettings) {
  return {
    simulationNow: toDatetimeLocalString(settings.simulationNow),
    registrationStart: toDatetimeLocalString(settings.registrationStart),
    registrationEnd: toDatetimeLocalString(settings.registrationEnd),
    adjustmentStart: toDatetimeLocalString(settings.adjustmentStart),
    adjustmentEnd: toDatetimeLocalString(settings.adjustmentEnd),
    withdrawalDeadline: toDatetimeLocalString(settings.withdrawalDeadline),
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

export function SettingsPage() {
  const { currentUser, snapshot, pushToast, actor } = useAdminContext()
  const backendForm = useMemo(() => settingsToForm(snapshot.settings), [snapshot.settings])
  const [draftForm, setDraftForm] = useState<SettingsForm | null>(null)
  const form = draftForm ?? backendForm
  const updateForm = (updater: (value: SettingsForm) => SettingsForm) => {
    setDraftForm((value) => updater(value ?? backendForm))
  }
  const [importText, setImportText] = useState('')
  const [snapshotAction, setSnapshotAction] = useState<'reset' | 'import' | null>(null)
  const [snapshotSubmitting, setSnapshotSubmitting] = useState(false)

  const handleConfirmSnapshotAction = async () => {
    if (!snapshotAction) {
      return
    }

    if (snapshotAction === 'import' && !importText.trim()) {
      pushToast({
        tone: 'warning',
        title: 'Chưa có dữ liệu snapshot',
        description: 'Hãy dán JSON snapshot trước khi xác nhận nhập dữ liệu.',
      })
      return
    }

    setSnapshotSubmitting(true)

    try {
      if (snapshotAction === 'reset') {
        await adminService.resetDemoData()
        setDraftForm(null)
        setSnapshotAction(null)
        pushToast({
          tone: 'success',
          title: 'Đã reset dữ liệu demo',
          description: 'Dữ liệu đã trở về bộ seed mặc định từ backend.',
        })
        return
      }

      const result = await adminService.importDemoData(importText)
      pushToast({
        tone: result.ok ? 'success' : 'error',
        title: result.ok ? 'Nhập thành công' : 'Nhập thất bại',
        description: result.ok ? 'Dữ liệu demo hiện tại đã được thay thế từ snapshot JSON.' : result.error,
      })

      if (result.ok) {
        setImportText('')
        setSnapshotAction(null)
      }
    } finally {
      setSnapshotSubmitting(false)
    }
  }

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy quản trị viên" description="Vui lòng đăng nhập lại." />
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Quản trị - Cấu hình tham số hệ thống" subtitle="Cập nhật cửa sổ đăng ký, giới hạn tín chỉ, chế độ bảo trì và thao tác sao lưu dữ liệu demo." />
      <div className="grid gap-6 lg:grid-cols-[0.56fr_0.44fr]">
        <Card title="Tham số hệ thống" description="Thay đổi các tham số tác động trực tiếp lên logic đăng ký">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-3">
              {/* <p className="rounded-3xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">
                Thời điểm mô phỏng hiện tại: {formatDateTime(snapshot.settings.simulationNow)}
              </p> */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input label="Thời điểm mô phỏng" type="datetime-local" step="1" value={form.simulationNow} onChange={(event) => updateForm((value) => ({ ...value, simulationNow: event.target.value }))} />
                </div>
                <Button type="button" variant="secondary" onClick={() => updateForm((value) => ({ ...value, simulationNow: toDatetimeLocalString(new Date().toISOString()) }))}>
                  Lấy giờ thực tế
                </Button>
              </div>
            </div>
            <Input label="Thời gian mở đăng ký" type="datetime-local" value={form.registrationStart} onChange={(event) => updateForm((value) => ({ ...value, registrationStart: event.target.value }))} />
            <Input label="Thời gian đóng đăng ký" type="datetime-local" value={form.registrationEnd} onChange={(event) => updateForm((value) => ({ ...value, registrationEnd: event.target.value }))} />
            <Input label="Bắt đầu điều chỉnh" type="datetime-local" value={form.adjustmentStart} onChange={(event) => updateForm((value) => ({ ...value, adjustmentStart: event.target.value }))} />
            <Input label="Kết thúc điều chỉnh" type="datetime-local" value={form.adjustmentEnd} onChange={(event) => updateForm((value) => ({ ...value, adjustmentEnd: event.target.value }))} />

            <Input label="Tín chỉ tối đa học kỳ chính" type="number" min={0} value={String(form.maxCreditsMain)} onChange={(event) => updateForm((value) => ({ ...value, maxCreditsMain: Number(event.target.value) }))} />
            <Input label="Tín chỉ tối đa học kỳ hè" type="number" min={0} value={String(form.maxCreditsSummer)} onChange={(event) => updateForm((value) => ({ ...value, maxCreditsSummer: Number(event.target.value) }))} />
            <Input label="Tín chỉ tối thiểu" type="number" min={0} value={String(form.minCredits)} onChange={(event) => updateForm((value) => ({ ...value, minCredits: Number(event.target.value) }))} />
            <Input label="Timeout phiên (phút)" value={form.sessionTimeoutMinutes} onChange={(event) => updateForm((value) => ({ ...value, sessionTimeoutMinutes: event.target.value }))} />
            <Input label="Cảnh báo trước logout (giây)" value={form.warningBeforeLogoutSeconds} onChange={(event) => updateForm((value) => ({ ...value, warningBeforeLogoutSeconds: event.target.value }))} />
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Bật bảo trì</label>
              <select className="block w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500" value={form.maintenanceMode} onChange={(e) => updateForm((value) => ({ ...value, maintenanceMode: e.target.value }))}>
                <option value="true">Bật (True)</option>
                <option value="false">Tắt (False)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Cho phép danh sách chờ</label>
              <select className="block w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500" value={form.allowWaitlist} onChange={(e) => updateForm((value) => ({ ...value, allowWaitlist: e.target.value }))}>
                <option value="true">Cho phép (True)</option>
                <option value="false">Không cho phép (False)</option>
              </select>
            </div>
            <Input label="Học kỳ hiện tại (ID)" value={form.currentSemesterId} onChange={(event) => updateForm((value) => ({ ...value, currentSemesterId: event.target.value }))} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={async () => {
                const simulationNow = toValidIsoDate(form.simulationNow)
                const registrationStart = toValidIsoDate(form.registrationStart)
                const registrationEnd = toValidIsoDate(form.registrationEnd)
                const adjustmentStart = toValidIsoDate(form.adjustmentStart)
                const adjustmentEnd = toValidIsoDate(form.adjustmentEnd)
                const withdrawalDeadline = toValidIsoDate(form.withdrawalDeadline)

                if (
                  !simulationNow ||
                  !registrationStart ||
                  !registrationEnd ||
                  !adjustmentStart ||
                  !adjustmentEnd ||
                  !withdrawalDeadline
                ) {
                  pushToast({
                    tone: 'error',
                    title: 'Thời gian không hợp lệ',
                    description: 'Vui lòng nhập ngày giờ theo định dạng ISO, ví dụ 2026-04-10T08:00:00.000Z.',
                  })
                  return
                }

                const sessionTimeoutMinutes = Number(form.sessionTimeoutMinutes)
                const warningBeforeLogoutSeconds = Number(form.warningBeforeLogoutSeconds)
                if (
                  !Number.isFinite(sessionTimeoutMinutes) ||
                  sessionTimeoutMinutes <= 0 ||
                  !Number.isFinite(warningBeforeLogoutSeconds) ||
                  warningBeforeLogoutSeconds < 0
                ) {
                  pushToast({
                    tone: 'error',
                    title: 'Timeout phiên không hợp lệ',
                    description: 'Timeout phiên phải lớn hơn 0 phút và thời gian cảnh báo không được âm.',
                  })
                  return
                }

                try {
                  await adminService.updateSettings({
                    simulationNow,
                    registrationStart,
                    registrationEnd,
                    adjustmentStart,
                    adjustmentEnd,
                    withdrawalDeadline,
                    maxCreditsMain: form.maxCreditsMain,
                    maxCreditsSummer: form.maxCreditsSummer,
                    minCredits: form.minCredits,
                    sessionTimeoutMinutes,
                    warningBeforeLogoutSeconds,
                    maintenanceMode: form.maintenanceMode === 'true',
                    allowWaitlist: form.allowWaitlist === 'true',
                    currentSemesterId: form.currentSemesterId,
                  }, actor)
                  setDraftForm(null)
                  pushToast({ tone: 'success', title: 'Đã cập nhật tham số', description: 'Các tham số mới đã có hiệu lực ngay trên giao diện.' })
                } catch (error) {
                  if (error instanceof ApiError) {
                    pushToast({
                      tone: 'error',
                      title: 'Lỗi cập nhật tham số',
                      description: error.message,
                    })
                  } else {
                    pushToast({
                      tone: 'error',
                      title: 'Lỗi hệ thống',
                      description: 'Không thể cập nhật cấu hình.',
                    })
                  }
                }
              }}
              type="button"
              ignoreMaintenance={true}
            >
              Lưu thay đổi
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSnapshotAction('reset')}
              type="button"
            >
              Reset dữ liệu demo
            </Button>
          </div>
        </Card>

        <div className="grid gap-6">
          <SystemWindowCard settings={snapshot.settings} />
          <Card title="Xuất / nhập dữ liệu" description="Sao lưu snapshot từ backend; import sẽ thay thế dữ liệu demo hiện tại">
            <div className="grid gap-4">
              <ExportButtons
                fileName="campus-demo-data.json"
                onExportText={async () => {
                  const raw = await adminService.exportDemoData()
                  navigator.clipboard.writeText(raw)
                  pushToast({ tone: 'success', title: 'Đã sao chép snapshot', description: 'Dữ liệu JSON đã được sao chép vào clipboard.' })
                }}
              />
              <Textarea label="Dán JSON để nhập" value={importText} onChange={(event) => setImportText(event.target.value)} />
              <Button
                onClick={() => setSnapshotAction('import')}
                type="button"
              >
                Nhập snapshot
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        danger
        loading={snapshotSubmitting}
        open={snapshotAction !== null}
        title={snapshotAction === 'reset' ? 'Xác nhận reset dữ liệu demo' : 'Xác nhận nhập snapshot'}
        description={
          snapshotAction === 'reset'
            ? 'Thao tác này gọi backend reset snapshot và có thể xóa hoặc thay thế dữ liệu demo hiện tại.'
            : 'Thao tác này sẽ import snapshot JSON và có thể thay thế dữ liệu demo hiện tại trong backend.'
        }
        confirmLabel={snapshotAction === 'reset' ? 'Reset dữ liệu' : 'Nhập và thay thế'}
        onClose={() => {
          if (!snapshotSubmitting) {
            setSnapshotAction(null)
          }
        }}
        onConfirm={() => void handleConfirmSnapshotAction()}
      >
        <div className="rounded-3xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Hãy export snapshot trước nếu cần giữ lại dữ liệu đang demo. Không dùng thao tác này trên dữ liệu thật khi chưa được xác nhận.
        </div>
      </ConfirmDialog>
    </div>
  )
}

export default SettingsPage;
