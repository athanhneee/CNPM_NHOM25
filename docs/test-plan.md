# Ke hoach kiem thu va checklist demo

Tai lieu nay dung cho bao cao cuoi mon va rehearsal truoc khi nop bai. Bo tai khoan demo chuan lay tu backend seed, mat khau chung: `ptithcm2026`.

## Tai khoan demo chuan

| Vai tro | Username | Email | Muc dich |
| --- | --- | --- | --- |
| ADMIN | `admin` | `admin@ptithcm.edu.vn` | Quan ly tai khoan, phan quyen, settings, snapshot, audit log |
| ACADEMIC_OFFICE | `academic.office` | `academic.office@ptithcm.edu.vn` | Quan ly mon hoc/lop hoc phan, si so, waitlist, override, bao cao |
| LECTURER | `minh.tuan` | `minh.tuan@ptithcm.edu.vn` | Xem lop phu trach, danh sach sinh vien, thoi khoa bieu |
| STUDENT | `N23DCCN001` | `n23dccn001@student.ptithcm.edu.vn` | Dang ky thanh cong, lich hoc, lich su, nguyen vong |
| STUDENT | `N23DCCN002` | `n23dccn002@student.ptithcm.edu.vn` | Waitlist, huy/rut, truong hop khong dat tien quyet |

## Lenh kiem tra tu dong

Backend:

```bash
cd backend
npm run lint
npm run test:rules
npm exec tsc -- -p tsconfig.build.json --noEmit
```

Frontend:

```bash
cd frontend
npm run lint
npm run test
npm exec tsc -- -b --noEmit
```

Neu can kiem tra build that truoc khi nop, chay `npm run build` o tung thu muc va ghi lai neu lenh tao/cap nhat `dist`.

## Test case chinh

| Ma | Vai tro | Man hinh/API | Buoc thuc hien | Ket qua mong doi |
| --- | --- | --- | --- | --- |
| AUTH-01 | Public | `/login`, `POST /auth/login` | Dang nhap `N23DCCN001` / `ptithcm2026` | Tra ve access token, refresh token, user da sanitize |
| AUTH-02 | Admin | `/admin/users`, JWT guard | Khoa tai khoan dang co token, dung token cu goi API protected | API tra ve 401, user bi khoa khong tiep tuc thao tac duoc |
| AUTH-03 | User | `/change-password` | Doi mat khau voi current password sai | Hien thong bao loi, khong doi mat khau |
| STUD-01 | Student | `/student/open-sections` | Tim lop con cho va bam dang ky nhanh | Tao enrollment `REGISTERED`, tang si so |
| STUD-02 | Student | `/student/register` | Kiem tra dieu kien lop full co allow waitlist | Backend tra ve `WAITLISTED`, frontend hien rule/result tu API |
| STUD-03 | Student | `/student/register` | Dang ky mon thieu tien quyet bang `N23DCCN002` | Tu choi voi ma loi tien quyet, ghi audit failure |
| STUD-04 | Student | `/student/cancel` | Huy enrollment trong adjustment window | Status thanh `CANCELLED`, giam si so/waitlist |
| STUD-05 | Student | `/student/withdraw` | Rut enrollment trong withdrawal window | Status thanh `DROPPED`, co ly do |
| STUD-06 | Student | `/student/wish` | Gui va huy nguyen vong PENDING | Tao wish PENDING, sau do CANCELLED |
| LEC-01 | Lecturer | `/lecturer/sections` | Dang nhap `minh.tuan` | Chi thay lop cua giang vien hien tai |
| LEC-02 | Lecturer | `/lecturer/sections/:id/students` | Mo lop duoc phan cong | Hien danh sach sinh vien da sanitize |
| LEC-03 | Lecturer | API sections students | Giang vien goi lop khong thuoc minh | API tra ve 403 |
| ACAD-01 | Academic | `/academic/courses` | Tao/sua/xoa mem hoc phan | API chap nhan role `ACADEMIC_OFFICE`, ghi audit log |
| ACAD-02 | Academic | `/academic/sections/create` | Tao lop trung phong/gio hoac trung giang vien/gio | API tu choi voi loi trung lich |
| ACAD-03 | Academic | `/academic/waitlist-override` | Process waitlist lop con cho | Promote sinh vien du dieu kien |
| ACAD-04 | Academic | `/academic/waitlist-override` | Override voi ly do hop le | Tao/cap nhat enrollment `REGISTERED`, ghi audit |
| ADMIN-01 | Admin | `/admin/users` | Tao sinh vien thu cong/import danh sach | Tao account username = MSSV, email PTIT, mat khau mac dinh |
| ADMIN-02 | Admin | `/admin/roles` | Doi role user | Role moi duoc cap nhat, route guard phan quyen lai |
| ADMIN-03 | Admin | `/admin/settings` | Doi maxCredits/simulationNow | Rule dang ky doc gia tri moi |
| ADMIN-04 | Admin | `/admin/settings`, `/snapshot/reset` | Bam reset demo data | Backend seed lai du lieu demo, frontend khong bi rong state |
| LOG-01 | Admin/Academic | `/admin/audit-logs`, `/logs` | Loc theo action/result | Tra ve log dung filter va phan trang neu co |

## Checklist truoc khi demo

- Chay `git status --short`, dam bao khong commit nham `.env`, `node_modules`, `dist` neu khong can.
- Tao/cap nhat `backend/.env` tu `backend/.env.example`.
- Neu dung database moi: chay `npm run prisma:generate`, `npm run prisma:migrate:dev`, `npm run prisma:seed` sau khi da xac nhan duoc phep reset DB.
- Chay backend o `http://localhost:3000/api` va mo Swagger UI.
- Chay frontend o `http://127.0.0.1:5173`.
- Dang nhap thu 4 vai tro bang bo tai khoan demo chuan.
- Dien tap cac luong: student register/waitlist, lecturer view students, academic process waitlist/override, admin lock/reset/settings/audit.
- Chup man hinh cac man hinh chinh de dua vao bao cao.

