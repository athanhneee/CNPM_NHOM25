# CNPM_NHOM25 - Hệ thống đăng ký học phần PTIT HCM

Đồ án cuối môn Công nghệ phần mềm: mô phỏng hệ thống đăng ký học phần/tín chỉ cho sinh viên, giảng viên, phòng đào tạo và quản trị viên.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Zustand, React Router.
- Backend: NestJS, TypeScript, Prisma ORM, Swagger, JWT + RBAC.
- Database: PostgreSQL/Supabase, migration quản lý bằng Prisma.

## Cấu trúc thư mục

```text
backend/   NestJS API, Prisma schema, migration, seed
frontend/  React app, API client, UI theo vai trò, mock seed fallback
docs/      Tài liệu phân tích thiết kế và kịch bản demo
```

## Yêu cầu môi trường

- Node.js 20+.
- npm.
- PostgreSQL hoặc Supabase PostgreSQL.
- File `backend/.env` được tạo từ `backend/.env.example`.
- File `frontend/.env` nếu cần đổi API base URL, theo mẫu `frontend/.env.example`.
- Nếu chạy integration test backend, cấu hình thêm `TEST_DATABASE_URL` trỏ đến database test riêng. Script này có reset/seed test DB, không dùng cho DB demo thật.

## Chạy backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

Backend mặc định chạy tại `http://localhost:3000/api`.
Swagger UI: `http://localhost:3000/api`.

## Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy tại `http://127.0.0.1:5173`.

Frontend ưu tiên gọi API backend thật qua `VITE_API_BASE_URL=http://localhost:3000/api`. Backend là nguồn dữ liệu chính cho đăng nhập, phân quyền và các thao tác mutation. Mock/localStorage trong `frontend/src/mocks` chủ yếu là cache/fallback hiển thị và dữ liệu demo phụ trợ khi backend không sẵn sàng; để demo cuối môn ổn định nên chạy backend.

Trang Admin/Settings có trường `simulationNow` để đổi mốc thời gian demo của backend, giúp trình bày các cửa sổ đăng ký, điều chỉnh, hủy và rút học phần mà không cần sửa seed.

## Tài khoản demo backend seed

Mật khẩu mặc định: `ptithcm2026`.

| Vai trò | Username | Email |
| --- | --- | --- |
| ADMIN | `admin` | `admin@ptithcm.edu.vn` |
| ACADEMIC_OFFICE | `academic.office` | `academic.office@ptithcm.edu.vn` |
| LECTURER | `minh.tuan` | `minh.tuan@ptithcm.edu.vn` |
| STUDENT | `N23DCCN001` | `n23dccn001@student.ptithcm.edu.vn` |
| STUDENT | `N23DCCN002` | `n23dccn002@student.ptithcm.edu.vn` |

Backend seed có dữ liệu demo cho: đăng ký thành công, lớp full/waitlist, case fail tiên quyết, giảng viên có lớp, và đủ tài khoản admin/academic/student/lecturer. Không chạy seed/reset trên DB demo thật nếu chưa xác nhận vì thao tác này sẽ thay thế dữ liệu hiện tại.

## Checklist demo

Sinh viên:
- Đăng nhập bằng `N23DCCN001` hoặc `N23DCCN002`.
- Xem học phần mở, chi tiết lớp, điều kiện đăng ký.
- Đăng ký lớp còn chỗ, thử lớp full để vào waitlist.
- Xem lịch sử, TKB, kết quả đăng ký.
- Gửi và hủy nguyện vọng học phần.

Giảng viên:
- Đăng nhập bằng `minh.tuan`.
- Xem lớp được phân công.
- Mở danh sách sinh viên trong lớp.
- Xem TKB tuần và học kỳ.

Phòng đào tạo:
- Đăng nhập bằng `academic.office`.
- Quản lý catalog học phần và lớp học phần.
- Tạo lớp, phân công giảng viên, cập nhật phòng/lịch.
- Theo dõi đăng ký, xử lý waitlist, override.
- Xem báo cáo sĩ số/lấp đầy.
- Duyệt/từ chối nguyện vọng kèm phản hồi.

Quản trị:
- Đăng nhập bằng `admin`.
- Quản lý tài khoản, khóa/mở khóa, import sinh viên.
- Cập nhật tham số hệ thống, timeout phiên.
- Export/import snapshot và xem audit log.

## Lệnh kiểm tra

```bash
cd backend
npm run lint
npm run test:rules
npm run test:integration
npm run build
```

```bash
cd frontend
npm run lint
npm run test
npm run build
```

Chỉ chạy `npm run test:integration` khi có `TEST_DATABASE_URL` riêng cho test.

## Tài liệu báo cáo

- [Phân tích thiết kế](docs/analysis-design.md)
- [Kịch bản demo](docs/demo-script.md)
- [Kế hoạch kiểm thử](docs/test-plan.md)
- [Backend API contract](backend/API_CONTRACT.md)
- [Frontend README](frontend/README.md)
