# Bao cao ra soat loi logic backend/frontend

Ngay lap bao cao: 17/06/2026  
Pham vi: toan bo cay source/config chinh cua `backend`, `frontend`, `docker-compose.yml`, README/API contract va seed/schema. Khong sua code chuc nang, chi tao file bao cao nay theo yeu cau.

## 1. Ket luan nhanh ve ket noi frontend/backend

- Frontend da co ket noi backend that: `frontend/src/lib/api-client.ts:4`, `frontend/src/lib/api-client.ts:33-34`, `frontend/src/lib/api-client.ts:113-147` tao base URL mac dinh `http://localhost:3000/api` hoac lay `VITE_API_BASE_URL`; cac service nhu `enrollment.api.ts`, `section.api.ts`, `settings.api.ts`, `schedule.api.ts`, `wish.api.ts`, `admin.api.ts` deu goi `apiRequest`.
- Cac mock service trong `frontend/src/mocks/services` khong thay duoc import vao runtime man hinh chinh. Mock/seed van con duoc dung lam state ban dau, fallback hien thi, demo account va mot so du lieu phu.
- Chua dong bo hoan toan: mot so man hinh van tinh rule local truoc/ngoai API, danh sach hoc ky van lay seed, lich fallback tinh ca `WAITLISTED`, room options hard-code khong khop backend.
- Rủi ro ket noi local: frontend dev chay `vite --host 127.0.0.1` o `frontend/package.json:7`, nhung backend neu khong set env thi CORS default chi cho `http://localhost:5173` o `backend/src/main.ts:21-25`. README/API contract co huong dan set `CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"`, neu `.env` thieu thi browser se bi CORS.
- Docker frontend build Vite trong image (`frontend/Dockerfile:12-21`). Bien `VITE_API_BASE_URL` la build-time, doi `.env` sau khi build image se khong doi URL API neu khong rebuild.

## 2. Loi backend

### [Cao] Admin/PDT cap nhat enrollment bo qua toan bo rule dang ky

- Vi tri: `backend/src/enrollments/enrollments.controller.ts:142-151`, `backend/src/enrollments/enrollments.service.ts:432-451`, DTO tai `backend/src/enrollments/dto/update-enrollment.dto.ts:5-14`.
- Hien trang: endpoint `PATCH /enrollments/:id` cho ADMIN/ACADEMIC_OFFICE doi `status` truc tiep, sau do chi goi `syncSectionCounters`.
- Loi logic:
  - Khong kiem tra suc chua lop khi doi `WAITLISTED/PENDING/CANCELLED` sang `REGISTERED`, co the lam `registeredCount > capacity`.
  - Khong kiem tra trung lop/trung hoc phan/trung lich/gioi han tin chi/hoc ky hien tai.
  - Khong clear `waitlistOrder` khi chuyen waitlist sang registered.
  - Khong them timeline moi cho thay doi status, chi ghi audit log.
- Anh huong: du lieu dang ky co the sai nghiep vu va counter section van co ve "dung" nhung du lieu goc da vi pham rule.

### [Cao] Rule dang ky khong xet `weeks` khi kiem tra trung lich

- Vi tri: rule section trong `backend/src/enrollments/enrollment-rules.ts:72-83` khong co `weeks`; mapping `asRuleSection` o `backend/src/enrollments/enrollments.service.ts:85-98` cung khong dua `weeks`; ham conflict tai `backend/src/enrollments/enrollment-rules.ts:246-255` chi so sanh thu/tiet.
- Trong khi do tao/sua section co xu ly overlap tuan: `backend/src/sections/sections.service.ts:50-59`, `backend/src/sections/sections.service.ts:171-186`.
- Loi logic: hai lop cung thu/tiet nhung khac dai tuan hoc van bi coi la trung khi sinh vien dang ky. Day la false reject.
- Anh huong: backend co the tu choi dang ky hop le neu cac lop hoc xen ke theo tuan.

### [Trung binh] Mon song hanh co the duoc thoa man bang lop dang WAITLISTED

