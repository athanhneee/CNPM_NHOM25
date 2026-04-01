# FRONTEND_BUG_CHECKLIST

- [x] `BUG-H01` Dữ liệu section/semester cũ không khớp catalog mới | route: student/*, academic/* | role: Student, Academic Office | severity: High | trạng thái: Đã xử lý
- [x] `BUG-H02` Catalog học phần chưa lọc được theo ngành/khối kiến thức/loại môn/học kỳ | route: `/academic/courses` | role: Academic Office | severity: High | trạng thái: Đã xử lý
- [x] `BUG-H03` Luồng sinh viên còn nhiều label không dấu và ví dụ mã môn cũ | route: `/student/*` | role: Student | severity: High | trạng thái: Đã xử lý
- [x] `BUG-H04` Admin chưa có luồng thêm sinh viên bằng nhập tay hoặc upload Excel/tab-delimited | route: `/admin/users` | role: Admin | severity: High | trạng thái: Đã xử lý
- [x] `BUG-H05` Cụm badge nhận diện ở trang hồ sơ chưa căn giữa nội dung, gây lệch thị giác trên card lớn | route: `/profile` | role: Student, Lecturer, Academic Office, Admin | severity: High | trạng thái: Đã xử lý
- [x] `BUG-M01` Audit logs và thẻ hiệu suất còn dùng mã môn seed cũ | route: `/`, các dashboard liên quan | role: Student, Lecturer, Academic Office, Admin | severity: Medium | trạng thái: Đã xử lý
- [x] `BUG-M02` Mapping prefix MSSV chưa an toàn cho mã ngoài DCCN/DCAT | route: data layer, student/admin views | role: Student, Admin | severity: Medium | trạng thái: Đã xử lý
- [x] `BUG-M03` Chưa có smoke test cho parser/mapping/seed scenario | route: repo-level | role: Dev/QA | severity: Medium | trạng thái: Đã xử lý
- [x] `BUG-M04` Chi tiết học phần chưa hiển thị rõ loại môn, ngành áp dụng, học kỳ gợi ý | route: `/student/open-sections/:sectionId` | role: Student | severity: Medium | trạng thái: Đã xử lý
- [x] `BUG-M05` Số lượng đăng ký và waitlist có nguy cơ lệch giữa section và enrollment seed | route: student/*, academic/* | role: Student, Academic Office | severity: Medium | trạng thái: Đã xử lý
- [x] `BUG-M06` Một số nhãn trạng thái, tooltip và subtitle ở lecturer/academic/common maps còn tiếng Việt không dấu | route: `/profile`, `/lecturer/*`, `/academic/registrations`, các badge trạng thái | role: Student, Lecturer, Academic Office, Admin | severity: Medium | trạng thái: Đã xử lý
- [ ] `BUG-L01` Bundle production vượt warning 500 kB của Vite | route: toàn app | role: All | severity: Low | trạng thái: Chưa xử lý
- [ ] `BUG-L02` Chưa có xác minh cross-browser bằng Firefox/WebKit trong môi trường hiện tại | route: toàn app | role: All | severity: Low | trạng thái: Chưa xử lý
