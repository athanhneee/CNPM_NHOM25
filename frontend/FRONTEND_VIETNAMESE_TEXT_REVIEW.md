# FRONTEND_VIETNAMESE_TEXT_REVIEW

## Vấn đề đã xử lý
- Chuyển nhiều label không dấu trong luồng sinh viên sang tiếng Việt chuẩn:
  - `Tim kiem mon hoc / lop HP` -> `Tìm kiếm môn học / lớp HP`
  - `Dang ky ngay` -> `Đăng ký ngay`
  - `Khong co lop phu hop` -> `Không có lớp phù hợp`
  - `Loc theo trang thai` -> `Lọc theo trạng thái`
- Đổi các ví dụ mã môn cũ:
  - `INT1387`
  - `INT2501`
  - `BUS1101`
  sang các ví dụ phù hợp với catalog mới.
- Chuẩn hóa lại subtitle và toast ở các màn:
  - đăng ký học phần
  - hủy đăng ký
  - rút học phần
  - nguyện vọng
  - lịch sử đăng ký

## Thuật ngữ đã thống nhất
- `đăng ký học phần`
- `lớp học phần`
- `mã môn học`
- `mã lớp HP`
- `tín chỉ`
- `học kỳ`
- `ngành áp dụng`
- `khối kiến thức`
- `học kỳ gợi ý`

## Bổ sung cho luồng admin
- Chuẩn hóa câu chữ mới tại `/admin/users`:
  - `Thêm sinh viên`
  - `Nhập danh sách sinh viên từ Excel`
  - `Phân tích nội dung dán`
  - `Xem trước danh sách nhập`
  - `Kết quả lần nhập gần nhất`

## Dọn tiếp các chuỗi còn sót
- Chuẩn hóa thêm các label/tooltip trạng thái dùng chung tại `src/lib/color-maps.ts`:
  - `Chờ xử lý`
  - `Đăng ký thành công`
  - `Danh sách chờ`
  - `Mở đăng ký`
  - `Đóng đăng ký`
  - `Bị khóa`
  - `Tạm ngưng`
- Chuẩn hóa subtitle và header bảng ở `src/features/lecturer/lecturer-pages.tsx` để bỏ hoàn toàn các chuỗi kiểu:
  - `Tong so lop`
  - `Tim theo ma lop / ten mon`
  - `Khong the truy cap lop hoc phan nay`
- Chuẩn hóa message nghiệp vụ ở `src/lib/business-rules.ts` và `src/app/store/data.store.ts` để toast/audit không còn tiếng Việt không dấu.
- Trang hồ sơ `/profile`:
  - giữ nguyên text tiếng Việt có dấu
  - chỉnh lại badge nhận diện để nội dung được căn giữa đúng thị giác

## Text tiếng Anh còn giữ lại có chủ đích
- `REGISTERED`, `WAITLISTED`, `CANCELLED`, `DROPPED`
  - đây là mã trạng thái nghiệp vụ nội bộ; phần badge/UI hiển thị vẫn do component map sang nhãn tiếng Việt
- `localStorage`
  - đã được thay khỏi toast người dùng, chỉ còn ở ngữ cảnh kỹ thuật trong code/report

## Font / dấu
- Giữ `Poppins` hiện có vì build ổn định và không cần thêm network dependency mới.
- `index.html` đã có:
  - `lang="vi"`
  - `meta charset="UTF-8"`

## Ghi chú
- Một số file legacy trong repo hiển thị ký tự mojibake khi đọc qua terminal Windows, nhưng build/runtime vẫn chạy ổn. Các thay đổi mới mình thêm đều dùng tiếng Việt đầy đủ ở các route đang được router thật sử dụng.
