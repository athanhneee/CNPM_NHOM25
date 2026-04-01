import { toDigest } from './utils.ts'
import {
  buildCitizenId,
  buildPhone,
  formatSeedDate,
  getAcademicPeriod,
  getBirthYearFromStudentCode,
  getCohortLabel,
  getMajorMappingFromStudentCode,
  getStudentClass,
  getYearLevel,
} from '../mocks/seed/ptit-helpers.ts'
import type { User } from '../types/user.ts'

export interface StudentImportCandidate {
  fullName: string
  code: string
  rowNumber: number
}

export interface StudentImportIssue {
  rowNumber: number
  message: string
}

export interface StudentImportSkippedRow extends StudentImportCandidate {
  reason: string
}

export interface StudentImportPreview {
  candidates: StudentImportCandidate[]
  issues: StudentImportIssue[]
  sourceLabel: string
}

export interface StudentImportSummary {
  created: User[]
  skipped: StudentImportSkippedRow[]
  issues: StudentImportIssue[]
  defaultPassword: string
}

export const STUDENT_IMPORT_DEFAULT_PASSWORD = 'ptithcm2026'
export const STUDENT_IMPORT_ACCEPT = '.xlsx,.xls,.csv,.tsv,.txt'

const FEMALE_GIVEN_NAMES = new Set([
  'Anh',
  'Ân',
  'Bình',
  'Châu',
  'Duyên',
  'Hiên',
  'Hiền',
  'Nhi',
  'Ngọc',
  'Phương',
  'Quỳnh',
  'Thi',
  'Thủy',
  'Trâm',
])

const HOME_TOWN_SEEDS = [
  'Thành phố Hồ Chí Minh',
  'Bình Định',
  'Gia Lai',
  'Đắk Lắk',
  'Khánh Hòa',
  'Đồng Nai',
  'Phú Yên',
  'Tiền Giang',
]

const RESIDENCE_SEEDS = [
  'Phường Linh Trung, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường Hiệp Bình Chánh, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường Tăng Nhơn Phú A, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường Linh Tây, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường Trường Thọ, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường 12, quận Gò Vấp, Thành phố Hồ Chí Minh',
  'Phường 13, quận Bình Thạnh, Thành phố Hồ Chí Minh',
  'Phường Tây Thạnh, quận Tân Phú, Thành phố Hồ Chí Minh',
]

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function simplifyHeaderValue(value: string) {
  return normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

function toPlainString(value: unknown) {
  return normalizeWhitespace(String(value ?? ''))
}

function splitTextLine(line: string) {
  if (line.includes('\t')) {
    return line.split('\t')
  }

  if (line.includes(';')) {
    return line.split(';')
  }

  if (line.includes(',')) {
    return line.split(',')
  }

  return [line]
}

function looksLikeHeader(fullName: string, code: string) {
  const nameToken = simplifyHeaderValue(fullName)
  const codeToken = simplifyHeaderValue(code)
  const nameLooksLikeHeader = ['hoten', 'hovaten', 'ten', 'fullname'].includes(nameToken)
  const codeLooksLikeHeader = ['mssv', 'masinhvien', 'studentid', 'studentscode'].includes(codeToken)

  return nameLooksLikeHeader && codeLooksLikeHeader
}

function isLikelyStudentCode(value: string) {
  return /^[A-Z0-9]{6,20}$/.test(value)
}

export function normalizeStudentCode(value: string) {
  return normalizeWhitespace(value).replace(/\s+/g, '').toUpperCase()
}

export function parseStudentGrid(
  rows: unknown[][],
  sourceLabel = 'Danh sách sinh viên',
): StudentImportPreview {
  const candidates: StudentImportCandidate[] = []
  const issues: StudentImportIssue[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    const cells = Array.isArray(row) ? row.map(toPlainString) : [toPlainString(row)]
    const fullName = normalizeWhitespace(cells[0] ?? '')
    const code = normalizeStudentCode(cells[1] ?? '')

    if (!fullName && !code) {
      return
    }

    if (looksLikeHeader(fullName, code)) {
      return
    }

    if (!fullName || !code) {
      issues.push({
        rowNumber,
        message: 'Thiếu họ tên hoặc MSSV ở một trong hai cột đầu tiên.',
      })
      return
    }

    if (!isLikelyStudentCode(code)) {
      issues.push({
        rowNumber,
        message: `MSSV "${code}" không đúng định dạng mong đợi.`,
      })
      return
    }

    candidates.push({
      fullName,
      code,
      rowNumber,
    })
  })

  return {
    candidates,
    issues,
    sourceLabel,
  }
}

