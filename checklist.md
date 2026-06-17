# Checklist Audit — Prompt 16 đến 20

> Tài liệu audit toàn diện hệ thống đăng ký học phần, tạo bởi code review tự động.
> **Không sửa code** — chỉ liệt kê phát hiện, đề xuất fix, test case.

---

## PROMPT 16 — Audit logic học kỳ chính, học kỳ hè, học lại và học cải thiện

### Files liên quan
- `backend/src/enrollments/enrollment-rules.ts`
- `backend/src/enrollments/enrollments.service.ts`
- `backend/prisma/schema.prisma` (model `Enrollment`, `StudentResult`, `SemesterOption`)

### Phát hiện

#### 16.1 — Không phân biệt học kỳ chính vs học kỳ hè
- **Mức độ**: P1
- **Hiện trạng**: `RuleSettings` chỉ có `currentSemesterId`, không có field `isSummer` hoặc `semesterType`.
- **Hệ quả**: Hệ thống không giới hạn tín chỉ hè riêng biệt (thông thường hè chỉ cho phép 10-14TC, kỳ chính 20-25TC). `maxCredits` dùng chung cho mọi loại học kỳ.
- **Ví dụ dữ liệu**: SV đăng ký 22TC ở kỳ hè — hệ thống cho phép vì `maxCredits = 25`.
- **Đề xuất rule backend**: Thêm `SemesterOption.type: 'MAIN' | 'SUMMER'` và `maxCreditsSummer` vào `SystemSetting`.
- **Đề xuất UI**: Hiển thị badge "Học kỳ hè" và cảnh báo giới hạn tín chỉ khác.

#### 16.2 — Không có logic học lại (retake)
- **Mức độ**: P1
- **Hiện trạng**: `evaluateEnrollmentEligibility()` kiểm tra `hasDuplicateCourse` trong kỳ hiện tại nhưng **không kiểm tra** sinh viên đã FAILED cùng course ở kỳ trước. Sinh viên rớt môn vẫn đăng ký lại được (đúng), nhưng hệ thống không gắn flag "học lại" để thống kê.
- **Hệ quả**: Không phân biệt được đăng ký mới vs học lại trong báo cáo. Không kiểm tra số lần học lại tối đa (quy chế cho phép tối đa 2-3 lần).
- **Đề xuất rule backend**: Thêm field `Enrollment.isRetake: Boolean` và check `StudentResult.passed === false` cho cùng courseCode.

#### 16.3 — Không có logic học cải thiện (grade improvement)
- **Mức độ**: P1
- **Hiện trạng**: Nếu SV đã COMPLETED (qua) một course, `completedCourseCodes` sẽ chứa code đó. Nhưng `hasDuplicateCourse` chỉ kiểm tra enrollment active trong kỳ hiện tại. SV đã qua môn vẫn **có thể** đăng ký lại section khác của cùng course — hệ thống không chặn và cũng không gắn flag "cải thiện".
- **Hệ quả**: Không rõ quy chế lấy điểm nào (cao nhất / mới nhất). Không giới hạn số lần cải thiện.
- **Đề xuất rule backend**: 
  - Thêm `SystemSetting.allowGradeImprovement: Boolean`
  - Nếu `allowGradeImprovement = false` và `completedCourseCodes.has(courseCode)` → reject với error code mới `REG_ERR_ALREADY_PASSED`.
  - Thêm `Enrollment.isImprovement: Boolean`.
  - Quy chế điểm: field `SystemSetting.gradePolicy: 'HIGHEST' | 'LATEST' | 'REGULATION'`.
- **Đề xuất UI**: Hiển thị tag "Học cải thiện" trên enrollment card.

