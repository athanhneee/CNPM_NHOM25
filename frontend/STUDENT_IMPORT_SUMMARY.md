# STUDENT_IMPORT_SUMMARY

## Tổng quan
- Tổng số sinh viên import: 131
- Trùng mã: không có
- Lỗi parse: không ghi nhận

## Quy tắc parse
- Nguồn import chuẩn theo định dạng `MSSV<TAB>Họ đệm<TAB>Tên`.
- Dữ liệu được giữ nguyên tiếng Việt có dấu.
- `fullName` được ghép từ `middleName + givenName`.

## Quy tắc xử lý prefix ngành
- `DCCN` => `7480201` => `Công nghệ thông tin`
- `DCAT` => `7480202` => `An toàn thông tin`
- Prefix không chắc chắn => `UNREVIEWED` / `Chưa phân loại` / `classificationStatus = REVIEW`

## Kết quả mapping
- CNTT: 73 sinh viên
- ATTT: 57 sinh viên
- Cần rà soát: 1 sinh viên

## Trường hợp cần rà soát
- `N22DCPT006`
  - Không tự gán sai ngành
  - Vẫn tạo tài khoản, hồ sơ và hiển thị đẹp trên UI
  - Được đưa vào nhóm `Chưa phân loại`

## Chuẩn hóa hồ sơ sinh viên
- Username: dùng chính MSSV
- Email: `mssv@student.ptithcm.edu.vn`
- Mật khẩu mock: `ptithcm2026`
- Trạng thái mặc định: `Đang học`
- Lớp hành chính:
  - CNTT: `D23CNTT1`, `D22CNTT1`...
  - ATTT: `D23ATTT1`, `D22ATTT1`...
  - Chưa phân loại: `D22RS1`

## Ghi chú
- Có 1 tài khoản được seed sẵn ở trạng thái khóa để phục vụ kịch bản auth/demo: `N23DCCN020`.
- Dữ liệu sinh viên mới đã được nối vào luồng auth mock, dropdown, danh sách, chi tiết và thống kê dựa trên `seedUsers`.
