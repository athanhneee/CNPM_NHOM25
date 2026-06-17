# Bao cao kiem tra loi logic backend/frontend du an CNPM

Ngay kiem tra: 17/06/2026  
Pham vi: `backend`, `frontend`, `docs`, Prisma schema/migrations/seed, cau hinh build. Khong audit logic trong `node_modules`, `dist`, `build`, `.git`, cache va cac file sinh tu dong/lock theo tung dong vi day khong phai source nghiep vu.

## 1. Ket qua kiem tra nhanh

Da chay cac lenh:

```text
backend: npm run build        -> PASS
backend: npm run test:rules   -> PASS
backend: npm run lint         -> PASS
backend: npx prisma validate  -> PASS
frontend: npm run test        -> PASS
frontend: npm run build       -> FAIL
frontend: npm run lint        -> FAIL
```

Loi chan build frontend:

- `frontend/src/features/pages.tsx:7`: import `BookOpenText` nhung khong su dung.
- TypeScript bao `TS6133`, ESLint bao `@typescript-eslint/no-unused-vars`.
- Ket qua: frontend hien tai chua build duoc ban production.

## 2. Frontend/backend da ket noi chua?

Ket luan: da ket noi mot phan, chua dong bo hoan toan.

Da ket noi API backend:

- `frontend/src/lib/api-client.ts:4`, `frontend/src/lib/api-client.ts:33-34`: frontend mac dinh goi `http://localhost:3000/api` hoac `VITE_API_BASE_URL`.
- Auth: `frontend/src/services/auth.api.ts` goi `/auth/login`, `/auth/me`, `/auth/logout`, `/auth/change-password`, `/auth/refresh`.
- Users/admin/settings/snapshot: `frontend/src/services/admin.api.ts`.
- Courses: `frontend/src/services/course.api.ts`.
- Sections: `frontend/src/services/section.api.ts`.
- Enrollments: `frontend/src/services/enrollment.api.ts`.
- Wishes: `frontend/src/services/wish.api.ts`.
- Reports export: `frontend/src/services/report.api.ts`.

Chua ket noi hoan toan:

- Dashboard, profile, lich hoc, audit logs, mot phan report van doc tu `useDataStore`/localStorage thay vi doc truc tiep backend.
- Backend co endpoint `/schedules/...` nhung frontend khong co `schedule.api.ts`; lich hoc sinh vien/giang vien dang tinh bang selector local tai `frontend/src/features/student/student-pages.tsx:712`, `frontend/src/features/student/student-pages.tsx:738`, `frontend/src/features/lecturer/lecturer-pages.tsx:153`, `frontend/src/features/lecturer/lecturer-pages.tsx:170`.
- Backend co endpoint `/logs` nhung trang audit log doc `snapshot.logs` local tai `frontend/src/features/admin/admin-pages.tsx:697-732`.
- Trang report hien thi bang du lieu local tai `frontend/src/features/academic/academic-pages.tsx:754-756`; chi nut export moi goi backend tai `frontend/src/features/academic/academic-pages.tsx:779`.
- Profile cap nhat localStorage, khong goi `/users/me`: `frontend/src/features/pages.tsx:1067`, `frontend/src/features/pages.tsx:1171`, `frontend/src/features/pages.tsx:1184`.

## 3. Loi backend nghiem trong/can sua

### 3.1. Dang ky section khac hoc ky nhung enrollment lai gan vao hoc ky hien tai

Vi tri:

- `backend/src/enrollments/enrollments.service.ts:128`: load section bang `sectionId` ma khong rang buoc `section.semesterId`.
- `backend/src/enrollments/enrollment-rules.ts:264-265`: rule chi loc enrollment theo `settings.currentSemesterId`.
- `backend/src/enrollments/enrollments.service.ts:323`: khi tao enrollment luu `semesterId: settings.currentSemesterId`.

Loi logic:

Neu client gui `sectionId` cua hoc ky cu/hoc ky khac, backend van co the tinh eligibility va tao enrollment cho `currentSemesterId`. Enrollment se tro den section khong cung hoc ky voi `Enrollment.semesterId`.

Hau qua:

- Du lieu bi lech giua `Enrollment.semesterId` va `Section.semesterId`.
- Lich hoc, bao cao, si so theo hoc ky co the sai.
- Sinh vien co the dang ky lop khong thuoc ky dang mo.

