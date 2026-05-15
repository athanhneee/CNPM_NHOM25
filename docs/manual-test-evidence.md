# Manual test evidence

Ngày chạy: 2026-05-14  
Môi trường: local backend/frontend, Playwright webServer reuse/start backend API `http://localhost:3000/api` và frontend `http://127.0.0.1:5173`, database demo theo `backend/.env`.

Quy uoc:

- Pass: đã chạy bằng command/API và có kết quả.
- Skipped: có guard an toàn, không đủ điều kiện để chạy.
- Manual pending: cần thao tác UI có chú ý vì có thể mutate database demo.

## Rehearsal mutation 4 vai tro - 2026-05-14

Run ID: `RH0514093608`  
Backup truoc mutation: `docs/demo-snapshot-rehearsal-backup-2026-05-14-163312.json`  
Raw evidence: `docs/rehearsal-mutation-RH0514093608.json`, `docs/rehearsal-mutation-RH0514093608-supplement.json`  
Quy tac an toan: khong chay `npm run prisma:seed`, `/snapshot/reset`, `/snapshot/import`. Neu can reset/import/seed DB demo, phai export snapshot va hoi xac nhan rieng truoc.
Post-run UI smoke: `frontend`: `npm run test:e2e` pass 3/3 Chromium sau khi mutation rehearsal.

Ket qua tom tat:

| ID | Role | Flow mutation / rehearsal | Trang thai | Evidence |
| --- | --- | --- | --- | --- |
| RH-ADM-01 | Admin | Import 6 sinh vien rehearsal | Pass | `POST /api/users/import-students`, created 6, skipped 0, default password `ptithcm2026`. |
| RH-ACD-01 | Academic | Tao lop | Pass | Tao section `RH0514093608-MAIN`, course `CSE101`, id `1872687b-e2fc-409b-afeb-c73e300db35b`. |
| RH-ACD-02 | Academic | Phan cong giang vien | Pass | `PATCH /api/sections/:id/assign-lecturer`, doi `LEC001` -> `LEC002`. |
| RH-ACD-03 | Academic | Doi phong/lich | Pass | `PATCH /api/sections/:id/room-schedule`, room `A1-301`, weekday 7, startPeriod 1. |
| RH-STU-01 | Student | Dang ky lop thanh cong | Pass | Sinh vien import `N26RH05140936081` dang ky `RH0514093608-MAIN`, enrollment `REGISTERED`. |
| RH-STU-02 | Student | Huy dang ky | Pass | Doi `simulationNow` sang `2026-05-02T08:00:00.000Z`, huy enrollment thanh `CANCELLED`, sau do restore `2026-04-10T08:00:00.000Z`. |
| RH-STU-03 | Student | Dang ky lop full de vao danh sach doi | Pass | Section `RH0514093608-WL` capacity 1: student 2 `REGISTERED`, student 3 `WAITLISTED`, waitlistOrder 1. |
| RH-ACD-04 | Academic | Process waitlist | Pass | Tang capacity `RH0514093608-WL` len 2, `POST /api/enrollments/sections/:sectionId/process-waitlist` promoted 1 -> `REGISTERED`. |
| RH-ACD-05 | Academic | Override | Pass | Tao section `RH0514093608-OVR` course `CSE201`, override student 4 -> `REGISTERED`, reason `Rehearsal override prerequisite RH0514093608`. |
| RH-STU-04 | Student | Gui nguyen vong | Pass | Tao 2 wish `CSE301`, trang thai ban dau `PENDING`. |
| RH-ACD-06 | Academic | Duyet nguyen vong | Pass | Wish `9f6d6536-874f-44d7-950e-d7a84da53199` -> `APPROVED`. |
| RH-ACD-07 | Academic | Tu choi nguyen vong | Pass | Wish `41a6279b-9832-452e-aaac-d50a1956c178` -> `REJECTED` voi `reviewNote`. |
| RH-LEC-01 | Lecturer | Xem lop duoc phan cong | Pass | Login `thu.ha` (`LEC002`), thay section `RH0514093608-MAIN`. |
| RH-LEC-02 | Lecturer | Xem danh sach sinh vien | Pass | `GET /api/sections/:id/students`, tra 1 row status `CANCELLED` cho section rehearsal. |
| RH-ADM-02 | Admin | Update settings | Pass | `PATCH /api/settings` doi `simulationNow` de test cancel, da restore ve gia tri ban dau. |
| RH-ADM-03 | Admin | Xem audit log | Pass | `GET /api/logs?targetId=1872687b-e2fc-409b-afeb-c73e300db35b&limit=20`, 4 log matching: `REGISTER_COURSE`, `UPDATE_SECTION`, `CREATE_SECTION`. |
| RH-SAFE-01 | Admin | Snapshot reset/import | Blocked | Khong chay theo guard an toan. Can export snapshot va hoi xac nhan truoc neu muon reset/import. |
| RH-SAFE-02 | Backend | Prisma seed/reset | Blocked | Khong chay `npm run prisma:seed` hay migration reset tren DB demo. |

