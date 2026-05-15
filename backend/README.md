# CNPM Nhóm 25 - Backend

Backend NestJS cho hệ thống đăng ký học phần.

## Stack

- NestJS + TypeScript
- PostgreSQL trên Supabase
- Prisma ORM
- Swagger API docs
- JWT authentication + RBAC

## Cài đặt

1. Tạo file `.env` từ `.env.example`.
2. Cập nhật kết nối Supabase PostgreSQL:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="replace_with_a_secure_secret"
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
```

`DATABASE_URL` nên dùng Supabase session pooler port 5432 cho backend NestJS local. Khi deploy serverless mới cần cân nhắc transaction pooler port 6543 với `pgbouncer=true`. `DIRECT_URL` được Prisma dùng cho migration.

3. Cài dependencies:

```bash
npm install
```

4. Generate Prisma Client:

```bash
npm run prisma:generate
```

5. Chạy migration và seed khi Supabase PostgreSQL đã sẵn sàng:

```bash
npm run prisma:migrate:dev
npm run prisma:seed
```

Không chạy seed/reset trên DB demo thật nếu chưa xác nhận, vì seed sẽ xóa và tạo lại dữ liệu demo.

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

Seed hiện có case đăng ký thành công, lớp full/waitlist, fail tiên quyết, giảng viên có lớp, và đủ tài khoản demo cho 4 vai trò.

## Endpoint chính

Xem [API_CONTRACT.md](./API_CONTRACT.md).