Can sua:

- Trong `loadEligibilityContext` hoac rule, bat buoc `section.semesterId === settings.currentSemesterId`.
- Khi tao enrollment nen dung `section.semesterId` sau khi da xac nhan dung hoc ky.

### 3.2. Cap nhat/xoa enrollment khong cap nhat si so section

Vi tri:

- `backend/src/enrollments/enrollments.service.ts:365-372`: `update()` chi update status/reason.
- `backend/src/enrollments/enrollments.service.ts:659-661`: `remove()` xoa enrollment truc tiep.

Loi logic:

Admin/Academic co the doi status enrollment hoac xoa enrollment nhung `Section.registeredCount`, `Section.waitlistCount`, `Section.status` khong duoc tinh lai.

Hau qua:

- Lop co the hien full du khong con sinh vien.
- Waitlist count bi sai.
- Bao cao utilization sai.
- Rule dang ky tiep theo dua tren count sai.

Can sua:

- Moi thay doi status/xoa enrollment phai chay chung mot transaction tinh delta count.
- Tot hon la khong cho update status tuy y; tach endpoint nghiep vu ro rang: cancel, withdraw, approve, reject, waitlist, promote.

### 3.3. Override dang ky bo qua qua nhieu rule, co the vuot si so va lech hoc ky

Vi tri:

- `backend/src/enrollments/enrollments.service.ts:580-645`.
- Dac biet `semesterId: settings.currentSemesterId` tai `:628`.
- Tang si so tai `:635-637` nhung khong check capacity.

Loi logic:

Override dang ky khong kiem tra:

- section co thuoc hoc ky hien tai khong;
- section da full hay chua;
- xung dot lich;
- credit limit;
- dieu kien tien quyet;
- da dang ky cung mon o section khac hay chua.

Override co the la nghiep vu hop le, nhung hien tai no khong ghi ro loai override nao duoc phep va co the lam section vuot capacity.

Can sua:

- Tach `forceOverride` va `controlledOverride`.
- Neu cho vuot capacity thi can metadata/audit ro rang va UI hien "vuot chi tieu".
- Van nen chan cross-semester va duplicate cung course neu khong co ly do dac biet.

### 3.4. Bao tri he thong chi chan o mot nhanh frontend, backend van cho ghi du lieu

Vi tri:

- Backend setting co `maintenanceMode`: `backend/src/settings/settings.service.ts:34`.
- Frontend chi check nhanh dang ky nhanh o `frontend/src/features/student/student-pages.tsx:184`.
- Cac endpoint backend mutating nhu register, cancel, withdraw, create course, create section, update settings, wish van khong check maintenance.

Loi logic:

Khi bat bao tri, nguoi dung co the goi API truc tiep hoac di qua cac man hinh khac de ghi du lieu.

Can sua:

- Them guard/interceptor backend doc `SystemSetting.maintenanceMode`.
- Cho phep whitelist: login/logout/settings cua admin neu can.

### 3.5. Cap nhat settings khong validate rang buoc nghiep vu

Vi tri:

- `backend/src/settings/settings.service.ts:22-41`.

Loi logic:

Backend nhan truc tiep ngay thang va so:

- khong check `registrationStart < registrationEnd`;
- khong check `adjustmentStart <= adjustmentEnd`;
- khong check `registrationEnd <= adjustmentStart`;
- khong check `minCredits <= maxCredits`;
- khong dong bo `SemesterOption.isCurrent` khi doi `currentSemesterId`.

Hau qua:

- Co the tao cua so dang ky vo ly.
- Frontend/backend tinh eligibility sai.
- Danh sach hoc ky sap xep theo `isCurrent` co the khong trung voi `settings.currentSemesterId`.

### 3.6. Huy section khong xu ly enrollment dang ton tai

Vi tri:

- `backend/src/sections/sections.service.ts:303-305`.

Loi logic:

Xoa section chi set `status = CANCELLED`, khong chuyen cac enrollment `REGISTERED/WAITLISTED` sang `CANCELLED/REJECTED`, khong cap nhat timeline, khong tinh lai si so.

Hau qua:

