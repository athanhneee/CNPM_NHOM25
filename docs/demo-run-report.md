# Demo run report

Ngay chay: 2026-05-14  
Moi truong: local backend/frontend, database demo theo `backend/.env`; Playwright webServer reuse/start backend va frontend cho e2e, khong seed/reset/migrate DB.

## Scope demo

Demo tap trung dung 4 vai tro trong scope dang ky hoc phan PTIT HCM:

- Student: xem hoc phan mo, eligibility, ket qua dang ky, lich hoc, nguyen vong.
- Lecturer: lop duoc phan cong, danh sach sinh vien, lich day.
- Academic Office: catalog/lop hoc phan, phong/lich, waitlist/override, bao cao, duyet nguyen vong.
- Admin: users/roles/settings, snapshot, audit logs, duyet nguyen vong.

Khong mo module lon ngoai scope dang ky hoc phan.

## Ket qua command

| Hang muc | Lenh | Ket qua |
| --- | --- | --- |
| Backend lint | `cd backend && npm run lint` | Pass |
| Backend rules smoke | `cd backend && npm run test:rules` | Pass |
| Backend build | `cd backend && npm run build` | Pass |
| Frontend lint | `cd frontend && npm run lint` | Pass |
| Frontend tests | `cd frontend && npm run test` | Pass, 7/7 test |
| Frontend build | `cd frontend && npm run build` | Pass |
| Frontend e2e | `cd frontend && npm run test:e2e` | Pass, 3/3 Chromium tests |
| Integration | `cd backend && npm run test:integration` | Skipped |

Ly do skipped integration: khong co `TEST_DATABASE_URL` trong process hoac `backend/.env`; khong chay integration tren database demo that vi script co the reset/seed DB test.

Ghi chu e2e: `frontend/e2e/student-login.spec.ts` login sinh vien `N23DCCN001` va mo ket qua dang ky, login giang vien `minh.tuan` va mo lop duoc phan cong, login admin va mo users/settings. `frontend/playwright.config.ts` hien reuse/start ca backend va frontend; lan chay moi nhat pass 3/3 Chromium tests, khong seed/reset/migrate DB.

## API smoke tham chieu

Bang duoi la evidence da xac nhan ngay 2026-05-13. Trong luot 2026-05-14 khong chay lai toan bo API smoke; chi xac nhan e2e login sinh vien qua UI.

| Flow | Evidence | Ket qua |
| --- | --- | --- |
| Login 4 vai tro | `POST /api/auth/login` | Pass: `AD001`, `AO001`, `LEC001`, `N23DCCN001`. |
| Student sections | `GET /api/sections?semesterId=sem-2026-1` | Pass, 3 section. |
| Student eligibility | `POST /api/enrollments/eligibility` | Pass, rule duplicate course tra `REG_ERR_ALREADY_REGISTERED_COURSE`. |
| Student enrollments/schedule/wishes | `/enrollments`, `/schedules/students/...`, `/wishes` | Pass: 3 enrollments, 2 lich, 1 wish. |
| Lecturer sections/students/schedule | `/sections?lecturerId=...`, `/sections/:id/students`, `/schedules/lecturers/...` | Pass. |
| Academic catalog/waitlist/reports | `/courses`, `/enrollments?...WAITLISTED`, `/reports/...` | Pass. |
| Academic semester schedule | `/schedules/semester/sem-2026-1` | Pass, 3 section. |
| Admin users/logs | `/users?limit=5`, `/logs?limit=5` | Pass. |

## Snapshot DB demo

Snapshot evidence hien co tu ngay 2026-05-13:

- Endpoint: `GET /api/snapshot/export`
- File evidence: `docs/demo-snapshot-2026-05-13.json`
- Ket qua: 12 nhom du lieu, gom 6 users, 3 courses, 4 sections, 7 enrollments.
- Ghi chu so sanh: snapshot co waitlist `CSE101-2` va prerequisite fail `CSE201-1`, nhung chua co seed moi `CSE150/CSE150-1`.

Trong luot 2026-05-14 khong chay `/snapshot/reset`, `/snapshot/import`, `npm run prisma:seed`, migration reset, hay export snapshot moi.
Checklist chot DB demo: `docs/db-demo-freeze-checklist.md`.