- Vi tri: `ACTIVE_ENROLLMENT_STATUSES` gom `REGISTERED` va `WAITLISTED` tai `backend/src/enrollments/enrollment-rules.ts:176`; `currentSections` lay tu tap nay tai `backend/src/enrollments/enrollment-rules.ts:271-274`; check corequisite tai `backend/src/enrollments/enrollment-rules.ts:403-410`.
- Loi logic: sinh vien chi o danh sach cho mon song hanh van duoc tinh nhu dang hoc cung ky.
- Anh huong: co the cho dang ky mon can song hanh khi mon song hanh chua duoc dang ky thanh cong.

### [Trung binh] Huy/rut enrollment khong tu dong day waitlist

- Vi tri huy: `backend/src/enrollments/enrollments.service.ts:503-521`; rut: `backend/src/enrollments/enrollments.service.ts:568-577`; xu ly waitlist rieng: `backend/src/enrollments/enrollments.service.ts:587-660`.
- Hien trang: khi mot sinh vien huy/rut, backend giam counter va mo ghe, nhung khong goi `processWaitlist`.
- Anh huong: co ghe trong nhung sinh vien dau danh sach cho van bi de `WAITLISTED` cho den khi admin/PDT bam xu ly thu cong.

### [Trung binh] Override khong promote duoc ban ghi waitlist hien co

- Vi tri: `backend/src/enrollments/enrollments.service.ts:693-704`.
- Hien trang: override reject neu sinh vien da co enrollment active trong cung section, trong do co `WAITLISTED`.
- Loi logic/UX: chuc nang override thuong duoc ky vong can thiep de cho phep sinh vien dang waitlist vao lop, nhung backend lai bao "da co ban ghi dang ky cho lop nay".
- Anh huong: PDT phai dung `processWaitlist` hoac sua du lieu theo cach khac, khong dung duoc override cho case waitlist hien huu.

### [Trung binh] Validate moc thoi gian rut hoc phan chua dung voi rule rut

- Vi tri validate settings: `backend/src/settings/settings.service.ts:31-41`; rule rut: `backend/src/enrollments/enrollment-rules.ts:517-521`.
- Hien trang: service chi cam `withdrawalDeadline < adjustmentStart`. Rule rut lai yeu cau `now > adjustmentEnd && now <= withdrawalDeadline`.
- Loi logic: he thong van cho cau hinh `withdrawalDeadline` nam giua `adjustmentStart` va `adjustmentEnd`, dan den khong co khoang rut hop le.
- Nen validate `withdrawalDeadline >= adjustmentEnd` theo dung rule.

### [Trung binh] Validate settings con thieu rang buoc so hoc

- Vi tri DTO: `backend/src/settings/dto/update-system-settings.dto.ts:35-73`; service: `backend/src/settings/settings.service.ts:44-61`.
- Da check `minCredits <= maxCredits`, `maxCredits > 0`, timeout > 0, warning > 0.
- Con thieu:
  - `minCredits >= 0` hoac `> 0` tuy nghiep vu.
  - `maxClassesPerDay > 0`.
  - `maxClassesPerSemester > 0`.
  - `warningBeforeLogoutSeconds < sessionTimeoutMinutes * 60`.
- Anh huong: rule dang ky co the bi vo nghia, vi du max class/day bang 0 lam moi dang ky fail.

### [Trung binh] Wish request co the bi trung lap va review note khong luu duoc

- Vi tri tao wish: `backend/src/wishes/wishes.service.ts:127-140`; update status: `backend/src/wishes/wishes.service.ts:171-200`; schema: `backend/prisma/schema.prisma:322-336`.
- Loi logic:
  - Khong chan sinh vien tao nhieu wish `PENDING` cho cung `studentId + semesterId + courseCode + preferredGroup`.
  - `reviewNote` chi dua vao audit metadata (`backend/src/wishes/wishes.service.ts:190-198`), model `WishRequest` khong co field `reviewNote/reviewedBy/reviewedAt`, nen frontend khong the hien thi lai ly do duyet/tu choi tu ban ghi wish.
  - Backend cho cap nhat status sang `CANCELLED`, `APPROVED`, `REJECTED`, `REVIEWED` ma khong rang buoc transition hien tai. Co the approve/reject lai wish da xu ly.

### [Trung binh] Build actor chi lay role dau tien, lech voi guard

