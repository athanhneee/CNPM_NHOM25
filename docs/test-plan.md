# Kế hoạch kiểm thử và checklist demo

Tài liệu này dùng cho báo cáo cuối môn và rehearsal trước khi nộp bài. Bộ tài khoản demo chuẩn lấy từ backend seed, mật khẩu chung: `ptithcm2026`.

## Tài khoản demo chuẩn

| Vai trò | Username | Email | Mục đích |
| --- | --- | --- | --- |
| ADMIN | `admin` | `admin@ptithcm.edu.vn` | Quản lý tài khoản, phân quyền, settings, snapshot, audit log |
| ACADEMIC_OFFICE | `academic.office` | `academic.office@ptithcm.edu.vn` | Quản lý môn học/lớp học phần, sĩ số, waitlist, override, báo cáo, duyệt nguyện vọng |
| LECTURER | `minh.tuan` | `minh.tuan@ptithcm.edu.vn` | Xem lớp phụ trách, danh sách sinh viên, thời khóa biểu |
| STUDENT | `N23DCCN001` | `n23dccn001@student.ptithcm.edu.vn` | Đăng ký thành công, lịch học, lịch sử, nguyện vọng |
| STUDENT | `N23DCCN002` | `n23dccn002@student.ptithcm.edu.vn` | Waitlist, hủy/rút, trường hợp không đạt tiên quyết |

## Lệnh kiểm tra tự động

Backend:

```bash
cd backend
npm run lint
npm run test:rules
npm run build
```

Frontend:

```bash
cd frontend
npm run lint
npm run test
npm run build
npm run test:e2e
```

Integration backend chỉ chạy khi có `TEST_DATABASE_URL` trỏ đến database test riêng. Không chạy integration trên database demo thật vì script có thể reset/seed dữ liệu test.

E2E frontend hiện dùng Playwright tại `frontend/e2e/student-login.spec.ts`. Spec kiểm tra các luồng read-only trọng yếu: sinh viên `N23DCCN001` đăng nhập và mở kết quả đăng ký, giảng viên `minh.tuan` mở lớp được phân công, admin mở users/settings. Vì login gọi `POST /auth/login`, test cần backend thật kết nối database demo/test đang chạy. `frontend/playwright.config.ts` đã cấu hình webServer để reuse hoặc start backend và frontend; nếu backend thiếu `.env`/database thì cần start backend thủ công trước khi chạy e2e.

## Test case chính

| Mã | Vai trò | Màn hình/API | Bước thực hiện | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| AUTH-01 | Public | `/login`, `POST /auth/login` | Đăng nhập `N23DCCN001` / `ptithcm2026` | Trả về access token, refresh token, user đã sanitize |
| AUTH-02 | Admin | `/admin/users`, JWT guard | Khóa tài khoản đang có token, dùng token cũ gọi API protected | API trả về 401, user bị khóa không tiếp tục thao tác được |
| AUTH-03 | User | `/change-password` | Đổi mật khẩu với current password sai | Hiển thị thông báo lỗi, không đổi mật khẩu |
| AUTH-04 | User | Session timeout | Đặt `sessionTimeoutMinutes` ngắn, chờ quá `lastActivityAt + timeout` | Frontend tự đăng xuất; warning dùng `warningBeforeLogoutSeconds` |
| STUD-01 | Student | `/student/open-sections` | Tìm lớp còn chỗ và bấm đăng ký nhanh | Tạo enrollment `REGISTERED`, tăng sĩ số |
| STUD-02 | Student | `/student/register` | Kiểm tra điều kiện lớp full có allow waitlist | Backend trả về `WAITLISTED`, frontend hiện rule/result từ API |
| STUD-03 | Student | `/student/register` | Đăng ký môn thiếu tiên quyết bằng `N23DCCN002` | Từ chối với mã lỗi tiên quyết, ghi audit failure |
| STUD-03B | Student | `/student/register` | Đăng ký/waitlist section khác của cùng `courseCode` trong cùng học kỳ | Từ chối với `REG_ERR_ALREADY_REGISTERED_COURSE` |
| STUD-04 | Student | `/student/cancel` | Hủy enrollment trong adjustment window | Status thành `CANCELLED`, giảm sĩ số/waitlist |
| STUD-05 | Student | `/student/withdraw` | Rút enrollment trong withdrawal window | Status thành `DROPPED`, có lý do |
| STUD-06 | Student | `/student/wish` | Gửi và hủy nguyện vọng PENDING | Tạo wish PENDING, sau đó CANCELLED |
| STUD-07 | Student | `/student/schedule/week` | Mở TKB tuần | Hiển thị lịch dạng tuần theo thứ/tiết và dải tuần học trong học kỳ; chưa lọc theo một tuần lịch cụ thể |
| LEC-01 | Lecturer | `/lecturer/sections` | Đăng nhập `minh.tuan` | Chỉ thấy lớp của giảng viên hiện tại |
| LEC-02 | Lecturer | `/lecturer/sections/:id/students` | Mở lớp được phân công | Hiện danh sách sinh viên đã sanitize |
| LEC-03 | Lecturer | API sections students | Giảng viên gọi lớp không thuộc mình | API trả về 403 |
| ACAD-01 | Academic | `/academic/courses` | Tạo/sửa/xóa mềm học phần | API chấp nhận role `ACADEMIC_OFFICE`, ghi audit log |
| ACAD-02 | Academic | `/academic/sections/create` | Tạo lớp trùng phòng/giờ hoặc trùng giảng viên/giờ | API từ chối với lỗi trùng lịch |
| ACAD-02B | Academic | `DELETE /sections/:id` | Hủy section có enrollment active | Section `CANCELLED`, enrollment active chuyển `CANCELLED`, counters về 0, có audit log |
| ACAD-03 | Academic | `/academic/waitlist-override` | Process waitlist lớp còn chỗ | Promote sinh viên đủ điều kiện |
| ACAD-04 | Academic | `/academic/waitlist-override` | Override với lý do hợp lệ | Tạo/cập nhật enrollment `REGISTERED`, ghi audit |
| ACAD-05 | Academic | `/academic/reports` | Mở báo cáo học kỳ hiện tại | Hiển thị tổng lớp, tổng sức chứa, đã đăng ký, tỷ lệ lấp đầy, lớp full, waitlist |
| ACAD-06 | Academic | `/academic/wishes` | Từ chối nguyện vọng và nhập lý do | Backend cập nhật trạng thái, audit metadata có `reviewNote` |
| ADMIN-01 | Admin | `/admin/users` | Tạo sinh viên thủ công/import danh sách | Tạo account username = MSSV, email PTIT, mật khẩu mặc định |
| ADMIN-02 | Admin | `/admin/roles` | Đổi role user | Role mới được cập nhật, route guard phân quyền lại |
| ADMIN-03 | Admin | `/admin/settings` | Đổi maxCredits/simulationNow/timeout phiên | Rule đăng ký và session timeout đọc giá trị mới |
| ADMIN-04 | Admin | `/admin/settings`, `/snapshot/reset` | Bấm reset demo data | UI hiện confirm cảnh báo có thể xóa/thay thế dữ liệu demo trước khi gọi backend |
| ADMIN-05 | Admin | `/admin/settings`, `/snapshot/import` | Import snapshot JSON | UI hiện confirm cảnh báo, backend thay thế dữ liệu từ snapshot |
| LOG-01 | Admin/Academic | `/admin/audit-logs`, `/logs` | Lọc theo action/result | Trả về log đúng filter và phân trang nếu có |

