import { isWithinRange } from '@/lib/date'
import { Card } from '@/components/ui/Card'
import type { SystemSettings } from '@/types/settings'

interface SystemWindowCardProps {
  settings: SystemSettings
}

function resolveWindowState(settings: SystemSettings) {
  const now = settings.simulationNow
  return {
    registrationOpen: isWithinRange(now, settings.registrationStart, settings.registrationEnd),
    adjustmentOpen: isWithinRange(now, settings.adjustmentStart, settings.adjustmentEnd),
    withdrawalOpen:
      new Date(now).getTime() > new Date(settings.adjustmentEnd).getTime() &&
      new Date(now).getTime() <= new Date(settings.withdrawalDeadline).getTime(),
  }
}

export function SystemWindowCard({ settings }: SystemWindowCardProps) {
  const state = resolveWindowState(settings)
  const rows = [
    { label: 'Đăng ký học phần', value: state.registrationOpen ? 'Đang mở' : 'Đã đóng' },
    { label: 'Điều chỉnh đăng ký', value: state.adjustmentOpen ? 'Đang mở' : 'Đã đóng' },
    { label: 'Rút học phần', value: state.withdrawalOpen ? 'Còn hiệu lực' : 'Chưa mở hoặc đã hết hạn' },
    { label: 'Bảo trì hệ thống', value: settings.maintenanceMode ? 'Đang bật' : 'Đang tắt' },
  ]

  return (
    <Card title="Cửa sổ hệ thống" description="Trạng thái hiện tại của các mốc thời gian quan trọng">
      <div className="grid gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3"
          >
            <span className="text-sm text-slate-600">{row.label}</span>
            <span className="text-sm font-semibold text-slate-900">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default SystemWindowCard
