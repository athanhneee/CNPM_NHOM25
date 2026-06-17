Bạn là Senior Full-stack Engineer, QA Lead và Software Architect cho dự án “Hệ thống đăng ký học phần”.

Công nghệ:

* Backend: NestJS + TypeScript + Prisma + PostgreSQL.
* Frontend: React + Vite + TypeScript + Zustand + Tailwind CSS v4.
* Không sửa cảm tính, không tạo mock để che lỗi.
* Không xoá hoặc xử lý file `.env` trong nhiệm vụ này.
* Nếu phần nào đã làm rồi thì kiểm tra lại, chứng minh bằng code/test, không làm trùng.
* Sau mỗi prompt phải chạy kiểm tra tối thiểu:

  * Backend: `npm run build`, `npm run test:rules`, `npm run lint`, `npx prisma validate`.
  * Frontend: `npm run test`, `npm run build`, `npm run lint`.
*  tạo commit riêng với message rõ ràng theo mẫu được gợi ý.


## PROMPT 03 — Chuẩn hoá source of truth frontend, không fallback im lặng về mock/localStorage

Hiện frontend đang có nguy cơ hiển thị dữ liệu mock/localStorage khi API backend lỗi. Điều này làm người dùng tưởng đang thao tác với dữ liệu thật.

Các vị trí cần kiểm tra:

* `frontend/src/app/store/data.store.ts`
* `frontend/src/features/student/student-pages.tsx`
* `frontend/src/features/academic/academic-pages.tsx`
* `frontend/src/features/lecturer/lecturer-pages.tsx`
* các service trong `frontend/src/services/*`

Yêu cầu:

1. Thêm trạng thái dùng chung trong store:

   * `apiStatus: 'idle' | 'loading' | 'ready' | 'error'`;
   * `apiError`;
   * `lastSyncedAt`.

2. Không được `.catch(() => undefined)` rồi tiếp tục hiển thị dữ liệu cũ như không có chuyện gì.

3. Nếu API lỗi:

   * hiện banner rõ: “Mất kết nối backend hoặc phiên đăng nhập đã hết hạn”;
   * khoá các thao tác ghi dữ liệu;
   * không tự động dùng mock nếu đang ở mode backend thật.

4. Nếu muốn giữ demo/offline mode:

   * phải có flag rõ ràng, ví dụ `VITE_APP_MODE=demo`;
   * UI phải hiển thị nhãn “Demo mode”;
   * production không được âm thầm dùng mock.

5. Kiểm tra các trang:

   * Dashboard;
   * Student pages;
   * Academic pages;
   * Lecturer pages;
   * Admin pages.

6. Đảm bảo lỗi API được hiển thị thân thiện, không làm trắng trang.

Chạy:

* `cd frontend && npm run build`
* `cd frontend && npm run lint`
* `cd frontend && npm run test`

Commit message:
`fix(frontend): prevent silent fallback to stale mock data`

---

## PROMPT 04 — Enforce maintenance mode ở backend và đồng bộ frontend

Hiện `maintenanceMode` chủ yếu chỉ bị chặn ở một số nhánh frontend. Backend vẫn có thể cho ghi dữ liệu nếu gọi API trực tiếp.

Yêu cầu backend:

1. Kiểm tra:

   * `backend/src/settings/settings.service.ts`
   * tất cả controller/service có mutation: enrollments, wishes, courses, sections, users, snapshot, settings.

2. Tạo guard/interceptor hoặc helper dùng chung để chặn mutation khi `SystemSetting.maintenanceMode = true`.

3. Chỉ whitelist các endpoint thật sự cần:

   * login;
   * logout;
   * refresh token nếu cần;
   * đọc settings;
   * admin tắt maintenance nếu cần.

4. Các endpoint cần bị chặn khi maintenance:

   * register enrollment;
   * cancel;
   * withdraw;
   * override;
   * create/update/delete course;
   * create/update/cancel section;
   * wish request;
   * import snapshot;
   * các mutation admin không cần thiết.

