# Kich ban demo

## Chuan bi

1. Chay backend:
   ```bash
   cd backend
   npm run prisma:migrate:dev
   npm run prisma:seed
   npm run start:dev
   ```
2. Chay frontend:
   ```bash
   cd frontend
   npm run dev
   ```
3. Mo `http://127.0.0.1:5173`.

## Demo sinh vien

Tai khoan: `N23DCCN001` / `ptithcm2026`.

1. Dang nhap va xem dashboard.
2. Mo `Hoc phan mo`, xem chi tiet lop.
3. Mo `Dang ky hoc phan`, dang ky mot lop con cho.
4. Thu dang ky lop full de minh hoa waitlist.
5. Mo `Ket qua dang ky` va `Lich su dang ky`.
6. Mo `Nguyen vong`, gui mot yeu cau moi va huy khi con PENDING.

## Demo giang vien

Tai khoan: `minh.tuan` / `ptithcm2026`.

1. Xem danh sach lop duoc phan cong.
2. Mo danh sach sinh vien cua mot lop.
3. Xem TKB tuan va TKB hoc ky.

## Demo phong dao tao

Tai khoan: `academic.office` / `ptithcm2026`.

1. Xem danh muc mon hoc.
2. Tao lop hoc phan moi.
3. Phan cong giang vien.
4. Cap nhat phong/lich hoc.
5. Xu ly waitlist hoac override co ly do.
6. Xem bao cao lap day.

## Demo quan tri

Tai khoan: `admin` / `ptithcm2026`.

1. Xem danh sach tai khoan.
2. Khoa/mo khoa tai khoan.
3. Import sinh vien hoac tao sinh vien thu cong.
4. Cap nhat tham so he thong.
5. Export snapshot va xem audit log.

## Man hinh nen chup cho bao cao

- Login va dashboard theo tung vai tro.
- Bang hoc phan mo va bang kiem dieu kien dang ky.
- Ket qua dang ky/waitlist.
- Man hinh tao lop/phong dao tao.
- Bao cao si so.
- Quan ly tai khoan va audit log.
