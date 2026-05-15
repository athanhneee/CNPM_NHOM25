import { create } from 'zustand'
import {
  canCancelEnrollment,
  canWithdrawEnrollment,
  evaluateEnrollmentEligibility,
} from '@/lib/business-rules'
import {
  buildImportedStudentUser,
  normalizeStudentCode,
  type StudentImportCandidate,
  type StudentImportSummary,
} from '@/lib/student-import'
import { STORAGE_KEYS, removeStorageKey, safeReadLocalStorage, safeWriteLocalStorage } from '@/lib/storage'
import { createId, toDigest } from '@/lib/utils'
import { seedCourses } from '@/mocks/seed/courses'
import { seedEnrollments } from '@/mocks/seed/enrollments'
import { seedLogs } from '@/mocks/seed/logs'
import { reportPresets } from '@/mocks/seed/reports'
import { seedCourseRelations } from '@/mocks/seed/relations'
import { seedSections } from '@/mocks/seed/sections'
import {
  seedAnnouncements,
  seedSemesters,
  seedSettings,
  seedWishRequests,
} from '@/mocks/seed/settings'
import { demoAccounts, seedUsers } from '@/mocks/seed/users'
import type { AccountStatus, UserRole } from '@/types/auth'
import type { Course, WishRequest } from '@/types/course'
import type { Enrollment, EnrollmentConventionCode, EnrollmentStatus } from '@/types/enrollment'
import type { AuditLog, AuditResult } from '@/types/log'
import type { Section } from '@/types/section'
import type {
  DashboardAnnouncement,
  ReportPreset,
  SemesterOption,
  SystemSettings,
} from '@/types/settings'
import type { User } from '@/types/user'

interface AuditActor {
  actorId: string
  actorRole: UserRole
}