5. Response lỗi phải có error code rõ, ví dụ:

   * `SYSTEM_MAINTENANCE`;
   * message lấy từ `maintenanceMessage`.

Yêu cầu frontend:

1. Tạo helper chung kiểm tra maintenance để disable nút mutation.
2. Không chỉ chặn “Đăng ký nhanh”; phải chặn mọi thao tác ghi.
3. Hiển thị banner maintenance ở layout.

Chạy:

* Backend build/test/lint/prisma validate.
* Frontend build/lint/test.

Commit message:
`fix(system): enforce maintenance mode on backend mutations`

---

## PROMPT 05 — Validate settings nghiệp vụ và đồng bộ học kỳ hiện tại

Hiện backend update settings chưa validate đủ ràng buộc nghiệp vụ.

Kiểm tra:

* `backend/src/settings/settings.service.ts`
* `backend/prisma/schema.prisma`
* DTO update settings nếu có
* frontend settings page nếu liên quan

Yêu cầu:

1. Khi update settings, validate:

   * `registrationStart < registrationEnd`;
   * `adjustmentStart <= adjustmentEnd`;
   * `registrationEnd <= adjustmentStart` nếu nghiệp vụ yêu cầu mở điều chỉnh sau đăng ký;
   * `withdrawalDeadline` hợp lý so với kỳ học;
   * `minCredits <= maxCredits`;
   * `maxCredits > 0`;
   * `sessionTimeoutMinutes > 0`;
   * `warningBeforeLogoutSeconds > 0`;
   * `currentSemesterId` phải tồn tại.

2. Khi đổi `currentSemesterId`:

   * update `SemesterOption.isCurrent` trong cùng transaction;
   * chỉ có đúng 1 học kỳ current.

3. Không cho settings rơi vào trạng thái nửa cập nhật nửa lỗi.

4. Trả lỗi rõ ràng cho frontend:

   * error code;
   * message tiếng Việt dễ hiểu.

5. Frontend SettingsPage phải hiển thị lỗi validate từ backend.

Chạy:

* Backend build/test/lint/prisma validate.
* Frontend build/lint/test.

Commit message:
`fix(settings): validate registration windows and current semester consistency`

---

## PROMPT 06 — Chặn đăng ký section khác học kỳ và đồng bộ `Enrollment.semesterId`

Hiện backend có lỗi nghiêm trọng: client có thể gửi `sectionId` thuộc học kỳ khác, nhưng enrollment lại được lưu theo `settings.currentSemesterId`.

Kiểm tra:

* `backend/src/enrollments/enrollments.service.ts`
* `backend/src/enrollments/enrollment-rules.ts`
* Prisma model `Enrollment`, `Section`, `SemesterOption`

Yêu cầu:

1. Khi load context đăng ký, bắt buộc kiểm tra:

   * section tồn tại;
   * `section.semesterId === settings.currentSemesterId`;
   * section thuộc học kỳ đang mở đăng ký.

2. Nếu section khác học kỳ hiện tại:

   * reject ngay;
   * trả error code rõ, ví dụ `SECTION_NOT_IN_CURRENT_SEMESTER`.

3. Khi tạo enrollment:

   * dùng `semesterId = section.semesterId` sau khi đã validate;
   * không tự gán mù bằng `settings.currentSemesterId` nếu section không được kiểm tra.

4. Kiểm tra các flow:

   * register thường;
   * register nhanh;
   * override;
   * waitlist;
   * cancel/withdraw nếu có truyền section/enrollment khác kỳ.

5. Thêm test rule/backend smoke:

   * section học kỳ cũ không đăng ký được;
   * section học kỳ tương lai không đăng ký được;
   * section học kỳ hiện tại đăng ký được nếu pass rule.

