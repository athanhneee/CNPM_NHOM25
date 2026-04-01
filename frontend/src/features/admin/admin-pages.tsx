import { startTransition, useDeferredValue, useMemo, useRef, useState } from 'react'
import { FileSpreadsheet, Upload, UserPlus } from 'lucide-react'
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
import { adminService } from '@/mocks/services/admin.service'
import { getMajorMappingFromStudentCode } from '@/mocks/seed/ptit-helpers'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { SystemWindowCard } from '@/components/shared/SystemWindowCard'
import { formatDateTime } from '@/lib/date'
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
  return {
    currentUser,
    snapshot,
    pushToast,
    actor: currentUser ? { actorId: currentUser.id, actorRole: currentUser.roles[0] ?? 'ADMIN' } : null,
  }
}

export function UserAccountsPage() {
  const { currentUser, snapshot, pushToast, actor } = useAdminContext()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [lockId, setLockId] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [studentImportText, setStudentImportText] = useState('')
  const [preview, setPreview] = useState<StudentImportPreview | null>(null)
  const [lastImportSummary, setLastImportSummary] = useState<StudentImportSummary | null>(null)
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const resolvedActor = actor ?? {
    actorId: currentUser?.id ?? 'AD001',
    actorRole: currentUser?.roles[0] ?? 'ADMIN',
  }

  const rows = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    return snapshot.users.filter((user) => {
      if (!normalizedQuery) {
        return true
      }

      return [user.username, user.fullName, user.email, user.code, user.majorName ?? user.department]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [deferredQuery, snapshot.users])

  const previewRows = useMemo(
    () =>
      (preview?.candidates ?? []).slice(0, 8).map((candidate) => ({
        ...candidate,
        majorName: getMajorMappingFromStudentCode(candidate.code).majorName,
      })),
    [preview],
  )

  const totalStudents = snapshot.users.filter((user) => user.roles.includes('STUDENT')).length
  const totalStaff = snapshot.users.filter((user) => !user.roles.includes('STUDENT')).length

  const resetImportDraft = () => {
    setStudentImportText('')
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePreviewResult = (nextPreview: StudentImportPreview) => {
    startTransition(() => {
      setPreview(nextPreview)
      setLastImportSummary(null)
    })
  }

  const handleManualCreate = async () => {
    if (!manualName.trim() || !manualCode.trim()) {
      pushToast({
        tone: 'error',
        title: 'Thiếu dữ liệu sinh viên',
        description: 'Bạn cần nhập đủ họ tên và MSSV trước khi lưu.',
      })
      return
    }

    setManualSubmitting(true)

    try {
      const createdUser = await adminService.createStudentUser(
        {
          fullName: manualName,
          code: manualCode,
        },
        resolvedActor,
      )

      setManualName('')
      setManualCode('')
      setLastImportSummary({
        created: [createdUser],
        skipped: [],
        issues: [],
        defaultPassword: STUDENT_IMPORT_DEFAULT_PASSWORD,
      })
      setQuery(createdUser.code)
      pushToast({
        tone: 'success',
        title: 'Đã thêm sinh viên',
        description: `Tài khoản ${createdUser.username} đã sẵn sàng với mật khẩu mặc định ${STUDENT_IMPORT_DEFAULT_PASSWORD}.`,
      })
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Không thể thêm sinh viên',
        description:
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi khi tạo tài khoản sinh viên.',
      })
    } finally {
      setManualSubmitting(false)
    }
  }

  const handlePreviewText = () => {
    if (!studentImportText.trim()) {
      pushToast({
        tone: 'info',
        title: 'Chưa có dữ liệu để phân tích',
        description: 'Hãy dán danh sách sinh viên theo định dạng Họ tên và MSSV trước khi xem trước.',
      })
      return
    }

    const nextPreview = parseStudentText(studentImportText)
    handlePreviewResult(nextPreview)
    pushToast({
      tone: nextPreview.candidates.length ? 'success' : 'info',
      title: 'Đã phân tích danh sách',
      description: `Hợp lệ: ${nextPreview.candidates.length} dòng, lỗi: ${nextPreview.issues.length} dòng.`,
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsParsingFile(true)

    try {
      const nextPreview = await parseStudentImportFile(file)
      handlePreviewResult(nextPreview)
      pushToast({
        tone: nextPreview.candidates.length ? 'success' : 'info',
        title: 'Đã đọc tệp sinh viên',
        description: `${file.name}: ${nextPreview.candidates.length} dòng hợp lệ, ${nextPreview.issues.length} dòng cần rà soát.`,
      })
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Không đọc được tệp',
        description:
          error instanceof Error
            ? error.message
            : 'Tệp không đúng định dạng hỗ trợ. Hãy thử lại với .xlsx, .xls, .csv, .tsv hoặc .txt.',
      })
    } finally {
      setIsParsingFile(false)
      event.target.value = ''
    }
  }

  const handleImportStudents = async () => {
    if (!preview?.candidates.length) {
      pushToast({
        tone: 'info',
        title: 'Chưa có danh sách hợp lệ',
        description: 'Hãy tải tệp hoặc dán dữ liệu để tạo bản xem trước trước khi nhập.',
      })
      return
    }

    setIsImporting(true)

    try {
      const result = await adminService.importStudentUsers(preview.candidates, resolvedActor)
      setLastImportSummary(result)
      setPreview(null)
      setStudentImportText('')
      pushToast({
        tone: result.created.length ? 'success' : 'info',
        title: 'Hoàn tất nhập sinh viên',
        description: `Đã thêm ${result.created.length} sinh viên, bỏ qua ${result.skipped.length} dòng trùng, lỗi ${result.issues.length} dòng.`,
      })
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Nhập sinh viên thất bại',
        description:
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi khi ghi dữ liệu sinh viên vào hệ thống.',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const columns: TableColumn<(typeof rows)[number]>[] = [
    {
      key: 'account',
      header: 'Tài khoản',
      render: (row) => (
        <div className="grid gap-1">
          <p className="font-semibold text-slate-900">{row.username}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    { key: 'fullName', header: 'Họ và tên', render: (row) => row.fullName },
    {
      key: 'code',
      header: 'MSSV / Mã nội bộ',
      render: (row) => (
        <div className="grid gap-1">
          <p className="font-medium text-slate-900">{row.code}</p>
          <p className="text-xs text-slate-500">{row.studentClass ?? row.department}</p>
        </div>
      ),
    },
    {
      key: 'program',
      header: 'Ngành / Vai trò',
      render: (row) => (
        <div className="grid gap-1">
          <p>{row.majorName ?? row.program ?? row.department}</p>
          <p className="text-xs text-slate-500">{row.roles.join(' • ')}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge kind="account" status={row.status} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.status === 'LOCKED' ? (
            <Button
              variant="secondary"
              onClick={async () => {
                await adminService.unlockUser(row.id, resolvedActor)
                pushToast({ tone: 'success', title: 'Đã mở khóa tài khoản', description: `${row.username} có thể đăng nhập lại.` })
              }}
              type="button"
            >
              Mở khóa
            </Button>
          ) : (
            <Button onClick={() => setLockId(row.id)} type="button" variant="danger">
              Khóa
            </Button>
          )}
        </div>
      ),
    },
  ]

  const previewColumns: TableColumn<(typeof previewRows)[number]>[] = [
    { key: 'rowNumber', header: 'Dòng', render: (row) => row.rowNumber },
    { key: 'fullName', header: 'Họ và tên', render: (row) => row.fullName },
    { key: 'code', header: 'MSSV', render: (row) => row.code },
    { key: 'majorName', header: 'Ngành suy luận', render: (row) => row.majorName },
  ]

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy quản trị viên" description="Vui lòng đăng nhập lại." />
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Quản trị - Quản lý tài khoản người dùng"
        subtitle="Theo dõi tài khoản, thêm sinh viên thủ công hoặc nhập danh sách từ Excel/tab-delimited ngay trên giao diện quản trị."
      />
      <div className="grid gap-4 xl:grid-cols-5">
        <StatCard label="Tổng người dùng" value={String(snapshot.users.length)} hint="Toàn bộ hệ thống mô phỏng" />
        <StatCard label="Sinh viên" value={String(totalStudents)} hint="Đăng nhập bằng MSSV" />
        <StatCard label="Nhân sự" value={String(totalStaff)} hint="Giảng viên, phòng đào tạo, quản trị" />
        <StatCard label="Đang hoạt động" value={String(snapshot.users.filter((user) => user.status === 'ACTIVE').length)} hint="Sẵn sàng đăng nhập" />
        <StatCard label="Đang khóa" value={String(snapshot.users.filter((user) => user.status === 'LOCKED').length)} hint="Cần quản trị viên xử lý" />
        <StatCard label="Tạm ngưng" value={String(snapshot.users.filter((user) => user.status === 'INACTIVE').length)} hint="Tạm dừng sử dụng" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
        <Card
          title="Thêm sinh viên thủ công"
          description="Nhập từng sinh viên mới. Hệ thống tự sinh tài khoản, hồ sơ cơ bản và suy luận ngành từ MSSV."
        >
          <div className="grid gap-4">
            <Input
              label="Họ và tên"
              onChange={(event) => setManualName(event.target.value)}
              placeholder="Nguyễn Thị Mỹ Duyên"
              value={manualName}
            />
            <Input
              label="MSSV"
              onChange={(event) => setManualCode(event.target.value.toUpperCase())}
              placeholder="N23DCCN001"
              value={manualCode}
            />
            <div className="rounded-3xl border border-cyan-100 bg-cyan-50/70 px-4 py-4 text-sm text-cyan-900">
              Tài khoản mặc định là <span className="font-semibold">MSSV</span>. Mật khẩu mặc định là{' '}
              <span className="font-semibold">{STUDENT_IMPORT_DEFAULT_PASSWORD}</span>.
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                leftIcon={<UserPlus className="size-4" />}
                loading={manualSubmitting}
                onClick={handleManualCreate}
                type="button"
              >
                Thêm sinh viên
              </Button>
              <Button
                onClick={() => {
                  setManualName('')
                  setManualCode('')
                }}
                type="button"
                variant="secondary"
              >
                Xóa nhanh biểu mẫu
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title="Nhập danh sách sinh viên từ Excel"
          description="Hỗ trợ tải tệp Excel hoặc dán trực tiếp từ bảng tính. Cột 1 là Họ tên, cột 2 là MSSV; các cột sau được bỏ qua."
        >
          <div className="grid gap-4">
            <div className="rounded-[28px] border border-dashed border-cyan-200 bg-gradient-to-r from-cyan-50 to-white px-5 py-5">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <FileSpreadsheet className="size-5 text-cyan-600" />
                <span>Chấp nhận tệp {STUDENT_IMPORT_ACCEPT}. Với Excel, hệ thống sẽ đọc sheet đầu tiên.</span>
              </div>
              <input
                ref={fileInputRef}
                accept={STUDENT_IMPORT_ACCEPT}
                className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-cyan-500"
                onChange={handleFileChange}
                type="file"
              />
              <p className="mt-3 text-xs text-slate-500">
                Nếu tệp có thêm cột như lớp, ghi chú hoặc email, hệ thống chỉ lấy 2 cột đầu tiên để tạo sinh viên.
              </p>
            </div>

            <Textarea
              className="min-h-40"
              hint="Định dạng khuyến nghị: Họ tên<TAB>MSSV<TAB>các cột khác. Có thể dán trực tiếp từ Excel."
              label="Hoặc dán dữ liệu thủ công"
              onChange={(event) => setStudentImportText(event.target.value)}
              placeholder={'Nguyễn Văn A\tN23DCCN199\tCNTT\nTrần Thị B\tN23DCAT088\tATTT'}
              value={studentImportText}
            />

            <div className="flex flex-wrap gap-3">
              <Button onClick={handlePreviewText} type="button" variant="secondary">
                Phân tích nội dung dán
              </Button>
              <Button
                leftIcon={<Upload className="size-4" />}
                loading={isImporting}
                onClick={handleImportStudents}
                type="button"
              >
                Nhập danh sách vào hệ thống
              </Button>
              <Button onClick={resetImportDraft} type="button" variant="ghost">
                Xóa bản xem trước
              </Button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Quy tắc nhập liệu</p>
              <p className="mt-2">- Cột 1: Họ và tên đầy đủ.</p>
              <p>- Cột 2: MSSV.</p>
              <p>- Prefix `DCCN` sẽ được gán vào Công nghệ thông tin, `DCAT` vào An toàn thông tin.</p>
              <p>- Prefix chưa map được vẫn được nhập, nhưng sẽ gắn trạng thái “Cần rà soát”.</p>
            </div>
          </div>
        </Card>
      </div>

      {preview ? (
        <Card
          title="Xem trước danh sách nhập"
          description={`Nguồn dữ liệu: ${preview.sourceLabel}`}
          actions={
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                Hợp lệ: {preview.candidates.length}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                Cần rà soát: {preview.issues.length}
              </span>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">
                Đang đọc tệp: {isParsingFile ? 'Có' : 'Không'}
              </span>
            </div>
          }
        >
          <div className="grid gap-4">
            {previewRows.length ? (
              <>
                <Table columns={previewColumns} rows={previewRows} rowKey={(row) => `${row.code}-${row.rowNumber}`} />
                {preview.candidates.length > previewRows.length ? (
                  <p className="text-sm text-slate-500">
                    Đang hiển thị {previewRows.length}/{preview.candidates.length} dòng hợp lệ đầu tiên.
                  </p>
                ) : null}
              </>
            ) : (
              <EmptyState
                title="Chưa có dòng hợp lệ để nhập"
                description="Hãy kiểm tra lại định dạng tệp hoặc nội dung dán. Hai cột đầu tiên phải là Họ tên và MSSV."
              />
            )}

            {preview.issues.length ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-sm font-semibold text-amber-900">Các dòng cần rà soát trước khi nhập</p>
                <div className="mt-3 grid gap-2 text-sm text-amber-900">
                  {preview.issues.slice(0, 8).map((issue) => (
                    <p key={`${issue.rowNumber}-${issue.message}`}>
                      Dòng {issue.rowNumber}: {issue.message}
                    </p>
                  ))}
                  {preview.issues.length > 8 ? (
                    <p>... và thêm {preview.issues.length - 8} dòng cần kiểm tra.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {lastImportSummary ? (
        <Card title="Kết quả lần nhập gần nhất" description="Tóm tắt các bản ghi vừa được thêm hoặc bị bỏ qua.">
          <div className="grid gap-4 lg:grid-cols-3">
            <StatCard label="Đã thêm mới" value={String(lastImportSummary.created.length)} hint="Sinh viên đã ghi vào hệ thống" />
            <StatCard label="Bị bỏ qua" value={String(lastImportSummary.skipped.length)} hint="Thường do trùng MSSV" />
            <StatCard label="Lỗi dữ liệu" value={String(lastImportSummary.issues.length)} hint="Cần chỉnh lại trước khi nhập" />
          </div>
          <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            Mật khẩu mặc định của sinh viên mới là <span className="font-semibold">{lastImportSummary.defaultPassword}</span>.
          </div>
          {lastImportSummary.skipped.length ? (
            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              {lastImportSummary.skipped.slice(0, 6).map((row) => (
                <p key={`${row.code}-${row.rowNumber}`}>
                  {row.code} - {row.fullName}: {row.reason}
                </p>
              ))}
              {lastImportSummary.skipped.length > 6 ? (
                <p>... và thêm {lastImportSummary.skipped.length - 6} dòng bị bỏ qua.</p>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      <FilterBar>
        <SearchInput label="Tìm tài khoản" value={query} onChange={(event) => setQuery(event.target.value)} />
      </FilterBar>
      {rows.length ? (
        <Table columns={columns} rows={rows} rowKey={(row) => row.id} />
      ) : (
        <EmptyState title="Không tìm thấy tài khoản phù hợp" description="Hãy thử lại với MSSV, họ tên, email hoặc ngành đào tạo." />
      )}
      <ConfirmDialog
        open={Boolean(lockId)}
        title="Xác nhận khóa tài khoản"
        description="Tài khoản sẽ không thể đăng nhập cho đến khi quản trị viên mở khóa lại."
        confirmLabel="Khóa tài khoản"
        danger
        onClose={() => setLockId('')}
        onConfirm={async () => {
          await adminService.lockUser(lockId, resolvedActor)
          pushToast({ tone: 'success', title: 'Đã khóa tài khoản', description: 'Trạng thái tài khoản đã chuyển sang LOCKED.' })
          setLockId('')
        }}
      />
    </div>
  )
}

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

export function SettingsPage() {
  const { currentUser, snapshot, pushToast, actor } = useAdminContext()
  const [form, setForm] = useState({
    registrationStart: snapshot.settings.registrationStart,
    registrationEnd: snapshot.settings.registrationEnd,
    adjustmentStart: snapshot.settings.adjustmentStart,
    adjustmentEnd: snapshot.settings.adjustmentEnd,
    withdrawalDeadline: snapshot.settings.withdrawalDeadline,
    maxCredits: String(snapshot.settings.maxCredits),
    minCredits: String(snapshot.settings.minCredits),
    maintenanceMode: snapshot.settings.maintenanceMode ? 'true' : 'false',
    allowWaitlist: snapshot.settings.allowWaitlist ? 'true' : 'false',
  })
  const [importText, setImportText] = useState('')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy quản trị viên" description="Vui lòng đăng nhập lại." />
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Quản trị - Cấu hình tham số hệ thống" subtitle="Cập nhật cửa sổ đăng ký, giới hạn tín chỉ, chế độ bảo trì và thao tác sao lưu dữ liệu demo." />
      <div className="grid gap-6 lg:grid-cols-[0.56fr_0.44fr]">
        <Card title="Tham số hệ thống" description="Thay đổi các tham số tác động trực tiếp lên logic đăng ký">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Thời gian mở đăng ký" value={form.registrationStart} onChange={(event) => setForm((value) => ({ ...value, registrationStart: event.target.value }))} />
            <Input label="Thời gian đóng đăng ký" value={form.registrationEnd} onChange={(event) => setForm((value) => ({ ...value, registrationEnd: event.target.value }))} />
            <Input label="Bắt đầu điều chỉnh" value={form.adjustmentStart} onChange={(event) => setForm((value) => ({ ...value, adjustmentStart: event.target.value }))} />
            <Input label="Kết thúc điều chỉnh" value={form.adjustmentEnd} onChange={(event) => setForm((value) => ({ ...value, adjustmentEnd: event.target.value }))} />
            <Input label="Hạn rút học phần" value={form.withdrawalDeadline} onChange={(event) => setForm((value) => ({ ...value, withdrawalDeadline: event.target.value }))} />
            <Input label="Tín chỉ tối đa" value={form.maxCredits} onChange={(event) => setForm((value) => ({ ...value, maxCredits: event.target.value }))} />
            <Input label="Tín chỉ tối thiểu" value={form.minCredits} onChange={(event) => setForm((value) => ({ ...value, minCredits: event.target.value }))} />
            <Input label="Bật bảo trì" value={form.maintenanceMode} onChange={(event) => setForm((value) => ({ ...value, maintenanceMode: event.target.value }))} list="boolean-options" />
            <Input label="Cho phép danh sách chờ" value={form.allowWaitlist} onChange={(event) => setForm((value) => ({ ...value, allowWaitlist: event.target.value }))} list="boolean-options" />
            <datalist id="boolean-options">
              <option value="true" />
              <option value="false" />
            </datalist>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={async () => {
                await adminService.updateSettings({
                  registrationStart: form.registrationStart,
                  registrationEnd: form.registrationEnd,
                  adjustmentStart: form.adjustmentStart,
                  adjustmentEnd: form.adjustmentEnd,
                  withdrawalDeadline: form.withdrawalDeadline,
                  maxCredits: Number(form.maxCredits),
                  minCredits: Number(form.minCredits),
                  maintenanceMode: form.maintenanceMode === 'true',
                  allowWaitlist: form.allowWaitlist === 'true',
                }, actor)
                pushToast({ tone: 'success', title: 'Đã cập nhật tham số', description: 'Các tham số mới đã có hiệu lực ngay trên giao diện.' })
              }}
              type="button"
            >
              Lưu thay đổi
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await adminService.resetDemoData()
                pushToast({ tone: 'success', title: 'Đã reset dữ liệu demo', description: 'Dữ liệu đã trở về bộ seed mặc định.' })
              }}
              type="button"
            >
              Reset dữ liệu demo
            </Button>
          </div>
        </Card>

        <div className="grid gap-6">
          <SystemWindowCard settings={snapshot.settings} />
          <Card title="Xuất / nhập dữ liệu" description="Hỗ trợ sao lưu dữ liệu mock trong localStorage">
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
                onClick={async () => {
                  const result = await adminService.importDemoData(importText)
                  pushToast({ tone: result.ok ? 'success' : 'error', title: result.ok ? 'Nhập thành công' : 'Nhập thất bại', description: result.ok ? 'Dữ liệu đã được thay thế từ JSON.' : result.error })
                }}
                type="button"
              >
                Nhập snapshot
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function AuditLogsPage() {
  const { currentUser, snapshot } = useAdminContext()
  const [query, setQuery] = useState('')

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

  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'timestamp', header: 'Thời gian', render: (row) => formatDateTime(row.timestamp) },
    { key: 'actorId', header: 'Người thực hiện', render: (row) => row.actorId },
    { key: 'role', header: 'Vai trò', render: (row) => row.actorRole },
    { key: 'action', header: 'Chức năng', render: (row) => row.action },
    { key: 'message', header: 'Nội dung', render: (row) => row.message },
    { key: 'result', header: 'Kết quả', render: (row) => <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{row.result}</span> },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Quản trị - Nhật ký hệ thống" subtitle="Theo dõi nhật ký cho các thao tác đăng nhập, đăng ký, danh sách chờ, can thiệp đặc biệt, cập nhật tham số và phân quyền." />
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Tổng log" value={String(snapshot.logs.length)} hint="Toàn bộ nhật ký cục bộ" />
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

