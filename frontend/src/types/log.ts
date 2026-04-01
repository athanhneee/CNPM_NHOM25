import type { UserRole } from '@/types/auth'

export type AuditResult = 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO'

export interface AuditLog {
  id: string
  timestamp: string
  actorId: string
  actorRole: UserRole
  action: string
  targetId: string
  result: AuditResult
  message: string
  metadata?: Record<string, string | number | boolean | null>
}