#### 16.4 — Một SV có thể đăng ký cùng course ở nhiều section?
- **Mức độ**: P0 ✅ ĐÃ XỬ LÝ
- **Hiện trạng**: `hasDuplicateCourse` check (`enrollment-rules.ts:303-312`) + double-check trong `registerSection()` (`enrollments.service.ts:350-375`) đều chặn duplicate course trong cùng kỳ.
- **Kết luận**: Đã đúng. SV không thể có 2 active enrollment cho cùng course trong cùng kỳ.

#### 16.5 — SV đã rút/hủy có đăng ký lại section khác được không?
- **Mức độ**: P2
- **Hiện trạng**: `DUPLICATE_ENROLLMENT_STATUSES = ['REGISTERED', 'WAITLISTED', 'PENDING']`. `CANCELLED` và `DROPPED` không nằm trong set → SV đã hủy/rút **có thể** đăng ký section khác cùng course. Đây là hành vi đúng theo nghiệp vụ.
- **Kết luận**: Logic đúng. Nhưng cần kiểm tra: SV rút section A rồi đăng ký lại **chính section A** — `hasDuplicateSection` cũng chỉ check active statuses → cho phép. OK.

#### 16.6 — Không phân biệt course bắt buộc/tự chọn khi học lại
- **Mức độ**: P2
- **Hiện trạng**: Schema có `Course.category: FOUNDATION | CORE | ELECTIVE | THESIS` nhưng `evaluateEnrollmentEligibility` không dùng field này.
- **Đề xuất**: Một số trường chỉ cho phép cải thiện môn tự chọn, không cho cải thiện môn bắt buộc. Cần xem xét thêm quy chế.

### Test case cần bổ sung
| # | Scenario | Expected |
|---|----------|----------|
| 1 | SV rớt môn A (FAILED) → đăng ký lại section cùng courseCode | ✅ cho phép, gắn `isRetake` |
| 2 | SV đã qua môn A (COMPLETED) → đăng ký lại cùng course | Tùy setting `allowGradeImprovement` |
| 3 | Kỳ hè: SV đăng ký > 14TC | ❌ reject nếu có `maxCreditsSummer` |
| 4 | SV hủy section → đăng ký lại section khác cùng course | ✅ cho phép |
| 5 | SV học lại lần 3 | ❌ reject nếu có `maxRetakeAttempts` |

---

## PROMPT 17 — Audit prerequisite, prestudy, corequisite và môn đang học song song

### Files liên quan
- `backend/src/enrollments/enrollment-rules.ts` (line 183-414)
- `backend/prisma/schema.prisma` (model `CourseCondition`, `StudentResult`, `Course`)

### Phát hiện

#### 17.1 — Prerequisite: dùng `passed` + `COMPLETED` enrollment
- **Mức độ**: ✅ ĐÃ XỬ LÝ ĐÚNG
- **Hiện trạng**: `completedCourseCodes` merge 2 nguồn:
  - `StudentResult.passed === true` (`enrollment-rules.ts:277-279`)
  - `Enrollment.status === 'COMPLETED'` (`enrollment-rules.ts:280-284`)
- **Kết luận**: Logic prerequisite đúng. SV cần **qua** (passed) môn trước mới được đăng ký.

#### 17.2 — Prestudy: chỉ cần "đã từng học" (kể cả chưa qua)
- **Mức độ**: ✅ ĐÃ XỬ LÝ ĐÚNG
- **Hiện trạng**: `completedOrAttemptedCourseCodes` merge:
  - `StudentResult` (tất cả, kể cả failed) (`enrollment-rules.ts:287-289`)
  - `Enrollment` với `COMPLETED` hoặc `FAILED` (`enrollment-rules.ts:290-294`)
- **Kết luận**: Prestudy chấp nhận SV đã từng học, kể cả rớt. Đúng với nghiệp vụ "học trước".