6. Cân nhắc thêm ràng buộc chống duplicate ở service/transaction:

   * cùng student;
   * cùng section;
   * cùng semester;
   * status active.

Chạy:

* Backend build/test/lint/prisma validate.

Commit message:
`fix(enrollments): reject cross-semester section registration`

---

## PROMPT 07 — Đồng bộ `registeredCount`, `waitlistCount`, `Section.status` khi update/delete enrollment

Hiện `update()` và `remove()` enrollment có thể làm sai sĩ số section.

Kiểm tra:

* `backend/src/enrollments/enrollments.service.ts`
* Prisma model `Enrollment`, `Section`
* các status: REGISTERED, WAITLISTED, CANCELLED, WITHDRAWN, REJECTED, COMPLETED nếu có

Yêu cầu:

1. Tạo helper dùng chung:

   * `recalculateSectionCounters(sectionId, tx)`;
   * đếm lại enrollment active từ DB;
   * cập nhật `registeredCount`;
   * cập nhật `waitlistCount`;
   * cập nhật `Section.status` nếu cần: OPEN, FULL, CANCELLED.

2. Mọi flow thay đổi enrollment status phải gọi helper trong cùng transaction:

   * create/register;
   * update status;
   * cancel;
   * withdraw;
   * remove/delete;
   * override;
   * promote waitlist nếu có.

3. Không dùng increment/decrement rời rạc nếu dễ lệch dữ liệu.

4. Không cho admin update status tuỳ tiện làm sai count. Nếu vẫn cần update, phải validate transition.

5. Thêm test:

   * update REGISTERED -> CANCELLED giảm registeredCount;
   * WAITLISTED -> REGISTERED giảm waitlistCount, tăng registeredCount;
   * delete enrollment cập nhật count;
   * section full chuyển về open khi count giảm.

Chạy:

* Backend build/test/lint/prisma validate.

Commit message:
`fix(enrollments): keep section counters consistent on status changes`

---

## PROMPT 08 — Làm lại override đăng ký theo hướng controlled override

Hiện override có thể bỏ qua quá nhiều rule, gây vượt sĩ số, trùng môn, lệch học kỳ, xung đột lịch.

Kiểm tra:

* `backend/src/enrollments/enrollments.service.ts`
* `backend/src/enrollments/enrollment-rules.ts`
* controller override nếu có
* frontend WaitlistOverridePage / RegistrationManagementPage

Yêu cầu:

1. Tách rõ 2 kiểu override:

   * `controlledOverride`: vẫn chặn lỗi nguy hiểm;
   * `forceOverride`: chỉ admin cấp cao dùng, phải có reason/audit.

2. Với override mặc định, vẫn phải chặn:

   * section khác học kỳ hiện tại;
   * duplicate cùng course trong cùng học kỳ;
   * duplicate cùng section;
   * section CANCELLED;
   * student không tồn tại;
   * section không tồn tại.

3. Các rule có thể override có kiểm soát:

   * capacity;
   * prerequisite;
   * credit limit;
   * schedule conflict;
   * waitlist order.

4. Nếu cho vượt capacity:

   * lưu metadata `capacityOverride: true`;
   * ghi audit log;
   * UI hiển thị rõ “Vượt chỉ tiêu”.

5. Bắt buộc nhập lý do override.

6. Thêm test cho:

   * override khác học kỳ bị reject;
   * override duplicate course bị reject;
   * override vượt capacity chỉ được khi có quyền và reason;
   * audit log được ghi.

Chạy:

* Backend build/test/lint/prisma validate.
* Frontend build/lint/test nếu sửa UI.

Commit message:
`fix(enrollments): constrain override registration rules`

---

## PROMPT 09 — Hủy section phải xử lý toàn bộ enrollment liên quan

Hiện cancel section chỉ đổi status section, không xử lý enrollment đang tồn tại.

Kiểm tra:

* `backend/src/sections/sections.service.ts`
* `backend/src/enrollments/enrollments.service.ts`
* timeline enrollment
* audit log

