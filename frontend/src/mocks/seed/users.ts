import { toDigest } from '@/lib/utils'
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
  parseStudentSeed,
} from '@/mocks/seed/ptit-helpers'
import { studentSeedRaw } from '@/mocks/seed/student-seed-raw'
import type { User } from '@/types/user'

const demoPasswordDigest = toDigest('ptithcm2026')
const lockedStudentCode = 'N23DCCN020'

const femaleGivenNames = new Set([
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

const homeTownSeeds = [
  'Thành phố Hồ Chí Minh',
  'Bình Định',
  'Gia Lai',
  'Đắk Lắk',
  'Khánh Hòa',
  'Đồng Nai',
  'Phú Yên',
  'Tiền Giang',
  'Long An',
  'Bình Thuận',
]

const residenceSeeds = [
  'Phường Linh Trung, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường Hiệp Bình Chánh, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường Tăng Nhơn Phú A, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường Linh Tây, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường Trường Thọ, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường 12, quận Gò Vấp, Thành phố Hồ Chí Minh',
  'Phường 13, quận Bình Thạnh, Thành phố Hồ Chí Minh',
  'Phường Tây Thạnh, quận Tân Phú, Thành phố Hồ Chí Minh',
]

const staffResidenceSeeds = [
  'Khu đô thị Đại học Quốc gia, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường An Phú, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
  'Phường Tân Phú, quận 7, Thành phố Hồ Chí Minh',
  'Phường 4, quận Tân Bình, Thành phố Hồ Chí Minh',
]

function inferGender(fullName: string) {
  const givenName = fullName.split(' ').filter(Boolean).pop() ?? ''
  return femaleGivenNames.has(givenName) ? 'Nữ' : 'Nam'
}

function createStudentProfile(code: string, fullName: string, index: number) {
  const mapping = getMajorMappingFromStudentCode(code)
  const specialization =
    mapping.specializationPool[index % mapping.specializationPool.length] ?? mapping.majorName
  const homeTown = homeTownSeeds[index % homeTownSeeds.length] ?? 'Thành phố Hồ Chí Minh'
  const address = residenceSeeds[index % residenceSeeds.length] ?? 'Thành phố Hồ Chí Minh'
  const cohortYear = Number(`20${code.slice(1, 3)}`)
  const completedCreditsBase = mapping.majorCode === '7480202' ? 42 : 45

  return {
    id: code,
    username: code,
    email: `${code.toLowerCase()}@student.ptithcm.edu.vn`,
    fullName,
    phone: buildPhone(index),
    roles: ['STUDENT'],
    status: code === lockedStudentCode ? 'LOCKED' : 'ACTIVE',
    campus: 'Hồ Chí Minh',
    department: mapping.department,
    code,
    passwordDigest: demoPasswordDigest,
    failedLoginAttempts: code === lockedStudentCode ? 5 : 0,
    secondaryEmail: `${code.toLowerCase()}@gmail.com`,
    dateOfBirth: formatSeedDate(
      getBirthYearFromStudentCode(code),
      (index % 12) + 1,
      ((index * 3) % 28) + 1,
    ),
    gender: inferGender(fullName),
    citizenId: buildCitizenId(index + 1),
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    birthPlace: homeTown,
    address,
    homeTown,
    program: mapping.majorName,
    cohort: getCohortLabel(code),
    faculty: mapping.faculty,
    majorCode: mapping.majorCode,
    majorName: mapping.majorName,
    studentClass: getStudentClass(code, mapping),
    educationProgram: 'Đại học chính quy',
    academicPeriod: getAcademicPeriod(code),
    studentStatus: 'Đang học',
    classificationStatus: mapping.classificationStatus,
    specialization,
    yearLevel: getYearLevel(code),
    gpa: Number((2.82 + ((index % 9) * 0.11) + (cohortYear <= 2022 ? 0.08 : 0)).toFixed(2)),
    attendanceRate: Number((0.82 + ((index % 6) * 0.025)).toFixed(2)),
    completedCredits: completedCreditsBase + ((index % 7) * 3) + (cohortYear <= 2022 ? 12 : 0),
    interests:
      mapping.majorCode === '7480202'
        ? ['An toàn mạng', 'Phân tích log', 'Bảo mật hệ thống']
        : ['Phát triển phần mềm', 'Dữ liệu', 'Hệ thống thông tin'],
    bio:
      mapping.classificationStatus === 'REVIEW'
        ? 'Sinh viên có tiền tố mã cần rà soát thêm để đối chiếu chương trình đào tạo trong bản demo.'
        : `Sinh viên ${mapping.majorName.toLowerCase()} dùng cho kịch bản đăng ký học phần, thời khóa biểu và thống kê học vụ tại PTIT HCM.`,
  } satisfies User
}

function createStaffProfile(index: number, fullName: string, email: string) {
  const homeTown = homeTownSeeds[(index + 2) % homeTownSeeds.length] ?? 'Thành phố Hồ Chí Minh'
  return {
    secondaryEmail: email.replace('@ptithcm.edu.vn', '@gmail.com'),
    dateOfBirth: formatSeedDate(1982 + (index % 10), ((index + 4) % 12) + 1, ((index * 2) % 28) + 1),
    gender: inferGender(fullName),
    citizenId: buildCitizenId(index + 301),
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    birthPlace: homeTown,
    homeTown,
    address: staffResidenceSeeds[index % staffResidenceSeeds.length] ?? 'Thành phố Hồ Chí Minh',
  }
}

function buildStaffUsers(
  seeds: Array<
    Pick<User, 'id' | 'username' | 'email' | 'fullName' | 'roles' | 'department' | 'code' | 'title' | 'position' | 'specialization'> & {
      bio: string
    }
  >,
) {
  return seeds.map((seed, index): User => ({
    phone: buildPhone(index, '091'),
    status: 'ACTIVE',
    campus: 'Hồ Chí Minh',
    passwordDigest: demoPasswordDigest,
    failedLoginAttempts: 0,
    ...seed,
    ...createStaffProfile(index, seed.fullName, seed.email),
  }))
}

const studentUsers = parseStudentSeed(studentSeedRaw).map((student, index) =>
  createStudentProfile(student.code, student.fullName, index),
)

const lecturerUsers = buildStaffUsers([
  { id: 'L001', username: 'minh.tuan', email: 'minh.tuan@ptithcm.edu.vn', fullName: 'Nguyễn Minh Tuấn', roles: ['LECTURER'], department: 'Khoa Công nghệ thông tin', code: 'GV001', title: 'Tiến sĩ', position: 'Giảng viên', specialization: 'Công nghệ phần mềm', bio: 'Phụ trách các học phần phát triển phần mềm và kiến trúc hệ thống.' },
  { id: 'L002', username: 'thu.binh', email: 'thu.binh@ptithcm.edu.vn', fullName: 'Nguyễn Thị Thu Bình', roles: ['LECTURER'], department: 'Khoa Công nghệ thông tin', code: 'GV002', title: 'Thạc sĩ', position: 'Giảng viên', specialization: 'Cơ sở dữ liệu', bio: 'Giảng dạy cơ sở dữ liệu, phân tích hệ thống và dữ liệu doanh nghiệp.' },
  { id: 'L003', username: 'ngoc.duy', email: 'ngoc.duy@ptithcm.edu.vn', fullName: 'Nguyễn Ngọc Duy', roles: ['LECTURER'], department: 'Khoa Công nghệ thông tin', code: 'GV003', title: 'Thạc sĩ', position: 'Giảng viên', specialization: 'Hệ thống thông tin', bio: 'Theo sát các lớp phân tích nghiệp vụ và hệ thống thông tin.' },
  { id: 'L004', username: 'ngoc.diep', email: 'ngoc.diep@ptithcm.edu.vn', fullName: 'Lưu Ngọc Diệp', roles: ['LECTURER'], department: 'Khoa Công nghệ thông tin', code: 'GV004', title: 'Thạc sĩ', position: 'Giảng viên', specialization: 'Mạng và điện toán đám mây', bio: 'Phụ trách lớp mạng máy tính, hệ điều hành và điện toán đám mây.' },
  { id: 'L005', username: 'anh.hao', email: 'anh.hao@ptithcm.edu.vn', fullName: 'Nguyễn Anh Hào', roles: ['LECTURER'], department: 'Khoa Công nghệ thông tin', code: 'GV005', title: 'Thạc sĩ', position: 'Giảng viên', specialization: 'Kiến trúc phần mềm', bio: 'Cố vấn chuyên môn cho nhóm đồ án và học phần kiến trúc phần mềm.' },
  { id: 'L006', username: 'linh.dm', email: 'linh.dm@ptithcm.edu.vn', fullName: 'Đàm Minh Lịnh', roles: ['LECTURER'], department: 'Khoa Công nghệ thông tin', code: 'GV006', title: 'Nghiên cứu sinh', position: 'Giảng viên', specialization: 'Trí tuệ nhân tạo', bio: 'Giảng dạy AI, học máy và học phần định hướng khoa học máy tính.' },
  { id: 'L007', username: 'nghia.hiep', email: 'nghia.hiep@ptithcm.edu.vn', fullName: 'Phan Nghĩa Hiệp', roles: ['LECTURER'], department: 'Khoa Công nghệ thông tin', code: 'GV007', title: 'Thạc sĩ', position: 'Giảng viên', specialization: 'Phát triển ứng dụng web', bio: 'Hỗ trợ học phần web, UX và chuyên đề doanh nghiệp.' },
  { id: 'L008', username: 'quang.huy', email: 'quang.huy@ptithcm.edu.vn', fullName: 'Lê Quang Huy', roles: ['LECTURER'], department: 'Khoa Công nghệ thông tin', code: 'GV008', title: 'Thạc sĩ', position: 'Giảng viên', specialization: 'Kiểm thử phần mềm', bio: 'Phụ trách kiểm thử phần mềm và quản lý dự án cho sinh viên năm trên.' },
  { id: 'L009', username: 'duc.hai', email: 'duc.hai@ptithcm.edu.vn', fullName: 'Trần Đức Hải', roles: ['LECTURER'], department: 'Khoa An toàn thông tin', code: 'GV009', title: 'Tiến sĩ', position: 'Giảng viên', specialization: 'An toàn mạng', bio: 'Phụ trách các học phần an toàn mạng, giám sát sự cố và phòng thủ hệ thống.' },
  { id: 'L010', username: 'hong.ngoc', email: 'hong.ngoc@ptithcm.edu.vn', fullName: 'Phạm Hồng Ngọc', roles: ['LECTURER'], department: 'Khoa An toàn thông tin', code: 'GV010', title: 'Thạc sĩ', position: 'Giảng viên', specialization: 'Mật mã ứng dụng', bio: 'Giảng dạy mật mã ứng dụng và bảo mật dữ liệu cho chương trình ATTT.' },
  { id: 'L011', username: 'minh.khang', email: 'minh.khang@ptithcm.edu.vn', fullName: 'Võ Minh Khang', roles: ['LECTURER'], department: 'Khoa An toàn thông tin', code: 'GV011', title: 'Thạc sĩ', position: 'Giảng viên', specialization: 'Điều tra số', bio: 'Đảm nhiệm học phần điều tra số và thực hành phòng lab an toàn thông tin.' },
  { id: 'L012', username: 'tuyet.ha', email: 'tuyet.ha@ptithcm.edu.vn', fullName: 'Nguyễn Tuyết Hà', roles: ['LECTURER'], department: 'Khoa An toàn thông tin', code: 'GV012', title: 'Thạc sĩ', position: 'Giảng viên', specialization: 'Bảo mật hệ thống', bio: 'Theo dõi các lớp bảo mật hệ điều hành, bảo mật ứng dụng và quản trị rủi ro.' },
])

const academicOfficeUsers = buildStaffUsers([
  { id: 'AO001', username: 'academic.office', email: 'academic.office@ptithcm.edu.vn', fullName: 'Phòng Đào tạo', roles: ['ACADEMIC_OFFICE'], department: 'Phòng Đào tạo', code: 'AO001', title: 'Tiến sĩ', position: 'Trưởng phòng Đào tạo', specialization: 'Điều phối học vụ', bio: 'Điều phối học phần, kế hoạch học kỳ và xử lý các tình huống phát sinh trong đợt đăng ký.' },
  { id: 'AO002', username: 'ht.thua', email: 'ht.thua@ptithcm.edu.vn', fullName: 'Huỳnh Trọng Thừa', roles: ['ACADEMIC_OFFICE'], department: 'Phòng Đào tạo', code: 'AO002', title: 'Tiến sĩ', position: 'Phó trưởng phòng Đào tạo', specialization: 'Điều phối chương trình ATTT', bio: 'Phụ trách học phần chuyên ngành ATTT và xử lý danh sách chờ.' },
  { id: 'AO003', username: 'tuyet.hai', email: 'tuyet.hai@ptithcm.edu.vn', fullName: 'Nguyễn Thị Tuyết Hải', roles: ['ACADEMIC_OFFICE'], department: 'Phòng Đào tạo', code: 'AO003', title: 'Tiến sĩ', position: 'Phụ trách chương trình CNTT', specialization: 'Khung chương trình và học phần cốt lõi', bio: 'Rà soát chương trình khung, chuẩn đầu ra và danh mục học phần.' },
  { id: 'AO004', username: 'ky.thu', email: 'ky.thu@ptithcm.edu.vn', fullName: 'Lưu Nguyễn Kỳ Thư', roles: ['ACADEMIC_OFFICE'], department: 'Phòng Đào tạo', code: 'AO004', title: 'Thạc sĩ', position: 'Chuyên viên giáo vụ', specialization: 'Điều phối đăng ký học phần', bio: 'Theo dõi chỉ tiêu lớp và hỗ trợ sinh viên trong đợt đăng ký cao điểm.' },
])

const adminUsers = buildStaffUsers([
  { id: 'AD001', username: 'admin', email: 'admin@ptithcm.edu.vn', fullName: 'Quản trị hệ thống', roles: ['ADMIN'], department: 'Trung tâm Công nghệ thông tin', code: 'AD001', title: 'Kỹ sư', position: 'Quản trị hệ thống', specialization: 'Điều hành nền tảng và phân quyền', bio: 'Quản trị viên chính chịu trách nhiệm vận hành và phân quyền hệ thống.' },
  { id: 'AD002', username: 'duyen.ntn', email: 'duyen.ntn@ptithcm.edu.vn', fullName: 'Nguyễn Trần Ngọc Duyên', roles: ['ADMIN'], department: 'Trung tâm Công nghệ thông tin', code: 'AD002', title: 'Kỹ sư', position: 'Quản trị hệ thống', specialization: 'Nhật ký và bảo mật phiên', bio: 'Theo dõi nhật ký, phiên đăng nhập và các thay đổi cấu hình quan trọng.' },
  { id: 'AD003', username: 'khoi.td', email: 'khoi.td@ptithcm.edu.vn', fullName: 'Trần Đăng Khôi', roles: ['ADMIN'], department: 'Trung tâm Công nghệ thông tin', code: 'AD003', title: 'Kỹ sư', position: 'Quản trị dữ liệu', specialization: 'Dữ liệu học vụ và sao lưu', bio: 'Phụ trách sao lưu, import/export snapshot và dữ liệu mô phỏng học vụ.' },
])

export const seedUsers: User[] = [
  ...studentUsers,
  ...lecturerUsers,
  ...academicOfficeUsers,
  ...adminUsers,
]

export const demoAccounts = [
  {
    username: 'N23DCCN001',
    email: 'n23dccn001@student.ptithcm.edu.vn',
    role: 'STUDENT',
    password: 'ptithcm2026',
    note: 'Sinh viên CNTT dùng để demo danh sách học phần, đăng ký nhanh và lịch học cá nhân.',
  },
  {
    username: 'N23DCCN002',
    email: 'n23dccn002@student.ptithcm.edu.vn',
    role: 'STUDENT',
    password: 'ptithcm2026',
    note: 'Sinh viên ATTT dùng để demo các học phần an toàn mạng, mật mã và bảo mật hệ thống.',
  },
  {
    username: 'minh.tuan',
    email: 'minh.tuan@ptithcm.edu.vn',
    role: 'LECTURER',
    password: 'ptithcm2026',
    note: 'Giảng viên phụ trách nhiều lớp CNTT trong học kỳ hiện tại.',
  },
  {
    username: 'academic.office',
    email: 'academic.office@ptithcm.edu.vn',
    role: 'ACADEMIC_OFFICE',
    password: 'ptithcm2026',
    note: 'Tài khoản phòng đào tạo để xử lý sĩ số, danh sách chờ và lịch học phần.',
  },
  {
    username: 'admin',
    email: 'admin@ptithcm.edu.vn',
    role: 'ADMIN',
    password: 'ptithcm2026',
    note: 'Tài khoản quản trị để kiểm tra phân quyền, cấu hình hệ thống và nhật ký vận hành.',
  },
] as const