#### 17.3 — Prestudy: SV đang học nhưng chưa có điểm → KHÔNG tính
- **Mức độ**: P2
- **Hiện trạng**: `HISTORY_RESULT_STATUSES = ['COMPLETED', 'FAILED']`. Enrollment status `REGISTERED` hoặc `IN_PROGRESS` KHÔNG nằm trong set → SV đang học kỳ này nhưng chưa có kết quả sẽ KHÔNG đáp ứng prestudy.
- **Hệ quả**: SV đăng ký song song 2 môn A (prestudy) và B (cần prestudy A) sẽ bị reject B. Đây có thể đúng hoặc sai tùy quy chế.
- **Đề xuất**: Nếu cho phép, thêm `REGISTERED` vào set prestudy check.

#### 17.4 — Corequisite: đã qua kỳ trước thì KHÔNG cần đăng ký lại
- **Mức độ**: ✅ ĐÃ XỬ LÝ ĐÚNG
- **Hiện trạng**: `corequisiteCodes.every(code => completedCourseCodes.has(code) || currentSemesterCourseCodes.has(code))` (`enrollment-rules.ts:407-408`)
- **Kết luận**: Nếu corequisite đã COMPLETED → pass. Nếu chưa → phải đăng ký cùng kỳ. Đúng.

#### 17.5 — Corequisite: rút một môn song hành → môn kia KHÔNG bị ảnh hưởng
- **Mức độ**: P1
- **Hiện trạng**: Khi SV cancel hoặc withdraw enrollment, hệ thống KHÔNG kiểm tra lại corequisite của các enrollment còn active. Nếu SV rút môn A (corequisite của B), enrollment B vẫn active.
- **Đề xuất rule backend**: Sau cancel/withdraw, kiểm tra corequisite của các enrollment active cùng kỳ. Nếu vi phạm → cảnh báo (warning, không tự hủy).

#### 17.6 — Không có logic điều kiện theo ngành/chuyên ngành
- **Mức độ**: P2
- **Hiện trạng**: Schema có `Course.majorsSupported`, `Course.majorCodesSupported`, `Course.applicableSpecializations` nhưng `evaluateEnrollmentEligibility` KHÔNG kiểm tra `User.majorCode` hay `User.program` khớp với course.
- **Đề xuất rule backend**: Thêm check `majorRestriction` nếu `course.majorCodesSupported` có giá trị.

#### 17.7 — Không có logic điều kiện theo năm học
- **Mức độ**: P2
- **Hiện trạng**: Schema có `Course.suggestedSemester` và `User.yearLevel` nhưng chưa kiểm tra.
- **Đề xuất**: Có thể thêm cảnh báo (warning, không block) nếu SV đăng ký môn ngoài năm đề xuất.

### Bảng rule hiện tại vs rule nên có

| Rule | Hiện tại | Nên có |
|------|----------|--------|
| Prerequisite (must pass) | ✅ Có | ✅ OK |
| Prestudy (must attempt) | ✅ Có | ⚠️ Xem xét đang học |
| Corequisite (pass or same semester) | ✅ Có | ⚠️ Cần cascade check |
| Major restriction | ❌ Không | ⚠️ Thêm nếu cần |
| Year level restriction | ❌ Không | ⚠️ Warning only |

---

## PROMPT 18 — Audit xung đột lịch, tín chỉ, sĩ số, waitlist, rút/hủy

### Files liên quan
- `backend/src/enrollments/enrollment-rules.ts` (checkScheduleConflict, calculateCurrentCredits)
- `backend/src/enrollments/enrollments.service.ts` (registerSection, cancelEnrollment, withdrawEnrollment, processWaitlist)
- `backend/src/sections/sections.service.ts` (assertScheduleAvailable, weeksOverlap)

### Phát hiện

