# Frontend - CNPM_NHOM25

Ứng dụng React/Vite cho hệ thống đăng ký học phần PTIT HCM. Frontend ưu tiên kết nối backend NestJS thật qua API; mock/localStorage chỉ dùng làm cache/fallback hiển thị và dữ liệu demo phụ trợ.

## Stack

- React 19, TypeScript, Vite.
- Tailwind CSS v4.
- Zustand cho auth/data/UI state.
- React Router cho route theo role.
- Lucide React cho icon.

## Chạy local

```bash
cd frontend
npm install
npm run dev
```

Dev server mặc định: `http://127.0.0.1:5173`.

Tạo `frontend/.env` nếu cần đổi API:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Để demo ổn định, hãy chạy backend trước. Một số màn vẫn có dữ liệu mock/localStorage để hiển thị khi API lỗi, nhưng đăng nhập, phân quyền và các thao tác mutation chính phụ thuộc backend.

## Scripts

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
npm run preview
```

`npm run test:e2e` dùng Playwright, hiện có smoke test đăng nhập sinh viên. Test này gọi backend thật, nên backend cần có `.env` và database sẵn sàng; Playwright config sẽ reuse hoặc start backend/frontend, nhưng không seed/reset/import DB.

## Kết nối backend thật

Các màn hình chính đang ưu tiên gọi backend:

- Auth: `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout`.
- Profile: `PATCH /users/me`.
- Settings: `GET /settings`, `PATCH /settings`, gồm cả `simulationNow`, timeout phiên và cảnh báo logout.
- Schedule: `/schedules/students/:studentId/week/:semesterId`, `/schedules/students/:studentId/semester/:semesterId`, `/schedules/lecturers/:lecturerId/week/:semesterId`, `/schedules/lecturers/:lecturerId/semester/:semesterId`. Các endpoint `week` trả lịch dạng tuần theo thứ/tiết và dải tuần học trong học kỳ, chưa có filter theo một tuần lịch cụ thể.
- Audit log: `GET /logs`.
- Admin/academic CRUD: users, courses, sections, enrollments, reports, snapshot theo backend API contract.

Mock data nằm trong `src/mocks` và localStorage key `app_*` không phải nguồn dữ liệu chính khi backend chạy.

## Tài khoản demo backend seed

Mật khẩu chung: `ptithcm2026`.

| Role | Username |
| --- | --- |
| ADMIN | `admin` |
| ACADEMIC_OFFICE | `academic.office` |
| LECTURER | `minh.tuan` |
| STUDENT | `N23DCCN001` |

## Flow demo gợi ý

- Student: đăng nhập, xem học phần mở, kiểm tra điều kiện, đăng ký/waitlist, xem lịch tuần và học kỳ.
- Lecturer: xem lớp phụ trách, danh sách sinh viên, lịch dạy.
- Academic office: quản lý học phần/lớp, phân công giảng viên, báo cáo, waitlist/override, duyệt nguyện vọng kèm phản hồi.
- Admin: users, roles, settings có `simulationNow`, timeout phiên, logs, snapshot.

## Ghi chú

- Backend là nguồn dữ liệu chính khi API chạy được.
- Không commit `.env`, `node_modules`, `dist`.
- Khi cần reset DB thật, dùng backend seed/snapshot có chú ý vì thao tác reset/import có thể xóa hoặc thay thế dữ liệu demo hiện tại.
