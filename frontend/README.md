# Học Vụ Tín Chỉ PTIT HCM

Frontend mô phỏng hệ thống đăng ký học phần/tín chỉ cho Học Viện Công Nghệ Bưu Chính Viễn Thông cơ sở Hồ Chí Minh. Dự án được xây dựng bằng React + Vite + TypeScript + Tailwind CSS, dùng mock service layer và `localStorage` để mô phỏng xác thực, phân quyền, nhật ký hệ thống, cửa sổ đăng ký và các luồng nghiệp vụ theo vai trò.

## Điểm nhấn

- Giao diện sáng, tông màu teal/cyan, chữ mềm hơn và bo góc mạnh hơn
- Font Poppins cho toàn bộ ứng dụng
- Mock auth, RBAC, session timeout, maintenance mode, khóa tài khoản sau nhiều lần đăng nhập sai
- Luồng sinh viên, giảng viên, phòng đào tạo và quản trị đầy đủ
- Business rules đăng ký: tiên quyết, học trước, song hành, trùng lịch, giới hạn tín chỉ, waitlist
- Dữ liệu seed đủ để demo nhiều trạng thái nghiệp vụ

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Zustand
- React Router
- Lucide React

## Chạy local

```bash
npm install
npm run dev
```

Mặc định dev server chạy tại `http://127.0.0.1:5173`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Tài khoản demo

Mật khẩu demo chung: `ptithcm2026`

| Username | Email | Vai trò | Mô tả |
| --- | --- | --- | --- |
| `N23DCCN001` | `n23dccn001@student.ptithcm.edu.vn` | `STUDENT` | Có dữ liệu để demo đăng ký thành công, vào danh sách chờ, hủy và bị từ chối |
| `minh.tuan` | `minh.tuan@ptithcm.edu.vn` | `LECTURER` | Giảng viên PTIT HCM phụ trách nhiều lớp không trùng lịch trong học kỳ hiện tại |
| `academic.office` | `academic.office@ptithcm.edu.vn` | `ACADEMIC_OFFICE` | Tài khoản phòng đào tạo dùng để demo quản lý học phần, xử lý danh sách chờ và cập nhật lịch |
| `admin` | `admin@ptithcm.edu.vn` | `ADMIN` | Quản trị viên toàn quyền với tài khoản, vai trò, tham số hệ thống và audit log |
| `N23DCCN020` | `n23dccn020@student.ptithcm.edu.vn` | `STUDENT` | Tài khoản mẫu đã bị khóa để kiểm thử đăng nhập thất bại |

## Tính năng theo vai trò

### Chung

- Đăng nhập, đổi mật khẩu, xem hồ sơ
- Bảng điều khiển theo vai trò
- Breadcrumb, sidebar theo quyền, trang 403 và 404
- Toast, confirm dialog, loading, empty state, error state

### Sinh viên

- Tra cứu học phần mở
- Xem chi tiết học phần và bảng kiểm điều kiện
- Đăng ký học phần, vào waitlist khi phù hợp
- Hủy đăng ký trong adjustment window
- Rút học phần trước withdrawal deadline
- Xem thời khóa biểu tuần và học kỳ
- Xem lịch sử đăng ký có timeline
- Tra cứu môn tiên quyết, học trước, song hành
- Gửi nguyện vọng
- Xem danh sách học phần đã đăng ký và kết quả

### Giảng viên

- Xem danh sách lớp được phân công
- Xem danh sách sinh viên trong lớp phụ trách
- Xem thời khóa biểu giảng dạy dạng tuần và học kỳ

### Phòng đào tạo

- Quản lý danh mục môn học
- Tạo lớp học phần
- Phân công giảng viên
- Quản lý đăng ký, sĩ số, waitlist
- Quản lý lịch học và phòng học
- Xem báo cáo thống kê
- Xử lý waitlist và override có lưu nhật ký

### Quản trị

- Quản lý tài khoản
- Gán vai trò
- Cập nhật tham số hệ thống
- Bật/tắt maintenance mode
- Reset dữ liệu demo
- Export/import snapshot JSON
- Xem nhật ký hệ thống

## Dữ liệu seed

Bộ seed hiện tại gồm:

- `148` người dùng PTIT HCM
- `13` học phần
- `28` lớp học phần
- `29` bản ghi đăng ký
- `20` nhật ký hệ thống

Trạng thái có sẵn:

- Enrollment: `REGISTERED`, `WAITLISTED`, `CANCELLED`, `DROPPED`, `REJECTED`, `COMPLETED`, `FAILED`
- Section: `OPEN`, `FULL`, `CLOSED`, `CANCELLED`, `IN_PROGRESS`, `COMPLETED`

## LocalStorage

Ứng dụng đọc/ghi dữ liệu qua các key:

- `app_auth`
- `app_users`
- `app_courses`
- `app_sections`
- `app_enrollments`
- `app_logs`
- `app_settings`
- `app_wish_requests`

## Reset, export, import dữ liệu

Trong route `/admin/settings`:

- `Reset demo data`: gọi backend `/snapshot/reset` để đưa dữ liệu về seed mặc định khi backend đang chạy; ở mock/localStorage thì đưa dữ liệu về seed frontend
- `Export snapshot`: sao chép JSON hiện tại vào clipboard
- `Import snapshot`: nạp lại dữ liệu từ JSON

Nếu cần reset thủ công, có thể xóa các key `app_*` trong Local Storage của trình duyệt.

## Cấu trúc thư mục

```text
src/
  app/
    config/
    providers.tsx
    router.tsx
    store/
  components/
    calendar/
    guards/
    layout/
    shared/
    ui/
  features/
    admin/
    academic/
    auth/
    dashboard/
    lecturer/
    profile/
    student/
    system/
  lib/
  mocks/
    seed/
    services/
  types/
```

## Luồng demo gợi ý

### Sinh viên

1. Đăng nhập bằng `n23dccn001@student.ptithcm.edu.vn`
2. Mở trang học phần mở và lọc theo mã môn
3. Xem chi tiết một lớp học phần để kiểm tra điều kiện
4. Đăng ký một lớp còn chỗ
5. Thử đăng ký lớp đầy để vào waitlist
6. Đối chiếu tại lịch sử đăng ký và danh sách học phần đã đăng ký

### Giảng viên

1. Đăng nhập bằng `minh.tuan@ptithcm.edu.vn`
2. Xem các lớp được phân công
3. Mở danh sách sinh viên của một lớp
4. Xem lịch dạy tuần và học kỳ

### Phòng đào tạo

1. Đăng nhập bằng `academic.office@ptithcm.edu.vn`
2. Tạo lớp học phần mới
3. Phân công giảng viên
4. Xử lý waitlist hoặc override
5. Kiểm tra báo cáo thống kê

### Quản trị

1. Đăng nhập bằng `admin@ptithcm.edu.vn`
2. Khóa hoặc mở khóa một tài khoản
3. Đổi `maxCredits` trong phần tham số hệ thống
4. Quay lại màn đăng ký để kiểm tra business rule đã thay đổi
5. Xem audit log sau thao tác

## Kiểm tra đã thực hiện

- `npm run build`
- `npm run lint`
