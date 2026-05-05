# CNPM Nhóm 25 - Backend

Backend NestJS cho hệ thống đăng ký học phần.

## Stack

- NestJS + TypeScript
- MySQL
- Prisma ORM
- Swagger API docs
- JWT authentication + RBAC

## Cài đặt

1. Tạo file `.env` từ `.env.example`.
2. Cập nhật `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`.
3. Cài dependencies:

```bash
npm install
```

4. Generate Prisma Client:

```bash
npm run prisma:generate
```

5. Chạy migration và seed khi MySQL đã sẵn sàng:

```bash
npm run prisma:migrate:dev
npm run prisma:seed
```

6. Chạy backend:

```bash
npm run start:dev
```

Swagger UI: `http://localhost:3000/api`

## Tài khoản demo

Tất cả dùng mật khẩu mặc định `ptithcm2026` sau khi chạy seed.

- ADMIN: `admin`
- ACADEMIC_OFFICE: `academic.office`
- LECTURER: `minh.tuan`
- STUDENT: `N23DCCN001`, `N23DCCN002`

## Endpoint chính

Xem [API_CONTRACT.md](./API_CONTRACT.md).
