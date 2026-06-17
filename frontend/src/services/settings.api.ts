import { useDataStore } from '@/app/store/data.store'
import { apiRequest } from '@/lib/api-client'
import type { SystemSettings } from '@/types/settings'

type BackendSettings = Partial<SystemSettings> & {
  id?: number
}

function normalizeSettings(settings: BackendSettings): SystemSettings {
  const current = useDataStore.getState().settings

  return {
    ...current,
    simulationNow: settings.simulationNow ?? current.simulationNow,
    registrationStart: settings.registrationStart ?? current.registrationStart,
    registrationEnd: settings.registrationEnd ?? current.registrationEnd,
    adjustmentStart: settings.adjustmentStart ?? current.adjustmentStart,
    adjustmentEnd: settings.adjustmentEnd ?? current.adjustmentEnd,
    withdrawalDeadline: settings.withdrawalDeadline ?? current.withdrawalDeadline,
    maxCredits: settings.maxCredits ?? current.maxCredits,
    minCredits: settings.minCredits ?? current.minCredits,
    maintenanceMode: settings.maintenanceMode ?? current.maintenanceMode,
    allowWaitlist: settings.allowWaitlist ?? current.allowWaitlist,
    sessionTimeoutMinutes: settings.sessionTimeoutMinutes ?? current.sessionTimeoutMinutes,
    warningBeforeLogoutSeconds:
      settings.warningBeforeLogoutSeconds ?? current.warningBeforeLogoutSeconds,
    maxClassesPerDay: settings.maxClassesPerDay ?? current.maxClassesPerDay,
    maxClassesPerSemester: settings.maxClassesPerSemester ?? current.maxClassesPerSemester,
    currentSemesterId: settings.currentSemesterId ?? current.currentSemesterId,
    maintenanceMessage: settings.maintenanceMessage ?? current.maintenanceMessage,
  }
}

function syncSettings(settings: SystemSettings) {
  useDataStore.setState({ settings })
}

export const settingsService = {
  async loadSettings() {
    const settings = normalizeSettings(await apiRequest<BackendSettings>('/settings'))
    syncSettings(settings)
    return settings
  },

  async updateSettings(payload: Partial<SystemSettings>) {
    const settings = normalizeSettings(
      await apiRequest<BackendSettings>('/settings', {
        method: 'PATCH',
        body: payload,
      }),
    )
    syncSettings(settings)
    return settings
  },
}