#### 18.1 — Schedule conflict: enrollment rules KHÔNG check weeks overlap
- **Mức độ**: P0
- **Hiện trạng**: `checkScheduleConflict()` (`enrollment-rules.ts:246-256`) chỉ so `weekday` + `startPeriod` + `periodCount`. **KHÔNG** so `weeks`. Hai section trùng thứ + tiết nhưng khác tuần → vẫn báo conflict.
- **Ví dụ**: Section A (tuần 1-7, thứ 2, tiết 1-3) vs Section B (tuần 8-15, thứ 2, tiết 1-3) → hiện tại báo conflict, nhưng thực tế KHÔNG trùng.
- **Lưu ý**: `sections.service.ts` đã có `weeksOverlap()` cho admin tạo section, nhưng `enrollment-rules.ts` chưa dùng.
- **Đề xuất fix backend**: Thêm field `weeks` vào `RuleSection` interface, dùng `parseWeeks()` + `weeksOverlap()` trong `checkScheduleConflict()`.
- **Đề xuất UI**: "Xung đột lịch tuần X-Y với lớp [code]".
- **Đề xuất test case**: 2 sections cùng thứ+tiết, khác tuần → phải cho phép đăng ký cả 2.

#### 18.2 — Schedule conflict: không check trùng phòng/trùng giảng viên cho SV
- **Mức độ**: P2 (dành cho admin, không ảnh hưởng SV)
- **Hiện trạng**: `checkScheduleConflict` chỉ áp dụng cho **lịch sinh viên**. Trùng phòng/giảng viên đã được check riêng trong `sections.service.ts:assertScheduleAvailable()`.
- **Kết luận**: OK cho SV enrollment. Admin đã có check riêng.

#### 18.3 — Tín chỉ waitlist CÓ tính vào giới hạn
- **Mức độ**: P1
- **Hiện trạng**: `ACTIVE_ENROLLMENT_STATUSES = ['REGISTERED', 'WAITLISTED']` → `calculateCurrentCredits()` tính cả WAITLISTED vào tổng tín chỉ.
- **Hệ quả**: SV waitlist 3 lớp (9TC) + đăng ký 18TC = 27TC → vượt maxCredits. Nhưng nếu không promote thì SV bị "chặn giả".
- **Đề xuất**: Xem xét không tính WAITLISTED vào credit limit, hoặc thêm `SystemSetting.countWaitlistCredits: Boolean`.

#### 18.4 — Tín chỉ môn rút/hủy KHÔNG tính ✅
- **Mức độ**: ✅ ĐÃ XỬ LÝ ĐÚNG
- **Hiện trạng**: `CANCELLED` và `DROPPED` không nằm trong `ACTIVE_ENROLLMENT_STATUSES` → không tính tín chỉ.

#### 18.5 — registeredCount/waitlistCount: đồng bộ sau mỗi thao tác ✅
- **Mức độ**: ✅ ĐÃ XỬ LÝ ĐÚNG
- **Hiện trạng**: `registerSection`, `cancelEnrollment`, `withdrawEnrollment`, `overrideEnrollment` đều update `registeredCount`/`waitlistCount` + `status` trong cùng transaction Serializable.
- **Có backup**: `syncSectionCounters()` recalculate từ DB nếu cần.

#### 18.6 — Section FULL/OPEN toggle ✅
- **Mức độ**: ✅ ĐÃ XỬ LÝ ĐÚNG
- **Hiện trạng**: `nextSectionStatus()` tự động chuyển FULL ↔ OPEN dựa trên `registeredCount >= capacity`. Không override nếu section đã CANCELLED/CLOSED/COMPLETED/IN_PROGRESS.

#### 18.7 — Waitlist promotion: thủ công qua processWaitlist
- **Mức độ**: P1
- **Hiện trạng**: `processWaitlist()` phải được gọi thủ công bởi ADMIN/ACADEMIC_OFFICE. Không tự động promote khi có người hủy.
- **Đề xuất**: Gọi `processWaitlist()` tự động trong `cancelEnrollment()` và `withdrawEnrollment()` nếu section có `allowWaitlist` và `waitlistCount > 0`.

