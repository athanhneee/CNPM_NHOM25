# Báo Cáo Review Repository CNPM_NHOM25

> **Dự án:** Hệ thống Đăng ký Học phần – Học viện Công nghệ Bưu chính Viễn thông, Cơ sở TP.HCM  
> **Nhóm:** Nhóm 25 – Đăng Khôi, Ngọc Duyên, Minh Thành  
> **Giảng viên hướng dẫn:** Cô Bích Nguyên  
> **Ngày review:** 15/05/2026

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Công nghệ sử dụng](#4-công-nghệ-sử-dụng)
5. [Phân tích từng module chính](#5-phân-tích-từng-module-chính)
   - 5.1 [Khởi tạo ứng dụng (App Bootstrap)](#51-khởi-tạo-ứng-dụng-app-bootstrap)
   - 5.2 [Module Xác thực (Auth)](#52-module-xác-thực-auth)
   - 5.3 [Module Sinh viên (Student)](#53-module-sinh-viên-student)
   - 5.4 [Module Giảng viên (Lecturer)](#54-module-giảng-viên-lecturer)
   - 5.5 [Module Phòng Đào tạo (Academic Office)](#55-module-phòng-đào-tạo-academic-office)
   - 5.6 [Module Quản trị (Admin)](#56-module-quản-trị-admin)
   - 5.7 [Dashboard](#57-dashboard)
   - 5.8 [Quản lý trạng thái toàn cục (Stores)](#58-quản-lý-trạng-thái-toàn-cục-stores)
   - 5.9 [Dữ liệu mô phỏng (Mock Services & Seed)](#59-dữ-liệu-mô-phỏng-mock-services--seed)
   - 5.10 [Thư viện tiện ích (lib)](#510-thư-viện-tiện-ích-lib)
   - 5.11 [Hệ thống kiểu dữ liệu (Types)](#511-hệ-thống-kiểu-dữ-liệu-types)
   - 5.12 [Components UI chia sẻ](#512-components-ui-chia-sẻ)
6. [Các quy ước và pattern nổi bật](#6-các-quy-ước-và-pattern-nổi-bật)
7. [Điểm mạnh](#7-điểm-mạnh)
8. [Điểm còn hạn chế](#8-điểm-còn-hạn-chế)
9. [Đề xuất cải thiện](#9-đề-xuất-cải-thiện)
10. [Kết luận](#10-kết-luận)

---

## 1. Tổng quan dự án

Repository `CNPM_NHOM25` là một **ứng dụng web mô phỏng hệ thống đăng ký học phần** dành cho sinh viên Học viện Công nghệ Bưu chính Viễn thông (PTIT), Cơ sở TP.HCM. Đây là bài tập lớn môn **Công nghệ Phần mềm (CNPM)** của nhóm 25.

**Mục tiêu hệ thống:** Xây dựng giao diện đầy đủ, tương tác thực tế cho các nghiệp vụ đăng ký học phần, bao gồm:
- Sinh viên tra cứu, đăng ký, hủy và rút học phần
- Giảng viên xem lịch giảng và danh sách sinh viên trong lớp
- Phòng Đào tạo quản lý học phần, lớp học, phân công giảng viên, xử lý danh sách chờ
- Quản trị viên quản lý tài khoản, phân quyền, cài đặt hệ thống và xem nhật ký

**Lưu ý quan trọng:** Đây là một **ứng dụng frontend thuần túy** (không có backend thực sự). Toàn bộ dữ liệu được mô phỏng trong bộ nhớ (Zustand store) và lưu trữ qua `localStorage`. Tất cả thao tác nghiệp vụ đều được thực hiện trên client, giả lập độ trễ mạng thực tế để tạo trải nghiệm giống một hệ thống API thật.

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────┐
│                     Browser (SPA)                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Router  │  │ Zustand  │  │  React Components  │ │
│  │(React    │  │ Stores   │  │  (UI / Features)   │ │
│  │ Router   │  │(Global   │  │                    │ │
│  │ DOM v7)  │  │ State)   │  │                    │ │
│  └────┬─────┘  └────┬─────┘  └────────────────────┘ │
│       │             │                                │
│  ┌────▼─────────────▼──────────────────────────────┐ │
│  │           Mock Services Layer                   │ │
│  │  (auth, enrollment, section, course, ...)       │ │
│  └────────────────────┬────────────────────────────┘ │
│                       │                              │
│  ┌────────────────────▼────────────────────────────┐ │
│  │           Seed Data (in-memory)                 │ │
│  │  users · courses · sections · enrollments       │ │
│  │  logs · settings · wishes                       │ │
│  └────────────────────┬────────────────────────────┘ │
│                       │                              │
│  ┌────────────────────▼────────────────────────────┐ │
│  │           localStorage (persistence)            │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Luồng hoạt động chính:**
1. Khi ứng dụng khởi động, `AppBootstrapper` khởi tạo `AuthStore` và đọc session từ `localStorage`.
2. `DataStore` tải dữ liệu seed (hoặc phiên bản đã thay đổi từ `localStorage`) vào bộ nhớ.
3. Người dùng tương tác với giao diện → gọi Mock Service → Mock Service đọc/ghi trực tiếp vào `DataStore` → Zustand cập nhật state → React re-render.
4. Mọi thay đổi được đồng bộ vào `localStorage` để duy trì dữ liệu qua các phiên làm việc.

---

## 3. Cấu trúc thư mục

```
CNPM_NHOM25/
├── README.md                         # (chỉ có tiêu đề, chưa có nội dung)
└── frontend/                         # Toàn bộ source code
    ├── index.html                    # Điểm vào HTML
    ├── package.json                  # Cấu hình npm & dependencies
    ├── vite.config.ts                # Cấu hình Vite
    ├── tsconfig.json                 # Cấu hình TypeScript
    ├── eslint.config.js              # Cấu hình ESLint
    ├── public/                       # Tài nguyên tĩnh (logo PTIT, favicon, icons)
    └── src/
        ├── main.tsx                  # Điểm vào React
        ├── App.tsx                   # Component gốc
        ├── index.css                 # CSS toàn cục (Tailwind)
        ├── assets/                   # Ảnh hero
        ├── app/
        │   ├── config/               # Cấu hình điều hướng, phân quyền, theme
        │   ├── providers.tsx         # AppProviders (BrowserRouter, Session, Toast)
        │   ├── router.tsx            # Định nghĩa routes
        │   └── store/                # Zustand stores (auth, data, session, ui)
        ├── components/
        │   ├── calendar/             # Lưới lịch tuần, bảng lịch học kỳ
        │   ├── guards/               # RoleGuard (kiểm soát truy cập theo vai trò)
        │   ├── layout/               # AppShell, SidebarNav, TopHeader, Breadcrumbs, ...
        │   ├── shared/               # Components dùng chung (StatCard, FilterBar, ...)
        │   └── ui/                   # Components nguyên tử (Button, Card, Table, ...)
        ├── features/
        │   ├── academic/             # 7 trang: Phòng Đào tạo
        │   ├── admin/                # 4 trang: Quản trị hệ thống
        │   ├── auth/                 # 2 trang: Đăng nhập, Đổi mật khẩu
        │   ├── dashboard/            # 1 trang: Bảng điều khiển theo vai trò
        │   ├── lecturer/             # 4 trang: Giảng viên
        │   ├── profile/              # 1 trang: Thông tin cá nhân
        │   ├── student/              # 10 trang: Sinh viên
        │   ├── system/               # 2 trang: 404, Forbidden
        │   ├── pages.tsx             # Chứa DashboardPage và ProfilePage (monolithic)
        │   └── student/student-pages.tsx # Chứa tất cả trang sinh viên (monolithic)
        ├── lib/
        │   ├── business-rules.ts     # Logic nghiệp vụ đăng ký học phần
        │   ├── color-maps.ts         # Ánh xạ màu sắc cho trạng thái
        │   ├── date.ts               # Tiện ích ngày giờ
        │   ├── error-codes.ts        # Mã lỗi đăng ký học phần
        │   ├── export.ts             # Xuất file CSV
        │   ├── selectors.ts          # Hàm truy vấn/tổng hợp dữ liệu
        │   ├── storage.ts            # Đọc/ghi localStorage
        │   ├── student-import.ts     # Nhập danh sách sinh viên từ Excel
        │   ├── student-import.test.ts
        │   └── utils.ts              # Tiện ích chung
        ├── mocks/
        │   ├── seed/                 # Dữ liệu khởi tạo (courses, sections, users, ...)
        │   └── services/             # Giả lập API services
        └── types/                    # Định nghĩa TypeScript interfaces
```

---

## 4. Công nghệ sử dụng

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **React** | 19.2 | Thư viện UI chính |
| **TypeScript** | 5.9 | Ngôn ngữ lập trình (99.4% codebase) |
| **Vite** | 8.0 | Build tool & dev server |
| **Tailwind CSS** | 4.2 | Styling utility-first |
| **Zustand** | 5.0 | Quản lý state toàn cục |
| **React Router DOM** | 7.13 | Client-side routing |
| **React Hook Form** | 7.72 | Quản lý form |
| **Zod** | 4.3 | Validation schema |
| **Lucide React** | 1.7 | Icon library |
| **xlsx** | 0.18 | Đọc file Excel (nhập sinh viên) |
| **clsx** | 2.1 | Kết hợp class điều kiện |
| **@fontsource/poppins** | 5.2 | Font chữ Poppins |
| **ESLint** | 9.39 | Linting TypeScript/React |
| **Node.js test runner** | built-in | Chạy unit test (không có Jest/Vitest) |

---

## 5. Phân tích từng module chính

### 5.1 Khởi tạo ứng dụng (App Bootstrap)

**File:** `src/app/providers.tsx`, `src/App.tsx`, `src/main.tsx`

Component `AppBootstrapper` (nằm bên trong `AppProviders`) chịu trách nhiệm:
- Khởi tạo phiên đăng nhập khi tải trang (`authStore.initialize()`)
- Theo dõi và tự động đăng xuất khi phiên hết hạn (countdown timer mỗi giây)
- Hiển thị cảnh báo trước khi phiên hết hạn (`warningBeforeLogoutSeconds`)
- Làm mới phiên khi có tương tác người dùng (click, keydown, mousemove — throtled 20 giây)
- Theo dõi chế độ bảo trì từ cài đặt hệ thống

**Điểm nổi bật:** Logic quản lý phiên được cài đặt khá chắt chẽ, xử lý đầy đủ các trường hợp: phiên hết hạn, phiên bị thu hồi, tài khoản bị khóa, v.v.

---

### 5.2 Module Xác thực (Auth)

**Files:** `src/features/auth/`, `src/mocks/services/auth.service.ts`, `src/app/store/auth.store.ts`

**Chức năng:**
- **Đăng nhập** (`LoginPage`): Hỗ trợ đăng nhập bằng tên đăng nhập hoặc email, có tùy chọn "Ghi nhớ đăng nhập" (7 ngày). Tự động khóa tài khoản sau 5 lần nhập sai.
- **Đổi mật khẩu** (`ChangePasswordPage`): Xác thực mật khẩu hiện tại trước khi cập nhật.
- **Khôi phục phiên:** Tự động đọc session từ `localStorage` và xác thực lại khi tải trang.

**Bảo mật:** Mật khẩu được lưu dưới dạng `demo::password` (hàm `toDigest` chỉ thêm tiền tố, không phải hash thật). Đây phù hợp cho môi trường demo, nhưng cần thay bằng hash thật (bcrypt) khi tích hợp backend thực tế.

**RoleGuard** (`src/components/guards/RoleGuard.tsx`): Bọc toàn bộ routes yêu cầu đăng nhập. Kiểm tra vai trò người dùng và điều hướng về `/login` (nếu chưa đăng nhập) hoặc `/forbidden` (nếu không đủ quyền).

---

### 5.3 Module Sinh viên (Student)

**Files:** `src/features/student/` (10 trang, gộp trong `student-pages.tsx`)

Đây là module lớn nhất với 10 trang:

| Trang | Route | Mô tả |
|---|---|---|
| **Học phần mở** | `/student/open-sections` | Tra cứu và lọc lớp học phần đang mở trong học kỳ |
| **Chi tiết lớp** | `/student/open-sections/:sectionId` | Xem chi tiết lớp, kiểm tra điều kiện và đăng ký |
| **Đăng ký học phần** | `/student/register` | Nhập mã lớp, kiểm tra toàn bộ điều kiện, xác nhận đăng ký |
| **Hủy đăng ký** | `/student/cancel` | Hủy học phần trong cửa sổ điều chỉnh |
| **Rút học phần** | `/student/withdraw` | Rút học phần (sau điều chỉnh, trước deadline rút) |
| **TKB tuần** | `/student/schedule/week` | Lịch học dạng lưới theo tuần (7 cột ngày, hàng tiết học) |
| **TKB học kỳ** | `/student/schedule/semester` | Tổng hợp lịch học cả học kỳ theo môn |
| **Lịch sử đăng ký** | `/student/history` | Timeline các thao tác đăng ký/hủy/rút |
| **Môn tiên quyết** | `/student/prerequisites` | Sơ đồ quan hệ tiên quyết, học trước, song hành |
| **Nguyện vọng** | `/student/wish` | Gửi nguyện vọng mở thêm lớp hoặc đăng ký đặc biệt |
| **Kết quả đăng ký** | `/student/registered` | Danh sách học phần đã đăng ký + danh sách chờ |

**Logic nghiệp vụ đăng ký** (hàm `evaluateEnrollmentEligibility` trong `business-rules.ts`) kiểm tra tuần tự **12 điều kiện**:
1. Tài khoản hợp lệ (ACTIVE)
2. Lớp học phần tồn tại
3. Trạng thái lớp OPEN
4. Trong cửa sổ đăng ký
5. Không đăng ký trùng lặp
6. Đủ môn tiên quyết (prerequisite)
7. Đủ môn học trước (prestudy)
8. Đủ môn song hành (corequisite)
9. Không trùng lịch học
10. Không vượt giới hạn tín chỉ
11. Không vượt số lớp tối đa/ngày
12. Không vượt số lớp tối đa/học kỳ

Nếu lớp đầy nhưng cho phép waitlist, sinh viên được xếp vào danh sách chờ.

---

### 5.4 Module Giảng viên (Lecturer)

**Files:** `src/features/lecturer/` (4 trang, gộp trong `lecturer-pages.tsx`)

| Trang | Route | Mô tả |
|---|---|---|
| **Lớp được phân công** | `/lecturer/sections` | Danh sách lớp đang phụ trách, số sinh viên đăng ký |
| **Danh sách sinh viên** | `/lecturer/sections/:sectionId/students` | Danh sách sinh viên trong một lớp cụ thể |
| **TKB tuần** | `/lecturer/schedule/week` | Lịch giảng dạy tuần hiện tại |
| **TKB học kỳ** | `/lecturer/schedule/semester` | Tổng hợp lịch giảng cả học kỳ |

Giảng viên có quyền **chỉ đọc** — không có thao tác ghi trong module này. Đây là thiết kế hợp lý cho giai đoạn demo.

---

### 5.5 Module Phòng Đào tạo (Academic Office)

**Files:** `src/features/academic/` (7 trang + `academic-pages.tsx`)

| Trang | Route | Mô tả |
|---|---|---|
| **Danh mục môn học** | `/academic/courses` | Xem, thêm, sửa, đổi trạng thái học phần trong toàn bộ chương trình |
| **Tạo lớp học phần** | `/academic/sections/create` | Khởi tạo lớp học phần mới cho học kỳ hiện tại |
| **Phân công giảng viên** | `/academic/assign-lecturer` | Gán/thay đổi giảng viên cho lớp, kiểm tra xung đột lịch |
| **Quản lý đăng ký** | `/academic/registrations` | Theo dõi sĩ số đăng ký, xem và can thiệp từng bản ghi |
| **Lịch học và phòng** | `/academic/schedule-rooms` | Cập nhật thông tin phòng học và lịch học của lớp |
| **Báo cáo** | `/academic/reports` | Thống kê tỷ lệ lấp đầy, lớp đã đủ sĩ số, nhóm báo cáo |
| **Danh sách chờ & can thiệp** | `/academic/waitlist-override` | Xem và xử lý danh sách chờ, can thiệp đặc biệt |

Module này là **trung tâm nghiệp vụ** của hệ thống. `academic-pages.tsx` là file đơn lớn nhất (kết hợp nhiều pages).

---

### 5.6 Module Quản trị (Admin)

**Files:** `src/features/admin/` (4 trang + `admin-pages.tsx`)

| Trang | Route | Mô tả |
|---|---|---|
| **Tài khoản** | `/admin/users` | Tạo, khóa, mở khóa tài khoản; reset mật khẩu; nhập sinh viên từ Excel |
| **Phân quyền** | `/admin/roles` | Gán/gỡ vai trò cho người dùng; xem ma trận quyền hệ thống |
| **Tham số hệ thống** | `/admin/settings` | Điều chỉnh cửa sổ đăng ký, tín chỉ tối đa/tối thiểu, giới hạn lớp/ngày, chế độ bảo trì |
| **Nhật ký hệ thống** | `/admin/audit-logs` | Lịch sử toàn bộ thao tác: đăng nhập, đổi mật khẩu, đăng ký, can thiệp, v.v. |

**Chức năng nhập sinh viên từ Excel** (`student-import.ts`): Hệ thống đọc file `.xlsx`, nhận dạng mã sinh viên theo quy ước PTIT (ví dụ: `N23DCCN001`), tự động xác định ngành học, khoa, chương trình đào tạo và tạo tài khoản sinh viên hàng loạt.

---

### 5.7 Dashboard

**File:** `src/features/pages.tsx` (DashboardPage)

Dashboard hiển thị nội dung **khác nhau tùy theo vai trò đăng nhập**:
- **Sinh viên:** Thống kê tín chỉ đã đăng ký, tỷ lệ lấp đầy, GPA, danh sách học phần hiện tại, cửa sổ đăng ký đang mở
- **Giảng viên:** Danh sách lớp đang phụ trách, tổng sinh viên, cửa sổ thời gian
- **Phòng Đào tạo:** Tổng quan sĩ số toàn hệ thống, tỷ lệ lấp đầy, thông báo học vụ
- **Quản trị viên:** Tổng số tài khoản, nhật ký gần đây, danh sách tài khoản demo

---

### 5.8 Quản lý trạng thái toàn cục (Stores)

**Thư mục:** `src/app/store/`

| Store | Mô tả |
|---|---|
| **`auth.store.ts`** | Trạng thái đăng nhập: currentUser, session, isAuthenticated, permissions. Cung cấp các action: login, logout, changePassword, touchSession |
| **`data.store.ts`** | Kho dữ liệu chính (≈ 36KB): users, courses, sections, enrollments, logs, settings, wishes. Chứa toàn bộ logic nghiệp vụ CRUD |
| **`session.store.ts`** | Trạng thái UI phiên: đếm ngược hết hạn, hiển thị cảnh báo, chế độ bảo trì |
| **`ui.store.ts`** | Trạng thái giao diện: sidebar mở/đóng, toast notifications |

`DataStore` đóng vai trò **"backend giả"** — chứa toàn bộ logic CRUD, kiểm tra điều kiện nghiệp vụ, ghi audit log và đồng bộ `localStorage`. Đây là điểm trung tâm của kiến trúc ứng dụng.

---

### 5.9 Dữ liệu mô phỏng (Mock Services & Seed)

**Thư mục:** `src/mocks/`

**Mock Services** (`src/mocks/services/`):

| Service | Mô tả |
|---|---|
| `auth.service.ts` | Login, logout, restore session, change password |
| `enrollment.service.ts` | Đăng ký, hủy, rút học phần; xử lý waitlist |
| `section.service.ts` | CRUD lớp học phần, phân công giảng viên |
| `course.service.ts` | CRUD học phần, cập nhật trạng thái |
| `schedule.service.ts` | Cập nhật phòng học và lịch học |
| `admin.service.ts` | Quản lý tài khoản, reset mật khẩu, import sinh viên |
| `log.service.ts` | Đọc nhật ký audit |
| `report.service.ts` | Tạo báo cáo thống kê |

**Seed Data** (`src/mocks/seed/`):

| File | Nội dung |
|---|---|
| `users.ts` | ~50 sinh viên, 12 giảng viên, 4 cán bộ phòng đào tạo, 3 quản trị viên |
| `courses.ts` | Danh mục học phần CNTT và ATTT (đại cương, cơ sở ngành, chuyên ngành, đồ án) |
| `sections.ts` | Các lớp học phần cho học kỳ 1 và 2 năm học 2025-2026 |
| `enrollments.ts` | Dữ liệu đăng ký mô phỏng cho các sinh viên |
| `settings.ts` | Cài đặt hệ thống, danh sách học kỳ, thông báo dashboard |
| `logs.ts` | Nhật ký mẫu ban đầu |
| `relations.ts` | Quan hệ tiên quyết/học trước/song hành giữa các học phần |
| `reports.ts` | Template báo cáo preset |
| `student-seed-raw.ts` | Danh sách thô mã số và tên sinh viên PTIT |
| `ptit-helpers.ts` | Tiện ích phân tích mã sinh viên (N23DCCN001 → CNTT, khóa 2023, ...) |

Dữ liệu seed được thiết kế **sát thực tế PTIT**: tên học phần thật (BAS1101 – Triết học Mác-Lênin, CSC1101, ...), mã ngành thật (7480201 – CNTT, 7480202 – ATTT), địa chỉ địa phương thật, email theo domain `@ptithcm.edu.vn`.

---

### 5.10 Thư viện tiện ích (lib)

**Thư mục:** `src/lib/`

| File | Mô tả |
|---|---|
| `business-rules.ts` | Engine kiểm tra 12 điều kiện đăng ký, hủy, rút học phần |
| `error-codes.ts` | 25 mã lỗi đăng ký với thông báo tiếng Việt |
| `selectors.ts` | ~20 hàm truy vấn tổng hợp: lịch học, credits hiện tại, thống kê dashboard, ... |
| `date.ts` | Định dạng ngày giờ theo chuẩn Việt Nam (`vi-VN`) |
| `export.ts` | Xuất dữ liệu ra file CSV |
| `storage.ts` | Đọc/ghi `localStorage` với xử lý lỗi JSON |
| `student-import.ts` | Parser nhập sinh viên từ Excel theo quy ước mã PTIT |
| `color-maps.ts` | Ánh xạ trạng thái sang màu Tailwind CSS |
| `utils.ts` | Hàm tiện ích: `cn()`, `sleep()`, `toDigest()`, `createId()`, ... |

**Điểm nổi bật:** `business-rules.ts` được thiết kế tốt theo hướng **pure function** – nhận context đầu vào và trả về kết quả kiểm tra mà không có side effect. Điều này giúp code dễ kiểm thử và tái sử dụng.

---

### 5.11 Hệ thống kiểu dữ liệu (Types)

**Thư mục:** `src/types/`

| File | Kiểu dữ liệu chính |
|---|---|
| `auth.ts` | `UserRole` (STUDENT, LECTURER, ACADEMIC_OFFICE, ADMIN), `AccountStatus`, `AuthSession`, `AuthCredentials` |
| `user.ts` | `User` – 40+ trường, bao gồm cả thông tin học vụ lẫn cá nhân |
| `course.ts` | `Course`, `CourseRelationRow`, `WishRequest` |
| `section.ts` | `Section`, `RoomSchedule` |
| `enrollment.ts` | `Enrollment`, `EnrollmentStatus`, `EligibilityCheckResult` |
| `schedule.ts` | `ScheduleEntry` |
| `settings.ts` | `SystemSettings`, `SemesterOption`, `DashboardAnnouncement`, `ReportPreset`, `ReportRow` |
| `log.ts` | `AuditLog`, `AuditResult` |

Hệ thống types được thiết kế **toàn diện**, sử dụng `satisfies` operator (TypeScript 4.9+) để đảm bảo kiểu tĩnh chính xác trong seed data.

---

### 5.12 Components UI chia sẻ

**Thư mục:** `src/components/`

**Layout:**
- `AppShell`: Khung tổng thể (sidebar + header + main content + toast)
- `SidebarNav`: Menu điều hướng theo vai trò, có hỗ trợ thu gọn
- `TopHeader`: Thanh tiêu đề, nút toggle sidebar, user menu
- `Breadcrumbs`: Breadcrumb điều hướng tự động theo route
- `PageTitleBlock`: Tiêu đề và mô tả trang

**Components dùng chung (Shared):**
- `CreditMeter`: Thanh tiến trình tín chỉ (min/max)
- `ExportButtons`: Nút xuất CSV
- `FilterBar`: Thanh lọc đa điều kiện
- `InfoList`: Danh sách thông tin key-value
- `PermissionMatrix`: Ma trận quyền theo vai trò
- `RuleCheckPanel`: Panel hiển thị kết quả kiểm tra điều kiện đăng ký
- `SearchInput`: Ô tìm kiếm
- `SectionCapacityBar`: Thanh hiển thị sĩ số đăng ký/tổng sĩ số
- `StatCard`: Card thống kê (số lượng + label + icon)
- `StatusBadge`: Badge trạng thái có màu
- `SystemWindowCard`: Card hiển thị cửa sổ thời gian hệ thống
- `TimelineList`: Danh sách timeline sự kiện

**Calendar:**
- `WeekCalendarGrid`: Lưới thời khóa biểu theo tuần (7 cột, hàng tiết học 1-16)
- `SemesterScheduleTable`: Bảng thời khóa biểu cả học kỳ

**UI nguyên tử:**
- `Button`, `Card`, `Badge`, `Input`, `Select`, `Textarea`, `Checkbox`
- `Table` (có hỗ trợ sort, pagination)
- `Dialog`, `ConfirmDialog`, `Drawer`
- `LoadingSkeleton`, `EmptyState`, `ErrorState`
- `Tabs`, `ToastProvider`

---

## 6. Các quy ước và pattern nổi bật

### 6.1 Feature-based folder structure
Code được tổ chức theo **tính năng (feature)** thay vì theo loại file. Mỗi nhóm chức năng (student, lecturer, academic, admin) có thư mục riêng, giúp dễ tìm kiếm và bảo trì.

### 6.2 Role-based Access Control (RBAC)
Hệ thống phân quyền 4 cấp (STUDENT, LECTURER, ACADEMIC_OFFICE, ADMIN) được thực thi ở 3 lớp:
- **Route level:** `RoleGuard` bọc các route nhóm
- **Navigation level:** `getNavigationForRoles()` lọc menu theo vai trò
- **Permission level:** `ROLE_PERMISSIONS` định nghĩa quyền chi tiết

### 6.3 Mock Service Pattern
Các service giả lập (`auth.service.ts`, `enrollment.service.ts`, ...) có API giống thật:
- Trả về `Promise` với `await sleep(delay)` để giả lập độ trễ mạng
- Trả về `{ success: true/false, message, data }` theo convention

### 6.4 Pure Function Business Rules
Hàm `evaluateEnrollmentEligibility()` là **pure function**: nhận đủ context (student, section, courses, enrollments, settings) và trả về kết quả mà không thay đổi state ngoài. Điều này rất tốt cho khả năng kiểm thử.

### 6.5 Seed Data với ptit-helpers
Hàm `parseStudentSeed()` + `getMajorMappingFromStudentCode()` phân tích mã sinh viên PTIT để tự động suy ra khoa, ngành, chuyên ngành, khóa học, v.v. — giảm thiểu hardcode và tăng tính mô phỏng thực tế.

### 6.6 LocalStorage Persistence
Toàn bộ dữ liệu có thể thay đổi (users, enrollments, sections, ...) được đồng bộ vào `localStorage` sau mỗi thao tác. Có cơ chế phát hiện và reset dữ liệu cũ từ phiên bản trước (`shouldResetLegacyDemoData()`).

### 6.7 Audit Logging
Mọi thao tác quan trọng đều được ghi log (`appendAuditLog`) với: timestamp, actorId, actorRole, action, targetId, result (SUCCESS/FAILURE/INFO), message, metadata. Điều này giúp trang `AuditLogsPage` có dữ liệu thực tế để hiển thị.

---

## 7. Điểm mạnh

1. **Phạm vi tính năng rộng:** 28 routes, 4 nhóm vai trò, đầy đủ CRUD cho học phần, lớp học, tài khoản, đăng ký — vượt xa yêu cầu tối thiểu của một đồ án CNPM.

2. **TypeScript nghiêm ngặt:** 99.4% code là TypeScript với types đầy đủ, sử dụng `satisfies`, union types, generic — thể hiện kỹ năng TypeScript tốt.

3. **Business rules hoàn chỉnh:** 12 điều kiện kiểm tra đăng ký học phần, 3 cửa sổ thời gian (đăng ký / điều chỉnh / rút), logic waitlist — mô phỏng sát nghiệp vụ thực tế của PTIT.

4. **Dữ liệu seed thực tế:** Tên học phần, mã ngành, cấu trúc mã sinh viên, email domain — đều sát với thực tế PTIT HCM.

5. **Session management đầy đủ:** Timeout, cảnh báo trước khi hết hạn, tự động gia hạn khi có tương tác, khóa tài khoản sau 5 lần đăng nhập sai.

6. **Component library nội bộ:** Bộ UI components tự xây dựng (~20 components) nhất quán về style và API.

7. **Audit logging:** Toàn bộ thao tác quan trọng được ghi lại, hỗ trợ trang quản trị tra cứu.

8. **Export CSV:** Hỗ trợ xuất dữ liệu tại nhiều trang (danh sách lớp, sinh viên, đăng ký).

9. **Import Excel sinh viên:** Tính năng nhập hàng loạt từ file Excel với validation và tạo tài khoản tự động.

10. **Responsive layout:** Sidebar có thể thu gọn, layout hỗ trợ màn hình rộng (max-width 1600px).

---

## 8. Điểm còn hạn chế

### 8.1 Không có backend thực sự
Toàn bộ logic chạy trên client. Không có API thực sự, không có database, không có server. Đây là hạn chế lớn nhất nếu dự án cần triển khai thực tế.

### 8.2 Mật khẩu không được hash thật
Hàm `toDigest(value)` chỉ trả về `"demo::" + value.trim().toLowerCase()` — không phải hash. Nếu tích hợp backend, cần thay bằng bcrypt hoặc Argon2.

### 8.3 Files quá lớn
- `src/features/student/student-pages.tsx` (~44KB): Chứa toàn bộ 10 trang sinh viên trong một file.
- `src/app/store/data.store.ts` (~36KB): Kho state quá lớn, khó bảo trì.
- `src/features/pages.tsx`: Gộp Dashboard và Profile page.

Các file này nên được tách nhỏ theo nguyên tắc Single Responsibility.

### 8.4 Một số nhãn business rules còn dùng tiếng Anh không dấu
Trong `business-rules.ts`, các `label` như `'Tai khoan hop le'`, `'Ton tai lop hoc phan'`, `'Trung lap dang ky'` — thiếu dấu tiếng Việt, không nhất quán với phần còn lại của codebase.

### 8.5 README.md gần như trống
File `README.md` tại root chỉ có một dòng `# CNPM_NHOM25`. Thiếu hướng dẫn cài đặt, chạy, tài khoản demo và mô tả dự án.

### 8.6 Kiểm thử hạn chế
Chỉ có 3 file test (`ptit-helpers.test.ts`, `ptit-seed-smoke.test.ts`, `student-import.test.ts`) dùng Node.js test runner built-in. Không có test cho components, hooks hay business rules UI. Không sử dụng Vitest hay Testing Library (chuẩn hơn cho React).

### 8.7 Không có i18n
Toàn bộ chuỗi tiếng Việt được hardcode trực tiếp trong JSX và config. Nếu cần hỗ trợ đa ngôn ngữ hoặc thay đổi text, phải tìm và sửa từng chỗ.

### 8.8 Chưa có xử lý lỗi ở tầng services
Các mock service chưa có `try/catch` toàn diện. Nếu `localStorage` bị hỏng hay `JSON.parse` thất bại, có thể gây lỗi không được xử lý đúng cách (dù `safeReadLocalStorage` đã bọc phần đọc).

### 8.9 `formatCredits` trả về tiếng Anh không dấu
Hàm `formatCredits` trong `utils.ts` trả về `"X tin chi"` thay vì `"X tín chỉ"`.

### 8.10 Không có lazy loading
Tất cả 28 pages được import trực tiếp trong `router.tsx`. Với ứng dụng lớn hơn, điều này làm tăng bundle size ban đầu. Nên dùng `React.lazy()` + `Suspense` để code-split.

---

## 9. Đề xuất cải thiện

### Ngắn hạn (dễ thực hiện)

1. **Sửa README.md** – Thêm mô tả dự án, yêu cầu cài đặt (`npm install`, `npm run dev`), danh sách tài khoản demo và mật khẩu, ảnh chụp màn hình.

2. **Sửa labels tiếng Việt** – Cập nhật các chuỗi còn thiếu dấu trong `business-rules.ts` và `utils.ts`.

3. **Thêm lazy loading** – Dùng `React.lazy()` cho các feature pages để giảm thời gian tải lần đầu.

4. **Tách `student-pages.tsx`** – Mỗi trang nên có file riêng (ví dụ: `RegisterPageContent.tsx`, `HistoryPageContent.tsx`, ...) để dễ bảo trì và review code.

### Trung hạn (cần đầu tư thêm)

5. **Viết thêm unit test** – Thêm test cho `business-rules.ts` (bộ rules quan trọng nhất), `selectors.ts` và các services.

6. **Tách `data.store.ts`** – Chia thành các store nhỏ hơn theo domain: `courseStore`, `sectionStore`, `enrollmentStore`, `userStore`.

7. **Thêm form validation UI** – Hiện tại một số form dùng React Hook Form + Zod nhưng chưa hiển thị lỗi tốt.

8. **Thêm trang thống kê sinh viên cá nhân** – Biểu đồ GPA, tín chỉ tích lũy theo từng học kỳ.

### Dài hạn (nếu muốn triển khai thực tế)

9. **Xây dựng backend API** – Node.js (Express/Fastify) hoặc Spring Boot, thay thế mock services bằng HTTP requests thực sự.

10. **Tích hợp database** – PostgreSQL hoặc MySQL cho dữ liệu học vụ.

11. **Thực hiện hash mật khẩu đúng cách** – bcrypt/Argon2 ở phía server.

12. **Thêm xác thực hai bước (2FA)** – OTP qua email cho tài khoản admin và phòng đào tạo.

---

## 10. Kết luận

Repository `CNPM_NHOM25` là một **đồ án sinh viên có chất lượng cao** cho môn Công nghệ Phần mềm. Nhóm đã xây dựng được một hệ thống mô phỏng đầy đủ chức năng với:

- **Giao diện hoàn chỉnh** cho 4 nhóm người dùng với tổng cộng 28 routes
- **Logic nghiệp vụ chặt chẽ** cho quy trình đăng ký học phần đặc thù của PTIT
- **Kiến trúc frontend hiện đại** (React 19, TypeScript nghiêm ngặt, Zustand, Vite)
- **Dữ liệu mô phỏng sát thực tế** trường PTIT HCM

Các hạn chế chủ yếu xoay quanh việc **thiếu backend thực sự**, **files code quá lớn**, và **kiểm thử còn hạn chế** — những điểm này hoàn toàn có thể cải thiện trong các phiên bản tiếp theo.

Nhìn chung, đây là một sản phẩm **đáng ghi nhận** ở cấp độ đồ án sinh viên, thể hiện rõ sự đầu tư công sức và hiểu biết về nghiệp vụ đăng ký học phần của nhóm.

---

*Báo cáo được tạo tự động dựa trên phân tích source code của repository. Mọi thông tin đều dựa trên trạng thái thực tế của codebase tại thời điểm review.*
