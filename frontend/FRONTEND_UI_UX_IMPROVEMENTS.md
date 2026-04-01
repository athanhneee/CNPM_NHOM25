# FRONTEND_UI_UX_IMPROVEMENTS

## Cải tiến layout
- Bổ sung cụm thao tác quản trị sinh viên trong `/admin/users`:
  - form thêm sinh viên thủ công
  - khu vực upload Excel/tab-delimited
  - khu vực xem trước và tổng kết import
- Căn giữa lại cụm badge nhận diện ở `/profile`:
  - đồng bộ chiều cao pill
  - căn giữa ngang/dọc cho nội dung
  - giảm cảm giác lệch text trong card thông tin lớn
- Bổ sung bộ lọc trực tiếp trong màn `/student/register`:
  - lọc theo lớp sinh viên
  - lọc theo khoa quản lý
  - hiển thị nhãn tóm tắt lớp/ngành/khoa đang áp dụng
- Bổ sung thông tin học vụ ngay trên card/chi tiết học phần:
  - loại môn
  - khối kiến thức
  - ngành áp dụng
  - học kỳ gợi ý
- Mở rộng bảng catalog học phần của phòng đào tạo với cột ngữ nghĩa thay vì chỉ mã/tên.

## Cải tiến màu sắc
- Giữ nguyên hướng teal/cyan của repo.
- Không đổi theme gốc; chỉ tăng tính rõ ràng của trạng thái bằng metadata và badge.

## Cải tiến font chữ
- Không thay font global để tránh phát sinh tải dependency mới và tránh regression.
- Tập trung chuẩn hóa câu chữ tiếng Việt và loại bỏ label không dấu ở các route chính.
- Rà soát thêm các nhãn trạng thái/tooltip ở color maps và luồng giảng viên để không còn các chuỗi kiểu `Khong`, `Dang ky`, `Sinh vien`.

## Cải tiến spacing / readability
- Tách rõ 3 bước nhập sinh viên cho admin:
  - nhập tay / tải tệp
  - xem trước
  - xem kết quả import
- Tăng mật độ thông tin có cấu trúc trong card đăng ký học phần.
- Thêm dòng phụ cho `courseType` và `majorsSupported` trong danh sách đăng ký để người dùng đọc nhanh hơn.
- Ở bảng sinh viên của giảng viên/phòng đào tạo, ưu tiên hiển thị `studentClass` thay vì `program` để người dùng nhìn ra lớp hành chính ngay.

## Cải tiến loading / empty / error state
- Giữ các `EmptyState` hiện có, đồng thời chuẩn hóa lại text tiếng Việt.
- Đồng bộ toast success/error trong các thao tác đăng ký, hủy, rút, gửi nguyện vọng.
- Bổ sung thông báo rõ ràng cho admin khi:
  - tệp không đọc được
  - chưa có bản xem trước hợp lệ
  - dòng nhập bị lỗi hoặc trùng MSSV
  - import hoàn tất

## Cải tiến animation
- Không thêm animation mới để tránh tăng rủi ro regression.
- Giữ motion hiện có của design system.

## Cải tiến accessibility cơ bản
- Text hành động rõ nghĩa hơn:
  - `Đăng ký ngay`
  - `Kiểm tra điều kiện`
  - `Hủy đăng ký`
  - `Rút học phần`
  - `Gửi nguyện vọng`
- Giảm nhãn mơ hồ bằng cách hiển thị đúng ngữ cảnh học vụ.

## Chưa thực hiện
- Chưa thêm screenshot before/after do môi trường terminal hiện tại không có browser automation để chụp UI.
- Chưa tối ưu code-splitting; bundle vẫn còn warning kích thước.
