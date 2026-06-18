import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

export async function resetDatabase(client: PrismaClient) {
  await client.auditLog.deleteMany()
  await client.enrollment.deleteMany()
  await client.wishRequest.deleteMany()
  await client.studentResult.deleteMany()
  await client.section.deleteMany()
  await client.courseCondition.deleteMany()
  await client.registrationErrorCode.deleteMany()
  await client.systemSetting.deleteMany()
  await client.room.deleteMany()
  await client.course.deleteMany()
  await client.user.deleteMany()
  await client.semesterOption.deleteMany()
}

/* ──────────────────────── helpers ──────────────────────── */
interface CourseInput {
  code: string
  name: string
  credits: number
  faculty: string
  department: string
  courseType: string
  category: 'FOUNDATION' | 'CORE' | 'ELECTIVE' | 'THESIS'
  suggestedSemester: number
  description: string
  prerequisites?: string[]
}

function buildCourse(c: CourseInput) {
  return {
    id: `course-${c.code.toLowerCase()}`,
    code: c.code,
    name: c.name,
    credits: c.credits,
    status: 'ACTIVE' as const,
    department: c.department,
    campus: 'PTIT HCM',
    description: c.description,
    prerequisites: c.prerequisites ?? [],
    prestudy: [],
    corequisites: [],
    category: c.category,
    faculty: c.faculty,
    courseType: c.courseType,
    suggestedSemester: c.suggestedSemester,
  }
}

/* ──────────────────────── DATA: COURSES ──────────────────────── */

