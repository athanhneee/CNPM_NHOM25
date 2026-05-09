# CNPM Nhom 25 - Backend

Backend NestJS cho he thong dang ky hoc phan.

## Stack

- NestJS + TypeScript
- PostgreSQL tren Supabase
- Prisma ORM
- Swagger API docs
- JWT authentication + RBAC

## Cai dat

1. Tao file `.env` tu `.env.example`.
2. Cap nhat ket noi Supabase PostgreSQL:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="replace_with_a_secure_secret"
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
```

`DATABASE_URL` nen dung Supabase session pooler port 5432 cho backend NestJS local. Khi deploy serverless moi can can nhac transaction pooler port 6543 voi `pgbouncer=true`. `DIRECT_URL` duoc Prisma dung cho migration.

3. Cai dependencies:

```bash
npm install
```

4. Generate Prisma Client:

```bash
npm run prisma:generate
```

5. Chay migration va seed khi Supabase PostgreSQL da san sang:

```bash
npm run prisma:migrate:dev
npm run prisma:seed
```

6. Chay backend:

```bash
npm run start:dev
```

Swagger UI: `http://localhost:3000/api`

## Tai khoan demo

Tat ca dung mat khau mac dinh `ptithcm2026` sau khi chay seed.

- ADMIN: `admin`
- ACADEMIC_OFFICE: `academic.office`
- LECTURER: `minh.tuan`
- STUDENT: `N23DCCN001`, `N23DCCN002`

## Endpoint chinh

Xem [API_CONTRACT.md](./API_CONTRACT.md).