Yêu cầu:

1. Khi hủy section, xử lý trong transaction:

   * update `Section.status = CANCELLED`;
   * tìm toàn bộ enrollment active của section;
   * chuyển REGISTERED/WAITLISTED/PENDING sang CANCELLED hoặc REJECTED theo nghiệp vụ;
   * ghi `cancelledAt`;
   * cập nhật `reasonCode`;
   * append timeline: “Lớp học phần bị hủy”.

2. Sau khi hủy:

   * `registeredCount = 0`;
   * `waitlistCount = 0`;
   * không hiển thị trong danh sách lớp mở.

3. Lịch học sinh viên/giảng viên không được hiện section đã CANCELLED như lớp đang học.

4. Báo cáo không được tính lớp CANCELLED như lớp đang mở.

5. Thêm test:

   * section có registered enrollments;
   * section có waitlist;
   * hủy section cập nhật toàn bộ enrollment;
   * schedule không còn hiện lớp hủy.

Chạy:

* Backend build/test/lint/prisma validate.
* Frontend build/lint/test nếu sửa UI hiển thị.

Commit message:
`fix(sections): cascade cancellation to active enrollments`

---

## PROMPT 10 — Bọc create/update course và course conditions trong transaction

Hiện create/update course và sync điều kiện môn học có thể nửa thành công nửa thất bại.

Kiểm tra:

* `backend/src/courses/courses.service.ts`
* Prisma model `Course`
* Prisma model `CourseCondition`
* DTO create/update course

Yêu cầu:

1. Trước khi ghi DB, validate toàn bộ:

   * courseCode không trùng;
   * requiredCourseCode tồn tại;
   * không cho môn học tự yêu cầu chính nó;
   * không tạo duplicate condition;
   * type condition hợp lệ.

2. Bọc toàn bộ create course + sync condition trong một transaction.

3. Bọc toàn bộ update course + sync condition trong một transaction.

4. Nếu sync condition fail thì course không được bị tạo/cập nhật một phần.

5. Trả lỗi rõ ràng:

   * `REQUIRED_COURSE_NOT_FOUND`;
   * `COURSE_CONDITION_SELF_REFERENCE`;
   * `DUPLICATE_COURSE_CONDITION`.

6. Thêm test:

   * tạo course với prerequisite hợp lệ;
   * tạo course với prerequisite không tồn tại phải rollback;
   * update course fail condition thì thông tin cũ không bị mất.

Chạy:

* Backend build/test/lint/prisma validate.

Commit message:
`fix(courses): make course condition sync atomic`

---

## PROMPT 11 — Sửa logic xung đột lịch theo `weeks` và kiểm tra sức chứa phòng

Hiện check conflict lịch chỉ dựa weekday/period/lecturer/room, chưa xét giao nhau theo tuần. Room cũng chưa check capacity.

Kiểm tra:

* `backend/src/sections/sections.service.ts`
* model `Section.weeks`
* model `Room.capacity`
* frontend tạo/cập nhật section nếu có

Yêu cầu:

1. Viết helper parse `weeks`, hỗ trợ các dạng dữ liệu đang dùng trong seed/project:

   * `1-15`;
   * `1,3,5,7`;
   * `1-5,8-10`;
   * chuỗi rỗng hoặc sai format phải báo lỗi.

2. Hai section chỉ conflict nếu:

   * cùng weekday;
   * period giao nhau;
   * lecturer trùng hoặc room trùng;
   * tập tuần giao nhau.

3. Nếu cùng phòng/cùng tiết nhưng khác tuần hoàn toàn thì không conflict.

4. Khi gán room:

   * room phải tồn tại;
   * `Room.capacity >= Section.capacity`;
   * nếu không đủ sức chứa thì reject với error code rõ.

5. Khi update capacity section:

   * không nhỏ hơn registeredCount;
   * không vượt room capacity nếu có room.

