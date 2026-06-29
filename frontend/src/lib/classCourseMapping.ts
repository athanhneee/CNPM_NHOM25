export const SPECIFIC_CLASS_COURSES: Record<string, Record<string, string[]>> = {
  'giải tích': {
    'CN': ['D22CQCN01-N'],
    'AT': ['D22CQAT01-N'],
    'VT': ['D22CQVT01-N'],
    'DT': ['D22CQDT01-N'],
    'PT': ['D22CQPT01-N'],
  },
  'đại số': {
    'CN': ['D22CQCN02-N'],
  },
  'toán rời rạc': {
    'CN': ['D23CQCN01-N'],
    'AT': ['D23CQAT01-N'],
  },
  'vật lý': {
    'CN': ['D23CQCN02-N'],
  },
  'pháp luật đại cương': {
    'CN': ['D23CQCN03-N'],
    'AT': ['D24CQAT01-N'],
    'VT': ['D23CQVT01-N'],
    'DT': ['D23CQDT01-N'],
    'PT': ['D23CQPT01-N'],
    'QT': ['D23CQQT01-N'],
    'MR': ['D24CQMR01-N'],
    'KT': ['D24CQKT01-N'],
  },
  'lập trình c/c++': {
    'CN': ['D24CQCN02-N'],
    'AT': ['D25CQAT01-N'],
    'VT': ['D24CQVT01-N'],
    'DT': ['D24CQDT01-N'],
    'PT': ['D25CQPT01-N'],
  },
  'kỹ thuật số': {
    'CN': ['D24CQCN01-N'],
    'VT': ['D25CQVT01-N'],
    'DT': ['D25CQDT01-N'],
  },
  'kiến trúc máy tính': {
    'CN': ['D25CQCN02-N'], // General in ATTT
  },
  'cấu trúc dữ liệu và giải thuật': {
    'CN': ['D25CQCN01-N'], // General in ATTT, PT
  },
  'toán cao cấp': {
    'QT': ['D22CQQT01-N'],
    'MR': ['D22CQMR01-N'],
    'KT': ['D22CQKT01-N'],
  },
  'lịch sử đảng': {
    'QT': ['D24CQQT01-N'],
    'MR': ['D23CQMR01-N'],
    'KT': ['D23CQKT01-N'],
  },
  'kinh tế vi mô': {
    'QT': ['D25CQQT01-N'],
    'KT': ['D25CQKT01-N'],
  },
  'kinh tế vi mô & vĩ mô': {
    'MR': ['D25CQMR01-N'],
  },
  'mỹ thuật cơ bản (vẽ tay/bố cục)': {
    'PT': ['D24CQPT01-N'],
  },
}

/**
 * Lấy mã ngành từ tên lớp (vd: D23CQCN01-N -> CN)
 */
export function getMajorCodeFromClass(studentClass: string): string | null {
  const match = studentClass.match(/[A-Z]{2,4}(?=\d{2})/)
  if (!match) return null
  const code = match[0]
  // Bỏ tiền tố CQ, DC, vv nếu có. Giả định mã ngành là 2 ký tự cuối (CN, AT, VT, DT, PT, QT, KT, MR)
  return code.slice(-2)
}

/**
 * Kiểm tra xem một môn học có được phép mở cho một lớp cụ thể không.
 * @param courseName Tên môn học
 * @param studentClass Lớp sinh viên (vd: D23CQCN01-N)
 * @returns true nếu hợp lệ
 */
export function isCourseAllowedForClass(courseName: string, studentClass: string): boolean {
  if (!courseName || !studentClass) return true
  
  const normalizedCourseName = courseName.trim().toLowerCase()
  const majorCode = getMajorCodeFromClass(studentClass)
  
  if (!majorCode) return true // Không parse được ngành, cho phép hiển thị
  
  const courseConfig = SPECIFIC_CLASS_COURSES[normalizedCourseName]
  
  // Nếu môn này có cấu hình ĐẶC THÙ cho ngành hiện tại
  if (courseConfig && courseConfig[majorCode]) {
    // Thì lớp hiện tại phải nằm trong danh sách cho phép của ngành đó
    return courseConfig[majorCode].includes(studentClass.toUpperCase())
  }
  
  // Nếu không có cấu hình đặc thù cho ngành này, đây là môn CHUNG của khoa (đã được lọc qua major codes trước đó)
  return true
}
