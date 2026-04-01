import { useDataStore } from '@/app/store/data.store'
import { getRandomDelay, sleep } from '@/lib/utils'
import type { StudentImportCandidate } from '@/lib/student-import'
import type { User } from '@/types/user'
import type { SystemSettings } from '@/types/settings'
import type { UserRole } from '@/types/auth'

const adminActor = { actorId: 'AD001', actorRole: 'ADMIN' as UserRole }

export const adminService = {
  async listUsers() {
    await sleep(getRandomDelay())
    return useDataStore.getState().users
  },
  async updateUser(userId: string, payload: Partial<User>, actor = adminActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().updateUser(userId, payload, actor)
  },
  async createUser(
    payload: Omit<User, 'id' | 'passwordDigest' | 'failedLoginAttempts' | 'lastLoginAt'>,
    actor = adminActor,
  ) {
    await sleep(getRandomDelay())
    return useDataStore.getState().createUser(payload, actor)
  },
  async createStudentUser(
    payload: Pick<StudentImportCandidate, 'fullName' | 'code'>,
    actor = adminActor,
  ) {
    await sleep(getRandomDelay())
    return useDataStore.getState().createStudentUser(payload, actor)
  },
  async importStudentUsers(payload: StudentImportCandidate[], actor = adminActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().importStudentUsers(payload, actor)
  },
  async updateRoles(userId: string, roles: UserRole[], actor = adminActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().updateUser(userId, { roles }, actor)
  },
  async updateSettings(payload: Partial<SystemSettings>, actor = adminActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().updateSettings(payload, actor)
  },
  async lockUser(userId: string, actor = adminActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().setUserStatus(userId, 'LOCKED', actor)
  },
  async unlockUser(userId: string, actor = adminActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().setUserStatus(userId, 'ACTIVE', actor)
  },
  async resetDemoData() {
    await sleep(160)
    useDataStore.getState().resetDemoData()
  },
  async exportDemoData() {
    await sleep(80)
    return useDataStore.getState().exportDemoData()
  },
  async importDemoData(rawData: string) {
    await sleep(80)
    return useDataStore.getState().importDemoData(rawData)
  },
}