Anh evidence Playwright da chup:

| Man hinh | File |
| --- | --- |
| Student ket qua dang ky | `docs/evidence/rehearsal-RH0514093608-student-registered.png` |
| Student lich su dang ky | `docs/evidence/rehearsal-RH0514093608-student-history.png` |
| Lecturer lop duoc phan cong | `docs/evidence/rehearsal-RH0514093608-lecturer-sections.png` |
| Academic quan ly dang ky | `docs/evidence/rehearsal-RH0514093608-academic-registrations.png` |
| Academic waitlist/override | `docs/evidence/rehearsal-RH0514093608-academic-waitlist-override.png` |
| Academic duyet nguyen vong | `docs/evidence/rehearsal-RH0514093608-academic-wishes.png` |
| Admin users/import sinh vien | `docs/evidence/rehearsal-RH0514093608-admin-users.png` |
| Admin settings/snapshot | `docs/evidence/rehearsal-RH0514093608-admin-settings.png` |
| Admin audit logs | `docs/evidence/rehearsal-RH0514093608-admin-audit-logs.png` |

Bug/phat hien:

- Khong phat hien bug app trong cac flow mutation tren.
- Loi ban dau trong rehearsal script: dung sai username `LEC002` la `lan.anh`; seed/live dung `thu.ha`. Da chay supplement va pass.
- Loi ban dau trong rehearsal script: `/logs` khong ho tro query `search`; DTO chi co `actorId`, `targetId`, `result`, `action`, `from`, `to`. Da dung `targetId` va pass. File lien quan: `backend/src/logs/dto/log-query.dto.ts`, `backend/src/logs/logs.service.ts`.

## Automated checks

| ID | Hang muc | Lenh | Ket qua | Ghi chu |
| --- | --- | --- | --- | --- |
| AUTO-01 | Backend lint | `backend`: `npm run lint` | Pass | Khong loi ESLint. |
| AUTO-02 | Backend rules smoke | `backend`: `npm run test:rules` | Pass | JWT, enrollment rules, section cancellation, schedule permission pass. |
| AUTO-03 | Backend build | `backend`: `npm run build` | Pass | TypeScript build thanh cong. |
| AUTO-04 | Frontend lint | `frontend`: `npm run lint` | Pass | Khong loi ESLint. |
| AUTO-05 | Frontend tests | `frontend`: `npm run test` | Pass | 7/7 test pass. |
| AUTO-06 | Frontend build | `frontend`: `npm run build` | Pass | Vite production build thanh cong. |
| AUTO-07 | Frontend e2e | `frontend`: `npm run test:e2e` | Pass | 3/3 Chromium test pass; Playwright start/reuse backend và frontend, không seed/reset DB. |
| AUTO-08 | Integration smoke | `backend`: `npm run test:integration` | Skipped | Không có `TEST_DATABASE_URL`; không chạy trên DB demo thật. |

Ghi chú e2e: `frontend/e2e/student-login.spec.ts` kiểm tra đăng nhập sinh viên `N23DCCN001` và mở kết quả đăng ký, đăng nhập giảng viên `minh.tuan` và mở lớp được phân công, đăng nhập admin và mở users/settings. Backend cần `.env` và database sẵn sàng; config hiện reuse/start backend/frontend nhưng không chạy seed/reset/import.

## API smoke cho 4 vai tro

Tat ca cac API smoke duoi day la read-only, tru `POST /auth/login` va `POST /enrollments/eligibility`.
Bang duoi la evidence tu lan chay 2026-05-13; trong ngay 2026-05-14 khong chay lai toan bo API smoke, chi chay e2e read-only cho student/lecturer/admin qua UI.

