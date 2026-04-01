# COURSE_CATALOG_NOTES

## Cấu trúc catalog
- `generalEducationCourses`
- `foundationCourses`
- `majorCoreCourses`
- `specializationCourses`
- `electiveCourses`

Catalog được biểu diễn qua các trường:
- `code`
- `name`
- `credits`
- `department`
- `faculty`
- `courseType`
- `academicBlock`
- `suggestedSemester`
- `prerequisites`
- `prestudy`
- `corequisites`
- `majorsSupported`
- `majorCodesSupported`
- `track` / `applicableSpecializations`

## Môn học dùng chung
- Triết học Mác - Lênin
- Pháp luật đại cương
- Kỹ năng học đại học và phương pháp nghiên cứu
- Tiếng Anh học phần 1, 2
- Giải tích cho công nghệ thông tin
- Đại số tuyến tính
- Xác suất thống kê
- Nhập môn lập trình
- Kiến trúc máy tính
- Lập trình hướng đối tượng
- Cấu trúc dữ liệu và giải thuật
- Cơ sở dữ liệu
- Mạng máy tính
- Hệ điều hành

## Môn học riêng CNTT
- Công nghệ phần mềm
- Phát triển ứng dụng web
- Kiểm thử phần mềm
- Quản lý dự án phần mềm
- Kiến trúc phần mềm
- Hệ quản trị dữ liệu doanh nghiệp
- Phân tích dữ liệu doanh nghiệp
- Trí tuệ nhân tạo
- Học máy ứng dụng
- Thị giác máy tính
- Điện toán đám mây
- Thiết kế hệ thống nhúng và IoT
- Đồ án chuyên ngành công nghệ thông tin

## Môn học riêng ATTT
- Nhập môn an toàn thông tin
- Mật mã ứng dụng
- An toàn mạng
- Bảo mật hệ điều hành
- Bảo mật cơ sở dữ liệu
- Kiểm thử xâm nhập
- Điều tra số
- Bảo mật ứng dụng web
- Giám sát và phản ứng sự cố an ninh mạng
- Quản trị rủi ro an toàn thông tin
- Đồ án chuyên ngành an toàn thông tin

## Cách xác định tiên quyết
- Giữ các cặp học vụ phổ biến và hợp lý cho demo:
  - `CSC1101` -> `CSC1201`
  - `CSC1201` -> `CSC1301`, `INT2101`, `INT2102`
  - `CSC1202` -> `INT2205`, một phần nhóm AI/thuật toán nâng cao
  - `CSC1302` -> `SEC2201`, `INT2208`
  - `CSC1303` -> `SEC2202`, `SEC2302`
  - `INT2101` -> `INT2103`, `INT2201`, `INT2202`
  - `SEC2201` -> `SEC2301`, `SEC2304`
- `prestudy` được dùng cho các môn cần “đã có kết quả trước đó”.
- `corequisites` được dùng cho các môn học song hành nền tảng, đặc biệt ở ATTT.

## Những phần bám PTIT HCM
- Cách chia khối kiến thức.
- Tinh thần hai ngành CNTT và ATTT.
- Hướng/chuyên sâu của CNTT.
- Cụm học phần lõi của ATTT.
- Tên môn bằng tiếng Việt chuẩn học vụ.

## Những phần được suy luận hợp lý để phục vụ demo
- Một số mã môn được chuẩn hóa theo convention nội bộ của repo để đồng nhất seed.
- Phân bổ giờ lý thuyết/thực hành/lab và trọng số điểm được suy luận theo hướng dùng được cho UI demo.
- Một số lớp học phần có sĩ số nhỏ để tạo case `FULL`/`WAITLIST` rõ ràng trong demo.