interface DemoSnapshot {
  users: User[]
  courses: Course[]
  sections: Section[]
  enrollments: Enrollment[]
  logs: AuditLog[]
  settings: SystemSettings
  wishes: WishRequest[]
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createSeedSnapshot(): DemoSnapshot {
  return {
    users: cloneValue(seedUsers),
    courses: cloneValue(seedCourses),
    sections: cloneValue(seedSections),
    enrollments: cloneValue(seedEnrollments),
    logs: cloneValue(seedLogs),
    settings: cloneValue(seedSettings),
    wishes: cloneValue(seedWishRequests),
  }
}

function readSeededValue<T>(key: string, seedValue: T) {
  return safeReadLocalStorage(key, cloneValue(seedValue))
}

function overlaps(startA: number, countA: number, startB: number, countB: number) {
  const endA = startA + countA
  const endB = startB + countB
  return startA < endB && startB < endA
}

function buildTimelineItem(
  actorId: string,
  actorRole: UserRole,
  status: EnrollmentStatus,
  note: string,
  timestamp: string,
) {
  return { actorId, actorRole, status, note, timestamp }
}

function buildAuditLog(
  currentLogs: AuditLog[],
  action: string,
  targetId: string,
  result: AuditResult,
  message: string,
  actor: AuditActor,
  metadata?: Record<string, string | number | boolean | null>,
) {
  return {
    id: createId('LOG', currentLogs.length + 1),
    timestamp: new Date().toISOString(),
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action,
    targetId,
    result,
    message,
    ...(metadata ? { metadata } : {}),
  } satisfies AuditLog
}

function getSectionStatus(section: Section) {
  if (section.status === 'CANCELLED' || section.status === 'COMPLETED' || section.status === 'IN_PROGRESS') {
    return section.status
  }

  return section.registeredCount >= section.capacity ? 'FULL' : 'OPEN'
}

function persistSnapshot(snapshot: Partial<DemoSnapshot>) {
  if (snapshot.users) {
    safeWriteLocalStorage(STORAGE_KEYS.users, snapshot.users)
  }

  if (snapshot.courses) {
    safeWriteLocalStorage(STORAGE_KEYS.courses, snapshot.courses)
  }

  if (snapshot.sections) {
    safeWriteLocalStorage(STORAGE_KEYS.sections, snapshot.sections)
  }

  if (snapshot.enrollments) {
    safeWriteLocalStorage(STORAGE_KEYS.enrollments, snapshot.enrollments)
  }

  if (snapshot.logs) {
    safeWriteLocalStorage(STORAGE_KEYS.logs, snapshot.logs)
  }

  if (snapshot.settings) {
    safeWriteLocalStorage(STORAGE_KEYS.settings, snapshot.settings)
  }

  if (snapshot.wishes) {
    safeWriteLocalStorage(STORAGE_KEYS.wishes, snapshot.wishes)
  }
}

function shouldResetLegacyDemoData() {
  const storedUsers = safeReadLocalStorage<User[]>(STORAGE_KEYS.users, [])

  if (!storedUsers.length) {
    return false
  }

  return storedUsers.some(
    (user) =>
      user.roles.includes('STUDENT') &&
      (/^U\d+$/i.test(user.id) || user.email.endsWith('@demo.local')),
  )
}

function createInitialSnapshot() {
  if (shouldResetLegacyDemoData()) {
    const snapshot = createSeedSnapshot()
    persistSnapshot(snapshot)
    removeStorageKey(STORAGE_KEYS.auth)
    return snapshot
  }

  return {
    users: readSeededValue(STORAGE_KEYS.users, seedUsers),
    courses: readSeededValue(STORAGE_KEYS.courses, seedCourses),
    sections: readSeededValue(STORAGE_KEYS.sections, seedSections),
    enrollments: readSeededValue(STORAGE_KEYS.enrollments, seedEnrollments),
    logs: readSeededValue(STORAGE_KEYS.logs, seedLogs),
    settings: readSeededValue(STORAGE_KEYS.settings, seedSettings),
    wishes: readSeededValue(STORAGE_KEYS.wishes, seedWishRequests),
  } satisfies DemoSnapshot
}

const initialSnapshot = createInitialSnapshot()

export interface DataStoreState {
  users: User[]
  courses: Course[]
  sections: Section[]
  enrollments: Enrollment[]
  logs: AuditLog[]
  settings: SystemSettings
  wishes: WishRequest[]
  semesters: SemesterOption[]
  announcements: DashboardAnnouncement[]
  courseRelations: typeof seedCourseRelations
  reportPresets: ReportPreset[]
  demoAccounts: typeof demoAccounts
  resetDemoData: () => void
  exportDemoData: () => string
  importDemoData: (rawData: string) => { ok: true } | { ok: false; error: string }
  appendAuditLog: (
    action: string,
    targetId: string,
    result: AuditResult,
    message: string,
    actor: AuditActor,
    metadata?: Record<string, string | number | boolean | null>,
  ) => void
  updateUser: (userId: string, payload: Partial<User>, actor: AuditActor) => User
  createUser: (
    payload: Omit<User, 'id' | 'passwordDigest' | 'failedLoginAttempts' | 'lastLoginAt'>,
    actor: AuditActor,
  ) => User
  createStudentUser: (
    payload: Pick<StudentImportCandidate, 'fullName' | 'code'>,
    actor: AuditActor,
  ) => User
  importStudentUsers: (
    payload: StudentImportCandidate[],
    actor: AuditActor,
  ) => StudentImportSummary
  setUserStatus: (userId: string, status: AccountStatus, actor: AuditActor) => User
  resetUserPassword: (userId: string, nextPassword: string, actor: AuditActor) => User
  updateCourse: (courseId: string, payload: Partial<Course>, actor: AuditActor) => Course
  createCourse: (payload: Omit<Course, 'id'>, actor: AuditActor) => Course
  softDeleteCourse: (courseId: string, actor: AuditActor) => Course
  updateSection: (sectionId: string, payload: Partial<Section>, actor: AuditActor) => Section
  createSection: (
    payload: Omit<Section, 'id' | 'registeredCount' | 'waitlistCount'> & {
      registeredCount?: number
      waitlistCount?: number
    },
    actor: AuditActor,
  ) => Section
  assignLecturer: (sectionId: string, lecturerId: string, actor: AuditActor) => Section
  updateRoomSchedule: (
    sectionId: string,
    payload: Pick<Section, 'room' | 'weekday' | 'startPeriod' | 'periodCount'>,
    actor: AuditActor,
  ) => Section
  updateSectionCapacity: (
    sectionId: string,
    capacity: number,
    actor: AuditActor,
    reason: string,
  ) => Section
  updateSettings: (payload: Partial<SystemSettings>, actor: AuditActor) => SystemSettings
  registerStudentToSection: (
    studentId: string,
    sectionId: string,
    actor: AuditActor,
  ) => {
    success: boolean
    message: string
    enrollment?: Enrollment | undefined
    pdfStatusCode?: EnrollmentConventionCode | undefined
    errorCode?: string | undefined
  }
  cancelEnrollment: (enrollmentId: string, actor: AuditActor, reason?: string) => Enrollment
  withdrawEnrollment: (enrollmentId: string, actor: AuditActor, reason: string) => Enrollment
  processWaitlist: (sectionId: string, actor: AuditActor) => Enrollment[]
  overrideEnrollment: (
    studentId: string,
    sectionId: string,
    reason: string,
    actor: AuditActor,
  ) => Enrollment
  createWishRequest: (
    payload: Omit<WishRequest, 'id' | 'createdAt' | 'status'>,
    actor: AuditActor,
  ) => WishRequest
  cancelWishRequest: (wishId: string, actor: AuditActor) => WishRequest
}

export const useDataStore = create<DataStoreState>((set, get) => ({
  users: initialSnapshot.users,
  courses: initialSnapshot.courses,
  sections: initialSnapshot.sections,
  enrollments: initialSnapshot.enrollments,
  logs: initialSnapshot.logs,
  settings: initialSnapshot.settings,
  wishes: initialSnapshot.wishes,
  semesters: seedSemesters,
  announcements: seedAnnouncements,
  courseRelations: seedCourseRelations,
  reportPresets,
  demoAccounts,
  resetDemoData: () => {
    const snapshot = createSeedSnapshot()
    persistSnapshot(snapshot)
    removeStorageKey(STORAGE_KEYS.auth)
    set(snapshot)
  },
  exportDemoData: () => {
    const { users, courses, sections, enrollments, logs, settings, wishes } = get()
    return JSON.stringify({ users, courses, sections, enrollments, logs, settings, wishes }, null, 2)
  },
  importDemoData: (rawData) => {
    try {
      const parsed = JSON.parse(rawData) as DemoSnapshot
      persistSnapshot(parsed)
      set(parsed)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Du lieu import khong hop le.' }
    }
  },
  appendAuditLog: (action, targetId, result, message, actor, metadata) => {
    const nextLogs = [...get().logs, buildAuditLog(get().logs, action, targetId, result, message, actor, metadata)]
    persistSnapshot({ logs: nextLogs })
    set({ logs: nextLogs })
  },
  updateUser: (userId, payload, actor) => {
    const currentUser = get().users.find((user) => user.id === userId)
    if (!currentUser) {
      throw new Error('Không tìm thấy tài khoản người dùng.')
    }

    const nextUsername = payload.username ?? currentUser.username
    const nextEmail = payload.email ?? currentUser.email
    const duplicate = get().users.some(
      (user) => user.id !== userId && (user.username === nextUsername || user.email === nextEmail),
    )

    if (duplicate) {
      throw new Error('Username hoac email da ton tai.')
    }

    const updatedUser = { ...currentUser, ...payload }
    const nextUsers = get().users.map((user) => (user.id === userId ? updatedUser : user))
    persistSnapshot({ users: nextUsers })
    set({ users: nextUsers })
    get().appendAuditLog('UPDATE_USER', userId, 'SUCCESS', `Cập nhật tài khoản ${updatedUser.username}.`, actor)
    return updatedUser
  },
  createUser: (payload, actor) => {
    const duplicate = get().users.some(
      (user) => user.username === payload.username || user.email === payload.email,
    )

    if (duplicate) {
      throw new Error('Username hoac email da ton tai.')
    }

    const nextUser = {
      id: createId('USR', get().users.length + 1),
      passwordDigest: toDigest('ptithcm2026'),
      failedLoginAttempts: 0,
      ...payload,
    } satisfies User

    const nextUsers = [...get().users, nextUser]
    persistSnapshot({ users: nextUsers })
    set({ users: nextUsers })
    get().appendAuditLog('CREATE_USER', nextUser.id, 'SUCCESS', `Tạo mới tài khoản ${nextUser.username}.`, actor)
    return nextUser
  },
  createStudentUser: (payload, actor) => {
    const result = get().importStudentUsers(
      [
        {
          fullName: payload.fullName,
          code: payload.code,
          rowNumber: 1,
        },
      ],
      actor,
    )

    const createdUser = result.created[0]

    if (!createdUser) {
      throw new Error(
        result.issues[0]?.message ??
          result.skipped[0]?.reason ??
          'Không thể tạo sinh viên mới từ dữ liệu đã nhập.',
      )
    }

    get().appendAuditLog(
      'CREATE_STUDENT_USER',
      createdUser.id,
      'SUCCESS',
      `Thêm mới sinh viên ${createdUser.code}.`,
      actor,
      { code: createdUser.code },
    )

    return createdUser
  },
  importStudentUsers: (payload, actor) => {
    const snapshot = get()
    const existingCodes = new Set(snapshot.users.map((user) => normalizeStudentCode(user.code)))
    const existingIds = new Set(snapshot.users.map((user) => user.id.toLowerCase()))
    const existingUsernames = new Set(snapshot.users.map((user) => user.username.toLowerCase()))
    const existingEmails = new Set(snapshot.users.map((user) => user.email.toLowerCase()))
    const batchCodes = new Set<string>()
    const created: User[] = []
    const skipped: StudentImportSummary['skipped'] = []
    const issues: StudentImportSummary['issues'] = []
    const studentBaseIndex = snapshot.users.filter((user) => user.roles.includes('STUDENT')).length

    payload.forEach((candidate, index) => {
      const normalizedCode = normalizeStudentCode(candidate.code)
      const normalizedFullName = candidate.fullName.trim().replace(/\s+/g, ' ')

      if (!normalizedFullName || !normalizedCode) {
        issues.push({
          rowNumber: candidate.rowNumber,
          message: 'Thiếu họ tên hoặc MSSV.',
        })
        return
      }

      if (batchCodes.has(normalizedCode)) {
        skipped.push({
          fullName: normalizedFullName,
          code: normalizedCode,
          rowNumber: candidate.rowNumber,
          reason: 'Trùng MSSV trong danh sách nhập.',
        })
        return
      }

      const email = `${normalizedCode.toLowerCase()}@student.ptithcm.edu.vn`

      if (
        existingCodes.has(normalizedCode) ||
        existingIds.has(normalizedCode.toLowerCase()) ||
        existingUsernames.has(normalizedCode.toLowerCase()) ||
        existingEmails.has(email)
      ) {
        skipped.push({
          fullName: normalizedFullName,
          code: normalizedCode,
          rowNumber: candidate.rowNumber,
          reason: 'MSSV đã tồn tại trong hệ thống.',
        })
        return
      }

      const nextUser = buildImportedStudentUser(
        {
          fullName: normalizedFullName,
          code: normalizedCode,
          rowNumber: candidate.rowNumber,
        },
        studentBaseIndex + index + 1,
      )

      created.push(nextUser)
      batchCodes.add(normalizedCode)
      existingCodes.add(normalizedCode)
      existingIds.add(nextUser.id.toLowerCase())
      existingUsernames.add(nextUser.username.toLowerCase())
      existingEmails.add(nextUser.email.toLowerCase())
    })

    if (created.length) {
      const nextUsers = [...snapshot.users, ...created]
      persistSnapshot({ users: nextUsers })
      set({ users: nextUsers })
    }

    get().appendAuditLog(
      'IMPORT_STUDENTS',
      'users',
      created.length ? 'SUCCESS' : 'WARNING',
      created.length
        ? `Nhập ${created.length} sinh viên mới vào hệ thống.`
        : 'Không có sinh viên hợp lệ nào được thêm mới.',
      actor,
      {
        createdCount: created.length,
        skippedCount: skipped.length,
        issueCount: issues.length,
      },
    )

    return {
      created,
      skipped,
      issues,
      defaultPassword: 'ptithcm2026',
    }
  },
  setUserStatus: (userId, status, actor) => {
    const updatedUser = get().updateUser(
      userId,
      {
        status,
        failedLoginAttempts: status === 'ACTIVE' ? 0 : get().users.find((user) => user.id === userId)?.failedLoginAttempts ?? 0,
      },
      actor,
    )
    get().appendAuditLog(
      status === 'LOCKED' ? 'LOCK_ACCOUNT' : 'SET_ACCOUNT_STATUS',
      userId,
      status === 'LOCKED' ? 'WARNING' : 'SUCCESS',
      `Cập nhật trạng thái tài khoản thành ${status}.`,
      actor,
      { status },
    )
    return updatedUser
  },
  resetUserPassword: (userId, nextPassword, actor) => {
    const updatedUser = get().updateUser(
      userId,
      {
        passwordDigest: toDigest(nextPassword),
        failedLoginAttempts: 0,
        status: 'ACTIVE',
      },
      actor,
    )
    get().appendAuditLog('RESET_PASSWORD', userId, 'SUCCESS', 'Đặt lại mật khẩu tài khoản.', actor)
    return updatedUser
  },
  updateCourse: (courseId, payload, actor) => {
    const currentCourse = get().courses.find((course) => course.id === courseId)
    if (!currentCourse) {
      throw new Error('Không tìm thấy học phần.')
    }

    const nextCode = payload.code ?? currentCourse.code
    const duplicate = get().courses.some((course) => course.id !== courseId && course.code === nextCode)
    if (duplicate) {
      throw new Error('Ma mon hoc da ton tai.')
    }

    const updatedCourse = { ...currentCourse, ...payload }
    const nextCourses = get().courses.map((course) => (course.id === courseId ? updatedCourse : course))
    persistSnapshot({ courses: nextCourses })
    set({ courses: nextCourses })
    get().appendAuditLog('UPDATE_COURSE', courseId, 'SUCCESS', `Cập nhật học phần ${updatedCourse.code}.`, actor)
    return updatedCourse
  },
  createCourse: (payload, actor) => {
    const duplicate = get().courses.some((course) => course.code === payload.code)
    if (duplicate) {
      throw new Error('Ma mon hoc da ton tai.')
    }

    const nextCourse = { id: createId('C', get().courses.length + 1), ...payload } satisfies Course
    const nextCourses = [...get().courses, nextCourse]
    persistSnapshot({ courses: nextCourses })
    set({ courses: nextCourses })
    get().appendAuditLog('CREATE_COURSE', nextCourse.id, 'SUCCESS', `Thêm mới học phần ${nextCourse.code}.`, actor)
    return nextCourse
  },
  softDeleteCourse: (courseId, actor) => {
    const currentCourse = get().courses.find((course) => course.id === courseId)
    if (!currentCourse) {
      throw new Error('Không tìm thấy học phần.')
    }

    const hasData = get().sections.some((section) => section.courseCode === currentCourse.code)
    if (hasData) {
      throw new Error('Không được xóa cùng học phần đã phát sinh dữ liệu.')
    }

    return get().updateCourse(courseId, { status: 'INACTIVE' }, actor)
  },
  updateSection: (sectionId, payload, actor) => {
    const currentSection = get().sections.find((section) => section.id === sectionId)
    if (!currentSection) {
      throw new Error('Không tìm thấy lớp học phần.')
    }

    const updatedSection = { ...currentSection, ...payload }
    const nextSections = get().sections.map((section) =>
      section.id === sectionId ? updatedSection : section,
    )
    persistSnapshot({ sections: nextSections })
    set({ sections: nextSections })
    get().appendAuditLog('UPDATE_SECTION', sectionId, 'SUCCESS', `Cập nhật lớp ${updatedSection.sectionCode}.`, actor)
    return updatedSection
  },
  createSection: (payload, actor) => {
    const duplicate = get().sections.some(
      (section) => section.sectionCode === payload.sectionCode && section.semesterId === payload.semesterId,
    )
    if (duplicate) {
      throw new Error('Mã lớp học phần phải duy nhất trong học kỳ.')
    }

    const lecturerConflict = get().sections.some(
      (section) =>
        section.semesterId === payload.semesterId &&
        section.lecturerId === payload.lecturerId &&
        section.weekday === payload.weekday &&
        overlaps(section.startPeriod, section.periodCount, payload.startPeriod, payload.periodCount),
    )
    if (lecturerConflict) {
      throw new Error('Giảng viên bị trùng lịch giảng dạy.')
    }

    const roomConflict = get().sections.some(
      (section) =>
        section.semesterId === payload.semesterId &&
        section.room === payload.room &&
        section.weekday === payload.weekday &&
        overlaps(section.startPeriod, section.periodCount, payload.startPeriod, payload.periodCount),
    )
    if (roomConflict) {
      throw new Error('Phòng học đã được gán tại khung giờ này.')
    }

    const nextSection = {
      id: createId('SEC', get().sections.length + 1),
      registeredCount: payload.registeredCount ?? 0,
      waitlistCount: payload.waitlistCount ?? 0,
      ...payload,
    } satisfies Section

    const nextSections = [...get().sections, nextSection]
    persistSnapshot({ sections: nextSections })
    set({ sections: nextSections })
    get().appendAuditLog('CREATE_SECTION', nextSection.id, 'SUCCESS', `Tạo mới lớp ${nextSection.sectionCode}.`, actor)
    return nextSection
  },
  assignLecturer: (sectionId, lecturerId, actor) => {
    const currentSection = get().sections.find((section) => section.id === sectionId)
    if (!currentSection) {
      throw new Error('Không tìm thấy lớp học phần.')
    }

    const conflict = get().sections.some(
      (section) =>
        section.id !== sectionId &&
        section.semesterId === currentSection.semesterId &&
        section.lecturerId === lecturerId &&
        section.weekday === currentSection.weekday &&
        overlaps(
          section.startPeriod,
          section.periodCount,
          currentSection.startPeriod,
          currentSection.periodCount,
        ),
    )

    if (conflict) {
      throw new Error('Giảng viên bị trùng lịch giảng dạy.')
    }

    return get().updateSection(sectionId, { lecturerId }, actor)
  },
  updateRoomSchedule: (sectionId, payload, actor) => {
    const currentSection = get().sections.find((section) => section.id === sectionId)
    if (!currentSection) {
      throw new Error('Không tìm thấy lớp học phần.')
    }

    const conflict = get().sections.some(
      (section) =>
        section.id !== sectionId &&
        section.semesterId === currentSection.semesterId &&
        section.room === payload.room &&
        section.weekday === payload.weekday &&
        overlaps(section.startPeriod, section.periodCount, payload.startPeriod, payload.periodCount),
    )
    if (conflict) {
      throw new Error('Tại cùng thời điểm, một phòng chỉ được gán cho một lớp.')
    }

    return get().updateSection(sectionId, payload, actor)
  },
  updateSectionCapacity: (sectionId, capacity, actor, reason) => {
    const currentSection = get().sections.find((section) => section.id === sectionId)
    if (!currentSection) {
      throw new Error('Không tìm thấy lớp học phần.')
    }

    const updatedSection = {
      ...currentSection,
      capacity,
      status: getSectionStatus({ ...currentSection, capacity }),
    } satisfies Section

    const nextSections = get().sections.map((section) =>
      section.id === sectionId ? updatedSection : section,
    )
    persistSnapshot({ sections: nextSections })
    set({ sections: nextSections })
    get().appendAuditLog(
      'UPDATE_SECTION_CAPACITY',
      sectionId,
      'SUCCESS',
      `Dieu chinh si so toi da cua ${currentSection.sectionCode} thanh ${capacity}.`,
      actor,
      { reason, capacity },
    )
    return updatedSection
  },
  updateSettings: (payload, actor) => {
    const nextSettings = { ...get().settings, ...payload }
    persistSnapshot({ settings: nextSettings })
    set({ settings: nextSettings })
    get().appendAuditLog('UPDATE_SETTINGS', 'system-settings', 'SUCCESS', 'Cập nhật tham số hệ thống.', actor)
    return nextSettings
  },
  registerStudentToSection: (studentId, sectionId, actor) => {
    const snapshot = get()
    const student = snapshot.users.find((user) => user.id === studentId)
    const section = snapshot.sections.find((item) => item.id === sectionId)
    const targetCourse = snapshot.courses.find((course) => course.code === section?.courseCode)

    const result = evaluateEnrollmentEligibility({
      nowIso: snapshot.settings.simulationNow,
      student,
      section,
      targetCourse,
      courses: snapshot.courses,
      sections: snapshot.sections,
      enrollments: snapshot.enrollments,
      settings: snapshot.settings,
    })

    if (!result.canRegister || !result.finalStatus || !section || !student) {
      get().appendAuditLog(
        'REGISTER_COURSE',
        sectionId,
        'FAILURE',
        result.message,
        actor,
        { errorCode: result.errorCode ?? null },
      )
      return {
        success: false,
        message: result.message,
        ...(result.pdfStatusCode ? { pdfStatusCode: result.pdfStatusCode } : {}),
        ...(result.errorCode ? { errorCode: result.errorCode } : {}),
      }
    }

    const nextEnrollment = {
      id: createId('ENR', snapshot.enrollments.length + 1),
      studentId,
      sectionId,
      semesterId: snapshot.settings.currentSemesterId,
      status: result.finalStatus,
      createdAt: snapshot.settings.simulationNow,
      updatedAt: snapshot.settings.simulationNow,
      ...(result.finalStatus === 'WAITLISTED'
        ? {
            waitlistOrder:
              snapshot.enrollments.filter(
                (enrollment) => enrollment.sectionId === sectionId && enrollment.status === 'WAITLISTED',
              ).length + 1,
          }
        : {}),
      timeline: [
        buildTimelineItem(
          actor.actorId,
          actor.actorRole,
          result.finalStatus,
          result.message,
          snapshot.settings.simulationNow,
        ),
      ],
    } satisfies Enrollment

    const nextEnrollments = [...snapshot.enrollments, nextEnrollment]
    const nextSections = snapshot.sections.map((item) => {
      if (item.id !== sectionId) {
        return item
      }

      const registeredCount = result.finalStatus === 'REGISTERED' ? item.registeredCount + 1 : item.registeredCount
      const waitlistCount = result.finalStatus === 'WAITLISTED' ? item.waitlistCount + 1 : item.waitlistCount

      return {
        ...item,
        registeredCount,
        waitlistCount,
        status: getSectionStatus({ ...item, registeredCount, waitlistCount }),
      } satisfies Section
    })

    persistSnapshot({ enrollments: nextEnrollments, sections: nextSections })
    set({ enrollments: nextEnrollments, sections: nextSections })
    get().appendAuditLog(
      result.finalStatus === 'WAITLISTED' ? 'WAITLIST_COURSE' : 'REGISTER_COURSE',
      sectionId,
      result.finalStatus === 'WAITLISTED' ? 'INFO' : 'SUCCESS',
      result.message,
      actor,
    )

    return { success: true, message: result.message, enrollment: nextEnrollment, pdfStatusCode: result.pdfStatusCode }
  },
  cancelEnrollment: (enrollmentId, actor, reason) => {
    const snapshot = get()
    const currentEnrollment = snapshot.enrollments.find((enrollment) => enrollment.id === enrollmentId)
    if (!currentEnrollment) {
      throw new Error('Không tìm thấy thông tin đăng ký.')
    }

    if (!canCancelEnrollment(snapshot.settings.simulationNow, snapshot.settings)) {
      throw new Error('Ngoài thời gian điều chỉnh đăng ký.')
    }

    if (!['REGISTERED', 'WAITLISTED'].includes(currentEnrollment.status)) {
      throw new Error('Không thể hủy học phần ở trạng thái hiện tại.')
    }

    const updatedEnrollment = {
      ...currentEnrollment,
      status: 'CANCELLED' as const,
      updatedAt: snapshot.settings.simulationNow,
      cancelledAt: snapshot.settings.simulationNow,
      timeline: [
        ...currentEnrollment.timeline,
        buildTimelineItem(
          actor.actorId,
          actor.actorRole,
          'CANCELLED',
          reason ?? 'Hủy học phần trong cửa sổ adjustment.',
          snapshot.settings.simulationNow,
        ),
      ],
    }

    const nextEnrollments = snapshot.enrollments.map((enrollment) =>
      enrollment.id === enrollmentId ? updatedEnrollment : enrollment,
    )
    const nextSections = snapshot.sections.map((section) => {
      if (section.id !== currentEnrollment.sectionId) {
        return section
      }

      const registeredCount =
        currentEnrollment.status === 'REGISTERED' ? Math.max(section.registeredCount - 1, 0) : section.registeredCount
      const waitlistCount =
        currentEnrollment.status === 'WAITLISTED' ? Math.max(section.waitlistCount - 1, 0) : section.waitlistCount

      return {
        ...section,
        registeredCount,
        waitlistCount,
        status: getSectionStatus({ ...section, registeredCount, waitlistCount }),
      } satisfies Section
    })

    persistSnapshot({ enrollments: nextEnrollments, sections: nextSections })
    set({ enrollments: nextEnrollments, sections: nextSections })
    get().appendAuditLog('CANCEL_ENROLLMENT', enrollmentId, 'SUCCESS', 'Hủy đăng ký học phần thành công.', actor)
    return updatedEnrollment
  },
  withdrawEnrollment: (enrollmentId, actor, reason) => {
    const snapshot = get()
    const currentEnrollment = snapshot.enrollments.find((enrollment) => enrollment.id === enrollmentId)
    if (!currentEnrollment) {
      throw new Error('Không tìm thấy thông tin đăng ký.')
    }

    if (!canWithdrawEnrollment(snapshot.settings.simulationNow, snapshot.settings)) {
      throw new Error('Ngoài cửa sổ rút học phần.')
    }

    if (currentEnrollment.status !== 'REGISTERED') {
      throw new Error('Chỉ có thể rút học phần đã đăng ký.')
    }

    const updatedEnrollment = {
      ...currentEnrollment,
      status: 'DROPPED' as const,
      updatedAt: snapshot.settings.simulationNow,
      droppedAt: snapshot.settings.simulationNow,
      timeline: [
        ...currentEnrollment.timeline,
        buildTimelineItem(actor.actorId, actor.actorRole, 'DROPPED', reason, snapshot.settings.simulationNow),
      ],
    }

    const nextEnrollments = snapshot.enrollments.map((enrollment) =>
      enrollment.id === enrollmentId ? updatedEnrollment : enrollment,
    )
    const nextSections = snapshot.sections.map((section) => {
      if (section.id !== currentEnrollment.sectionId) {
        return section
      }

      const registeredCount = Math.max(section.registeredCount - 1, 0)
      return {
        ...section,
        registeredCount,
        status: getSectionStatus({ ...section, registeredCount }),
      } satisfies Section
    })

    persistSnapshot({ enrollments: nextEnrollments, sections: nextSections })
    set({ enrollments: nextEnrollments, sections: nextSections })
    get().appendAuditLog('WITHDRAW_ENROLLMENT', enrollmentId, 'SUCCESS', 'Rút học phần thành công.', actor, { reason })
    return updatedEnrollment
  },
  processWaitlist: (sectionId, actor) => {
    const snapshot = get()
    const targetSection = snapshot.sections.find((section) => section.id === sectionId)
    if (!targetSection) {
      throw new Error('Không tìm thấy lớp học phần.')
    }

    let nextSections = [...snapshot.sections]
    let nextEnrollments = [...snapshot.enrollments]
    const waitlisted = snapshot.enrollments
      .filter((enrollment) => enrollment.sectionId === sectionId && enrollment.status === 'WAITLISTED')
      .sort((left, right) => (left.waitlistOrder ?? 999) - (right.waitlistOrder ?? 999))

    const promoted: Enrollment[] = []

    for (const candidate of waitlisted) {
      const latestSection = nextSections.find((section) => section.id === sectionId)
      if (!latestSection || latestSection.registeredCount >= latestSection.capacity) {
        break
      }

      const student = snapshot.users.find((user) => user.id === candidate.studentId)
      const targetCourse = snapshot.courses.find((course) => course.code === latestSection.courseCode)
      const eligibility = evaluateEnrollmentEligibility({
        nowIso: snapshot.settings.simulationNow,
        student,
        section: latestSection,
        targetCourse,
        courses: snapshot.courses,
        sections: nextSections,
        enrollments: nextEnrollments.filter((enrollment) => enrollment.id !== candidate.id),
        settings: snapshot.settings,
      })

      if (!eligibility.canRegister || eligibility.finalStatus !== 'REGISTERED') {
        continue
      }

      const promotedEnrollment = {
        ...candidate,
        status: 'REGISTERED' as const,
        updatedAt: snapshot.settings.simulationNow,
        timeline: [
          ...candidate.timeline,
          buildTimelineItem(
            actor.actorId,
            actor.actorRole,
            'REGISTERED',
            'Được chuyển từ danh sách chờ sang đăng ký thành công.',
            snapshot.settings.simulationNow,
          ),
        ],
      }

      nextEnrollments = nextEnrollments.map((enrollment) =>
        enrollment.id === candidate.id ? promotedEnrollment : enrollment,
      )
      nextSections = nextSections.map((section) => {
        if (section.id !== sectionId) {
          return section
        }

        const registeredCount = section.registeredCount + 1
        const waitlistCount = Math.max(section.waitlistCount - 1, 0)
        return {
          ...section,
          registeredCount,
          waitlistCount,
          status: getSectionStatus({ ...section, registeredCount, waitlistCount }),
        } satisfies Section
      })
      promoted.push(promotedEnrollment)
    }

    persistSnapshot({ enrollments: nextEnrollments, sections: nextSections })
    set({ enrollments: nextEnrollments, sections: nextSections })
    get().appendAuditLog(
      'PROCESS_WAITLIST',
      sectionId,
      promoted.length ? 'SUCCESS' : 'INFO',
      promoted.length ? `Đã xử lý ${promoted.length} sinh viên từ waitlist.` : 'Không có waitlist nào đủ điều kiện.',
      actor,
      { promotedCount: promoted.length },
    )
    return promoted
  },
  overrideEnrollment: (studentId, sectionId, reason, actor) => {
    if (!reason.trim()) {
      throw new Error('Lý do override là bắt buộc.')
    }

    const snapshot = get()
    const currentEnrollment = snapshot.enrollments.find(
      (enrollment) =>
        enrollment.studentId === studentId &&
        enrollment.sectionId === sectionId &&
        ['REGISTERED', 'WAITLISTED'].includes(enrollment.status),
    )

    const nextEnrollment = currentEnrollment
      ? {
          ...currentEnrollment,
          status: 'REGISTERED' as const,
          updatedAt: snapshot.settings.simulationNow,
          timeline: [
            ...currentEnrollment.timeline,
            buildTimelineItem(actor.actorId, actor.actorRole, 'REGISTERED', `Override: ${reason}`, snapshot.settings.simulationNow),
          ],
        }
      : {
          id: createId('ENR', snapshot.enrollments.length + 1),
          studentId,
          sectionId,
          semesterId: snapshot.settings.currentSemesterId,
          status: 'REGISTERED' as const,
          createdAt: snapshot.settings.simulationNow,
          updatedAt: snapshot.settings.simulationNow,
          timeline: [
            buildTimelineItem(actor.actorId, actor.actorRole, 'REGISTERED', `Override: ${reason}`, snapshot.settings.simulationNow),
          ],
        }

    const nextEnrollments = currentEnrollment
      ? snapshot.enrollments.map((enrollment) =>
          enrollment.id === currentEnrollment.id ? nextEnrollment : enrollment,
        )
      : [...snapshot.enrollments, nextEnrollment]

    const nextSections = snapshot.sections.map((section) => {
      if (section.id !== sectionId) {
        return section
      }

      const registeredCount = section.registeredCount + (currentEnrollment?.status === 'REGISTERED' ? 0 : 1)
      const waitlistCount =
        currentEnrollment?.status === 'WAITLISTED' ? Math.max(section.waitlistCount - 1, 0) : section.waitlistCount

      return {
        ...section,
        registeredCount,
        waitlistCount,
        status: getSectionStatus({ ...section, registeredCount, waitlistCount }),
      } satisfies Section
    })

    persistSnapshot({ enrollments: nextEnrollments, sections: nextSections })
    set({ enrollments: nextEnrollments, sections: nextSections })
    get().appendAuditLog('OVERRIDE_ENROLLMENT', nextEnrollment.id, 'SUCCESS', 'Override đăng ký học phần.', actor, { reason })
    return nextEnrollment
  },
  createWishRequest: (payload, actor) => {
    const nextWish = {
      id: createId('WISH', get().wishes.length + 1),
      createdAt: get().settings.simulationNow,
      status: 'PENDING' as const,
      ...payload,
    } satisfies WishRequest

    const nextWishes = [...get().wishes, nextWish]
    persistSnapshot({ wishes: nextWishes })
    set({ wishes: nextWishes })
    get().appendAuditLog('CREATE_WISH_REQUEST', nextWish.id, 'SUCCESS', 'Gửi nguyện vọng thành công.', actor)
    return nextWish
  },
  cancelWishRequest: (wishId, actor) => {
    const currentWish = get().wishes.find((wish) => wish.id === wishId)
    if (!currentWish) {
      throw new Error('Không tìm thấy nguyện vọng.')
    }

    const updatedWish = { ...currentWish, status: 'CANCELLED' as const }
    const nextWishes = get().wishes.map((wish) => (wish.id === wishId ? updatedWish : wish))
    persistSnapshot({ wishes: nextWishes })
    set({ wishes: nextWishes })
    get().appendAuditLog('CANCEL_WISH_REQUEST', wishId, 'INFO', 'Hủy nguyện vọng.', actor)
    return updatedWish
  },
}))