- Vi tri: `backend/src/common/utils/audit.ts:10-14`; guard role dung toan bo roles tai `backend/src/common/guards/roles.guard.ts:24`; service enrollment authorize theo `actorRole` tai `backend/src/enrollments/enrollments.service.ts:212-221`.
- Loi logic: tai khoan nhieu role co the duoc `RolesGuard` cho qua, nhung `buildActor` lay role dau tien. Neu roles la `['STUDENT','ADMIN']`, route admin co the pass nhung service lai xu ly nhu STUDENT va reject hoac audit sai role.

### [Thap/Trung binh] Danh sach sinh vien cua section tra ve tat ca status

- Vi tri: `backend/src/sections/sections.service.ts:233-242`.
- Hien trang: endpoint `/sections/:id/students` tra ve tat ca enrollment cua section, gom `CANCELLED`, `DROPPED`, `REJECTED`, `WAITLISTED`.
- Anh huong: man hinh giang vien/PDT co the hien thi sinh vien da huy/rut nhu thanh vien lop neu UI khong loc ro.

### [Thap] Ràng buộc database chua chan duplicate active enrollment

- Vi tri schema enrollment: `backend/prisma/schema.prisma:271-291`.
- Hien trang: khong co unique/index co dieu kien de chan active duplicate theo `studentId + sectionId + semesterId` hoac `studentId + courseCode + semesterId`.
- Service co check duplicate khi dang ky (`backend/src/enrollments/enrollments.service.ts:331-375`), nhung import snapshot, update admin, thao tac DB truc tiep co the tao du lieu vi pham.

### [Thap] Danh muc error code seed thieu code backend dang emit

- Backend rule co `REG_ERR_SECTION_NOT_IN_CURRENT_SEMESTER`: `backend/src/enrollments/enrollment-rules.ts:31`, `backend/src/enrollments/enrollment-rules.ts:345-350`.
- Seed error code tai `backend/prisma/seed.ts:259-283` khong co code nay.
- Anh huong: bang `RegistrationErrorCode` khong day du neu UI/report tra cuu tu DB.

### [Thap] Seed backend co du lieu lich su/de-mo hoi gay nhiem

- Vi tri: `backend/prisma/seed.ts:464-478` va `backend/prisma/seed.ts:531-540`.
- Hien trang: cung sinh vien `N23DCCN001`, cung section `sec-cse201-1`, cung ky hien tai co mot enrollment `REGISTERED` va mot enrollment `DROPPED`.
- Anh huong: khong phai active duplicate, nhung de-mo/bao cao lich su co the gay nham rang sinh vien vua dang hoc vua da rut cung lop.

## 3. Loi frontend

### [Cao] Rule eligibility local khong khop backend

- Vi tri frontend: `frontend/src/lib/business-rules.ts:89-250`.
- Backend rule day du hon: `backend/src/enrollments/enrollment-rules.ts:258-511`.
- Cac diem lech:
  - Frontend khong co check `current-semester`; backend co `current-semester` tai `backend/src/enrollments/enrollment-rules.ts:344-350`.
  - Frontend chi check trung cung section (`frontend/src/lib/business-rules.ts:157-171`), thieu check trung hoc phan khac section; backend co `duplicate-course` tai `backend/src/enrollments/enrollment-rules.ts:303-312`, `backend/src/enrollments/enrollment-rules.ts:379-386`.
  - Frontend khong dung `CourseCondition`/`StudentResult`, chi dua vao array trong course va enrollment local; backend co mapping `courseConditions`, `studentResults` tai `backend/src/enrollments/enrollments.service.ts:191-207`.
  - Frontend va backend rule dang ky deu chua xet `weeks` trong conflict dang ky, nhung backend tao/sua section lai co xet `weeks`.
- Anh huong: UI co the bao du dieu kien/khong du dieu kien khac voi ket qua backend.

### [Cao] Man chi tiet hoc phan hien rule local, khong goi API eligibility

- Vi tri: `frontend/src/features/student/student-pages.tsx:271-300`.
- Hien trang: `CourseDetailPage` tinh `eligibility` bang `evaluateEnrollmentEligibility` local va hien `RuleCheckPanel`.
- Nut "Dang ky" van goi backend (`frontend/src/features/student/student-pages.tsx:310-318`), nen ket qua dang ky that co the nguoc voi bang rule dang hien.
- Anh huong: sinh vien co the thay UI bao hop le, bam dang ky thi backend reject.

### [Trung binh] RegisterPage hien ket qua local truoc khi API tra ve

