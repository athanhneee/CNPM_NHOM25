import { useDataStore } from '@/app/store/data.store'
import { apiRequest } from '@/lib/api-client'
import type { UserRole } from '@/types/auth'
import type { AuditLog, AuditResult } from '@/types/log'

interface BackendAuditLog {
  id: string
  timestamp?: string | Date | null
  actorId: string
  actorRole: UserRole
  action: string
  targetId: string
  result: AuditResult
  message: string
  metadata?: unknown
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LogQuery {
  actorId?: string
  targetId?: string
  result?: AuditResult
  action?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

function queryPath(basePath: string, query: LogQuery = {}) {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

function normalizeMetadata(metadata: unknown): AuditLog['metadata'] {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined
  }

  const normalized: Record<string, string | number | boolean | null> = {}
  Object.entries(metadata).forEach(([key, value]) => {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      normalized[key] = value
    }
  })

  return Object.keys(normalized).length ? normalized : undefined
}

function normalizeLog(log: BackendAuditLog): AuditLog {
  const metadata = normalizeMetadata(log.metadata)

  return {
    id: log.id,
    timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
    actorId: log.actorId,
    actorRole: log.actorRole,
    action: log.action,
    targetId: log.targetId,
    result: log.result,
    message: log.message,
    ...(metadata ? { metadata } : {}),
  }
}

function normalizeLogs(payload: BackendAuditLog[] | PaginatedResponse<BackendAuditLog>) {
  const logs = Array.isArray(payload) ? payload : payload.items
  return logs.map(normalizeLog)
}

function syncLogs(logs: AuditLog[]) {
  useDataStore.setState({ logs })
}

export const logService = {
  async listLogs(query: LogQuery = {}) {
    const logs = normalizeLogs(
      await apiRequest<BackendAuditLog[] | PaginatedResponse<BackendAuditLog>>(
        queryPath('/logs', query),
      ),
    )
    syncLogs(logs)
    return logs
  },
}