// ── Khoa Công nghệ Thông tin (INT) ──
const CNTT_COURSES: CourseInput[] = [
  // D22 (semester 7-8)
  { code: 'INT101', name: 'Giải tích', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 7, description: 'Giới hạn, đạo hàm, tích phân và ứng dụng.' },
  { code: 'INT102', name: 'Đại số', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 7, description: 'Ma trận, định thức, không gian vector.' },
  { code: 'INT103', name: 'Lập trình hướng đối tượng (OOP)', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Kế thừa, đa hình, đóng gói và trừu tượng hóa.' },
  { code: 'INT104', name: 'Cơ sở dữ liệu', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: 'Mô hình quan hệ, SQL, thiết kế cơ sở dữ liệu.' },
  { code: 'INT105', name: 'Mạng máy tính', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: 'Mô hình OSI/TCP-IP, định tuyến, bảo mật mạng.' },
  // D23 (semester 5-6)
  { code: 'INT201', name: 'Toán rời rạc', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Logic mệnh đề, lý thuyết đồ thị, tổ hợp.' },
  { code: 'INT202', name: 'Vật lý', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Cơ học, điện từ, quang học và vật lý hiện đại.' },
  { code: 'INT203', name: 'Pháp luật Đại cương', credits: 2, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Nhà nước, pháp luật và các ngành luật cơ bản.' },
  { code: 'INT204', name: 'Hệ điều hành', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 6, description: 'Quản lý tiến trình, bộ nhớ, hệ thống tệp.' },
  { code: 'INT205', name: 'Cơ sở an toàn thông tin', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 6, description: 'Mã hóa, xác thực, kiểm soát truy cập.' },
  // D24 (semester 3-4)
  { code: 'INT301', name: 'Lập trình C/C++', credits: 4, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 3, description: 'Cú pháp C/C++, con trỏ, cấu trúc dữ liệu cơ bản.' },
  { code: 'INT302', name: 'Kỹ thuật số', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 3, description: 'Mạch logic, đại số Boolean, thiết kế vi mạch số.' },
  { code: 'INT303', name: 'Nhập môn Công nghệ phần mềm', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'Quy trình, mô hình và kỹ thuật phát triển phần mềm.' },
  { code: 'INT304', name: 'Hệ quản trị cơ sở dữ liệu', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'MySQL, PostgreSQL, tối ưu truy vấn, backup.' },
  { code: 'INT305', name: 'Phân tích thiết kế hệ thống thông tin', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'UML, use-case, thiết kế hệ thống.' },
  // D25 (semester 1-2)
  { code: 'INT401', name: 'Kiến trúc máy tính', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'CPU, bộ nhớ, bus, pipeline.' },
  { code: 'INT402', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'Danh sách, cây, đồ thị, sắp xếp, tìm kiếm.' },
  { code: 'INT403', name: 'Lập trình Web', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'HTML/CSS/JS, React, Node.js, REST API.' },
  { code: 'INT404', name: 'Nhập môn Trí tuệ nhân tạo', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Machine Learning, Neural Networks cơ bản.' },
  { code: 'INT405', name: 'Phát triển ứng dụng di động', credits: 3, faculty: 'Công nghệ thông tin', department: 'CNTT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'React Native, Flutter, native development.' },
]

// ── Khoa An toàn Thông tin (SEC) ──
const ATTT_COURSES: CourseInput[] = [
  { code: 'SEC101', name: 'Giải tích', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 7, description: 'Giới hạn, đạo hàm, tích phân.' },
  { code: 'SEC102', name: 'Mật mã học', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 7, description: 'Mã đối xứng, bất đối xứng, hàm băm.' },
  { code: 'SEC103', name: 'An toàn mạng máy tính', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 8, description: 'Firewall, IDS/IPS, VPN, penetration testing.' },
  { code: 'SEC104', name: 'An toàn hệ điều hành', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 8, description: 'Hardening Linux/Windows, access control.' },
  { code: 'SEC105', name: 'Phân tích mã độc', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 8, description: 'Phân loại malware, sandbox, phân tích tĩnh/động.' },
  { code: 'SEC201', name: 'Toán rời rạc', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Logic mệnh đề, lý thuyết đồ thị.' },
  { code: 'SEC202', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 5, description: 'Danh sách, cây, đồ thị, sắp xếp.' },
  { code: 'SEC203', name: 'Mạng máy tính', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 5, description: 'Mô hình OSI/TCP-IP, switching, routing.' },
  { code: 'SEC204', name: 'Hệ điều hành', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 6, description: 'Quản lý tiến trình, bộ nhớ, I/O.' },
  { code: 'SEC205', name: 'Lập trình an toàn', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Secure coding, OWASP, code review.' },
  { code: 'SEC301', name: 'Pháp luật Đại cương', credits: 2, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 3, description: 'Nhà nước, pháp luật cơ bản.' },
  { code: 'SEC302', name: 'Kiến trúc máy tính', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 3, description: 'CPU, bộ nhớ, bus, pipeline.' },
  { code: 'SEC303', name: 'Cơ sở dữ liệu', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 4, description: 'Mô hình quan hệ, SQL, thiết kế CSDL.' },
  { code: 'SEC304', name: 'Cơ sở an toàn thông tin', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 4, description: 'Mã hóa, xác thực, chính sách bảo mật.' },
  { code: 'SEC305', name: 'Đánh giá an toàn hệ thống thông tin', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'Audit, vulnerability assessment, compliance.' },
  { code: 'SEC401', name: 'Lập trình C/C++', credits: 4, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'Ngôn ngữ C/C++, con trỏ, quản lý bộ nhớ.' },
  { code: 'SEC402', name: 'Quản lý rủi ro an toàn thông tin', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 1, description: 'ISO 27001, risk assessment, BCP.' },
  { code: 'SEC403', name: 'Kỹ thuật dịch ngược', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'Reverse engineering, IDA Pro, disassembly.' },
  { code: 'SEC404', name: 'Pháp luật và đạo đức về ATTT', credits: 2, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Luật An ninh mạng, đạo đức nghề nghiệp.' },
  { code: 'SEC405', name: 'Điều tra số', credits: 3, faculty: 'An toàn thông tin', department: 'ATTT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'Digital Forensics, thu thập bằng chứng điện tử.' },
]

// ── Khoa Viễn thông (TEL) ──
const VT_COURSES: CourseInput[] = [
  { code: 'TEL101', name: 'Giải tích', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 7, description: 'Giới hạn, đạo hàm, tích phân.' },
  { code: 'TEL102', name: 'Lý thuyết mạch', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Mạch điện, phương pháp phân tích mạch.' },
  { code: 'TEL103', name: 'Tín hiệu và hệ thống', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Tín hiệu liên tục, rời rạc, biến đổi Fourier.' },
  { code: 'TEL104', name: 'Điện tử tương tự', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: 'Transistor, khuếch đại, mạch phản hồi.' },
  { code: 'TEL105', name: 'Trường điện từ', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: 'Phương trình Maxwell, sóng điện từ.' },
  { code: 'TEL201', name: 'Pháp luật Đại cương', credits: 2, faculty: 'Viễn thông', department: 'VT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Nhà nước, pháp luật cơ bản.' },
  { code: 'TEL202', name: 'Kỹ thuật vi xử lý', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 5, description: 'Vi xử lý 8051, ARM, lập trình Assembly.' },
  { code: 'TEL203', name: 'Cơ sở kỹ thuật thông tin', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 5, description: 'Lý thuyết thông tin, mã hóa nguồn, mã kênh.' },
  { code: 'TEL204', name: 'Mạng viễn thông', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Kiến trúc mạng viễn thông, PSTN, NGN.' },
  { code: 'TEL205', name: 'Kỹ thuật chuyển mạch', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Chuyển mạch kênh, gói, nhãn đa giao thức.' },
  { code: 'TEL301', name: 'Lập trình C/C++', credits: 4, faculty: 'Viễn thông', department: 'VT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 3, description: 'Ngôn ngữ C/C++, con trỏ, quản lý bộ nhớ.' },
  { code: 'TEL302', name: 'Kỹ thuật truyền dẫn quang', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 3, description: 'Sợi quang, WDM, EDFA, hệ thống DWDM.' },
  { code: 'TEL303', name: 'Thông tin di động (4G/5G)', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'LTE, 5G NR, kiến trúc mạng di động.' },
  { code: 'TEL304', name: 'Anten và truyền sóng', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'Anten dipole, mảng, lan truyền sóng vô tuyến.' },
  { code: 'TEL305', name: 'Kỹ thuật siêu cao tần', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 4, description: 'Đường truyền, ống dẫn sóng, mạch siêu cao tần.' },
  { code: 'TEL401', name: 'Kỹ thuật số', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'Mạch logic, flip-flop, máy trạng thái.' },
  { code: 'TEL402', name: 'Thông tin vệ tinh', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 1, description: 'Quỹ đạo vệ tinh, link budget, VSAT.' },
  { code: 'TEL403', name: 'Xử lý tín hiệu số', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'FFT, bộ lọc FIR/IIR, DSP.' },
  { code: 'TEL404', name: 'Thiết kế mạng vô tuyến', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'Quy hoạch tần số, cell planning, coverage.' },
  { code: 'TEL405', name: 'Mạng Internet vạn vật (IoT)', credits: 3, faculty: 'Viễn thông', department: 'VT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'LoRa, NB-IoT, MQTT, kiến trúc IoT.' },
]

// ── Khoa Điện tử (ELE) ──
const DT_COURSES: CourseInput[] = [
  { code: 'ELE101', name: 'Giải tích', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 7, description: 'Giới hạn, đạo hàm, tích phân.' },
  { code: 'ELE102', name: 'Cấu kiện điện tử', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Diode, transistor BJT/MOSFET.' },
  { code: 'ELE103', name: 'Lý thuyết mạch', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Mạch điện, phân tích mạch tuyến tính.' },
  { code: 'ELE104', name: 'Mạch điện tử', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: 'Khuếch đại, dao động, nguồn ổn áp.' },
  { code: 'ELE105', name: 'Đo lường điện tử', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: 'Oscilloscope, multimeter, đo lường số.' },
  { code: 'ELE201', name: 'Pháp luật Đại cương', credits: 2, faculty: 'Điện tử', department: 'DT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Nhà nước, pháp luật cơ bản.' },
  { code: 'ELE202', name: 'Tín hiệu và hệ thống', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 5, description: 'Tín hiệu, biến đổi Fourier, Laplace.' },
  { code: 'ELE203', name: 'Kỹ thuật vi xử lý / Vi điều khiển', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 5, description: 'Vi xử lý, vi điều khiển ARM, lập trình.' },
  { code: 'ELE204', name: 'Hệ thống nhúng', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Embedded Linux, RTOS, phần cứng nhúng.' },
  { code: 'ELE205', name: 'Thiết kế vi mạch số (VLSI)', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'VHDL/Verilog, FPGA, ASIC design.' },
  { code: 'ELE301', name: 'Lập trình C/C++', credits: 4, faculty: 'Điện tử', department: 'DT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 3, description: 'Ngôn ngữ C/C++ cho hệ thống nhúng.' },
  { code: 'ELE302', name: 'Điện tử công suất', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 3, description: 'Bộ biến đổi DC-DC, AC-DC, inverter.' },
  { code: 'ELE303', name: 'Cảm biến và ứng dụng', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'Cảm biến nhiệt, áp suất, gia tốc, IoT.' },
  { code: 'ELE304', name: 'Điều khiển tự động / PLC', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'PID, PLC Siemens, hệ thống SCADA.' },
  { code: 'ELE305', name: 'Giao tiếp máy tính', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 4, description: 'UART, SPI, I2C, USB, giao tiếp ngoại vi.' },
  { code: 'ELE401', name: 'Kỹ thuật số', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'Mạch logic, flip-flop, bộ đếm.' },
  { code: 'ELE402', name: 'Xử lý tín hiệu số trong ĐT', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 1, description: 'FFT, bộ lọc số, DSP processor.' },
  { code: 'ELE403', name: 'Robot và trí tuệ nhân tạo trong ĐT', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'Robot di động, computer vision, ROS.' },
  { code: 'ELE404', name: 'Cơ sở kỹ thuật truyền hình', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'Truyền hình số, HDTV, codec video.' },
  { code: 'ELE405', name: 'Mạng truyền số liệu', credits: 3, faculty: 'Điện tử', department: 'DT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Ethernet, MPLS, mạng truyền dữ liệu.' },
]

// ── Khoa Đa phương tiện (MUL) ──
const DPT_COURSES: CourseInput[] = [
  { code: 'MUL101', name: 'Giải tích', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 7, description: 'Giới hạn, đạo hàm, tích phân.' },
  { code: 'MUL102', name: 'Nguyên lý thiết kế đa phương tiện', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Nguyên tắc thiết kế, phối màu, typography.' },
  { code: 'MUL103', name: 'Kịch bản đa phương tiện', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Viết kịch bản, storyboard, nội dung ĐPT.' },
  { code: 'MUL104', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: 'Danh sách, cây, đồ thị, thuật toán.' },
  { code: 'MUL105', name: 'Mạng máy tính & CSDL', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: 'Mạng TCP/IP, SQL, thiết kế CSDL.' },
  { code: 'MUL201', name: 'Pháp luật Đại cương', credits: 2, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Nhà nước, pháp luật cơ bản.' },
  { code: 'MUL202', name: 'Đồ họa máy tính', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 5, description: 'OpenGL, đường cong Bezier, rendering.' },
  { code: 'MUL203', name: 'Xử lý ảnh số', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 5, description: 'Photoshop, Illustrator, xử lý ảnh.' },
  { code: 'MUL204', name: 'Xử lý âm thanh và video', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Premiere, After Effects, biên tập video.' },
  { code: 'MUL205', name: 'Thiết kế giao diện người dùng (UI/UX)', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Figma, wireframe, prototyping, usability.' },
  { code: 'MUL301', name: 'Mỹ thuật cơ bản', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 3, description: 'Vẽ tay, bố cục, hình họa cơ bản.' },
  { code: 'MUL302', name: 'Lập trình Web', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 3, description: 'HTML/CSS/JS, responsive design.' },
  { code: 'MUL303', name: 'Lập trình ứng dụng di động', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'React Native, mobile UI, API.' },
  { code: 'MUL304', name: 'Kỹ xảo hình ảnh (VFX)', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 4, description: 'After Effects, Nuke, compositing.' },
  { code: 'MUL305', name: 'Lập trình phát triển Game', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 4, description: 'Unity, C#, game mechanics, physics.' },
  { code: 'MUL401', name: 'Lập trình C/C++', credits: 4, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'C/C++ cơ bản và nâng cao.' },
  { code: 'MUL402', name: 'Đồ họa 3D', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 1, description: 'Maya, Blender, modeling, texturing.' },
  { code: 'MUL403', name: 'Thiết kế sản phẩm đa phương tiện', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Đồ án tích hợp, sản phẩm ĐPT hoàn chỉnh.' },
  { code: 'MUL404', name: 'Sản xuất chương trình truyền hình', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'Quay phim, dàn dựng, hậu kỳ.' },
  { code: 'MUL405', name: 'Truyền thông đa phương tiện', credits: 3, faculty: 'Đa phương tiện', department: 'DPT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'Truyền thông số, content strategy.' },
]

// ── Khoa Quản trị Kinh doanh (BUS) ──
const QTKD_COURSES: CourseInput[] = [
  { code: 'BUS101', name: 'Toán cao cấp', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 7, description: 'Đại số tuyến tính, giải tích ứng dụng.' },
  { code: 'BUS102', name: 'Kinh tế vĩ mô', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'GDP, lạm phát, chính sách tiền tệ.' },
  { code: 'BUS103', name: 'Nguyên lý kế toán', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Hệ thống kế toán, bảng cân đối, sổ sách.' },
  { code: 'BUS104', name: 'Quản trị học', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: 'Chức năng quản trị, lãnh đạo, tổ chức.' },
  { code: 'BUS105', name: 'Marketing căn bản', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: '4P, phân khúc, định vị, chiến lược.' },
  { code: 'BUS201', name: 'Pháp luật đại cương', credits: 2, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Nhà nước, pháp luật cơ bản.' },
  { code: 'BUS202', name: 'Hệ thống thông tin quản lý', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 5, description: 'MIS, ERP, hệ thống ra quyết định.' },
  { code: 'BUS203', name: 'Hành vi tổ chức', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 5, description: 'Động lực, nhóm, văn hóa tổ chức.' },
  { code: 'BUS204', name: 'Quản trị nguồn nhân lực', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Tuyển dụng, đào tạo, đánh giá, lương.' },
  { code: 'BUS205', name: 'Quản trị sản xuất và tác nghiệp', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Lean, Six Sigma, chuỗi cung ứng.' },
  { code: 'BUS301', name: 'Lịch sử Đảng', credits: 2, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 3, description: 'Lịch sử Đảng Cộng sản Việt Nam.' },
  { code: 'BUS302', name: 'Quản trị tài chính', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 3, description: 'Phân tích tài chính, dự toán vốn.' },
  { code: 'BUS303', name: 'Quản trị chiến lược', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'SWOT, Porter, chiến lược cạnh tranh.' },
  { code: 'BUS304', name: 'Giao tiếp trong kinh doanh', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'Kỹ năng thuyết trình, đàm phán.' },
  { code: 'BUS305', name: 'Thương mại điện tử', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 4, description: 'Mô hình e-commerce, thanh toán trực tuyến.' },
  { code: 'BUS401', name: 'Kinh tế vi mô', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'Cung cầu, chi phí, cấu trúc thị trường.' },
  { code: 'BUS402', name: 'Khởi sự kinh doanh', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 1, description: 'Startup, business plan, pitch deck.' },
  { code: 'BUS403', name: 'Quản trị rủi ro', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Nhận diện, đánh giá và kiểm soát rủi ro.' },
  { code: 'BUS404', name: 'Quản trị chất lượng', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'TQM, ISO 9001, Kaizen.' },
  { code: 'BUS405', name: 'Phân tích hoạt động kinh doanh', credits: 3, faculty: 'Quản trị kinh doanh', department: 'QTKD', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Phân tích doanh thu, lợi nhuận, KPI.' },
]

// ── Khoa Marketing (MKT) ──
const MKT_COURSES: CourseInput[] = [
  { code: 'MKT101', name: 'Toán cao cấp', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 7, description: 'Đại số tuyến tính, giải tích ứng dụng.' },
  { code: 'MKT102', name: 'Nguyên lý kế toán', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Hệ thống kế toán cơ bản.' },
  { code: 'MKT103', name: 'Quản trị học', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Chức năng quản trị, lãnh đạo.' },
  { code: 'MKT104', name: 'Marketing căn bản', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 8, description: '4P, STP, chiến lược marketing.' },
  { code: 'MKT105', name: 'Hành vi người tiêu dùng', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 8, description: 'Tâm lý mua hàng, ra quyết định.' },
  { code: 'MKT201', name: 'Lịch sử Đảng', credits: 2, faculty: 'Marketing', department: 'MKT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Lịch sử Đảng Cộng sản Việt Nam.' },
  { code: 'MKT202', name: 'Nghiên cứu Marketing', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 5, description: 'Phương pháp nghiên cứu, khảo sát, phân tích.' },
  { code: 'MKT203', name: 'Marketing dịch vụ', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 5, description: '7P, chất lượng dịch vụ, SERVQUAL.' },
  { code: 'MKT204', name: 'Marketing quốc tế', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Toàn cầu hóa, chiến lược quốc tế.' },
  { code: 'MKT205', name: 'Quản trị thương hiệu', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Brand equity, định vị, brand strategy.' },
  { code: 'MKT301', name: 'Pháp luật Đại cương', credits: 2, faculty: 'Marketing', department: 'MKT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 3, description: 'Nhà nước, pháp luật cơ bản.' },
  { code: 'MKT302', name: 'Truyền thông Marketing tích hợp (IMC)', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 3, description: 'ATL, BTL, quảng cáo, PR, sales promotion.' },
  { code: 'MKT303', name: 'Digital Marketing', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'SEO, SEM, social media, Google Ads.' },
  { code: 'MKT304', name: 'Quan hệ công chúng (PR)', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'Truyền thông đối ngoại, xử lý khủng hoảng.' },
  { code: 'MKT305', name: 'Tổ chức sự kiện', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 4, description: 'Event planning, sponsorship, logistics.' },
  { code: 'MKT401', name: 'Kinh tế vi mô & vĩ mô', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'Cung cầu, GDP, chính sách kinh tế.' },
  { code: 'MKT402', name: 'Quản trị lực lượng bán hàng', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 1, description: 'Xây dựng đội ngũ sales, KPI.' },
  { code: 'MKT403', name: 'Quản trị kênh phân phối', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Kênh phân phối, logistics, trade marketing.' },
  { code: 'MKT404', name: 'Phân tích dữ liệu Marketing', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Google Analytics, Data Studio, A/B testing.' },
  { code: 'MKT405', name: 'Content Marketing', credits: 3, faculty: 'Marketing', department: 'MKT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'Content strategy, storytelling, copywriting.' },
]

// ── Khoa Kế toán (ACC) ──
const KT_COURSES: CourseInput[] = [
  { code: 'ACC101', name: 'Toán cao cấp', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 7, description: 'Đại số tuyến tính, giải tích ứng dụng.' },
  { code: 'ACC102', name: 'Tài chính tiền tệ', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Tiền tệ, tín dụng, thị trường tài chính.' },
  { code: 'ACC103', name: 'Nguyên lý kế toán', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 7, description: 'Nguyên tắc kế toán, ghi sổ, báo cáo.' },
  { code: 'ACC104', name: 'Kế toán tài chính', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 8, description: 'Chuẩn mực kế toán VAS, BCTC.' },
  { code: 'ACC105', name: 'Kế toán quản trị', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 8, description: 'Chi phí, lập ngân sách, ra quyết định.' },
  { code: 'ACC201', name: 'Lịch sử Đảng', credits: 2, faculty: 'Kế toán', department: 'KT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 5, description: 'Lịch sử Đảng Cộng sản Việt Nam.' },
  { code: 'ACC202', name: 'Kiểm toán căn bản', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 5, description: 'Chuẩn mực kiểm toán, bằng chứng kiểm toán.' },
  { code: 'ACC203', name: 'Kế toán chi phí', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 5, description: 'Phân loại chi phí, giá thành sản phẩm.' },
  { code: 'ACC204', name: 'Hệ thống thông tin kế toán', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'AIS, ERP, quy trình kế toán số.' },
  { code: 'ACC205', name: 'Tổ chức công tác kế toán', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 6, description: 'Bộ máy kế toán, chứng từ, sổ sách.' },
  { code: 'ACC301', name: 'Pháp luật Đại cương', credits: 2, faculty: 'Kế toán', department: 'KT', courseType: 'Đại cương', category: 'FOUNDATION', suggestedSemester: 3, description: 'Nhà nước, pháp luật cơ bản.' },
  { code: 'ACC302', name: 'Kế toán máy', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 3, description: 'Phần mềm MISA, ERP, kế toán tự động.' },
  { code: 'ACC303', name: 'Phân tích báo cáo tài chính', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'Phân tích tỷ số, dự báo tài chính.' },
  { code: 'ACC304', name: 'Kế toán thuế', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 4, description: 'Thuế GTGT, TNDN, TNCN, quyết toán.' },
  { code: 'ACC305', name: 'Kế toán ngân hàng', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 4, description: 'Kế toán ngân hàng thương mại.' },
  { code: 'ACC401', name: 'Kinh tế vi mô', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'Cung cầu, cấu trúc thị trường.' },
  { code: 'ACC402', name: 'Quản trị học', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Cơ sở ngành', category: 'CORE', suggestedSemester: 1, description: 'Chức năng quản trị, lãnh đạo, tổ chức.' },
  { code: 'ACC403', name: 'Kế toán công ty cổ phần', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Vốn cổ phần, cổ tức, hợp nhất.' },
  { code: 'ACC404', name: 'Kiểm toán báo cáo tài chính', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'CORE', suggestedSemester: 2, description: 'Quy trình kiểm toán BCTC, ý kiến kiểm toán.' },
  { code: 'ACC405', name: 'Thị trường chứng khoán', credits: 3, faculty: 'Kế toán', department: 'KT', courseType: 'Chuyên ngành', category: 'ELECTIVE', suggestedSemester: 2, description: 'Chứng khoán, phân tích kỹ thuật, đầu tư.' },
]

const ALL_COURSES = [
  ...CNTT_COURSES, ...ATTT_COURSES, ...VT_COURSES, ...DT_COURSES,
  ...DPT_COURSES, ...QTKD_COURSES, ...MKT_COURSES, ...KT_COURSES,
]

/* ──────────────────────── DATA: ROOMS ──────────────────────── */
const ROOMS = [
  { id: 'room-a1-101', code: 'A1-101', name: 'A1-101', capacity: 40, campus: 'PTIT HCM' },
  { id: 'room-a1-201', code: 'A1-201', name: 'A1-201', capacity: 45, campus: 'PTIT HCM' },
  { id: 'room-a1-202', code: 'A1-202', name: 'A1-202', capacity: 45, campus: 'PTIT HCM' },
  { id: 'room-a1-301', code: 'A1-301', name: 'A1-301', capacity: 50, campus: 'PTIT HCM' },
  { id: 'room-a1-302', code: 'A1-302', name: 'A1-302', capacity: 50, campus: 'PTIT HCM' },
  { id: 'room-a2-101', code: 'A2-101', name: 'A2-101', capacity: 40, campus: 'PTIT HCM' },
  { id: 'room-a2-201', code: 'A2-201', name: 'A2-201', capacity: 45, campus: 'PTIT HCM' },
  { id: 'room-a2-301', code: 'A2-301', name: 'A2-301', capacity: 50, campus: 'PTIT HCM' },
  { id: 'room-b1-101', code: 'B1-101', name: 'B1-101', capacity: 40, campus: 'PTIT HCM' },
  { id: 'room-b1-201', code: 'B1-201', name: 'B1-201', capacity: 45, campus: 'PTIT HCM' },
  { id: 'room-b1-301', code: 'B1-301', name: 'B1-301', capacity: 50, campus: 'PTIT HCM' },
  { id: 'room-c1-101', code: 'C1-101', name: 'C1-101', capacity: 60, campus: 'PTIT HCM' },
  { id: 'room-c1-201', code: 'C1-201', name: 'C1-201', capacity: 60, campus: 'PTIT HCM' },
  { id: 'room-c1-301', code: 'C1-301', name: 'C1-301', capacity: 80, campus: 'PTIT HCM' },
]

/* ──────────────────────── MAIN SEED ──────────────────────── */
export async function seedDemoData(client: PrismaClient, options: { reset?: boolean } = {}) {
  if (options.reset ?? true) {
    await resetDatabase(client)
  }

  const passwordDigest = await bcrypt.hash('ptithcm2026', 10)
  const currentSemesterId = 'sem-2026-1'
  const previousSemesterId = 'sem-2025-2'

  /* ── Semesters ── */
  await client.semesterOption.createMany({
    data: [
      { id: previousSemesterId, label: 'Học kỳ 2025-2', isCurrent: false, academicYear: '2025-2026', termCode: 'HK2', registrationStatus: 'COMPLETED' },
      { id: currentSemesterId, label: 'Học kỳ 2026-1', isCurrent: true, academicYear: '2026-2027', termCode: 'HK1', registrationStatus: 'OPEN', registrationStart: new Date('2026-04-01T00:00:00.000Z'), registrationEnd: new Date('2026-04-30T23:59:59.999Z'), adjustmentStart: new Date('2026-05-01T00:00:00.000Z'), adjustmentEnd: new Date('2026-05-10T23:59:59.999Z') },
      { id: 'sem-2026-he', label: 'Học kỳ hè 2026', type: 'SUMMER', isCurrent: false, academicYear: '2026-2027', termCode: 'HÈ', registrationStatus: 'UPCOMING', registrationStart: new Date('2026-06-01T00:00:00.000Z'), registrationEnd: new Date('2026-06-15T23:59:59.999Z'), adjustmentStart: new Date('2026-06-16T00:00:00.000Z'), adjustmentEnd: new Date('2026-06-20T23:59:59.999Z') },
    ],
  })

  /* ── Users ── */
  await client.user.createMany({
    data: [
      // Admin & Academic Office
      { id: 'AD001', code: 'AD001', username: 'admin', email: 'admin@ptithcm.edu.vn', fullName: 'Quản trị hệ thống', phone: '0900000001', roles: ['ADMIN'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'IT', passwordDigest },
      { id: 'AO001', code: 'AO001', username: 'academic.office', email: 'academic.office@ptithcm.edu.vn', fullName: 'Phòng đào tạo', phone: '0900000002', roles: ['ACADEMIC_OFFICE'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'Academic Office', passwordDigest },

      // Lecturers — CNTT
      { id: 'LEC001', code: 'LEC001', username: 'minh.tuan', email: 'minh.tuan@ptithcm.edu.vn', fullName: 'Nguyễn Minh Tuấn', phone: '0900000003', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'CNTT', faculty: 'Công nghệ thông tin', title: 'ThS.', position: 'Giảng viên', specialization: 'Công nghệ phần mềm', passwordDigest },
      { id: 'LEC002', code: 'LEC002', username: 'thu.ha', email: 'thu.ha@ptithcm.edu.vn', fullName: 'Trần Thu Hà', phone: '0900000004', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'CNTT', faculty: 'Công nghệ thông tin', title: 'TS.', position: 'Giảng viên', specialization: 'Hệ thống thông tin', passwordDigest },
      { id: 'LEC017', code: 'LEC017', username: 'quang.vinh', email: 'quang.vinh@ptithcm.edu.vn', fullName: 'Ngô Quang Vinh', phone: '0900000019', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'CNTT', faculty: 'Công nghệ thông tin', title: 'TS.', position: 'Giảng viên', specialization: 'Trí tuệ nhân tạo', passwordDigest },
      { id: 'LEC018', code: 'LEC018', username: 'thi.huong', email: 'thi.huong@ptithcm.edu.vn', fullName: 'Đinh Thị Hương', phone: '0900000020', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'CNTT', faculty: 'Công nghệ thông tin', title: 'ThS.', position: 'Giảng viên', specialization: 'Lập trình Web', passwordDigest },
      // Lecturers — ATTT
      { id: 'LEC003', code: 'LEC003', username: 'quoc.huy', email: 'quoc.huy@ptithcm.edu.vn', fullName: 'Phạm Quốc Huy', phone: '0900000005', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'ATTT', faculty: 'An toàn thông tin', title: 'TS.', position: 'Giảng viên', specialization: 'An toàn mạng', passwordDigest },
      { id: 'LEC004', code: 'LEC004', username: 'thi.lan', email: 'thi.lan@ptithcm.edu.vn', fullName: 'Vũ Thị Lan', phone: '0900000006', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'ATTT', faculty: 'An toàn thông tin', title: 'ThS.', position: 'Giảng viên', specialization: 'Mật mã học', passwordDigest },
      // Lecturers — Viễn thông
      { id: 'LEC005', code: 'LEC005', username: 'duc.minh', email: 'duc.minh@ptithcm.edu.vn', fullName: 'Hoàng Đức Minh', phone: '0900000007', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'VT', faculty: 'Viễn thông', title: 'PGS.TS.', position: 'Phó trưởng khoa', specialization: 'Hệ thống viễn thông', passwordDigest },
      { id: 'LEC006', code: 'LEC006', username: 'thanh.tung', email: 'thanh.tung@ptithcm.edu.vn', fullName: 'Đỗ Thanh Tùng', phone: '0900000008', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'VT', faculty: 'Viễn thông', title: 'TS.', position: 'Giảng viên', specialization: 'Thông tin di động', passwordDigest },
      // Lecturers — Điện tử
      { id: 'LEC007', code: 'LEC007', username: 'hong.phuc', email: 'hong.phuc@ptithcm.edu.vn', fullName: 'Lê Hồng Phúc', phone: '0900000009', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'DT', faculty: 'Điện tử', title: 'TS.', position: 'Giảng viên', specialization: 'Vi mạch số', passwordDigest },
      { id: 'LEC008', code: 'LEC008', username: 'thi.mai', email: 'thi.mai@ptithcm.edu.vn', fullName: 'Nguyễn Thị Mai', phone: '0900000010', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'DT', faculty: 'Điện tử', title: 'ThS.', position: 'Giảng viên', specialization: 'Hệ thống nhúng', passwordDigest },
      // Lecturers — Đa phương tiện
      { id: 'LEC009', code: 'LEC009', username: 'van.dat', email: 'van.dat@ptithcm.edu.vn', fullName: 'Trương Văn Đạt', phone: '0900000011', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'DPT', faculty: 'Đa phương tiện', title: 'ThS.', position: 'Giảng viên', specialization: 'Đồ họa máy tính', passwordDigest },
      { id: 'LEC010', code: 'LEC010', username: 'ngoc.diep', email: 'ngoc.diep@ptithcm.edu.vn', fullName: 'Phan Ngọc Diệp', phone: '0900000012', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'DPT', faculty: 'Đa phương tiện', title: 'ThS.', position: 'Giảng viên', specialization: 'UI/UX Design', passwordDigest },
      // Lecturers — QTKD
      { id: 'LEC011', code: 'LEC011', username: 'minh.tri', email: 'minh.tri@ptithcm.edu.vn', fullName: 'Bùi Minh Trí', phone: '0900000013', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'QTKD', faculty: 'Quản trị kinh doanh', title: 'TS.', position: 'Giảng viên', specialization: 'Quản trị chiến lược', passwordDigest },
      { id: 'LEC012', code: 'LEC012', username: 'thi.hong', email: 'thi.hong@ptithcm.edu.vn', fullName: 'Cao Thị Hồng', phone: '0900000014', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'QTKD', faculty: 'Quản trị kinh doanh', title: 'ThS.', position: 'Giảng viên', specialization: 'Marketing', passwordDigest },
      // Lecturers — Marketing
      { id: 'LEC013', code: 'LEC013', username: 'anh.khoa', email: 'anh.khoa@ptithcm.edu.vn', fullName: 'Đặng Anh Khoa', phone: '0900000015', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'MKT', faculty: 'Marketing', title: 'ThS.', position: 'Giảng viên', specialization: 'Digital Marketing', passwordDigest },
      { id: 'LEC014', code: 'LEC014', username: 'thi.thanh', email: 'thi.thanh@ptithcm.edu.vn', fullName: 'Lý Thị Thanh', phone: '0900000016', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'MKT', faculty: 'Marketing', title: 'TS.', position: 'Giảng viên', specialization: 'Truyền thông', passwordDigest },
      // Lecturers — Kế toán
      { id: 'LEC015', code: 'LEC015', username: 'xuan.bach', email: 'xuan.bach@ptithcm.edu.vn', fullName: 'Mai Xuân Bách', phone: '0900000017', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'KT', faculty: 'Kế toán', title: 'TS.', position: 'Giảng viên', specialization: 'Kế toán tài chính', passwordDigest },
      { id: 'LEC016', code: 'LEC016', username: 'kim.oanh', email: 'kim.oanh@ptithcm.edu.vn', fullName: 'Tạ Thị Kim Oanh', phone: '0900000018', roles: ['LECTURER'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'KT', faculty: 'Kế toán', title: 'ThS.', position: 'Giảng viên', specialization: 'Kiểm toán', passwordDigest },

      // Students
      { id: 'N23DCCN001', code: 'N23DCCN001', username: 'N23DCCN001', email: 'n23dccn001@student.ptithcm.edu.vn', fullName: 'Nguyễn Văn An', phone: '0911000001', roles: ['STUDENT'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'CNTT', faculty: 'Công nghệ thông tin', majorCode: 'DCCN', majorName: 'Công nghệ phần mềm', studentClass: 'D23CQCN01-N', studentStatus: 'Đang học', completedCredits: 24, gpa: 3.2, passwordDigest },
      { id: 'N23DCCN002', code: 'N23DCCN002', username: 'N23DCCN002', email: 'n23dccn002@student.ptithcm.edu.vn', fullName: 'Lê Thị Bình', phone: '0911000002', roles: ['STUDENT'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'CNTT', faculty: 'Công nghệ thông tin', majorCode: 'DCCN', majorName: 'Công nghệ phần mềm', studentClass: 'D23CQCN01-N', studentStatus: 'Đang học', completedCredits: 18, gpa: 3.0, passwordDigest },
      { id: 'N23DCAT001', code: 'N23DCAT001', username: 'N23DCAT001', email: 'n23dcat001@student.ptithcm.edu.vn', fullName: 'Trần Đức Cường', phone: '0911000003', roles: ['STUDENT'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'ATTT', faculty: 'An toàn thông tin', majorCode: 'DCAT', majorName: 'An toàn thông tin', studentClass: 'D23CQAT01-N', studentStatus: 'Đang học', completedCredits: 22, gpa: 3.4, passwordDigest },
      { id: 'N23DCVT001', code: 'N23DCVT001', username: 'N23DCVT001', email: 'n23dcvt001@student.ptithcm.edu.vn', fullName: 'Phạm Thanh Dũng', phone: '0911000004', roles: ['STUDENT'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'VT', faculty: 'Viễn thông', majorCode: 'DCVT', majorName: 'Kỹ thuật viễn thông', studentClass: 'D23CQVT01-N', studentStatus: 'Đang học', completedCredits: 20, gpa: 2.8, passwordDigest },
      { id: 'N23DCDT001', code: 'N23DCDT001', username: 'N23DCDT001', email: 'n23dcdt001@student.ptithcm.edu.vn', fullName: 'Hoàng Mai Linh', phone: '0911000005', roles: ['STUDENT'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'DT', faculty: 'Điện tử', majorCode: 'DCDT', majorName: 'Kỹ thuật điện tử', studentClass: 'D23CQDT01-N', studentStatus: 'Đang học', completedCredits: 21, gpa: 3.1, passwordDigest },
      { id: 'N24DCPT001', code: 'N24DCPT001', username: 'N24DCPT001', email: 'n24dcpt001@student.ptithcm.edu.vn', fullName: 'Vũ Quỳnh Anh', phone: '0911000006', roles: ['STUDENT'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'DPT', faculty: 'Đa phương tiện', majorCode: 'DCPT', majorName: 'Công nghệ đa phương tiện', studentClass: 'D24CQPT01-N', studentStatus: 'Đang học', completedCredits: 12, gpa: 3.5, passwordDigest },
      { id: 'N24DCQT001', code: 'N24DCQT001', username: 'N24DCQT001', email: 'n24dcqt001@student.ptithcm.edu.vn', fullName: 'Đỗ Minh Khôi', phone: '0911000007', roles: ['STUDENT'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'QTKD', faculty: 'Quản trị kinh doanh', majorCode: 'DCQT', majorName: 'Quản trị kinh doanh', studentClass: 'D24CQQT01-N', studentStatus: 'Đang học', completedCredits: 15, gpa: 3.3, passwordDigest },
      { id: 'N24DCMR001', code: 'N24DCMR001', username: 'N24DCMR001', email: 'n24dcmr001@student.ptithcm.edu.vn', fullName: 'Nguyễn Hà My', phone: '0911000008', roles: ['STUDENT'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'MKT', faculty: 'Marketing', majorCode: 'DCMR', majorName: 'Marketing', studentClass: 'D24CQMR01-N', studentStatus: 'Đang học', completedCredits: 14, gpa: 3.6, passwordDigest },
      { id: 'N24DCKT001', code: 'N24DCKT001', username: 'N24DCKT001', email: 'n24dckt001@student.ptithcm.edu.vn', fullName: 'Lê Thanh Sơn', phone: '0911000009', roles: ['STUDENT'], status: 'ACTIVE', campus: 'PTIT HCM', department: 'KT', faculty: 'Kế toán', majorCode: 'DCKT', majorName: 'Kế toán', studentClass: 'D24CQKT01-N', studentStatus: 'Đang học', completedCredits: 13, gpa: 3.1, passwordDigest },
    ],
  })

  /* ── Courses (160) ── */
  for (const batch of [CNTT_COURSES, ATTT_COURSES, VT_COURSES, DT_COURSES, DPT_COURSES, QTKD_COURSES, MKT_COURSES, KT_COURSES]) {
    await client.course.createMany({ data: batch.map(buildCourse) })
  }

  /* ── Rooms (14) ── */
  await client.room.createMany({ data: ROOMS })

  /* ── Registration Error Codes ── */
  await client.registrationErrorCode.createMany({
    data: [
      { code: 'DK_TC', message: 'Đăng ký thành công.' },
      { code: 'HUY_DK', message: 'Đã hủy đăng ký.' },
      { code: 'KHONG_DU_DK', message: 'Không đủ điều kiện đăng ký.' },
      { code: 'NGOAI_TGDK', message: 'Ngoài thời gian đăng ký.' },
      { code: 'REG_ERR_SECTION_NOT_OPEN', message: 'Lớp học phần chưa mở đăng ký.' },
      { code: 'REG_ERR_OUTSIDE_REGISTRATION_WINDOW', message: 'Ngoài thời gian đăng ký.' },
      { code: 'REG_ERR_OUTSIDE_ADJUSTMENT_WINDOW', message: 'Ngoài thời gian điều chỉnh đăng ký.' },
      { code: 'REG_ERR_OUTSIDE_WITHDRAWAL_WINDOW', message: 'Đã quá hạn rút học phần.' },
      { code: 'REG_ERR_FULL_CAPACITY', message: 'Lớp học phần đã đủ sĩ số.' },
      { code: 'REG_ERR_PREREQUISITE_NOT_MET', message: 'Chưa đạt môn tiên quyết.' },
      { code: 'REG_ERR_PRESTUDY_NOT_MET', message: 'Chưa đáp ứng môn học trước.' },
      { code: 'REG_ERR_COREQUISITE_NOT_MET', message: 'Chưa đáp ứng môn song hành.' },
      { code: 'REG_ERR_SCHEDULE_CONFLICT', message: 'Trùng thời khóa biểu.' },
      { code: 'REG_ERR_CREDIT_LIMIT_EXCEEDED', message: 'Vượt giới hạn tín chỉ.' },
      { code: 'REG_ERR_ALREADY_REGISTERED', message: 'Đã đăng ký lớp học phần này.' },
      { code: 'REG_ERR_ALREADY_REGISTERED_COURSE', message: 'Đã đăng ký hoặc vào danh sách chờ lớp khác của cùng học phần trong học kỳ này.' },
      { code: 'REG_ERR_CLASS_NOT_FOUND', message: 'Không tìm thấy lớp học phần.' },
      { code: 'REG_ERR_STUDENT_NOT_FOUND', message: 'Không tìm thấy sinh viên.' },
      { code: 'REG_ERR_CANNOT_WITHDRAW', message: 'Không thể hủy hoặc rút học phần này.' },
      { code: 'REG_ERR_CLASS_CANCELLED', message: 'Lớp học phần đã bị hủy.' },
      { code: 'REG_ERR_ACCOUNT_INACTIVE', message: 'Tài khoản không hoạt động.' },
      { code: 'REG_ERR_MAX_CLASS_PER_DAY', message: 'Vượt số lớp tối đa trong ngày.' },
      { code: 'REG_ERR_MAX_CLASS_PER_SEMESTER', message: 'Vượt số lớp tối đa trong học kỳ.' },
    ],
  })

  /* ── Sections (1 per course for current semester) ── */
  const lecturerByDept: Record<string, string[]> = {
    CNTT: ['LEC001', 'LEC002', 'LEC017', 'LEC018'],
    ATTT: ['LEC003', 'LEC004'],
    VT: ['LEC005', 'LEC006'],
    DT: ['LEC007', 'LEC008'],
    DPT: ['LEC009', 'LEC010'],
    QTKD: ['LEC011', 'LEC012'],
    MKT: ['LEC013', 'LEC014'],
    KT: ['LEC015', 'LEC016'],
  }

  // --- Conflict-free schedule generation ---
  // 3 non-overlapping time blocks per day: startPeriod 1 (Ca sáng), 5 (Ca chiều), 9 (Ca tối)
  // 6 weekdays (Mon–Sat, encoded 2–7) × 3 blocks = 18 slots per lecturer / room
  // 14 rooms × 18 slots = 252 total capacity (>160 courses)
  const WEEKDAYS = [2, 3, 4, 5, 6, 7]
  const PERIOD_SLOTS = [1, 5, 9]

  type SlotEntry = { weekday: number; startPeriod: number; periodCount: number }

  function scheduleConflicts(schedule: SlotEntry[], weekday: number, startPeriod: number, periodCount: number): boolean {
    return schedule.some(
      (s) => s.weekday === weekday && s.startPeriod < startPeriod + periodCount && startPeriod < s.startPeriod + s.periodCount,
    )
  }

  const lecturerSchedule = new Map<string, SlotEntry[]>()
  const roomSchedule = new Map<string, SlotEntry[]>()

  const sectionData = ALL_COURSES.map((course, index) => {
    const lecturers = lecturerByDept[course.department] ?? ['LEC001']
    const lecturerId = lecturers[index % lecturers.length]
    const periodCount = course.credits >= 4 ? 4 : 3

    if (!lecturerSchedule.has(lecturerId)) lecturerSchedule.set(lecturerId, [])
    const lecSched = lecturerSchedule.get(lecturerId)!

    let weekday = WEEKDAYS[0]
    let startPeriod = PERIOD_SLOTS[0]
    let roomObj = ROOMS[0]

    // Find first (weekday, timeSlot, room) with no lecturer or room conflict
    // Rotate room start position per course to distribute rooms evenly
    const roomOffset = index % ROOMS.length
    let found = false
    for (const w of WEEKDAYS) {
      for (const sp of PERIOD_SLOTS) {
        if (scheduleConflicts(lecSched, w, sp, periodCount)) continue
        for (let ri = 0; ri < ROOMS.length; ri++) {
          const r = ROOMS[(ri + roomOffset) % ROOMS.length]
          if (!roomSchedule.has(r.code)) roomSchedule.set(r.code, [])
          if (scheduleConflicts(roomSchedule.get(r.code)!, w, sp, periodCount)) continue
          weekday = w
          startPeriod = sp
          roomObj = r
          found = true
          break
        }
        if (found) break
      }
      if (found) break
    }

    const slot: SlotEntry = { weekday, startPeriod, periodCount }
    lecSched.push(slot)
    if (!roomSchedule.has(roomObj.code)) roomSchedule.set(roomObj.code, [])
    roomSchedule.get(roomObj.code)!.push(slot)

    return {
      id: `sec-${course.code.toLowerCase()}-1`,
      sectionCode: `${course.code}-1`,
      courseCode: course.code,
      semesterId: currentSemesterId,
      group: '01',
      subGroup: '001',
      lecturerId,
      roomId: roomObj.id,
      room: roomObj.code,
      weekday,
      startPeriod,
      periodCount,
      weeks: '1-15',
      capacity: roomObj.capacity,
      registeredCount: Math.floor(Math.random() * 10),
      waitlistCount: 0,
      allowWaitlist: true,
      status: 'OPEN' as const,
      campus: 'PTIT HCM',
    }
  })

  // Create in batches of 40 to avoid issues
  for (let i = 0; i < sectionData.length; i += 40) {
    await client.section.createMany({ data: sectionData.slice(i, i + 40) })
  }

  /* ── System Settings ── */
  await client.systemSetting.create({
    data: {
      id: 1,
      simulationNow: new Date('2026-04-10T08:00:00.000Z'),
      registrationStart: new Date('2026-04-01T00:00:00.000Z'),
      registrationEnd: new Date('2026-04-30T23:59:59.999Z'),
      adjustmentStart: new Date('2026-05-01T00:00:00.000Z'),
      adjustmentEnd: new Date('2026-05-10T23:59:59.999Z'),
      withdrawalDeadline: new Date('2026-05-20T23:59:59.999Z'),
      maxCreditsMain: 24,
      maxCreditsSummer: 12,
      minCredits: 12,
      maintenanceMode: false,
      allowWaitlist: true,
      countWaitlistCredits: false,
      allowGradeImprovement: true,
      maxRetakeAttempts: 3,
      sessionTimeoutMinutes: 30,
      warningBeforeLogoutSeconds: 60,
      maxClassesPerDay: 4,
      maxClassesPerSemester: 8,
      currentSemesterId,
      maintenanceMessage: 'Hệ thống đang hoạt động bình thường.',
    },
  })

  /* ── Student Results (previous semester) ── */
  await client.studentResult.createMany({
    data: [
      { id: 'result-n23dccn001-int201', studentId: 'N23DCCN001', courseCode: 'INT201', semesterId: previousSemesterId, letterGrade: 'B+', numericGrade: 8.0, status: 'PASSED', passed: true },
      { id: 'result-n23dccn001-int203', studentId: 'N23DCCN001', courseCode: 'INT203', semesterId: previousSemesterId, letterGrade: 'A', numericGrade: 9.0, status: 'PASSED', passed: true },
      { id: 'result-n23dccn002-int201', studentId: 'N23DCCN002', courseCode: 'INT201', semesterId: previousSemesterId, letterGrade: 'C', numericGrade: 6.0, status: 'PASSED', passed: true },
      { id: 'result-n23dcat001-sec201', studentId: 'N23DCAT001', courseCode: 'SEC201', semesterId: previousSemesterId, letterGrade: 'B', numericGrade: 7.5, status: 'PASSED', passed: true },
      { id: 'result-n23dcvt001-tel201', studentId: 'N23DCVT001', courseCode: 'TEL201', semesterId: previousSemesterId, letterGrade: 'B+', numericGrade: 8.0, status: 'PASSED', passed: true },
      { id: 'result-n23dcdt001-ele201', studentId: 'N23DCDT001', courseCode: 'ELE201', semesterId: previousSemesterId, letterGrade: 'A', numericGrade: 8.5, status: 'PASSED', passed: true },
    ],
  })

  /* ── Enrollments (current semester) ── */
  await client.enrollment.createMany({
    data: [
      { id: 'enr-n23dccn001-int204', studentId: 'N23DCCN001', sectionId: 'sec-int204-1', semesterId: currentSemesterId, status: 'REGISTERED', timeline: [{ status: 'REGISTERED', timestamp: '2026-04-10T08:00:00Z', actorId: 'N23DCCN001', actorRole: 'STUDENT', note: 'Đăng ký thành công.' }] },
      { id: 'enr-n23dccn001-int205', studentId: 'N23DCCN001', sectionId: 'sec-int205-1', semesterId: currentSemesterId, status: 'REGISTERED', timeline: [{ status: 'REGISTERED', timestamp: '2026-04-10T08:01:00Z', actorId: 'N23DCCN001', actorRole: 'STUDENT', note: 'Đăng ký thành công.' }] },
      { id: 'enr-n23dcat001-sec204', studentId: 'N23DCAT001', sectionId: 'sec-sec204-1', semesterId: currentSemesterId, status: 'REGISTERED', timeline: [{ status: 'REGISTERED', timestamp: '2026-04-10T08:05:00Z', actorId: 'N23DCAT001', actorRole: 'STUDENT', note: 'Đăng ký thành công.' }] },
      { id: 'enr-n23dcvt001-tel204', studentId: 'N23DCVT001', sectionId: 'sec-tel204-1', semesterId: currentSemesterId, status: 'REGISTERED', timeline: [{ status: 'REGISTERED', timestamp: '2026-04-10T08:10:00Z', actorId: 'N23DCVT001', actorRole: 'STUDENT', note: 'Đăng ký thành công.' }] },
      { id: 'enr-n23dcdt001-ele204', studentId: 'N23DCDT001', sectionId: 'sec-ele204-1', semesterId: currentSemesterId, status: 'REGISTERED', timeline: [{ status: 'REGISTERED', timestamp: '2026-04-10T08:15:00Z', actorId: 'N23DCDT001', actorRole: 'STUDENT', note: 'Đăng ký thành công.' }] },
      { id: 'enr-n24dcpt001-mul301', studentId: 'N24DCPT001', sectionId: 'sec-mul301-1', semesterId: currentSemesterId, status: 'REGISTERED', timeline: [{ status: 'REGISTERED', timestamp: '2026-04-10T08:20:00Z', actorId: 'N24DCPT001', actorRole: 'STUDENT', note: 'Đăng ký thành công.' }] },
      { id: 'enr-n24dcqt001-bus301', studentId: 'N24DCQT001', sectionId: 'sec-bus301-1', semesterId: currentSemesterId, status: 'REGISTERED', timeline: [{ status: 'REGISTERED', timestamp: '2026-04-10T08:25:00Z', actorId: 'N24DCQT001', actorRole: 'STUDENT', note: 'Đăng ký thành công.' }] },
      { id: 'enr-n24dcmr001-mkt301', studentId: 'N24DCMR001', sectionId: 'sec-mkt301-1', semesterId: currentSemesterId, status: 'REGISTERED', timeline: [{ status: 'REGISTERED', timestamp: '2026-04-10T08:30:00Z', actorId: 'N24DCMR001', actorRole: 'STUDENT', note: 'Đăng ký thành công.' }] },
      { id: 'enr-n24dckt001-acc301', studentId: 'N24DCKT001', sectionId: 'sec-acc301-1', semesterId: currentSemesterId, status: 'REGISTERED', timeline: [{ status: 'REGISTERED', timestamp: '2026-04-10T08:35:00Z', actorId: 'N24DCKT001', actorRole: 'STUDENT', note: 'Đăng ký thành công.' }] },
    ],
  })

  /* ── Wish Requests ── */
  await client.wishRequest.create({
    data: {
      id: 'wish-int303-extra',
      studentId: 'N23DCCN001',
      semesterId: currentSemesterId,
      courseCode: 'INT303',
      preferredGroup: '01',
      reason: 'Sinh viên có nhu cầu mở thêm lớp Nhập môn CNPM để kịp tiến độ học tập.',
      status: 'PENDING',
    },
  })

  /* ── Audit Log ── */
  await client.auditLog.create({
    data: {
      id: 'log-seed',
      actorId: 'AD001',
      actorRole: 'ADMIN',
      action: 'SEED_INITIAL_DATA',
      targetId: 'SYSTEM',
      result: 'SUCCESS',
      message: 'Tạo dữ liệu demo ban đầu gồm 160 môn, 18 giảng viên, 9 sinh viên.',
      metadata: { seed: 'full-catalog-v2' },
    },
  })
}

async function main() {
  const prisma = new PrismaClient()
  try {
    await seedDemoData(prisma, { reset: true })
    console.log('✅ Seed completed: 160 courses, 18 lecturers, 9 students, 160 sections.')
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  void main()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