#### 18.8 — Waitlist không hết hạn
- **Mức độ**: P2
- **Hiện trạng**: Không có `waitlistExpiresAt` — waitlist tồn tại vĩnh viễn.
- **Đề xuất**: Thêm `waitlistDeadline` vào `SystemSetting` hoặc per-section.

#### 18.9 — Cancel vs Withdraw: đúng business rule ✅
- **Mức độ**: ✅ ĐÃ XỬ LÝ ĐÚNG
- **Cancel**: Trong cửa sổ adjustment → status = CANCELLED.
- **Withdraw**: Sau adjustment, trước deadline → status = DROPPED.
- **Hiện trạng**: `canCancelEnrollment()` check `adjustmentStart ≤ now ≤ adjustmentEnd`. `canWithdrawEnrollment()` check `adjustmentEnd < now ≤ withdrawalDeadline`.

#### 18.10 — Transcript ghi W: chưa có
- **Mức độ**: P2
- **Hiện trạng**: Enrollment status `DROPPED` tồn tại nhưng không tạo `StudentResult` với note "W". Transcript sẽ không thể hiện SV đã rút môn.
- **Đề xuất**: Khi withdraw → tạo `StudentResult` với `status = 'WITHDRAWN'`, `passed = false`, `letterGrade = 'W'`.

### Đánh giá mức độ nghiêm trọng

| # | Issue | Severity |
|---|-------|----------|
| 18.1 | Schedule conflict thiếu weeks overlap | **P0** |
| 18.3 | Waitlist credits tính vào limit | P1 |
| 18.7 | Waitlist promotion thủ công | P1 |
| 18.8 | Waitlist không hết hạn | P2 |
| 18.10 | Withdraw không ghi W vào transcript | P2 |

---

## PROMPT 19 — Audit phân quyền và dữ liệu theo vai trò

### Files liên quan
- Tất cả `*.controller.ts` trong `backend/src/`
- `backend/src/auth/jwt.guard.ts`, `backend/src/auth/roles.guard.ts`
- `backend/src/enrollments/enrollments.service.ts` (assertActorMayActForStudent)

### Ma trận endpoint vs role

| Endpoint | Method | Guard | Roles | Ghi chú |
|----------|--------|-------|-------|---------|
| `/auth/login` | POST | None | All | ✅ Public |
| `/auth/me` | GET | JWT | All | ✅ |
| `/auth/logout` | POST | JWT | All | ✅ |
| `/auth/change-password` | POST | JWT | All | ✅ |
| `/users/me` | PATCH | JWT | All | ✅ Self-update |
| `/users` | GET | JWT+Roles | ADMIN | ✅ |
| `/users/:id` | PATCH/DELETE | JWT+Roles | ADMIN | ✅ |
| `/courses` | GET | JWT | All | ✅ Read-only |
| `/courses` | POST/PATCH/DELETE | JWT+Roles | ADMIN, AO | ✅ |
| `/sections` | GET | JWT | All | ✅ |
| `/sections` | POST/PATCH/DELETE | JWT+Roles | ADMIN, AO | ✅ |
| `/enrollments` | GET | JWT | All | ⚠️ xem 19.1 |
| `/enrollments` | POST (register) | JWT | All | ✅ `assertActorMayActForStudent` |
| `/enrollments/override` | POST | JWT+Roles | ADMIN, AO | ✅ |
| `/enrollments/process-waitlist` | POST | JWT+Roles | ADMIN, AO | ✅ |
| `/enrollments/:id` (delete) | DELETE | JWT+Roles | ADMIN | ✅ |
| `/schedules/*` | GET | JWT | All | ⚠️ xem 19.2 |
| `/logs` | GET | JWT+Roles | ADMIN, AO | ✅ |
| `/reports` | GET | JWT+Roles | ADMIN, AO | ✅ |
| `/settings` | GET | JWT | All | ✅ Read |
| `/settings` | PATCH | JWT+Roles | ADMIN, AO | ✅ |
| `/snapshot/*` | ALL | JWT+Roles | ADMIN | ✅ |
| `/wishes` | GET/POST | JWT | All | ✅ |
| `/wishes/review` | POST | JWT+Roles | ADMIN, AO | ✅ |