6. Thêm test:

   * cùng tiết khác tuần không conflict;
   * cùng tiết có tuần giao nhau conflict;
   * room capacity nhỏ hơn section capacity bị reject;
   * update section capacity hợp lệ.

Chạy:

* Backend build/test/lint/prisma validate.

Commit message:
`fix(sections): validate weekly schedule conflicts and room capacity`

---

## PROMPT 12 — Sửa session timeout, rememberMe và đổi mật khẩu logout đúng

Hiện `rememberMe=false` không làm session ngắn hơn, `sessionTimeoutMinutes` chưa được backend dùng đúng. Frontend đổi mật khẩu xong xoá token nhưng Zustand vẫn nghĩ đang đăng nhập.

Kiểm tra:

* `backend/src/auth/auth.service.ts`
* `backend/src/auth/dto/login.dto.ts`
* `backend/src/auth/dto/change-password.dto.ts`
* `frontend/src/services/auth.api.ts`
* `frontend/src/app/store/auth.store.ts`
* `frontend/src/app/store/session.store.ts`
* trang ChangePassword/Login nếu có

Yêu cầu backend:

1. Khi login:

   * nếu `rememberMe=true`, dùng refresh token expiry dài;
   * nếu `rememberMe=false`, dùng `SystemSetting.sessionTimeoutMinutes` hoặc cấu hình ngắn hơn.

2. `expiresAt` của session phải phản ánh đúng lựa chọn rememberMe.

3. Refresh token không được gia hạn vô lý nếu session đã hết hạn.

4. Trả session expiry rõ cho frontend.

Yêu cầu frontend:

1. Sau đổi mật khẩu thành công:

   * clear token;
   * set `currentUser = null`;
   * set `session = null`;
   * set `isAuthenticated = false`;
   * điều hướng về login;
   * toast: “Đổi mật khẩu thành công, vui lòng đăng nhập lại”.

2. Đồng bộ validate password:

   * frontend min length phải là 8;
   * message thống nhất với backend.

3. Kiểm tra session warning theo đúng `warningBeforeLogoutSeconds`.

Chạy:

* Backend build/test/lint/prisma validate.
* Frontend build/lint/test.

Commit message:
`fix(auth): align session timeout remember me and password change logout`

---

## PROMPT 13 — Làm snapshot import atomic, tránh xóa sạch dữ liệu nếu import lỗi

Hiện snapshot import có nguy cơ xóa dữ liệu ở transaction đầu, sau đó create fail làm database rỗng.

Kiểm tra:

* `backend/src/snapshot/snapshot.service.ts`
* DTO/payload import snapshot
* frontend snapshot import/export page nếu có

Yêu cầu:

1. Validate toàn bộ payload trước khi đụng vào DB:

   * users;
   * courses;
   * sections;
   * enrollments;
   * settings;
   * logs;
   * wishes;
   * relationships.

2. Delete và create lại dữ liệu phải nằm trong cùng một transaction.

3. Nếu bất kỳ bước nào fail:

   * rollback toàn bộ;
   * dữ liệu cũ vẫn còn nguyên.

4. Không import nếu payload thiếu field bắt buộc.

5. Trả summary rõ:

   * số user;
   * số course;
   * số section;
   * số enrollment;
   * số lỗi nếu có.

6. Frontend phải hiển thị lỗi import rõ ràng, không báo thành công giả.

7. Thêm test:

   * import hợp lệ thành công;
   * import lỗi requiredCourse không tồn tại phải rollback;
   * import lỗi enrollment section không tồn tại phải rollback;
   * DB cũ vẫn còn sau import fail.

Chạy:

* Backend build/test/lint/prisma validate.
* Frontend build/lint/test nếu sửa UI.

Commit message:
`fix(snapshot): make import validation and restore atomic`

---

## PROMPT 14 — Chuyển Profile sang API thật và đồng bộ auth store

Hiện Profile cập nhật localStorage, không gọi backend `/users/me`.