## Playwright và manual smoke E2E

Project đã cấu hình Playwright. Chạy e2e từ thư mục `frontend`:

```bash
npm run test:e2e
```

Playwright hiện có smoke test read-only cho student/lecturer/admin. Khi chạy trên máy demo, backend thật phải sẵn sàng ở `http://localhost:3000/api` hoặc được Playwright start thành công từ `../backend`; không chạy seed/reset/import DB trong bước e2e. Các flow mutation còn lại vẫn kiểm thử thủ công theo checklist dưới đây:

| Flow | Tài khoản | Bước chính | Evidence cần chụp |
| --- | --- | --- | --- |
| Login student | `N23DCCN001` | Login, vào dashboard, mở thông tin cá nhân | Dashboard có tên sinh viên, session hoạt động |
| Student đăng ký | `N23DCCN001` hoặc `N23DCCN002` | Mở học phần mở, kiểm tra rule, đăng ký lớp còn chỗ hoặc vào waitlist | Toast/result DK_TC hoặc WAITLISTED, bảng kết quả cập nhật |
| Lecturer xem lớp | `minh.tuan` | Mở danh sách lớp, vào danh sách sinh viên của lớp được phân công | Chỉ thấy lớp của giảng viên, danh sách sinh viên được sanitize |
| Academic report/waitlist | `academic.office` | Mở waitlist/override, xử lý hoặc xem báo cáo | Báo cáo có tổng sức chứa, đã đăng ký, waitlist; waitlist xử lý có log |

## Checklist trước khi demo

- Chạy `git status --short`, đảm bảo không commit nhầm `.env`, `node_modules`, `dist` nếu không cần.
- Tạo/cập nhật `backend/.env` từ `backend/.env.example`.
- Đọc `docs/db-demo-freeze-checklist.md` và xác nhận DB đang dùng snapshot nào trước khi thao tác mutation.
- Nếu dùng database mới: chạy `npm run prisma:generate`, `npm run prisma:migrate:dev`, `npm run prisma:seed` sau khi đã xác nhận được phép reset DB.
- Chạy backend ở `http://localhost:3000/api` và mở Swagger UI.
- Chạy frontend ở `http://127.0.0.1:5173`.
- Đăng nhập thử 4 vai trò bằng bộ tài khoản demo chuẩn.
- Diễn tập các luồng: student register/waitlist, lecturer view students, academic process waitlist/override/report/wish review, admin lock/reset/settings/audit.
- Export snapshot trước mọi thao tác reset/import snapshot trên DB demo.
- Chụp màn hình các màn hình chính để đưa vào báo cáo.