### Phát hiện

#### 19.1 — Enrollments GET: SV có thể xem enrollment người khác
- **Mức độ**: P1
- **Hiện trạng**: `GET /enrollments` trả tất cả enrollments (query filter). Không filter theo `studentId` khi actor là STUDENT.
- **Ví dụ**: SV A gọi `GET /enrollments?studentId=B` → nhận được enrollment SV B.
- **Đề xuất**: Nếu actor role = STUDENT, force `where.studentId = actor.id`.

#### 19.2 — Schedules: SV có thể xem lịch người khác
- **Mức độ**: P1
- **Hiện trạng**: `GET /schedules/students/:studentId/*` không kiểm tra `studentId === actor.id`.
- **Ví dụ**: SV A gọi `/schedules/students/B/week/sem1` → nhận lịch SV B.
- **Đề xuất**: Thêm check `req.user.id === params.studentId || isAdmin(req.user)`.

#### 19.3 — Lecturer chỉ xem lớp mình dạy: chưa enforce trên API
- **Mức độ**: P2
- **Hiện trạng**: `GET /sections` trả tất cả sections. Frontend filter theo `lecturerId` nhưng API không force.
- **Đề xuất**: Nếu actor = LECTURER, thêm `where.lecturerId = actor.id` trên backend.

#### 19.4 — STUDENT không gọi được override ✅
- **Mức độ**: ✅ ĐÃ XỬ LÝ ĐÚNG
- **Hiện trạng**: Override endpoint có `@Roles('ADMIN', 'ACADEMIC_OFFICE')` + `@UseGuards(RolesGuard)`.

#### 19.5 — Audit log actorRole: multi-role handling
- **Mức độ**: P2
- **Hiện trạng**: `AuditLog.actorRole` là single `UserRole` enum. User có nhiều roles → lấy role đầu tiên khi tạo log. Có thể không chính xác nếu user vừa là ADMIN vừa là LECTURER.
- **Đề xuất**: Lưu `actorRole` là role mà user **đang hành động với** (dựa trên context, không phải role[0]).

#### 19.6 — Admin có thể override học vụ: cần thống nhất
- **Mức độ**: P2
- **Hiện trạng**: ADMIN có tất cả quyền mutation (courses, sections, enrollments, override, users, settings). ACADEMIC_OFFICE cũng có quyền tạo course/section/override.
- **Đề xuất**: Xem xét tách: ADMIN chỉ quản trị hệ thống (users, settings, snapshot), ACADEMIC_OFFICE quản trị học vụ (courses, sections, enrollments).

### Endpoint thiếu guard

| Endpoint | Issue |
|----------|-------|
| `GET /enrollments` | Thiếu filter studentId cho STUDENT |
| `GET /schedules/students/:id/*` | Thiếu ownership check |
| `GET /schedules/lecturers/:id/*` | Thiếu ownership check cho LECTURER |
| `GET /sections` | Thiếu filter lecturerId cho LECTURER |

---

## PROMPT 20 — Audit invariant dữ liệu và test end-to-end

### Invariant checklist

