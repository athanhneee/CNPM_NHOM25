# FRONTEND_FIX_LOG

## Data / seed
- `src/mocks/seed/student-seed-raw.ts`
  - thêm toàn bộ 131 sinh viên nguồn gốc
  - dùng làm input chuẩn cho parser/import
  - đã dùng lại trong smoke test
- `src/mocks/seed/ptit-helpers.ts`
  - thêm parser sinh viên, mapper ngành, helper lớp hành chính, helper đếm section
  - mục tiêu: chuẩn hóa import và mapping an toàn
- `src/mocks/seed/users.ts`
  - dựng lại toàn bộ seed sinh viên/giảng viên/phòng đào tạo/admin
  - thêm majorCode, classificationStatus, specialization, email, account mock
- `src/mocks/seed/courses.ts`
  - dựng lại catalog PTIT mock gồm 44 môn
  - thêm metadata học vụ phục vụ filter/chi tiết
- `src/mocks/seed/sections.ts`
  - dựng 32 section cho 3 học kỳ
  - đồng bộ `registeredCount` và `waitlistCount` từ enrollments
- `src/mocks/seed/enrollments.ts`
  - thêm seed lịch sử hoàn thành, đăng ký hiện tại, waitlist, cancel, reject
  - tạo dữ liệu đủ case để demo đăng ký tín chỉ
- `src/mocks/seed/settings.ts`
  - cập nhật học kỳ 2025–2026, cửa sổ đăng ký, current semester
- `src/mocks/seed/logs.ts`
  - đồng bộ lại message theo mã môn/lớp mới

## UI / UX
- `src/features/admin/admin-pages.tsx`
  - bổ sung form thêm 1 sinh viên thủ công trong `/admin/users`
  - bổ sung upload Excel/tab-delimited, xem trước dữ liệu và tổng kết import
  - mục tiêu: để admin thêm sinh viên ngay trên giao diện thay vì phải sửa seed thủ công
- `src/features/student/student-pages.tsx`
  - chuẩn hóa text tiếng Việt ở luồng sinh viên
  - thay ví dụ mã môn cũ bằng catalog mới
  - thêm metadata môn học ở trang chi tiết và đăng ký
  - thêm bộ lọc tại màn `Đăng ký học phần` theo:
    - lớp sinh viên đang học
    - khoa quản lý học phần
  - hỗ trợ suy luận ngành/khoa từ mã lớp như `D23CQCN01-N`, `D23CNTT1`, `D23ATTT1`
  - thêm empty state rõ ràng khi bộ lọc không còn lớp học phần phù hợp
- `src/features/academic/academic-pages.tsx`
  - thêm filter catalog theo ngành, khối, loại môn, học kỳ
  - mở rộng biểu mẫu học phần để lưu metadata mới
- `src/lib/selectors.ts`
  - đồng bộ course labels dùng trong performance/dashboard

## UI / typography follow-up
- `src/features/pages.tsx`
  - căn giữa lại cụm badge nhận diện ở `/profile`
  - đổi badge sang `inline-flex` có `min-height`, `items-center`, `justify-center`
  - mục tiêu: giữ text đứng giữa ổn định trong pill lớn theo đúng layout mới
- `src/lib/color-maps.ts`
  - chuẩn hóa lại toàn bộ label/tooltip trạng thái sang tiếng Việt có dấu
  - ảnh hưởng trực tiếp tới badge/trạng thái dùng chung ở nhiều route
- `src/features/lecturer/lecturer-pages.tsx`
  - sửa header bảng, subtitle, error state và ô tìm kiếm còn tiếng Việt không dấu
  - đồng thời ưu tiên hiển thị `studentClass` thay cho `program` ở cột lớp
- `src/features/academic/academic-pages.tsx`
  - sửa cột `Lớp` trong quản lý đăng ký để hiển thị `studentClass`
  - chuẩn hóa text mặc định của lý do tăng chỉ tiêu
- `src/lib/business-rules.ts`
  - chuẩn hóa message điều kiện đăng ký, trùng lịch, tín chỉ, waitlist sang tiếng Việt có dấu
  - giúp toast/feedback nghiệp vụ rõ ràng hơn
- `src/app/store/data.store.ts`
  - sửa lại error message và audit message còn không dấu trong các thao tác tài khoản/học phần/waitlist
  - tránh lẫn tiếng Việt không dấu trên UI audit và toast

## Tooling / verification
- `src/lib/student-import.ts`
  - thêm parser cho Excel/text tab-delimited và builder hồ sơ sinh viên mới
  - chuẩn hóa 2 cột đầu: Họ tên, MSSV; bỏ qua các cột sau
- `src/app/store/data.store.ts`
  - thêm `createStudentUser` và `importStudentUsers`
  - đảm bảo persist localStorage và audit log đồng bộ khi admin thêm sinh viên
- `src/mocks/services/admin.service.ts`
  - thêm service wrapper cho tạo sinh viên và import nhiều sinh viên
- `package.json`
  - mở rộng script `test`
- `tsconfig.app.json`
  - exclude test files khỏi build app
- `src/mocks/seed/ptit-helpers.test.ts`
  - smoke test parser/mapping sinh viên
- `src/mocks/seed/ptit-seed-smoke.test.ts`
  - smoke test file-level seed scenario
- `src/lib/student-import.test.ts`
  - smoke test parser import theo format admin mới

## Ảnh hưởng
- Luồng sinh viên và phòng đào tạo đọc được dữ liệu PTIT mock mới mà không vỡ build.
- Admin/đào tạo có thể lọc catalog theo ngữ nghĩa học vụ thay vì chỉ tìm text.
- Dữ liệu mới sẵn sàng cho demo đăng ký học phần, waitlist, hủy, từ chối tiên quyết.
- Admin có thể thêm sinh viên ngay trên UI bằng nhập tay hoặc upload tệp Excel/tab-delimited.

## Đã test lại
- Có
  - `npm.cmd test`
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - smoke runtime qua dev server cục bộ HTTP 200
