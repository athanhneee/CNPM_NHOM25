# CNPM_NHOM25 - He thong dang ky hoc phan PTIT HCM

Do an cuoi mon Cong nghe phan mem: mo phong he thong dang ky hoc phan/tin chi cho sinh vien, giang vien, phong dao tao va quan tri vien.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Zustand, React Router.
- Backend: NestJS, TypeScript, Prisma ORM, Swagger, JWT + RBAC.
- Database: PostgreSQL/Supabase, migration quan ly bang Prisma.

## Cau truc thu muc

```text
backend/   NestJS API, Prisma schema, migration, seed
frontend/  React app, API client, UI theo vai tro, mock seed fallback
docs/      Tai lieu phan tich thiet ke va kich ban demo
```

## Yeu cau moi truong

- Node.js 20+.
- npm.
- PostgreSQL hoac Supabase PostgreSQL.
- File `backend/.env` duoc tao tu `backend/.env.example`.
- File `frontend/.env` neu can doi API base URL, theo mau `frontend/.env.example`.

## Chay backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

Backend mac dinh chay tai `http://localhost:3000/api`.
Swagger UI: `http://localhost:3000/api`.

## Chay frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend mac dinh chay tai `http://127.0.0.1:5173`.

Frontend uu tien goi API backend that qua `VITE_API_BASE_URL=http://localhost:3000/api`. Cac mock/localStorage trong `frontend/src/mocks` duoc giu lam du lieu fallback va doi chieu demo, khong phai nguon du lieu chinh khi backend dang chay.

## Tai khoan demo backend seed

Mat khau mac dinh: `ptithcm2026`.

| Vai tro | Username | Email |
| --- | --- | --- |
| ADMIN | `admin` | `admin@ptithcm.edu.vn` |
| ACADEMIC_OFFICE | `academic.office` | `academic.office@ptithcm.edu.vn` |
| LECTURER | `minh.tuan` | `minh.tuan@ptithcm.edu.vn` |
| STUDENT | `N23DCCN001` | `n23dccn001@student.ptithcm.edu.vn` |
| STUDENT | `N23DCCN002` | `n23dccn002@student.ptithcm.edu.vn` |

Backend seed la bo demo rut gon de chay nhanh voi PostgreSQL. Frontend mock seed co bo du lieu mo rong hon, gom nhieu sinh vien/mon hoc/section de doi chieu UI va demo offline.

## Checklist demo

Sinh vien:
- Dang nhap bang `N23DCCN001`.
- Xem hoc phan mo, chi tiet lop, dieu kien dang ky.
- Dang ky lop con cho, thu lop full de vao waitlist.
- Xem lich su, TKB, ket qua dang ky.
- Gui va huy nguyen vong hoc phan.

Giang vien:
- Dang nhap bang `minh.tuan`.
- Xem lop duoc phan cong.
- Mo danh sach sinh vien trong lop.
- Xem TKB tuan va hoc ky.

Phong dao tao:
- Dang nhap bang `academic.office`.
- Quan ly catalog hoc phan va lop hoc phan.
- Tao lop, phan cong giang vien, cap nhat phong/lich.
- Theo doi dang ky, xu ly waitlist, override.
- Xem bao cao si so/lap day.

Quan tri:
- Dang nhap bang `admin`.
- Quan ly tai khoan, khoa/mo khoa, import sinh vien.
- Cap nhat tham so he thong.
- Export/import snapshot va xem audit log.

## Lenh kiem tra

```bash
cd backend
npm run lint
npm run test:rules
npm run build
```

```bash
cd frontend
npm run lint
npm run test
npm run build
```

## Tai lieu bao cao

- [Phan tich thiet ke](docs/analysis-design.md)
- [Kich ban demo](docs/demo-script.md)
- [Ke hoach kiem thu](docs/test-plan.md)
- [Backend API contract](backend/API_CONTRACT.md)
- [Frontend README](frontend/README.md)
