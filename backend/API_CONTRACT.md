# API Contract

Base URL: `http://localhost:3000/api`

Database target: PostgreSQL on Supabase via Prisma.

Required backend env:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="replace_with_a_secure_secret"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
```

Auth header for protected routes:

```http
Authorization: Bearer <accessToken>
```

## Auth

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Body `{ identifier, password, rememberMe }`; returns `accessToken`, `refreshToken`, `session`, sanitized `user`. |
| POST | `/auth/refresh` | Public | Body `{ refreshToken, userId? }`; returns new access token. |
| GET | `/auth/me` | Authenticated | Restore current user from JWT. |
| POST | `/auth/logout` | Authenticated | Clears stored refresh token hash. |
| POST | `/auth/change-password` | Authenticated | Body `{ currentPassword, newPassword }`. |

## Users

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/users` | ADMIN | Supports `search`, `role`, `status`, `page`, `limit`. |
| GET/PATCH | `/users/me` | Authenticated | Current profile. Normal users cannot update role/status/username; profile fields such as email, phone, secondaryEmail, address, bio, avatarUrl can be updated. |
| POST | `/users` | ADMIN | Create account. |
| GET/PATCH/DELETE | `/users/:id` | ADMIN | Delete is soft deactivation. |
| POST | `/users/:id/lock` | ADMIN | Lock account. |
| POST | `/users/:id/unlock` | ADMIN | Unlock account. |
| POST | `/users/:id/reset-password` | ADMIN | Body `{ password }`. |
| POST | `/users/students` | ADMIN | Create one student from `{ fullName, code }`. |
| POST | `/users/import-students` | ADMIN | Body `{ students: [{ fullName, code, rowNumber? }] }`. |

## Courses And Sections

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/courses` | Authenticated | Supports `search`, `department`, `campus`, `status`, `category`, `semesterId`, `page`, `limit`. |
| GET | `/courses/:id` | Authenticated | `id` can be course id or course code. |
| POST/PATCH/DELETE | `/courses` / `/courses/:id` | ADMIN, ACADEMIC_OFFICE | Delete sets `status = INACTIVE`. |
| GET | `/sections` | Authenticated | Supports `search`, `semesterId`, `courseCode`, `lecturerId`, `status`, `campus`, `page`, `limit`. |
| GET | `/sections/:id` | Authenticated | Section detail. |
| GET | `/sections/:id/students` | Assigned LECTURER, ADMIN, ACADEMIC_OFFICE | Returns enrollments in the section with sanitized student info. |
| POST/PATCH/DELETE | `/sections` / `/sections/:id` | ADMIN, ACADEMIC_OFFICE | Delete sets `status = CANCELLED`, cancels active enrollments for that section, resets section counters, and writes audit metadata. |
| PATCH | `/sections/:id/assign-lecturer` | ADMIN, ACADEMIC_OFFICE | Body `{ lecturerId }`. |
| PATCH | `/sections/:id/room-schedule` | ADMIN, ACADEMIC_OFFICE | Body `{ room, weekday, startPeriod, periodCount }`. |
| PATCH | `/sections/:id/capacity` | ADMIN, ACADEMIC_OFFICE | Body `{ capacity, reason }`. |

## Enrollments

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/enrollments` | Authenticated | Students are restricted to their own rows. Supports `studentId`, `sectionId`, `semesterId`, `status`, `page`, `limit`. |
| POST | `/enrollments/eligibility` | Authenticated | Body `{ studentId?, sectionId }`; returns rule checks. |
| POST | `/enrollments/register` | Authenticated | Body `{ studentId?, sectionId }`; transactionally registers or waitlists. Rejects duplicate active registration/waitlist for another section with the same `courseCode` in the current semester using `REG_ERR_ALREADY_REGISTERED_COURSE`. |
| POST | `/enrollments/:id/cancel` | Owner, ADMIN, ACADEMIC_OFFICE | Body `{ reason? }`; requires adjustment window. |
| POST | `/enrollments/:id/withdraw` | Owner, ADMIN, ACADEMIC_OFFICE | Body `{ reason }`; requires withdrawal window. |
| POST | `/enrollments/sections/:sectionId/process-waitlist` | ADMIN, ACADEMIC_OFFICE | Promotes eligible waitlisted students. |
| POST | `/enrollments/override` | ADMIN, ACADEMIC_OFFICE | Body `{ studentId, sectionId, reason }`. |

## Wishes

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/wishes` | STUDENT, ADMIN, ACADEMIC_OFFICE | Students are restricted to their own wishes. Supports `studentId`, `semesterId`, `courseCode`, `status`, `page`, `limit`. |
| GET | `/wishes/:id` | Owner, ADMIN, ACADEMIC_OFFICE | Wish detail. |
| POST | `/wishes` | STUDENT, ADMIN, ACADEMIC_OFFICE | Body `{ studentId?, semesterId?, courseCode, preferredGroup?, reason }`; students can only create for themselves. |
| POST | `/wishes/:id/cancel` | Owner, ADMIN, ACADEMIC_OFFICE | Cancels a pending wish. |
| PATCH | `/wishes/:id/status` | ADMIN, ACADEMIC_OFFICE | Body `{ status, reviewNote? }` for `REVIEWED`, `APPROVED`, `REJECTED`, `CANCELLED`. `reviewNote` is required when rejecting and is stored in audit metadata. |

## Schedules, Reports, Settings, Logs

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/schedules/students/:studentId/week/:semesterId` | Owner, ADMIN, ACADEMIC_OFFICE | Same response shape as frontend `ScheduleEntry`; returns the weekly pattern by weekday/period and `weeks`, not a concrete calendar-week filter. |
| GET | `/schedules/students/:studentId/semester/:semesterId` | Owner, ADMIN, ACADEMIC_OFFICE | Semester schedule. |
| GET | `/schedules/lecturers/:lecturerId/week/:semesterId` | Owner, ADMIN, ACADEMIC_OFFICE | Lecturer teaching schedule as a weekly pattern by weekday/period and `weeks`. |
| GET | `/schedules/lecturers/:lecturerId/semester/:semesterId` | Owner, ADMIN, ACADEMIC_OFFICE | Lecturer semester teaching schedule. |
| GET | `/reports/registration-summary` | ADMIN, ACADEMIC_OFFICE | Optional `semesterId`. Rows include capacity, registered count, waitlist count, utilization rate, and status. |
| GET | `/reports/utilization-stats` | ADMIN, ACADEMIC_OFFICE | Optional `semesterId`. Returns total sections, total capacity, total registered, total waitlisted, average utilization, and full sections. |
| GET/PATCH | `/settings` | GET authenticated, PATCH admin/academic | System settings. PATCH accepts ISO date strings such as `simulationNow`, `registrationStart`, `registrationEnd`, `adjustmentStart`, `adjustmentEnd`, `withdrawalDeadline`. |
| GET | `/settings/semesters` | Authenticated | Semester options. |
| GET | `/logs` | ADMIN, ACADEMIC_OFFICE | Supports `actorId`, `targetId`, `result`, `action`, `from`, `to`, `page`, `limit`. |
| GET/POST | `/snapshot/export`, `/snapshot/import`, `/snapshot/reset` | ADMIN | Export omits password and refresh token fields, and includes Room, CourseCondition, StudentResult, RegistrationErrorCode. Reset re-seeds demo data and returns the refreshed snapshot. |