- Sinh vien van co enrollment dang ky thanh cong vao lop da huy.
- Lich hoc co the van hien lop bi huy neu build tu enrollment.
- Bao cao si so van tinh registeredCount cu.

Can sua:

- Huy section trong transaction: update section, update active enrollments, them timeline, tinh lai count/status.

### 3.7. Tao/cap nhat course va course conditions khong atomic

Vi tri:

- `backend/src/courses/courses.service.ts:145-157`: tao course xong moi sync conditions.
- `backend/src/courses/courses.service.ts:178-196`: update course xong moi sync conditions.
- `backend/src/courses/courses.service.ts:64`: xoa conditions cu.

Loi logic:

Neu sync `CourseCondition` fail do ma mon tien quyet khong ton tai, course da duoc tao/cap nhat truoc do. Du lieu de lai trang thai nua thanh cong nua that bai.

Can sua:

- Boc create/update course va sync conditions trong cung mot transaction.
- Validate tat ca `requiredCourseCode` ton tai truoc khi ghi.

### 3.8. Xung dot lich khong tinh `weeks`, phong khong check suc chua

Vi tri:

- `backend/src/sections/sections.service.ts:93-122`: check trung weekday/period/lecturer/room.
- `backend/src/sections/sections.service.ts:64-70`: `resolveRoomId` chi check phong ton tai.

Loi logic:

- Hai lop cung phong/cung tiet nhung khac tuan van bi coi la trung lich.
- Phong co capacity nho hon section capacity van duoc gan.

Can sua:

- Parse `weeks` thanh tap tuan va chi conflict khi tap tuan giao nhau.
- Kiem tra `Room.capacity >= Section.capacity`.

### 3.9. Session timeout va rememberMe khong dung ky vong

Vi tri:

- `backend/src/auth/auth.service.ts:38-43`: session nhan `rememberMe`.
- `backend/src/auth/auth.service.ts:142`: expiresAt luon tinh theo `REFRESH_TOKEN_EXPIRES_IN`.
- `backend/src/auth/auth.service.ts:163`: session tra ve dung refresh token expiry.

Loi logic:

`rememberMe = false` khong lam session ngan hon. `SystemSetting.sessionTimeoutMinutes` khong duoc backend dung. Frontend real API cung chi cap nhat `lastActivityAt`, khong gia han `expiresAt` tai `frontend/src/services/auth.api.ts:193-203`.

Hau qua:

- UI thong bao session timeout co the khong dung cau hinh 30 phut.
- Nguoi dung khong chon remember me van co session theo refresh token 7 ngay.

### 3.10. Snapshot import co nguy co xoa sach du lieu neu import loi

Vi tri:

- `backend/src/snapshot/snapshot.service.ts:67-79`: transaction xoa du lieu.
- `backend/src/snapshot/snapshot.service.ts:82-94`: transaction tao lai du lieu.

Loi logic:

Import tach thanh hai transaction. Neu xoa thanh cong nhung create fail, database co the bi rong/mat du lieu.

Can sua:

- Dua delete va create vao cung mot transaction.
- Validate payload truoc khi xoa.
- Can co backup/rollback ro rang.

## 4. Loi frontend nghiem trong/can sua

### 4.1. Frontend khong build duoc

Vi tri:

- `frontend/src/features/pages.tsx:7`.

Loi:

`BookOpenText` import nhung khong dung. `npm run build` va `npm run lint` deu fail.

Can sua:

- Xoa import thua hoac su dung icon nay that su.

### 4.2. State frontend van khoi tao tu mock/localStorage, de hien thi du lieu cu khi API loi

Vi tri:

- `frontend/src/app/store/data.store.ts:15-27`: import seed mock.
- `frontend/src/app/store/data.store.ts:72-73`: doc localStorage/seed.
- `frontend/src/app/store/data.store.ts:175-181`: khoi tao users/courses/sections/enrollments/logs/settings/wishes tu localStorage/seed.
- `frontend/src/features/student/student-pages.tsx:49-52`: goi API nhung `.catch(() => undefined)`.
- `frontend/src/features/academic/academic-pages.tsx:77-79`: goi API nhung `.catch(() => undefined)`.
- `frontend/src/features/lecturer/lecturer-pages.tsx:32-33`: goi API nhung `.catch(() => undefined)`.

Loi logic:

Neu backend chet, het token, API loi, UI van tiep tuc hien mock/localStorage ma khong bao loi ro. Nguoi dung co the tuong dang lam viec voi backend that.

Can sua:

- Them trang thai `apiStatus/error`.
- Khi API loi, hien banner "mat ket noi backend" va khoa thao tac ghi.
- Tach mode demo/offline va mode backend that.

### 4.3. Profile cap nhat localStorage, khong cap nhat backend

Vi tri:

- `frontend/src/features/pages.tsx:1067`: `ProfilePage`.
- `frontend/src/features/pages.tsx:1171`: goi `updateUser` tu data store.
- `frontend/src/features/pages.tsx:1184`: toast ghi ro "dong bo vao localStorage".

Loi logic:

Backend co `PATCH /users/me`, nhung profile UI khong goi API. Sau reload/restore tu backend, thay doi profile co the mat hoac lech voi database.

Can sua:

- Them `user.api.ts` hoac dung `admin.api` rieng cho `/users/me`.
- Sau update thanh cong, cap nhat auth store currentUser va data store.

### 4.4. Doi mat khau thanh cong nhung auth store van coi nhu dang dang nhap

Vi tri:

- `frontend/src/services/auth.api.ts:223`: doi mat khau thanh cong thi `clearStoredAuth()`.
- `frontend/src/app/store/auth.store.ts:89-95`: `changePassword` chi return ket qua, khong set `currentUser = null`, `session = null`, `isAuthenticated = false`.

Loi logic:

LocalStorage token bi xoa nhung Zustand auth state van giu user dang nhap. UI co the van cho vao app cho den khi request API tiep theo fail.

Can sua:

- Sau change password thanh cong, set auth state ve logout hoac dieu huong login.
- Thong bao ro "Vui long dang nhap lai".

### 4.5. Validate mat khau frontend va backend khong khop

Vi tri:

- Frontend: `frontend/src/features/pages.tsx:1552` check `nextPassword.length < 6`.
- Backend: `backend/src/auth/dto/change-password.dto.ts` yeu cau `@MinLength(8)`.

Loi logic:

Mat khau 6-7 ky tu duoc frontend chap nhan nhung backend reject. UX se bao loi muon, khong nhat quan.

Can sua:

- Dong bo min length thanh 8 o frontend.

### 4.6. Kiem tra dieu kien dang ky co 2 ban logic khac nhau

Vi tri:

- Frontend local rule: `frontend/src/lib/business-rules.ts:104-112`, `:176`, `:186`, `:197`.
- Backend rule dung them `StudentResult`: `backend/src/enrollments/enrollment-rules.ts` va `backend/src/enrollments/enrollments.service.ts:126-132`.
- UI student goi local rule truoc tai `frontend/src/features/student/student-pages.tsx:271` va `:390`, sau do moi goi API tai `:404`.

Loi logic:

Frontend local rule tinh mon da qua/hoc truoc tu enrollment `COMPLETED/FAILED`, trong khi backend tinh them `studentResults`. Cung mot sinh vien/section co the hien rule pass/fail khac nhau truoc khi API tra ve.

Can sua:

- Chi hien ket qua eligibility tu backend.
- Neu can preview offline, dung chung shared package/rules va cung data shape.

### 4.7. Lich hoc khong dung endpoint backend `/schedules`

Vi tri:

- Student: `frontend/src/features/student/student-pages.tsx:712`, `:738`.
- Lecturer: `frontend/src/features/lecturer/lecturer-pages.tsx:153`, `:170`.
- Backend co `backend/src/schedules/schedules.controller.ts`.

Loi logic:

Lich hoc duoc build tu `snapshot` local. Neu backend schedule co permission/filter/status khac, UI khong dung source chuan.

Can sua:

- Tao `frontend/src/services/schedule.api.ts`.
- Week/Semester schedule page goi `/schedules/students/:id/...` va `/schedules/lecturers/:id/...`.

### 4.8. Audit logs page khong dung endpoint backend `/logs`

Vi tri:

- `frontend/src/features/admin/admin-pages.tsx:697-732`.

Loi logic:

Trang "Nhat ky he thong" doc `snapshot.logs` local. Trong khi backend ghi audit log that vao database. Admin co the khong thay log login/register/backend mutation moi nhat neu chua sync snapshot.

