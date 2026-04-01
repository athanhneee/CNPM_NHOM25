import { useDataStore } from '@/app/store/data.store'
import { getRandomDelay, sleep } from '@/lib/utils'
import type { AuditLog, AuditResult } from '@/types/log'
import type { UserRole } from '@/types/auth'

export const logService = {
  async appendLog(
    action: string,
    targetId: string,
    result: AuditResult,
    message: string,
    actorId: string,
    actorRole: UserRole,
  ) {
    await sleep(80)
    useDataStore.getState().appendAuditLog(action, targetId, result, message, { actorId, actorRole })
  },
  async listLogs() {
    await sleep(getRandomDelay())
    return useDataStore.getState().logs
  },
  async filterLogs(predicate: (log: AuditLog) => boolean) {
    await sleep(100)
    return useDataStore.getState().logs.filter(predicate)
  },
}
