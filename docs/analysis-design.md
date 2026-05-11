# Tai lieu phan tich thiet ke

## Pham vi

He thong ho tro dang ky hoc phan theo vai tro:
- Sinh vien: xem hoc phan, dang ky, huy/rut, waitlist, gui nguyen vong.
- Giang vien: xem lop duoc phan cong, danh sach sinh vien, lich day.
- Phong dao tao: quan ly hoc phan/lop, phan cong giang vien, xu ly waitlist/override, bao cao.
- Quan tri: quan ly tai khoan, phan quyen, tham so he thong, snapshot, audit log.

## Use Case Tom Tat

| Actor | Use case chinh |
| --- | --- |
| Sinh vien | Dang nhap, tra cuu hoc phan, kiem tra dieu kien, dang ky, huy/rut, xem TKB, gui nguyen vong |
| Giang vien | Xem lop phu trach, xem sinh vien trong lop, xem lich day |
| Phong dao tao | Tao/cap nhat hoc phan va lop, phan cong giang vien, xu ly waitlist, override, xem bao cao |
| Quan tri | Quan ly tai khoan, phan quyen, tham so, snapshot, audit log |

```mermaid
flowchart LR
  Student[Sinh vien]
  Lecturer[Giang vien]
  Academic[Phong dao tao]
  Admin[Quan tri]

  UCLogin((Dang nhap))
  UCRegister((Dang ky hoc phan))
  UCCancel((Huy/Rut hoc phan))
  UCWish((Gui nguyen vong))
  UCSchedule((Xem thoi khoa bieu))
  UCSectionStudents((Xem sinh vien trong lop))
  UCCourse((Quan ly hoc phan/lop))
  UCWaitlist((Xu ly waitlist/override))
  UCUsers((Quan ly tai khoan))
  UCSettings((Tham so/snapshot/log))

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
  Admin --> UCUsers
  Admin --> UCSettings
```

## ERD Rut Gon

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

## Sequence Dang Ky Hoc Phan

```mermaid
sequenceDiagram
  actor S as Sinh vien
  participant FE as Frontend
  participant API as Enrollment API
  participant Rules as Enrollment Rules
  participant DB as PostgreSQL/Prisma

  S->>FE: Chon lop hoc phan
  FE->>API: POST /enrollments/eligibility
  API->>DB: Load student, section, courses, results, settings
  API->>Rules: evaluateEnrollmentEligibility()
  Rules-->>API: checks + finalStatus
  API-->>FE: Ket qua dieu kien
  S->>FE: Xac nhan dang ky
  FE->>API: POST /enrollments/register
  API->>DB: Transaction Serializable
  API->>Rules: Kiem tra lai dieu kien
  alt Du dieu kien va con cho
    API->>DB: Tao Enrollment REGISTERED, tang registeredCount
  else Lop day va cho waitlist
    API->>DB: Tao Enrollment WAITLISTED, tang waitlistCount
  else Khong du dieu kien
    API->>DB: Ghi audit failure
  end
  API-->>FE: Ket qua dang ky
```

## Activity Huy/Rut/Waitlist

```mermaid
flowchart TD
  A[Chon enrollment] --> B{Loai thao tac}
  B -->|Huy| C{Trong adjustment window?}
  C -->|Co| D[Cap nhat CANCELLED va giam si so/waitlist]
  C -->|Khong| E[Tu choi]
  B -->|Rut| F{Sau adjustment va truoc withdrawal deadline?}
  F -->|Co| G[Cap nhat DROPPED va giam si so]
  F -->|Khong| E
  B -->|Xu ly waitlist| H{Con cho trong lop?}
  H -->|Co| I[Kiem tra lai dieu kien tung sinh vien]
  I --> J[Promote WAITLISTED sang REGISTERED]
  H -->|Khong| K[Ket thuc]
```

## Kien Truc

Frontend goi API backend that qua `frontend/src/services/*.api.ts`. Zustand giu state UI/cache phia client. Backend NestJS chia module theo nghiep vu: Auth, Users, Courses, Sections, Enrollments, Schedules, Reports, Settings, Logs, Snapshot, Wishes. Prisma schema la nguon chinh cho cau truc database va migration.
