const fs = require('fs');
const oldFile = fs.readFileSync('src/enrollments/class-course-mapping.util.ts', 'utf8').split('\n');
const helpers = oldFile.slice(68, 117).join('\n'); // Up to the end of getAdmissionYearFromClass

const data = JSON.parse(fs.readFileSync('generated_mapping.json'));
let newContent = 'export const SPECIFIC_CLASS_COURSES: Record<string, Record<string, string[]>> = ' + JSON.stringify(data, null, 2) + ';\n\n';

newContent += helpers + '\n';
newContent += `
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
  const cohortMatch = studentClass.match(/D\\d{2}/)
  const cohort = cohortMatch ? cohortMatch[0] : null
  
  if (!majorCode || !cohort) return true
  
  const courseConfig = SPECIFIC_CLASS_COURSES[normalizedCourseName]
  
  // Nếu môn này có cấu hình ĐẶC THÙ cho ngành hiện tại
  if (courseConfig && courseConfig[majorCode]) {
    // Thì khoá hiện tại (vd: D23) phải nằm trong danh sách phân bổ của ngành đó
    return courseConfig[majorCode].includes(cohort)
  }
  
  // Nếu không có cấu hình đặc thù cho ngành này, đây là môn CHUNG của khoa
  return true
}
`;

fs.writeFileSync('src/enrollments/class-course-mapping.util.ts', newContent);
console.log('Updated class-course-mapping.util.ts');
