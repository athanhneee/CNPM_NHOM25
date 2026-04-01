import { Badge } from '@/components/ui/Badge'
import { accountStatusMap, enrollmentStatusMap, sectionStatusMap } from '@/lib/color-maps'
import type { AccountStatus } from '@/types/auth'
import type { EnrollmentStatus } from '@/types/enrollment'
import type { SectionStatus } from '@/types/section'

interface StatusBadgeProps {
  kind: 'enrollment' | 'section' | 'account'
  status: EnrollmentStatus | SectionStatus | AccountStatus
}

export function StatusBadge({ kind, status }: StatusBadgeProps) {
  if (kind === 'enrollment') {
    const config = enrollmentStatusMap[status as EnrollmentStatus]
    return (
      <Badge className={config.className} title={config.tooltip}>
        {config.label}
      </Badge>
    )
  }

  if (kind === 'section') {
    const config = sectionStatusMap[status as SectionStatus]
    return (
      <Badge className={config.className} title={config.tooltip}>
        {config.label}
      </Badge>
    )
  }

  const config = accountStatusMap[status as AccountStatus]
  return <Badge className={config.className}>{config.label}</Badge>
}

export default StatusBadge