| # | Invariant | Hiện trạng | Ghi chú |
|---|-----------|------------|---------|
| 1 | `Enrollment.semesterId === Section.semesterId` | ✅ Enforce | `registerSection` lấy từ `section.semesterId` |
| 2 | No 2 active enrollments for same student+section | ✅ Enforce | `duplicate` check in `registerSection` |
| 3 | No 2 active enrollments for same student+course in semester | ✅ Enforce | `duplicateCourse` check |
| 4 | `Section.registeredCount === count(REGISTERED)` | ✅ Enforce | Updated in every mutation + `syncSectionCounters` backup |
| 5 | `Section.waitlistCount === count(WAITLISTED)` | ✅ Enforce | Same as above |
| 6 | CANCELLED section → no active enrollments | ✅ Enforce | `cancelSection` in sections.service cascades CANCELLED to enrollments |
| 7 | No schedule conflicts for student | ⚠️ Partial | Weeks overlap NOT checked (P0 issue 18.1) |
| 8 | Total credits ≤ maxCredits | ✅ Enforce | `calculateCurrentCredits` check in eligibility |
| 9 | Prerequisite/corequisite from correct source | ✅ Enforce | Uses both StudentResult + Enrollment history |
| 10 | All mutations have audit log | ✅ Enforce | `appendAuditLog` in every mutation method |
| 11 | Frontend no local data fallback | ✅ Fixed (Prompt 14, 15) | Profile, schedules, logs now API-only |
| 12 | Export = UI data source | ✅ | Both use `snapshot.logs` / rows from same query |
| 13 | Session expired → no mutation | ✅ Enforce | JWT guard rejects expired tokens |
| 14 | Maintenance mode → no mutation | ✅ Enforce (Prompt 6) | MaintenanceGuard on mutations |
| 15 | Snapshot import fail → no data loss | ✅ Fixed (Prompt 13) | Single atomic transaction |

### Danh sách test backend unit/integration cần có

#### Unit tests
1. `evaluateEnrollmentEligibility` — prerequisite met/not met
2. `evaluateEnrollmentEligibility` — prestudy met/not met
3. `evaluateEnrollmentEligibility` — corequisite met (completed) / met (same semester) / not met
4. `evaluateEnrollmentEligibility` — credit limit exact boundary
5. `evaluateEnrollmentEligibility` — schedule conflict (same weekday+period)
6. `evaluateEnrollmentEligibility` — schedule no conflict (different weekday)
7. `evaluateEnrollmentEligibility` — duplicate section
8. `evaluateEnrollmentEligibility` — duplicate course in semester
9. `checkScheduleConflict` — overlapping periods
10. `checkScheduleConflict` — adjacent periods (no conflict)
11. `calculateCurrentCredits` — only REGISTERED+WAITLISTED counted
12. `canCancelEnrollment` — within/outside adjustment window
13. `canWithdrawEnrollment` — within/outside withdrawal window
14. `parseWeeks` + `weeksOverlap` — edge cases

#### Integration tests
1. `registerSection` — happy path (REGISTERED)
2. `registerSection` — section FULL with waitlist → WAITLISTED
3. `registerSection` — section FULL without waitlist → reject
4. `cancelEnrollment` — registeredCount decrement + section FULL→OPEN
5. `withdrawEnrollment` — registeredCount decrement
6. `overrideEnrollment` — capacity override
7. `processWaitlist` — promote first eligible waitlisted
8. `cancelSection` — cascade cancel all enrollments
9. Concurrent registration — Serializable isolation prevents double-register
10. Maintenance mode — mutation rejected

### Danh sách test frontend cần có
1. Schedule page: loading → data → empty state
2. Schedule page: API error → error state (no fallback to local)
3. Profile page: save → API success → auth store updated
4. Profile page: save → API fail → error toast (no fake success)
5. ChangePassword: success → navigate to /login
6. AuditLogs: loading → data from backend
7. Register enrollment: success → enrollment list refreshed
8. Register enrollment: fail → error message with code
9. Cancel enrollment: confirmation → success toast
10. Maintenance mode banner: visible when setting enabled

### 10 kịch bản E2E

#### E2E-01: Sinh viên đăng ký thành công
```
1. SV đăng nhập
2. Mở trang đăng ký, chọn section có slot trống
3. Bấm "Đăng ký"
4. Verify: enrollment REGISTERED, registeredCount +1
5. Verify: schedule page hiển thị lớp mới
6. Verify: audit log ghi REGISTER_COURSE
```

