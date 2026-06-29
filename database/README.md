# Database - Hệ thống Đăng ký Học phần (Nhóm 25)

## Tổng quan

Database sử dụng **PostgreSQL** (thông qua Supabase) và được quản lý bằng **Prisma ORM**.

## Cấu trúc thư mục

```
database/
├── create_database.sql   # File SQL tạo toàn bộ database (schema hoàn chỉnh)
└── README.md             # Hướng dẫn sử dụng
```

## Cách sử dụng

### Cách 1: Chạy trực tiếp file SQL (trên PostgreSQL)

```bash
psql -U postgres -d your_database -f create_database.sql
```

### Cách 2: Sử dụng Prisma (khuyến nghị)

```bash
cd backend

# Tạo database từ schema Prisma
npx prisma db push

# Hoặc chạy tất cả migrations
npx prisma migrate deploy

# Seed dữ liệu mẫu
npx prisma db seed
```

## Danh sách bảng dữ liệu

| STT | Tên bảng                | Mô tả                                              |
|-----|-------------------------|-----------------------------------------------------|
| 1   | `User`                  | Người dùng (Sinh viên, Giảng viên, Phòng ĐT, Admin)|
| 2   | `Course`                | Môn học                                             |
| 3   | `SemesterOption`        | Học kỳ                                              |
| 4   | `Section`               | Lớp học phần                                        |
| 5   | `Room`                  | Phòng học                                           |
| 6   | `CourseCondition`       | Điều kiện môn học (tiên quyết, song hành, ...)      |
| 7   | `Enrollment`            | Đăng ký học phần                                    |
| 8   | `StudentResult`         | Kết quả học tập                                     |
| 9   | `RegistrationErrorCode` | Mã lỗi đăng ký                                     |
| 10  | `WishRequest`           | Yêu cầu nguyện vọng mở lớp                         |
| 11  | `AuditLog`              | Nhật ký kiểm toán                                   |
| 12  | `SystemSetting`         | Cài đặt hệ thống                                   |
| 13  | `ElectiveGroup`         | Nhóm môn tự chọn                                   |
| 14  | `_CourseElectiveGroups`  | Bảng trung gian (N-N: Course ↔ ElectiveGroup)      |
| 15  | `RegistrationPhase`     | Đợt đăng ký theo học kỳ                            |

## Danh sách ENUM

| Tên ENUM                       | Mô tả                        | Giá trị                                                          |
|---------------------------------|-------------------------------|-------------------------------------------------------------------|
| `UserRole`                      | Vai trò người dùng           | STUDENT, LECTURER, ACADEMIC_OFFICE, ADMIN                         |
| `AccountStatus`                 | Trạng thái tài khoản         | ACTIVE, LOCKED, INACTIVE, DEFERRED, SUSPENDED                     |
| `CourseStatus`                  | Trạng thái môn học           | ACTIVE, INACTIVE                                                   |
| `CourseCategory`                | Phân loại môn học            | FOUNDATION, CORE, ELECTIVE, THESIS                                 |
| `EnrollmentStatus`             | Trạng thái đăng ký           | PENDING, REGISTERED, CANCELLED, REJECTED, COMPLETED, FAILED, ...   |
| `SectionStatus`                | Trạng thái lớp học phần      | OPEN, CLOSED, FULL, CANCELLED, IN_PROGRESS, COMPLETED              |
| `WishStatus`                   | Trạng thái nguyện vọng       | PENDING, REVIEWED, APPROVED, REJECTED, CANCELLED                   |
| `AuditResult`                  | Kết quả kiểm toán           | SUCCESS, FAILURE, WARNING, INFO                                     |
| `SemesterRegistrationStatus`   | Trạng thái đăng ký HK       | UPCOMING, OPEN, ADJUSTMENT, CLOSED, COMPLETED                      |
| `CourseConditionType`          | Loại điều kiện môn           | PREREQUISITE, PRESTUDY, COREQUISITE, EQUIVALENT, REPLACEMENT       |
| `StudentResultStatus`          | Trạng thái kết quả           | PASSED, FAILED, IN_PROGRESS, TRANSFERRED, WITHDRAWN                |
| `SemesterType`                 | Loại học kỳ                  | MAIN, SUMMER                                                       |
| `LearningMode`                 | Hình thức học                | OFFLINE, ONLINE, BLENDED                                           |

## Thông tin kỹ thuật

- **DBMS**: PostgreSQL 15+
- **ORM**: Prisma 6.x
- **Hosting**: Supabase (AWS ap-northeast-1)
- **Nguồn schema**: `backend/prisma/schema.prisma`
- **Migrations**: `backend/prisma/migrations/` (14 migrations)
- **Seed data**: `backend/prisma/seed.ts`
