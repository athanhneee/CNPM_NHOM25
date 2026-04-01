# DATA_UPDATE_REPORT

## Tóm tắt
- Đã import đầy đủ 131 sinh viên từ danh sách cung cấp.
- Đã tái cấu trúc seed dữ liệu cho sinh viên, môn học, lớp học phần, học kỳ, đăng ký học phần và quan hệ tiên quyết theo hướng PTIT HCM mock version.
- Đã cập nhật UI để đọc được metadata mới của catalog và hiển thị tiếng Việt rõ ràng hơn ở các luồng sinh viên, phòng đào tạo và quản trị.
- Đã bổ sung luồng quản trị để admin thêm sinh viên trực tiếp bằng nhập tay hoặc upload Excel/tab-delimited.

## File đã sửa
- `src/types/course.ts`
- `src/types/settings.ts`
- `src/types/user.ts`
- `src/mocks/seed/ptit-helpers.ts`
- `src/mocks/seed/student-seed-raw.ts`
- `src/mocks/seed/courses.ts`
- `src/mocks/seed/relations.ts`
- `src/mocks/seed/settings.ts`
- `src/mocks/seed/users.ts`
- `src/mocks/seed/enrollments.ts`
- `src/mocks/seed/sections.ts`
- `src/mocks/seed/logs.ts`
- `src/lib/selectors.ts`
- `src/lib/student-import.ts`
- `src/lib/student-import.test.ts`
- `src/app/store/data.store.ts`
- `src/mocks/services/admin.service.ts`
- `src/features/student/student-pages.tsx`
- `src/features/academic/academic-pages.tsx`
- `src/features/admin/admin-pages.tsx`
- `package.json`
- `tsconfig.app.json`
- `src/mocks/seed/ptit-helpers.test.ts`
- `src/mocks/seed/ptit-seed-smoke.test.ts`

## Số liệu cập nhật
- Sinh viên import: 131
- Sinh viên map vào CNTT: 73
- Sinh viên map vào ATTT: 57
- Sinh viên map vào nhóm cần rà soát: 1
- Môn học trong catalog: 44
- Lớp học phần/section: 32
- Case từ chối do tiên quyết đã seed sẵn: 2
- Tài khoản demo nổi bật cập nhật: 5

## Thay đổi dữ liệu chính
- Dựng lại `seedUsers` để toàn bộ sinh viên mới đều có tài khoản mock, email, lớp hành chính, khóa, chuyên ngành và trạng thái học vụ.
- Dựng catalog môn học có metadata học vụ: `courseType`, `academicBlock`, `suggestedSemester`, `majorsSupported`, `majorCodesSupported`, giờ học, trọng số điểm và mô tả.
- Đồng bộ `seedSections` với `seedEnrollments` để `registeredCount` và `waitlistCount` được tính từ dữ liệu thực.
- Tạo đủ học kỳ:
  - `2025-2026-1`
  - `2025-2026-2`
  - `2025-2026-he`
- Seed các trạng thái thực tế cho demo:
  - lớp còn chỗ
  - lớp đầy
  - lớp có waitlist
  - lớp đóng
  - đăng ký thành công
  - hủy đăng ký
  - từ chối do tiên quyết

## Bổ sung luồng admin
- Admin có thể:
  - thêm 1 sinh viên thủ công
  - upload Excel `.xlsx/.xls`
  - dán dữ liệu `Họ tên<TAB>MSSV<TAB>...`
  - xem trước danh sách hợp lệ và dòng lỗi
  - nhập hàng loạt vào local demo data
- Dữ liệu import sẽ:
  - tự tạo tài khoản `STUDENT`
  - dùng `MSSV` làm username
  - dùng mật khẩu mặc định `ptithcm2026`
  - suy luận ngành từ prefix MSSV
  - giữ prefix chưa map được ở trạng thái `Cần rà soát`
  - ghi audit log cho thao tác import

## Nguồn PTIT HCM đã tham chiếu
- https://ptithcm.edu.vn/chuong-trinh-dao-tao
- https://ptithcm.edu.vn/chuong-trinh-dao-tao/chuong-trinh-dao-tao-cong-nghe-thong-tin
- https://ptithcm.edu.vn/chuong-trinh-dao-tao/chuong-trinh-dao-tao-an-toan-thong-tin
- https://ptithcm.edu.vn/wp-content/uploads/2022/11/ChuongTrinhCNTT-2021.pdf

## Phần bám PTIT HCM
- Cấu trúc catalog theo khối kiến thức chung, cơ sở ngành, chuyên ngành, tự chọn.
- Ngành CNTT có phản ánh các hướng:
  - Công nghệ phần mềm
  - Kỹ thuật máy tính
  - Hệ thống thông tin
  - Khoa học máy tính
  - Máy tính và truyền thông dữ liệu
- Ngành ATTT có các cụm học phần cốt lõi:
  - nhập môn ATTT
  - mật mã
  - an toàn mạng
  - bảo mật hệ điều hành
  - bảo mật ứng dụng web
  - kiểm thử xâm nhập
  - điều tra số
  - quản trị rủi ro ATTT

## Kiểm tra đã chạy
- `npm.cmd test`
- `npm.cmd run lint`
- `npm.cmd run build`
- Khởi chạy dev server cục bộ và kiểm tra `http://127.0.0.1:5173` trả về HTTP 200
- Kiểm tra thêm `http://127.0.0.1:5173/admin/users` trả về HTTP 200 sau khi bổ sung luồng import sinh viên

## Giới hạn môi trường
- Không có browser automation/screenshot test đầy đủ trong terminal hiện tại, nên phần xác nhận UI chủ yếu dựa trên code audit, build sạch, smoke test dữ liệu và dev-server check.
- PDF chương trình CNTT của PTIT được tham chiếu ở mức định hướng cấu trúc; mã học phần trong mock đã được chuẩn hóa theo hướng hợp lý để phục vụ demo, không tuyên bố trùng 100% từng mã nội bộ của PTIT.
- Sau khi cài thư viện đọc Excel, `npm install` báo 1 high severity vulnerability trong dependency tree; cần rà lại trước khi dùng production.