Kiểm tra:

* `frontend/src/features/profile/ProfilePage.tsx`
* `frontend/src/features/pages.tsx` nếu còn code profile cũ
* `frontend/src/services/admin.api.ts`
* cần tạo `frontend/src/services/user.api.ts` nếu chưa có
* `frontend/src/app/store/auth.store.ts`
* backend users controller/service

Yêu cầu:

1. Tạo service frontend riêng:

   * `getMe()`;
   * `updateMe(payload)`;
   * gọi đúng endpoint backend `/users/me`.

2. Profile page:

   * load dữ liệu từ currentUser/API;
   * khi submit phải gọi backend;
   * sau update thành công cập nhật auth store;
   * không ghi localStorage như source chính.

3. Nếu API fail:

   * hiện lỗi rõ;
   * không báo “đã lưu” giả.

4. Xóa text gây hiểu nhầm kiểu “đồng bộ vào localStorage”.

5. Đảm bảo field frontend gửi khớp DTO backend.

6. Không cho user tự sửa role/status nếu backend không cho phép.

Chạy:

* Frontend build/lint/test.
* Backend build/test/lint nếu sửa users endpoint.

Commit message:
`fix(frontend): persist profile updates through user api`

---

## PROMPT 15 — Chuyển Schedules, Logs, Reports và eligibility UI sang backend API thật

Một số màn hình vẫn tính từ local snapshot, trong khi backend đã có endpoint thật.

Kiểm tra:

* `backend/src/schedules/schedules.controller.ts`
* `backend/src/logs/logs.controller.ts`
* `backend/src/reports/reports.controller.ts`
* `frontend/src/features/student/*Schedule*`
* `frontend/src/features/lecturer/*Schedule*`
* `frontend/src/features/admin/AuditLogsPage.tsx`
* `frontend/src/features/academic/ReportsPage.tsx`
* `frontend/src/lib/business-rules.ts`
* `backend/src/enrollments/enrollment-rules.ts`

Yêu cầu:

1. Tạo `frontend/src/services/schedule.api.ts`:

   * student week schedule;
   * student semester schedule;
   * lecturer week schedule;
   * lecturer semester schedule.

2. Student schedule page và Lecturer schedule page phải dùng API backend, không build từ snapshot local.

3. Tạo `frontend/src/services/log.api.ts`:

   * gọi `/logs`;
   * hỗ trợ filter actor/action/result/date nếu backend có.

4. AuditLogsPage phải dùng log thật từ backend, không dùng `snapshot.logs`.

5. ReportsPage:

   * load summary/stat từ backend;
   * bảng trên màn hình và file export phải dùng cùng source dữ liệu;
   * không để UI một số liệu, export một số liệu khác.

6. Eligibility UI:

   * không dùng local rule để quyết định pass/fail cuối cùng;
   * nếu cần preview, ghi rõ “ước tính”;
   * kết quả chính thức phải lấy từ backend eligibility/register response.

7. Xử lý loading/error/empty state rõ ràng.

Chạy:

* Frontend build/lint/test.
* Backend build/test/lint nếu cần sửa API contract.

Commit message:
`fix(frontend): use backend APIs for schedules logs reports and eligibility`

---

# 5 PROMPT AUDIT THÊM LOGIC ĐĂNG KÝ HỌC PHẦN THỰC TẾ

## PROMPT 16 — Audit logic học kỳ chính, học kỳ hè, học lại và học cải thiện

Hãy audit sâu logic đăng ký học phần theo thực tế đào tạo tín chỉ.

Tập trung kiểm tra:

1. Sinh viên chưa đăng ký môn ở học kỳ chính thì có được đăng ký ở học kỳ hè không?
2. Sinh viên đã rớt môn thì đăng ký học lại như thế nào?
3. Sinh viên đã qua môn có được học cải thiện không?
4. Nếu học cải thiện thì lấy điểm nào:

   * điểm cao nhất;
   * điểm mới nhất;
   * điểm theo quy chế?