## Thay doi trong luot 2026-05-14

| Hang muc | Ket qua | Verify |
| --- | --- | --- |
| Sua `frontend/package.json` | File JSON hop le, gop `test:e2e`, `test:e2e:ui`, `test:e2e:headed` vao object `scripts` chinh. | `npm pkg get scripts`, frontend lint/test/build. |
| Mo rong e2e read-only | Giu login student va them 3 flow doc du lieu: student ket qua dang ky, lecturer lop duoc phan cong, admin users/settings. | `npm run test:e2e` pass 3/3. |
| Dong bo counter enrollment | `PATCH/DELETE /enrollments/:id` recompute lai `registeredCount` va `waitlistCount` tu enrollment thuc te trong transaction. | Backend lint, `npm run test:rules`, backend build. |
| Review note nguyen vong | Da ra soat: DTO/frontend da gui `reviewNote`, backend hien ghi vao audit metadata nhung schema `WishRequest` chua co cot. Chua them migration sat demo de tranh rui ro DB. | Ghi de xuat tiep tuc sau demo. |
| Dong bo doi mat khau | Frontend validation, hint va message doi mat khau yeu cau toi thieu 8 ky tu, khop backend DTO `@MinLength(8)`. | Frontend lint/build. |
| Playwright webServer | Config e2e reuse/start backend `../backend` va frontend, khong seed/reset DB. | `npm run test:e2e` pass 3/3. |
| TKB tuan | UI/docs ghi ro lich dang tuan theo thu/tiet va dai tuan hoc trong hoc ky, chua phai filter mot tuan lich cu the. | Frontend lint/build. |
| Seed demo | Bo sung seed source `CSE150` va section `CSE150-1` de co lop mo cho demo dang ky thanh cong; waitlist/thieu tien quyet da co san. | Backend lint/build; khong chay seed tren DB that. |
| Chot DB demo | Tao checklist so sanh seed source voi snapshot 2026-05-13 va khuyen nghi truoc demo. | `docs/db-demo-freeze-checklist.md`. |
| Ra UI text | Khong thay loi encoding trong source frontend/backend/docs khi doc UTF-8; doi text meta tren login thanh noi dung nghiep vu va sua duplicate quick-link key. | Frontend lint/build/e2e. |

## Git / file an toan

- Da chay `git status --short`.
- `git ls-files` khong thay `.env`, `node_modules`, `dist` dang duoc track.
- Chi thay `.env.example` va file DTO `refresh-token.dto.ts` co chu `token` trong ten, khong phai secret.
- `backend/.env`, `backend/dist/`, `backend/node_modules/`, `frontend/dist/`, `frontend/node_modules/` dang ignored.
- Playwright artifacts `frontend/test-results/`, `frontend/playwright-report/`, `frontend/.playwright/` dang ignored.
- Khong dung `git reset --hard`, khong revert thay doi co san.

## Rui ro con lai

- Integration test van chua chay vi thieu DB test rieng.
- Full API smoke 4 vai tro chua chay lai trong ngay 2026-05-14; evidence gan nhat la 2026-05-13, con e2e read-only student/lecturer/admin da pass ngay 2026-05-14.
- Seed source da co them `CSE150`/`CSE150-1` cho demo dang ky thanh cong, nhung snapshot evidence 2026-05-13 chua co cap du lieu nay. Neu DB demo dang dung snapshot nay, can rehearsal va export snapshot moi truoc khi demo dang ky thanh cong live.
- Reviewer note cho duyet nguyen vong chua luu tren `WishRequest`; hien review note chi nam trong audit log metadata. Neu can hien thi lai note sau khi duyet/tu choi, can migration them cot truoc buoi bao cao va apply vao DB demo co kiem chung.
- Seed backend da duoc bo sung nho; chua chay seed lai de tranh reset DB demo.
- Cac file frontend lon `academic-pages.tsx`, `student-pages.tsx`, `admin-pages.tsx`, `pages.tsx` chua refactor sat deadline; day la han che bao tri de dua vao backlog sau bao cao.
