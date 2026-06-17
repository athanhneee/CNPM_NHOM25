# Kịch bản demo

## Chuẩn bị

1. Chạy backend:
   ```bash
   cd backend
   npm run start:dev
   ```
2. Nếu dùng database mới hoặc đã được xác nhận có thể làm mới dữ liệu demo, chạy thêm:
   ```bash
   cd backend
   npm run prisma:migrate:dev
   npm run prisma:seed
   ```
   Với DB demo đang dùng để báo cáo, đọc `docs/db-demo-freeze-checklist.md` trước; không chạy seed/reset/import snapshot khi chưa export snapshot hoặc chưa có xác nhận.
3. Chạy frontend:
   ```bash
   cd frontend
   npm run dev
   ```
4. Mở `http://127.0.0.1:5173`.

## Demo sinh viên

Tài khoản: `N23DCCN001` / `ptithcm2026`.

1. Đăng nhập và xem dashboard.
2. Mở `Học phần mở`, xem chi tiết lớp.
3. Mở `Đăng ký học phần`, đăng ký một lớp còn chỗ.
4. Thử đăng ký lớp full để minh họa waitlist.
5. Mở `Kết quả đăng ký` và `Lịch sử đăng ký`.
6. Mở `Nguyện vọng`, gửi một yêu cầu mới và hủy khi còn PENDING.

## Demo giảng viên

Tài khoản: `minh.tuan` / `ptithcm2026`.

1. Xem danh sách lớp được phân công.
2. Mở danh sách sinh viên của một lớp.
3. Xem TKB dạng tuần theo khung tiết trong học kỳ và TKB học kỳ.

## Demo phòng đào tạo

Tài khoản: `academic.office` / `ptithcm2026`.

1. Xem danh mục môn học.
2. Tạo lớp học phần mới.
3. Phân công giảng viên.
4. Cập nhật phòng/lịch học.
5. Xử lý waitlist hoặc override có lý do.
6. Xem báo cáo lấp đầy: tổng lớp, tổng sức chứa, đã đăng ký, waitlist.
7. Duyệt/từ chối nguyện vọng và nhập phản hồi khi từ chối.

## Demo quản trị

Tài khoản: `admin` / `ptithcm2026`.

1. Xem danh sách tài khoản.
2. Khóa/mở khóa tài khoản.
3. Import sinh viên hoặc tạo sinh viên thủ công.
4. Cập nhật tham số hệ thống, gồm `simulationNow` và timeout phiên.
5. Export snapshot và xem audit log.
6. Khi cần reset/import snapshot, đọc hộp cảnh báo và xác nhận rằng thao tác có thể thay thế dữ liệu demo hiện tại.

## Màn hình nên chụp cho báo cáo

- Login và dashboard theo từng vai trò.
- Bảng học phần mở và bảng kiểm điều kiện đăng ký.
- Kết quả đăng ký/waitlist.
- Màn hình tạo lớp/phòng đào tạo.
- Báo cáo sĩ số/lấp đầy.
- Duyệt nguyện vọng có lý do phản hồi.
- Quản lý tài khoản, settings, snapshot và audit log.
