# Tài liệu phân tích thiết kế

## Phạm vi

Hệ thống hỗ trợ đăng ký học phần theo vai trò:
- Sinh viên: xem học phần, đăng ký, hủy/rút, waitlist, gửi nguyện vọng.
- Giảng viên: xem lớp được phân công, danh sách sinh viên, lịch dạy.
- Phòng đào tạo: quản lý học phần/lớp, phân công giảng viên, xử lý waitlist/override, báo cáo, duyệt nguyện vọng.
- Quản trị: quản lý tài khoản, phân quyền, tham số hệ thống, snapshot, audit log.

## Use Case Tóm Tắt

| Actor | Use case chính |
| --- | --- |
| Sinh viên | Đăng nhập, tra cứu học phần, kiểm tra điều kiện, đăng ký, hủy/rút, xem TKB, gửi nguyện vọng |
| Giảng viên | Xem lớp phụ trách, xem sinh viên trong lớp, xem lịch dạy |
| Phòng đào tạo | Tạo/cập nhật học phần và lớp, phân công giảng viên, xử lý waitlist, override, xem báo cáo, duyệt/từ chối nguyện vọng |
| Quản trị | Quản lý tài khoản, phân quyền, tham số, snapshot, audit log |

```mermaid
flowchart LR
  Student[Sinh viên]
  Lecturer[Giảng viên]
  Academic[Phòng đào tạo]
  Admin[Quản trị]

  UCLogin((Đăng nhập))
  UCRegister((Đăng ký học phần))
  UCCancel((Hủy/Rút học phần))
  UCWish((Gửi nguyện vọng))
  UCSchedule((Xem thời khóa biểu))
  UCSectionStudents((Xem sinh viên trong lớp))
  UCCourse((Quản lý học phần/lớp))
  UCWaitlist((Xử lý waitlist/override))
  UCUsers((Quản lý tài khoản))
  UCSettings((Tham số/snapshot/log))

  Student --> UCLogin
  Student --> UCRegister
  Student --> UCCancel
  Student --> UCWish
  Student --> UCSchedule
  Lecturer --> UCLogin
  Lecturer --> UCSectionStudents
  Lecturer --> UCSchedule
  Academic --> UCLogin
  Academic --> UCCourse
  Academic --> UCWaitlist
  Academic --> UCSchedule
  Academic --> UCWish
  Admin --> UCUsers
  Admin --> UCSettings
```

## ERD Rút Gọn

```mermaid
erDiagram
  User ||--o{ Enrollment : has
  User ||--o{ Section : teaches
  User ||--o{ WishRequest : creates
  User ||--o{ AuditLog : writes
  User ||--o{ StudentResult : owns
  Course ||--o{ Section : opens
  Course ||--o{ CourseCondition : requires
  Course ||--o{ StudentResult : has
  SemesterOption ||--o{ Section : contains
  SemesterOption ||--o{ Enrollment : contains
  SemesterOption ||--o{ WishRequest : contains
  Section ||--o{ Enrollment : receives
  Room ||--o{ Section : hosts
  SystemSetting }o--|| SemesterOption : current

  User {
    string id PK
    string username
    string email
    json roles
    string status
  }
  Course {
    string id PK
    string code UK
    string name
    int credits
    string status
  }
  Section {
    string id PK
    string sectionCode
    string courseCode FK
    string semesterId FK
    string lecturerId FK
    string roomId FK
    int capacity
    int registeredCount
    int waitlistCount
  }
  Enrollment {
    string id PK
    string studentId FK
    string sectionId FK
    string semesterId FK
    string status
  }
  WishRequest {
    string id PK
    string studentId FK
    string semesterId FK
    string courseCode
    string status
  }
```

## Sequence Đăng Ký Học Phần

```mermaid
sequenceDiagram
  actor S as Sinh viên
  participant FE as Frontend
  participant API as Enrollment API
  participant Rules as Enrollment Rules
  participant DB as PostgreSQL/Prisma

  S->>FE: Chọn lớp học phần
  FE->>API: POST /enrollments/eligibility
  API->>DB: Load student, section, courses, results, settings
  API->>Rules: evaluateEnrollmentEligibility()
  Rules-->>API: checks + finalStatus
  API-->>FE: Kết quả điều kiện
  S->>FE: Xác nhận đăng ký
  FE->>API: POST /enrollments/register
  API->>DB: Transaction Serializable
  API->>Rules: Kiểm tra lại điều kiện
  alt Đủ điều kiện và còn chỗ
    API->>DB: Tạo Enrollment REGISTERED, tăng registeredCount
  else Lớp đầy và cho waitlist
    API->>DB: Tạo Enrollment WAITLISTED, tăng waitlistCount
  else Không đủ điều kiện
    API->>DB: Ghi audit failure
  end
  API-->>FE: Kết quả đăng ký
```

## Activity Hủy/Rút/Waitlist

```mermaid
flowchart TD
  A[Chọn enrollment] --> B{Loại thao tác}
  B -->|Hủy| C{Trong adjustment window?}
  C -->|Có| D[Cập nhật CANCELLED và giảm sĩ số/waitlist]
  C -->|Không| E[Từ chối]
  B -->|Rút| F{Sau adjustment và trước withdrawal deadline?}
  F -->|Có| G[Cập nhật DROPPED và giảm sĩ số]
  F -->|Không| E
  B -->|Xử lý waitlist| H{Còn chỗ trong lớp?}
  H -->|Có| I[Kiểm tra lại điều kiện từng sinh viên]
  I --> J[Promote WAITLISTED sang REGISTERED]
  H -->|Không| K[Kết thúc]
```

## Kiến Trúc

Frontend gọi API backend thật qua `frontend/src/services/*.api.ts`. Zustand giữ state UI/cache phía client. Backend NestJS chia module theo nghiệp vụ: Auth, Users, Courses, Sections, Enrollments, Schedules, Reports, Settings, Logs, Snapshot, Wishes. Prisma schema là nguồn chính cho cấu trúc database và migration.

Mock/localStorage không thay thế backend cho đăng nhập, phân quyền hoặc mutation học vụ quan trọng; chúng chỉ giúp UI còn dữ liệu hiển thị khi API lỗi hoặc dùng cho demo phụ trợ.
