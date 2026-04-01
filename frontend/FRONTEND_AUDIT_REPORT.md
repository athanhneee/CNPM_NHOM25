# FRONTEND_AUDIT_REPORT

## Tóm tắt dự án và phạm vi
- Dự án: website đăng ký tín chỉ PTIT HCM mock version trên React + Vite + TailwindCSS.
- Phạm vi audit:
  - dữ liệu seed/mock
  - route/guard
  - luồng sinh viên
  - luồng phòng đào tạo
  - text tiếng Việt
  - build/lint/smoke test

## Route/page/module đã audit
- Public/System:
  - `/login`
  - `/forbidden`
  - `*` (404)
- Common:
  - `/`
  - `/profile`
  - `/change-password`
- Student:
  - `/student/open-sections`
  - `/student/open-sections/:sectionId`
  - `/student/register`
  - `/student/cancel`
  - `/student/withdraw`
  - `/student/schedule/week`
  - `/student/schedule/semester`
  - `/student/history`
  - `/student/prerequisites`
  - `/student/wish`
  - `/student/registered`
- Lecturer:
  - `/lecturer/sections`
  - `/lecturer/sections/:sectionId/students`
  - `/lecturer/schedule/week`
  - `/lecturer/schedule/semester`
- Academic office:
  - `/academic/courses`
  - `/academic/sections/create`
  - `/academic/assign-lecturer`
  - `/academic/registrations`
  - `/academic/schedule-rooms`
  - `/academic/reports`
  - `/academic/waitlist-override`
- Admin:
  - `/admin/users`
  - `/admin/roles`
  - `/admin/settings`
  - `/admin/audit-logs`
  - luồng thêm sinh viên thủ công
  - luồng import sinh viên từ Excel/tab-delimited

## Trình duyệt / viewport đã test
- Runtime smoke:
  - Chromium-equivalent local dev server check qua `http://127.0.0.1:5173` => HTTP 200
- Kỹ thuật:
  - `npm.cmd test`
  - `npm.cmd run lint`
  - `npm.cmd run build`
- Responsive/cross-browser:
  - chủ yếu audit bằng code và component structure
  - chưa có screenshot automation trong môi trường terminal hiện tại

## Tóm tắt phát hiện chính theo nhóm
- Data/UI consistency:
  - seed cũ dùng mã môn, section và semester không còn khớp với catalog mới
  - section counts trước đây có nguy cơ lệch với enrollments
- Vietnamese text:
  - nhiều label/placeholder/subtitle ở luồng sinh viên còn không dấu hoặc ví dụ mã môn cũ
  - còn sót một nhóm nhãn trạng thái, tooltip và subtitle không dấu ở `/lecturer/*`, `/academic/registrations` và các color maps dùng chung
- Academic UX:
  - catalog chưa khai thác các trường mới như ngành, khối kiến thức, loại môn, học kỳ gợi ý
- Admin UX:
  - trước khi sửa chưa có luồng thêm sinh viên trực tiếp từ giao diện quản trị
  - đã bổ sung nhập tay, upload Excel, xem trước và tổng kết import
- Profile UX:
  - cụm badge nhận diện trong `/profile` chưa căn giữa nội dung khi hiển thị kiểu pill lớn
  - đã chỉnh lại alignment để text đứng giữa ổn định trên desktop
- Regression coverage:
  - repo chưa có smoke test tự động cho seed data
  - đã bổ sung smoke test cho parser/import sinh viên

## Tổng số lỗi theo mức độ
- Critical: 0
- High: 5
- Medium: 6
- Low: 2

## Những cải tiến UI/UX đã thực hiện
- Chuẩn hóa lại text tiếng Việt ở luồng sinh viên.
- Đổi ví dụ mã môn cũ sang catalog PTIT mock mới.
- Mở rộng trang catalog học phần với filter theo:
  - ngành
  - khối kiến thức
  - loại môn
  - học kỳ gợi ý
- Bổ sung metadata hiển thị cho chi tiết học phần:
  - loại môn
  - khối kiến thức
  - ngành áp dụng
  - học kỳ gợi ý
- Đồng bộ performance snippets và audit log seed với mã môn mới.
- Căn giữa lại cụm badge nhận diện trên trang hồ sơ bằng pill `inline-flex` có chiều cao ổn định.
- Chuẩn hóa thêm các nhãn trạng thái/tooltip dùng chung:
  - đăng ký học phần
  - trạng thái lớp học phần
  - trạng thái tài khoản
- Chuẩn hóa lại subtitle và cột bảng ở luồng giảng viên/phòng đào tạo để không còn tiếng Việt không dấu.
- Bổ sung trang `/admin/users` với:
  - thêm 1 sinh viên thủ công
  - upload Excel `.xlsx/.xls`
  - hỗ trợ `.csv/.tsv/.txt`
  - xem trước danh sách hợp lệ/lỗi trước khi nhập
  - tổng kết số dòng đã thêm, bị bỏ qua, lỗi dữ liệu
- Thêm smoke test cho parser import sinh viên theo định dạng `Họ tên<TAB>MSSV<TAB>...`.

## Rủi ro còn lại
- Bundle JS vẫn đang vượt ngưỡng warning 500 kB của Vite; chưa xử lý code-splitting trong vòng thay đổi này.
- Chưa có browser automation/screenshot regression thật sự nên phần responsive/cross-browser vẫn là mức audit bằng code + smoke runtime.
- Sau khi cài thư viện đọc Excel, `npm install` báo 1 high severity vulnerability từ dependency tree; cần rà lại trước khi dùng production.
