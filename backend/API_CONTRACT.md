# API Contract

Base URL: `http://localhost:3000/api`

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
| GET/PATCH | `/users/me` | Authenticated | Current profile. Normal users cannot update role/status/username. |
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
| GET | `/sections` | Authenticated | Supports `search`, `semesterId`, `courseCode`, `lecturerId`, `status`, `page`, `limit`. |
| GET | `/sections/:id` | Authenticated | Section detail. |
| POST/PATCH/DELETE | `/sections` / `/sections/:id` | ADMIN, ACADEMIC_OFFICE | Delete sets `status = CANCELLED`. |
| PATCH | `/sections/:id/assign-lecturer` | ADMIN, ACADEMIC_OFFICE | Body `{ lecturerId }`. |
| PATCH | `/sections/:id/room-schedule` | ADMIN, ACADEMIC_OFFICE | Body `{ room, weekday, startPeriod, periodCount }`. |
| PATCH | `/sections/:id/capacity` | ADMIN, ACADEMIC_OFFICE | Body `{ capacity, reason }`. |

## Enrollments

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/enrollments` | Authenticated | Students are restricted to their own rows. Supports `studentId`, `sectionId`, `semesterId`, `status`. |
| POST | `/enrollments/eligibility` | Authenticated | Body `{ studentId?, sectionId }`; returns rule checks. |
| POST | `/enrollments/register` | Authenticated | Body `{ studentId?, sectionId }`; transactionally registers or waitlists. |
| POST | `/enrollments/:id/cancel` | Owner, ADMIN, ACADEMIC_OFFICE | Body `{ reason? }`; requires adjustment window. |
| POST | `/enrollments/:id/withdraw` | Owner, ADMIN, ACADEMIC_OFFICE | Body `{ reason }`; requires withdrawal window. |
| POST | `/enrollments/sections/:sectionId/process-waitlist` | ADMIN, ACADEMIC_OFFICE | Promotes eligible waitlisted students. |
| POST | `/enrollments/override` | ADMIN, ACADEMIC_OFFICE | Body `{ studentId, sectionId, reason }`. |

## Schedules, Reports, Settings, Logs

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/schedules/students/:studentId/week/:semesterId` | Owner, ADMIN, ACADEMIC_OFFICE | Same response shape as frontend `ScheduleEntry`. |
| GET | `/schedules/students/:studentId/semester/:semesterId` | Owner, ADMIN, ACADEMIC_OFFICE | Semester schedule. |
| GET | `/schedules/lecturers/:lecturerId/week/:semesterId` | Owner, ADMIN, ACADEMIC_OFFICE | Lecturer teaching schedule. |
| GET | `/reports/registration-summary` | ADMIN, ACADEMIC_OFFICE | Optional `semesterId`. |
| GET | `/reports/utilization-stats` | ADMIN, ACADEMIC_OFFICE | Optional `semesterId`. |
| GET/PATCH | `/settings` | GET authenticated, PATCH admin/academic | System settings. |
| GET | `/settings/semesters` | Authenticated | Semester options. |
| GET | `/logs` | ADMIN, ACADEMIC_OFFICE | Supports `actorId`, `targetId`, `result`, `action`, `from`, `to`, `page`, `limit`. |
| GET/POST | `/snapshot/export`, `/snapshot/import`, `/snapshot/reset` | ADMIN | Export omits password and refresh token. |
