import { useDataStore } from '@/app/store/data.store'
import { getRandomDelay, sleep } from '@/lib/utils'
import type { UserRole } from '@/types/auth'
import type { Section } from '@/types/section'

const defaultActor = { actorId: 'AO001', actorRole: 'ACADEMIC_OFFICE' as UserRole }

export const sectionService = {
  async listSections() {
    await sleep(getRandomDelay())
    return useDataStore.getState().sections
  },
  async listMyTeachingSections() {
    await sleep(getRandomDelay())
    return useDataStore.getState().sections
  },
  async getSectionDetail(sectionId: string) {
    await sleep(120)
    return useDataStore.getState().sections.find((section) => section.id === sectionId) ?? null
  },
  async createSection(
    payload: Omit<Section, 'id' | 'registeredCount' | 'waitlistCount'> & {
      registeredCount?: number
      waitlistCount?: number
    },
    actor = defaultActor,
  ) {
    await sleep(getRandomDelay())
    return useDataStore.getState().createSection(payload, actor)
  },
  async updateSection(sectionId: string, payload: Partial<Section>, actor = defaultActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().updateSection(sectionId, payload, actor)
  },
  async assignLecturer(sectionId: string, payload: { lecturerId?: string, guestLecturer?: string }, actor = defaultActor) {
    await sleep(200)
    return useDataStore.getState().assignLecturer(sectionId, payload, actor)
  },
  async updateRoomSchedule(
    sectionId: string,
    payload: Pick<Section, 'room' | 'weekday' | 'startPeriod' | 'periodCount'>,
    actor = defaultActor,
  ) {
    await sleep(getRandomDelay())
    return useDataStore.getState().updateRoomSchedule(sectionId, payload, actor)
  },
  async updateCapacity(sectionId: string, capacity: number, reason: string, actor = defaultActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().updateSectionCapacity(sectionId, capacity, actor, reason)
  },
}