- Vi tri: `frontend/src/features/student/student-pages.tsx:403-426`.
- Hien trang: `handleCheck` set `checkResult` bang rule local truoc, sau do moi goi `enrollmentService.checkEligibility`.
- Anh huong: neu request cham/loi, nguoi dung thay thong tin rule tam thoi khong khop backend. Neu API loi thi service tra checks rong (`frontend/src/services/enrollment.api.ts:291-309`), UI mat chi tiet rule.

### [Trung binh] Lich fallback cua sinh vien tinh ca WAITLISTED

- Vi tri frontend selector: `frontend/src/lib/selectors.ts:66`, `frontend/src/lib/selectors.ts:172-198`.
- Backend schedule chi lay `REGISTERED`: `backend/src/schedules/schedules.service.ts:46-55`.
- Man lich fallback khi API fail: `frontend/src/features/student/student-pages.tsx:725-763`, `frontend/src/features/student/student-pages.tsx:784-815`.
- Anh huong: neu API schedule loi/chua co, lop waitlist co the hien tren thoi khoa bieu nhu lop da hoc.

### [Trung binh] Frontend khong load danh sach hoc ky tu backend

- Backend co endpoint: `backend/src/settings/settings.controller.ts:35-45`.
- Frontend store de `semesters: seedSemesters` tai `frontend/src/app/store/data.store.ts:304`; `settingsService` chi load `/settings` tai `frontend/src/services/settings.api.ts:38-54`.
- Cac noi dung dung `snapshot.semesters` nhu `TopHeader` va lich su co the stale neu backend doi hoc ky.

### [Trung binh] Form tao section co gia tri ban dau lay tu snapshot rong

- Vi tri: `frontend/src/features/academic/academic-pages.tsx:411-426`.
- Hien trang: `courseCode` va `lecturerId` lay tu `snapshot.courses[0]`/`snapshot.users` luc mount. O non-demo, snapshot ban dau rong (`frontend/src/app/store/data.store.ts:166-178`), API load sau khong tu cap nhat state form.
- Anh huong: user co the submit `courseCode`/`lecturerId` rong neu khong chon lai, backend se reject.

### [Trung binh] Room options frontend hard-code khong khop Room seed backend

- Frontend hard-code: `frontend/src/features/academic/academic-pages.tsx:35`, build options tai `frontend/src/features/academic/academic-pages.tsx:907-910`.
- Backend seed room: `backend/prisma/seed.ts:233-236` gom `A1-101`, `A1-201`, `A1-202`, `A1-301`.
- Frontend lai goi y `A2-301`, `B1-201`, `LAB-01` khong ton tai trong backend; man doi phong mac dinh `A2-301` tai `frontend/src/features/academic/academic-pages.tsx:700-706`.
- Anh huong: PDT de chon phong UI goi y nhung backend reject "phong hoc khong ton tai".

### [Trung binh] Input so khong validate finite/range truoc khi gui API

- Vi tri section: `frontend/src/features/academic/academic-pages.tsx:468-472`, `frontend/src/features/academic/academic-pages.tsx:663`, `frontend/src/features/academic/academic-pages.tsx:762-767`.
- Vi tri admin settings: `frontend/src/features/admin/admin-pages.tsx:812-843`.
- Hien trang: dung `Number(value)` truc tiep. Gia tri rong co the thanh `0`, gia tri chu thanh `NaN` va khi JSON stringify se thanh `null`.
- Anh huong: user nhap sai se gap loi backend kho hieu, hoac gui gia tri 0 khong hop nghiep vu neu backend chua chan het.

### [Trung binh] Admin settings dung currentSemesterId free text

- Vi tri: `frontend/src/features/admin/admin-pages.tsx:780`, submit tai `frontend/src/features/admin/admin-pages.tsx:828-843`.
- Backend co endpoint semesters nhung frontend khong load dropdown. User phai go dung ID hoc ky.
- Anh huong: de nhap sai ID, backend reject; UX khong huong dan tu danh sach that.

### [Trung binh] Button bi disable toan cuc khi bat ky API context bi loi

- Vi tri: `frontend/src/components/ui/Button.tsx:37-42`.
- Hien trang: `isApiError = apiStatus === 'error'` lam tat ca write button bi disable trong non-demo.
- Anh huong: mot request load du lieu cua mot module loi co the vo hieu hoa nut ghi o man khac, du endpoint mutation van co the hoat dong.