| ID | Role | Flow | Evidence | Ket qua |
| --- | --- | --- | --- | --- |
| AUTH-01 | Admin | Dang nhap | `POST /api/auth/login` voi `admin` | Pass, user `AD001`. |
| AUTH-02 | Academic Office | Dang nhap | `POST /api/auth/login` voi `academic.office` | Pass, user `AO001`. |
| AUTH-03 | Lecturer | Dang nhap | `POST /api/auth/login` voi `minh.tuan` | Pass, user `LEC001`. |
| AUTH-04 | Student | Dang nhap | `POST /api/auth/login` voi `N23DCCN001` | Pass, user `N23DCCN001`. |
| STU-01 | Student | Hoc phan mo | `GET /api/sections?semesterId=sem-2026-1` | Pass, 3 section. |
| STU-02 | Student | Eligibility | `POST /api/enrollments/eligibility` | Pass, rule moi tra `REG_ERR_ALREADY_REGISTERED_COURSE` khi sinh vien da co/waitlist cung `courseCode`. |
| STU-03 | Student | Ket qua dang ky | `GET /api/enrollments?semesterId=sem-2026-1` | Pass, 3 enrollment. |
| STU-04 | Student | Lich hoc | `GET /api/schedules/students/N23DCCN001/week/sem-2026-1` | Pass, 2 dong lich. |
| STU-05 | Student | Nguyen vong | `GET /api/wishes?semesterId=sem-2026-1` | Pass, 1 nguyen vong. |
| LEC-01 | Lecturer | Lop duoc phan cong | `GET /api/sections?lecturerId=LEC001&semesterId=sem-2026-1` | Pass, 2 section. |
| LEC-02 | Lecturer | Danh sach sinh vien | `GET /api/sections/:id/students` | Pass, endpoint tra du lieu cho section duoc phan cong. |
| LEC-03 | Lecturer | Lich day | `GET /api/schedules/lecturers/LEC001/week/sem-2026-1` | Pass, 2 dong lich. |
| ACD-01 | Academic | Catalog hoc phan | `GET /api/courses?limit=5` | Pass, 3 course. |
| ACD-02 | Academic | Waitlist | `GET /api/enrollments?semesterId=sem-2026-1&status=WAITLISTED` | Pass, 1 waitlist. |
| ACD-03 | Academic | Bao cao | `GET /api/reports/registration-summary`, `/utilization-stats` | Pass, summary 3 row, utilization 1 row. |
| ACD-04 | Academic | Lich toan hoc ky | `GET /api/schedules/semester/sem-2026-1` | Pass, 3 section. |
| ADM-01 | Admin | Users/logs | `GET /api/users?limit=5`, `/logs?limit=5` | Pass, moi endpoint tra 5 row. |

## Snapshot / backup

| ID | Hang muc | Evidence | Ket qua | Ghi chu |
| --- | --- | --- | --- | --- |
| SNAP-01 | Snapshot export | `GET /api/snapshot/export` bang admin token | Pass | Da luu `docs/demo-snapshot-2026-05-13.json`. |
| SNAP-02 | Snapshot reset/import | `/snapshot/reset`, `/snapshot/import` | Skipped | Co nguy co thay the du lieu demo; khong chay khi khong co ly do ro. |

Snapshot export hien co 12 nhom du lieu: 6 users, 3 courses, 4 sections, 7 enrollments va cac bang demo lien quan. Snapshot này có waitlist `CSE101-2` và prerequisite fail `CSE201-1`, nhưng chưa có `CSE150/CSE150-1`.
Trong ngày 2026-05-14 không export/import/reset snapshot mới. Checklist chốt DB đã ghi riêng tại `docs/db-demo-freeze-checklist.md`.

## Business smoke moi

| ID | Hang muc | Evidence | Ket qua |
| --- | --- | --- | --- |
| RULE-01 | Chan dang ky nhieu section cung course | `npm run test:rules` + API eligibility | Pass, tra `REG_ERR_ALREADY_REGISTERED_COURSE`. |
| RULE-02 | Huy section cap nhat enrollment/counter | `npm run test:rules` section cancellation smoke | Pass, helper dem REGISTERED/WAITLISTED/PENDING can cancel. |
| RULE-03 | PATCH/DELETE enrollment dong bo counter | `npm run test:rules`, backend lint/build | Pass, service recompute `registeredCount`/`waitlistCount` trong transaction sau update/delete. |
| UI-01 | Danh muc phong | Frontend lint/build | Pass, input phong co datalist tu room trong section + fallback seed. |
| UI-02 | Read-only e2e chính | `npm run test:e2e` | Pass, 3/3: student kết quả đăng ký, lecturer lớp được phân công, admin users/settings. |
| UI-03 | Đổi mật khẩu | Frontend lint/build | Pass, validation/hint/message yêu cầu mật khẩu mới tối thiểu 8 ký tự, khớp backend DTO. |
| UI-04 | TKB tuần | Frontend lint/build + docs | Pass, UI ghi rõ đây là lịch dạng tuần theo thứ/tiết trong học kỳ, chưa lọc theo tuần lịch cụ thể. |
| SEED-01 | Seed demo | Review `backend/prisma/seed.ts` | Pass, seed source có thêm `CSE150`/`CSE150-1` để demo đăng ký thành công; chưa chạy seed trên DB thật. |

## Manual evidence theo flow quan trọng

