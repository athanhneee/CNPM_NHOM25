# FRONTEND_TEST_MATRIX

| Module | Route | Happy | Empty | Invalid | API Error | Permission | Responsive | Cross-browser | Kết quả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth / Login | `/login` | Code review + seed account | Có | Có | Có thông báo lỗi auth mock | Có guard | Audit code | Chưa xác minh | Đạt mức smoke |
| Dashboard / Profile | `/`, `/profile`, `/change-password` | Code review | Không trọng tâm | Có validate đổi mật khẩu | Có toast lỗi | Có role guard | Audit code | Chưa xác minh | Đạt mức smoke |
| Student open sections | `/student/open-sections` | Có | Có empty state | Có filter/status | Có maintenance/eligibility message | Có | Audit code | Chưa xác minh | Đạt |
| Student detail/register | `/student/open-sections/:sectionId`, `/student/register` | Có | Có | Có kiểm tra điều kiện | Có reject do tiên quyết | Có | Audit code | Chưa xác minh | Đạt |
| Student cancel/withdraw | `/student/cancel`, `/student/withdraw` | Có | Có | Có confirm/reason | Có catch lỗi service | Có | Audit code | Chưa xác minh | Đạt |
| Student schedule/history | `/student/schedule/*`, `/student/history`, `/student/registered` | Có | Có | Không áp dụng nhiều | Dùng seed fallback | Có | Audit code | Chưa xác minh | Đạt |
| Student prerequisites/wish | `/student/prerequisites`, `/student/wish` | Có | Có | Có validate lý do | Có toast lỗi | Có | Audit code | Chưa xác minh | Đạt |
| Lecturer | `/lecturer/*` | Code review | Có | Không trọng tâm | Có fallback dữ liệu | Có | Audit code | Chưa xác minh | Đạt mức smoke |
| Academic office | `/academic/*` | Có | Có | Có validate trùng lịch/phòng/section | Có toast lỗi | Có | Audit code | Chưa xác minh | Đạt |
| Admin | `/admin/*`, đặc biệt `/admin/users` | Có thêm sinh viên thủ công và import Excel/tab-delimited | Có empty preview / không có kết quả tìm kiếm | Có validate thiếu MSSV, thiếu họ tên, mã sai định dạng | Có toast lỗi đọc file / nhập thất bại | Có | Audit code + dev server smoke | Chưa xác minh | Đạt mức smoke |
| System pages | `/forbidden`, `*` | Có | N/A | N/A | N/A | Có | Audit code | Chưa xác minh | Đạt |