### [Trung binh] Giang vien bi chan boi state local truoc khi tin backend

- Vi tri: load section giang vien `frontend/src/features/lecturer/lecturer-pages.tsx:25-54`; trang danh sach sinh vien `frontend/src/features/lecturer/lecturer-pages.tsx:110-138`.
- Hien trang: trang check `ownedSection` tu `snapshot.sections`. Neu list API chua load/loi, UI tra `ErrorState` khong cho xem, du backend co the authorize dung.
- Ngoai ra API `/sections/:id/students` fail thi catch thanh rows rong (`frontend/src/features/lecturer/lecturer-pages.tsx:121-124`), khong bao loi ro.

### [Trung binh] Bao cao fallback tinh utilization khac backend

- Backend tinh average utilization theo tong registered/tong capacity: `backend/src/reports/reports.service.ts:46-60`.
- Frontend fallback tinh trung binh cong cua tung section: `frontend/src/features/academic/academic-pages.tsx:816-823`.
- Anh huong: khi backend report fail, so lieu fallback khac cong thuc backend.

### [Trung binh] WishPage co the submit courseCode rong

- Vi tri: `frontend/src/features/student/student-pages.tsx:926-955`.
- Hien trang: `courseCode` init tu `snapshot.courses[0]?.code ?? ''` mot lan. Neu course load sau, state khong tu set lai. Form chi validate `reason`, khong validate `courseCode`.
- Anh huong: submit wish co courseCode rong, backend reject.

### [Thap/Trung binh] Man duyet wish noi review note duoc luu nhung backend khong luu vao WishRequest

- Vi tri UI: `frontend/src/features/academic/academic-pages.tsx:1144-1150`; backend chi audit metadata: `backend/src/wishes/wishes.service.ts:190-198`; schema khong co field note: `backend/prisma/schema.prisma:322-336`.
- Anh huong: nguoi dung tuong ly do duyet/tu choi se truy van duoc tren wish, nhung sau nay chi con trong audit log.

### [Thap] Login/demo account van lay seed local

- Vi tri: `frontend/src/features/pages.tsx:436-439`, `frontend/src/features/pages.tsx:616-629`.
- Hien trang: demo cards lay `demoAccounts` local. Neu backend seed/import doi account, UI demo cards co the stale.

### [Thap] Nhieu catch im lang lam UI fallback ma khong bao nguon du lieu

- Vi tri: `frontend/src/features/student/student-pages.tsx:739-750`, `frontend/src/features/student/student-pages.tsx:797-809`, `frontend/src/features/lecturer/lecturer-pages.tsx:181-192`, `frontend/src/features/lecturer/lecturer-pages.tsx:230-241`, `frontend/src/features/academic/academic-pages.tsx:960-963`, `frontend/src/features/admin/admin-pages.tsx:47-49`.
- Anh huong: khi backend loi, UI co the hien local/empty state khong ro la backend dang loi.

## 4. Cac diem lech frontend/backend can uu tien dong bo

1. Dong bo mot nguon rule eligibility: frontend nen hien ket qua tu `/enrollments/eligibility`, local rule chi nen la skeleton/loading hoac fallback co gan nhan ro.
2. Them `weeks` vao `RuleSection` backend enrollment rule va frontend local rule neu van giu local rule.
3. Dong bo status schedule: fallback frontend khong nen dua `WAITLISTED` vao thoi khoa bieu chinh, hoac phai gan nhan danh sach cho.
4. Load semesters tu `/settings/semesters` thay vi dung `seedSemesters`.
5. Dong bo room options voi API/backend Room table, khong hard-code phong khong ton tai.
6. Quyet dinh ro nghiep vu waitlist: huy/rut co auto promote hay bat buoc admin bam. Hien tai backend manual, UI can noi ro.
7. Sua `PATCH /enrollments/:id` thanh cac action co rule rieng hoac bat buoc validate lai eligibility/capacity/duplicate/timeline.

## 5. Khong chay test/build

Theo yeu cau "chi doc va phan tich loi, khong sua bat ky cho nao", toi khong chay `npm install`, `npm test`, `npm run build` hay migration de tranh phat sinh artifact/thay doi moi truong. Bao cao dua tren doc source/config/seed/schema va doi chieu logic.