5. Một sinh viên có thể đăng ký cùng một course ở nhiều section trong cùng học kỳ không?
6. Nếu đã REGISTERED một section của course A thì có được WAITLISTED section khác của course A không?
7. Nếu đã rút/hủy một section thì có được đăng ký lại section khác không?
8. Hè có giới hạn số tín chỉ khác học kỳ chính không?
9. Có phân biệt course bắt buộc/tự chọn khi học lại/học cải thiện không?

Yêu cầu output:

* Liệt kê từng lỗi/điểm chưa rõ.
* Ghi file liên quan.
* Đưa ví dụ dữ liệu cụ thể.
* Đề xuất rule backend.
* Đề xuất UI message.
* Đề xuất test case.

Không sửa code ngay, chỉ tạo báo cáo audit trước.

Commit message nếu có thêm tài liệu:
`docs(audit): review retake summer and grade improvement enrollment rules`

---

## PROMPT 17 — Audit prerequisite, prestudy, corequisite và môn đang học song song

Hãy audit logic điều kiện môn học trong dự án.

Tập trung:

1. Prerequisite:

   * bắt buộc đã qua môn trước;
   * dùng `StudentResult.passed` hay enrollment COMPLETED?
   * nếu đang học nhưng chưa có điểm thì có được tính không?

2. Pre-study / học trước:

   * khác gì prerequisite?
   * có cần chỉ cần đã từng học, kể cả chưa qua không?
   * project đang xử lý đúng chưa?

3. Corequisite / song hành:

   * có bắt buộc đăng ký cùng học kỳ không?
   * nếu đã qua corequisite từ kỳ trước thì có cần đăng ký lại không?
   * nếu rút một môn song hành thì môn còn lại xử lý sao?

4. Điều kiện theo ngành/chuyên ngành:

   * course có áp dụng cho major/specialization không?
   * sinh viên trái ngành có bị chặn không?

5. Điều kiện theo khóa học:

   * sinh viên năm nhất/năm hai có bị chặn môn nâng cao không?

Yêu cầu output:

* Bảng rule hiện tại vs rule nên có.
* Các file liên quan.
* Các case sai có thể xảy ra.
* Test case backend cần thêm.
* Test UI cần thêm.

Không sửa code ngay, chỉ audit.

Commit message:
`docs(audit): review prerequisite prestudy and corequisite rules`

---

## PROMPT 18 — Audit xung đột lịch, tín chỉ, sĩ số, waitlist, rút/hủy học phần

Hãy audit toàn bộ logic vận hành đăng ký thực tế liên quan lịch học và trạng thái enrollment.

Tập trung:

1. Xung đột lịch:

   * trùng thứ;
   * trùng tiết;
   * giao tuần;
   * trùng phòng;
   * trùng giảng viên;
   * lớp online/offline nếu có.

2. Giới hạn tín chỉ:

   * minCredits;
   * maxCredits;
   * tín chỉ waitlist có tính không?
   * tín chỉ môn rút/hủy có tính không?
   * tín chỉ học cải thiện có tính không?

3. Sĩ số:

   * registeredCount;
   * waitlistCount;
   * capacity;
   * room capacity;
   * section FULL/OPEN/CANCELLED.

4. Waitlist:

   * thứ tự waitlist;
   * khi có người hủy thì promote tự động hay thủ công;
   * có gửi thông báo không;
   * waitlist có hết hạn không?

5. Rút/hủy:

   * cancel trong thời gian đăng ký;
   * withdraw sau thời gian điều chỉnh;
   * deadline rút môn;
   * transcript có ghi W hay không;
   * hoàn lại slot thế nào.

Yêu cầu output:

* Danh sách lỗi logic có khả năng cao.
* Mức độ nghiêm trọng P0/P1/P2.
* Đề xuất fix backend.
* Đề xuất fix frontend.
* Test case cần bổ sung.