#### E2E-02: Đăng ký lớp full → vào waitlist
```
1. Admin tạo section capacity=1
2. SV_A đăng ký → REGISTERED (capacity full)
3. SV_B đăng ký cùng section → WAITLISTED (waitlistOrder=1)
4. Verify: section status = FULL
5. SV_A hủy → section OPEN
6. Admin processWaitlist
7. Verify: SV_B → REGISTERED
```

#### E2E-03: Hủy đăng ký trong cửa sổ điều chỉnh
```
1. SV đăng ký thành công
2. Trong adjustment window: SV bấm "Hủy"
3. Verify: enrollment CANCELLED, registeredCount -1
4. Verify: section trở lại OPEN
5. Verify: audit log ghi CANCEL_ENROLLMENT
```

#### E2E-04: Rút môn sau adjustment, trước deadline
```
1. SV đăng ký thành công
2. Admin chỉnh simulationNow > adjustmentEnd, < withdrawalDeadline
3. SV bấm "Rút học phần", nhập lý do
4. Verify: enrollment DROPPED, droppedAt set
5. Verify: registeredCount -1
```

#### E2E-05: Admin hủy section → cascade
```
1. Admin tạo section, 3 SV đăng ký
2. Admin hủy section
3. Verify: section status = CANCELLED
4. Verify: 3 enrollments → CANCELLED
5. Verify: schedule pages không hiển thị section này
```

#### E2E-06: Academic Office override
```
1. Section đã FULL
2. AO vào trang override, chọn SV + section, nhập lý do
3. Verify: enrollment REGISTERED (vượt capacity)
4. Verify: audit log ghi OVERRIDE_ENROLLMENT
5. SV kiểm tra lịch → thấy lớp mới
```

#### E2E-07: Giảng viên xem lịch giảng dạy
```
1. Lecturer đăng nhập
2. Mở "TKB giảng dạy dạng tuần"
3. Verify: chỉ hiển thị sections có lecturerId = current user
4. Mở "TKB dạng học kỳ"
5. Verify: bảng schedule đúng dữ liệu backend
```

#### E2E-08: Export report vs UI table
```
1. AO đăng nhập, mở Reports
2. Kiểm tra bảng trên UI: tổng SV, tổng enrollment, etc.
3. Bấm "Export CSV"
4. Verify: CSV có cùng số liệu với bảng
```

#### E2E-09: Maintenance mode
```
1. Admin bật maintenance mode
2. SV cố đăng ký → reject "Hệ thống đang bảo trì"
3. AO cố tạo section → reject
4. Admin tắt maintenance
5. SV đăng ký lại → thành công
```

#### E2E-10: Session timeout
```
1. SV đăng nhập KHÔNG tick "Remember me"
2. Chờ sessionTimeoutMinutes
3. SV cố mutation → 401 Unauthorized
4. Frontend redirect về /login
5. SV đăng nhập lại → session mới
```

---

## Tổng kết phát hiện theo mức độ

| Severity | Count | Phát hiện chính |
|----------|-------|-----------------|
| **P0** | 1 | Schedule conflict thiếu weeks overlap (18.1) |
| **P1** | 5 | Không phân biệt kỳ hè (16.1), Không có logic học lại (16.2), Không có logic cải thiện (16.3), Waitlist promotion thủ công (18.7), SV xem được data người khác (19.1, 19.2) |
| **P2** | 8 | Prestudy đang học (17.3), Cascade corequisite (17.5), Major restriction (17.6), Waitlist credits (18.3), Waitlist expiry (18.8), Transcript W (18.10), Multi-role audit (19.5), Admin vs AO separation (19.6) |
| **✅ OK** | 12+ | Prerequisite, corequisite, duplicate check, registeredCount sync, cancel/withdraw window, section cascade, maintenance, snapshot atomic |

---

> **Ghi chú**: Tất cả phát hiện trên dựa trên code review tĩnh. Cần verify thêm bằng integration tests thực tế.