| ID | Role | Flow | Trạng thái | Evidence / lý do |
| --- | --- | --- | --- | --- |
| STU-M01 | Student | Đăng nhập | Pass | `npm run test:e2e`, user `N23DCCN001`. |
| STU-M02 | Student | Xem học phần mở | Pass theo API evidence | Evidence 2026-05-13: `GET /api/sections?semesterId=sem-2026-1`; manual screenshot còn pending. |
| STU-M03 | Student | Check eligibility | Pass theo API/rules | Evidence 2026-05-13 + `npm run test:rules`; có rule duplicate/prerequisite. |
| STU-M04 | Student | Đăng ký thành công | Manual pending | Không mutate DB demo. Snapshot 2026-05-13 chưa có `CSE150/CSE150-1`, nên cần rehearsal/snapshot mới nếu muốn demo live. |
| STU-M05 | Student | Waitlist | Pass read-only, mutation pending | Snapshot có `enr-waitlist-cse101`; không tạo waitlist mới trong lượt này. |
| STU-M06 | Student | Hủy/rút học phần | Manual pending | Đây là mutation đổi enrollment/counter, chỉ chạy sau khi export snapshot backup. |
| STU-M07 | Student | Gửi/hủy nguyện vọng | Manual pending | Đây là mutation wish; snapshot hiện có `wish-cse301-extra` để xem read-only. |
| LEC-M01 | Lecturer | Xem lớp được phân công | Pass | `npm run test:e2e`, user `minh.tuan`, route `/lecturer/sections`. |
| LEC-M02 | Lecturer | Xem danh sách sinh viên | Pass theo API evidence | Evidence 2026-05-13: `GET /api/sections/:id/students`; manual screenshot còn pending. |
| LEC-M03 | Lecturer | Xem lịch dạy | Pass theo API evidence | Evidence 2026-05-13: `GET /api/schedules/lecturers/LEC001/week/sem-2026-1`. |
| ACD-M01 | Academic office | Tạo/cập nhật lớp | Manual pending | Mutation section, chưa chạy để tránh đổi DB demo. |
| ACD-M02 | Academic office | Phân công giảng viên | Manual pending | Mutation section lecturer, chưa chạy để tránh đổi lịch demo. |
| ACD-M03 | Academic office | Đổi phòng/lịch | Manual pending | Mutation phòng/lịch, chỉ demo sau backup snapshot. |
| ACD-M04 | Academic office | Xử lý waitlist | Manual pending | Mutation enrollment, snapshot đã có waitlist để xem read-only. |
| ACD-M05 | Academic office | Override | Manual pending | Mutation nghiệp vụ đặc biệt, cần ghi lý do và audit sau khi backup. |
| ACD-M06 | Academic office | Xem báo cáo | Pass theo API evidence | Evidence 2026-05-13: `/reports/registration-summary`, `/utilization-stats`. |
| ACD-M07 | Academic office | Duyệt/từ chối nguyện vọng | Manual pending | Mutation wish; `reviewNote` sẽ vào audit metadata, chưa lưu trực tiếp trên `WishRequest`. |
| ADM-M01 | Admin | Khóa/mở khóa user | Manual pending | Mutation user status, không chạy trên DB demo trong lượt này. |
| ADM-M02 | Admin | Reset mật khẩu | Manual pending | Mutation auth/user, tránh làm lệch tài khoản demo. |
| ADM-M03 | Admin | Import sinh viên | Manual pending | Mutation hàng loạt user, chỉ chạy trên DB test hoặc sau backup snapshot. |
| ADM-M04 | Admin | Cập nhật settings | Manual pending | Mutation rules/session window, không đổi cấu hình demo hiện tại. |
| ADM-M05 | Admin | Export snapshot | Pass theo evidence cũ | Snapshot export đã lưu `docs/demo-snapshot-2026-05-13.json`; không export lại trong lượt này. |
| ADM-M06 | Admin | Xem audit log | Pass theo API evidence | Evidence 2026-05-13: `GET /api/logs?limit=5`; UI admin users/settings pass e2e. |

## Manual pending truoc khi quay demo

- Không chạy seed/reset DB trong lượt này.
- Không gọi các API mutation học vụ như tạo section, phân công giảng viên, đổi phòng/lịch, process waitlist, override, khóa/mở khóa user, import sinh viên, update settings.
- Review note nguyện vọng hiện chỉ được ghi trong audit log metadata; chưa thêm cột `WishRequest.reviewNote` vì cần migration/apply DB demo có kiểm chứng.
- Seed source đã bổ sung dữ liệu demo nhỏ, nhưng DB demo hiện tại chưa được seed lại để tránh thay đổi dữ liệu trước báo cáo.
- Nếu cần demo mutation live, tạo snapshot trước, thao tác có chú ý, và ghi lại bản ghi đã tạo/sửa để dọn dẹp sau.