export function parseStudentText(raw: string, sourceLabel = 'Nội dung dán thủ công') {
  const rows = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => splitTextLine(line.trim()))

  return parseStudentGrid(rows, sourceLabel)
}

export async function parseStudentImportFile(file: File) {
  const normalizedName = file.name.toLowerCase()

  if (normalizedName.endsWith('.xlsx') || normalizedName.endsWith('.xls')) {
    const xlsx = await import('xlsx')
    const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0] ?? '']

    if (!firstSheet) {
      return {
        candidates: [],
        issues: [{ rowNumber: 1, message: 'Không tìm thấy sheet dữ liệu trong tệp Excel.' }],
        sourceLabel: file.name,
      } satisfies StudentImportPreview
    }

    const rows = xlsx.utils.sheet_to_json<unknown[]>(firstSheet, {
      header: 1,
      raw: false,
      defval: '',
    })

    return parseStudentGrid(rows, file.name)
  }

  return parseStudentText(await file.text(), file.name)
}

function inferGender(fullName: string) {
  const givenName = fullName.split(' ').filter(Boolean).pop() ?? ''
  return FEMALE_GIVEN_NAMES.has(givenName) ? 'Nữ' : 'Nam'
}

export function buildImportedStudentUser(candidate: StudentImportCandidate, sequence: number): User {
  const mapping = getMajorMappingFromStudentCode(candidate.code)
  const specialization =
    mapping.specializationPool[sequence % mapping.specializationPool.length] ?? mapping.majorName
  const homeTown = HOME_TOWN_SEEDS[sequence % HOME_TOWN_SEEDS.length] ?? 'Thành phố Hồ Chí Minh'
  const address = RESIDENCE_SEEDS[sequence % RESIDENCE_SEEDS.length] ?? 'Thành phố Hồ Chí Minh'
  const admissionYear = Number(`20${candidate.code.slice(1, 3)}`)
  const completedCreditsBase =
    mapping.classificationStatus === 'REVIEW' ? 0 : mapping.majorCode === '7480202' ? 12 : 15

  return {
    id: candidate.code,
    username: candidate.code,
    email: `${candidate.code.toLowerCase()}@student.ptithcm.edu.vn`,
    fullName: normalizeWhitespace(candidate.fullName),
    phone: buildPhone(sequence + 600),
    secondaryEmail: `${candidate.code.toLowerCase()}@gmail.com`,
    roles: ['STUDENT'],
    status: 'ACTIVE',
    campus: 'Hồ Chí Minh',
    department: mapping.department,
    code: candidate.code,
    passwordDigest: toDigest(STUDENT_IMPORT_DEFAULT_PASSWORD),
    failedLoginAttempts: 0,
    dateOfBirth: formatSeedDate(
      getBirthYearFromStudentCode(candidate.code),
      (sequence % 12) + 1,
      ((sequence * 2) % 28) + 1,
    ),
    gender: inferGender(candidate.fullName),
    citizenId: buildCitizenId(sequence + 600),
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    birthPlace: homeTown,
    address,
    homeTown,
    program: mapping.majorName,
    cohort: getCohortLabel(candidate.code),
    faculty: mapping.faculty,
    majorCode: mapping.majorCode,
    majorName: mapping.majorName,
    studentClass: getStudentClass(candidate.code, mapping),
    educationProgram: 'Đại học chính quy',
    academicPeriod: getAcademicPeriod(candidate.code),
    studentStatus: 'Đang học',
    classificationStatus: mapping.classificationStatus,
    specialization,
    yearLevel: getYearLevel(candidate.code),
    gpa: Number((2.72 + ((sequence % 7) * 0.09) + (admissionYear <= 2022 ? 0.08 : 0)).toFixed(2)),
    attendanceRate: Number((0.84 + ((sequence % 5) * 0.02)).toFixed(2)),
    completedCredits: completedCreditsBase + ((sequence % 6) * 3) + (admissionYear <= 2022 ? 9 : 0),
    interests:
      mapping.majorCode === '7480202'
        ? ['An toàn mạng', 'Giám sát an ninh', 'Bảo mật ứng dụng']
        : mapping.classificationStatus === 'REVIEW'
          ? ['Cần rà soát chương trình']
          : ['Phát triển phần mềm', 'Dữ liệu', 'Hệ thống thông tin'],
    bio:
      mapping.classificationStatus === 'REVIEW'
        ? 'Sinh viên được thêm từ màn hình quản trị và đang chờ rà soát lại mã ngành.'
        : `Sinh viên ${mapping.majorName.toLowerCase()} được thêm từ màn hình quản trị để phục vụ demo học vụ.`,
  }
}