Can sua:

- Tao `log.api.ts` goi `/logs`.
- Them filter actor/action/result/date theo backend.

### 4.9. Reports page hien local, export moi goi backend

Vi tri:

- `frontend/src/features/academic/academic-pages.tsx:754-756`: tao rows tu local selector.
- `frontend/src/features/academic/academic-pages.tsx:779`: export CSV goi backend report.

Loi logic:

So lieu tren man hinh va file export co the khac nhau.

Can sua:

- Khi vao ReportsPage, load `reportService.getRegistrationSummary()` va `getUtilizationStats()`.
- Dung chung data cho UI va export.

### 4.10. Maintenance mode chi chan nut "Dang ky nhanh"

Vi tri:

- `frontend/src/features/student/student-pages.tsx:184`.

Loi logic:

Chi nut dang ky nhanh trong OpenSectionsPage check maintenance. Cac nut dang ky o CourseDetail/RegisterPage, wish, cancel/withdraw, admin mutations van co the goi API.

Can sua:

- Backend guard la bat buoc.
- Frontend nen co helper chung de disable mutation khi maintenance.

## 5. Cac loi/diem yeu khac

### Backend

- `backend/src/common/utils/audit.ts:10-13`: `buildActor` lay `roles[0]` lam role chinh. Neu user co nhieu role va role ADMIN/ACADEMIC_OFFICE khong nam dau, audit/permission trong service co the sai.
- `backend/src/sections/sections.service.ts:236`: check capacity moi khong nho hon `registeredCount`, nhung khong tinh `waitlistCount` va khong check room capacity.
- `backend/src/enrollments/enrollment-rules.ts:451-452`: section `FULL` van duoc coi la register-able neu allowWaitlist. Hop ly cho waitlist, nhung can dam bao UI hien ro "vao waitlist" khong phai "dang ky thanh cong".
- Backend chua co unique constraint cho active enrollment theo `(studentId, sectionId, semesterId)`; rule co check duplicate nhung DB khong co rang buoc cuoi cung.

### Frontend

- `frontend/src/features/lecturer/lecturer-pages.tsx:104`: neu API lay danh sach sinh vien loi, UI set rows rong, khong bao loi; giang vien co the tuong lop khong co sinh vien.
- `frontend/src/features/admin/admin-pages.tsx:669`: text van noi snapshot la "du lieu mock trong localStorage" trong khi service that goi `/snapshot/export/import`; noi dung UI gay nham lan.
- `frontend/src/features/pages.tsx:435`: LoginPage van lay `demoAccounts` tu mock store. Neu backend seed khac, danh sach demo co the khong khop tai khoan backend.

## 6. Danh sach endpoint backend va muc do frontend su dung

| Nhom | Backend co | Frontend dung that | Ghi chu |
| --- | --- | --- | --- |
| Auth | Co | Co | Da goi API that, con loi session/change password |
| Users/Admin | Co | Co mot phan | Admin list/create/import/lock dung API; profile user tu cap nhat local |
| Courses | Co | Co | Dang dung API |
| Sections | Co | Co | Dang dung API, nhung schedule/list students co fallback im lang |
| Enrollments | Co | Co | Dang dung API, frontend van co local rule song song |
| Wishes | Co | Co | Dang dung API |
| Settings | Co | Co mot phan | Update dung API; initial/current settings van tu store seed/local |
| Reports | Co | Mot phan | Export dung API; man hinh report dung local |
| Schedules | Co | Chua | Frontend tinh tu local selector |
| Logs | Co | Chua | AuditLogsPage doc local logs |
| Snapshot | Co | Co | Import/export/reset dung API, backend import can atomic |

## 7. Thu tu uu tien sua

1. Sua loi build frontend `BookOpenText`.
2. Sua backend enrollment: chan cross-semester, sync count khi update/delete/cancel section.
3. Enforce maintenance mode o backend.
4. Dong bo frontend source of truth: bo fallback im lang sang mock/localStorage trong mode backend.
5. Chuyen Profile, Logs, Schedules, Reports screen sang API backend that.
6. Dong bo rule eligibility frontend/backend hoac chi dung ket qua backend.
7. Validate settings va course conditions bang transaction.
8. Sua logic session/change-password de logout/dieu huong dung.