Không sửa code ngay, chỉ audit.

Commit message:
`docs(audit): review schedule credit capacity waitlist withdrawal rules`

---

## PROMPT 19 — Audit phân quyền và dữ liệu theo vai trò trong đăng ký học phần

Hãy audit quyền truy cập và quyền thao tác theo vai trò thực tế.

Vai trò cần kiểm tra:

* STUDENT
* LECTURER
* ACADEMIC_OFFICE
* ADMIN

Tập trung:

1. Student:

   * chỉ xem/sửa dữ liệu của chính mình;
   * không đăng ký thay người khác;
   * không xem danh sách sinh viên lớp nếu không có quyền;
   * không gọi API override.

2. Lecturer:

   * chỉ xem lớp mình dạy;
   * chỉ xem sinh viên thuộc lớp mình;
   * không sửa enrollment nếu không được phép;
   * lịch giảng viên phải filter đúng lecturerId.

3. Academic Office:

   * được tạo/sửa course/section;
   * được xử lý đăng ký/override theo nghiệp vụ;
   * không được làm tác vụ admin hệ thống nếu không có quyền.

4. Admin:

   * quản lý user/settings/log;
   * có được override học vụ không hay chỉ quản trị tài khoản?
   * cần thống nhất rule.

5. Audit log:

   * mọi mutation quan trọng phải ghi log;
   * actorRole không được lấy sai khi user có nhiều role;
   * metadata đủ để truy vết.

Yêu cầu output:

* Bảng endpoint vs role được phép.
* Các endpoint thiếu guard.
* Các màn hình frontend hiển thị chức năng sai quyền.
* Test case quyền truy cập.
* Đề xuất sửa.

Không sửa code ngay, chỉ audit.

Commit message:
`docs(audit): review enrollment role permissions and audit logs`

---

## PROMPT 20 — Audit invariant dữ liệu và test end-to-end đăng ký học phần

Hãy audit các invariant dữ liệu quan trọng và đề xuất bộ test end-to-end để đảm bảo hệ thống đăng ký học phần không sai logic.

Các invariant cần kiểm tra:

1. `Enrollment.semesterId` luôn bằng `Section.semesterId`.
2. Một sinh viên không có 2 enrollment active cho cùng một section.
3. Một sinh viên không có 2 enrollment active cho cùng một course trong cùng học kỳ, trừ khi nghiệp vụ cho phép học cải thiện đặc biệt.
4. `Section.registeredCount` luôn bằng số enrollment REGISTERED active.
5. `Section.waitlistCount` luôn bằng số enrollment WAITLISTED active.
6. Section CANCELLED không còn enrollment active.
7. Lịch học sinh viên không có 2 lớp trùng thời gian/tuần.
8. Tổng tín chỉ REGISTERED không vượt maxCredits.
9. Prerequisite/corequisite được kiểm tra bằng source dữ liệu chính xác.
10. Mọi mutation quan trọng có audit log.
11. Frontend không hiển thị dữ liệu local khác backend.
12. Export report và bảng report trên UI cùng số liệu.
13. Session hết hạn thì không mutation được.
14. Maintenance mode bật thì không mutation được.
15. Snapshot import fail thì DB không mất dữ liệu cũ.

Yêu cầu output:

* Viết danh sách test backend unit/integration.
* Viết danh sách test frontend cần có.
* Viết ít nhất 10 kịch bản E2E theo luồng người dùng thật:

  * sinh viên đăng ký;
  * đăng ký lớp full vào waitlist;
  * hủy đăng ký;
  * rút môn;
  * admin hủy section;
  * academic override;
  * lecturer xem lịch;
  * report export;
  * maintenance mode;
  * session timeout.

Không sửa code ngay, tạo báo cáo audit và kế hoạch test.

Commit message:
`docs(audit): define enrollment invariants and e2e test plan`
