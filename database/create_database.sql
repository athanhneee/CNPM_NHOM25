-- ==============================================================================
-- HỆ THỐNG ĐĂNG KÝ HỌC PHẦN - NHÓM 25 (CNPM)
-- File tạo Database (PostgreSQL)
-- Tạo từ Prisma Schema + Migrations
-- Ngày tạo: 29/06/2026
-- ==============================================================================

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║  PHẦN 1: TẠO CÁC KIỂU ENUM                                             ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- Vai trò người dùng
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN');

-- Trạng thái tài khoản
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'LOCKED', 'INACTIVE', 'DEFERRED', 'SUSPENDED');

-- Trạng thái môn học
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- Phân loại môn học
CREATE TYPE "CourseCategory" AS ENUM ('FOUNDATION', 'CORE', 'ELECTIVE', 'THESIS');

-- Trạng thái đăng ký học phần
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'REGISTERED', 'CANCELLED', 'REJECTED', 'COMPLETED', 'FAILED', 'WAITLISTED', 'DROPPED');

-- Trạng thái lớp học phần
CREATE TYPE "SectionStatus" AS ENUM ('OPEN', 'CLOSED', 'FULL', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED');

-- Trạng thái yêu cầu nguyện vọng
CREATE TYPE "WishStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- Kết quả kiểm toán
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILURE', 'WARNING', 'INFO');

-- Trạng thái đăng ký học kỳ
CREATE TYPE "SemesterRegistrationStatus" AS ENUM ('UPCOMING', 'OPEN', 'ADJUSTMENT', 'CLOSED', 'COMPLETED');

-- Loại điều kiện môn học
CREATE TYPE "CourseConditionType" AS ENUM ('PREREQUISITE', 'PRESTUDY', 'COREQUISITE', 'EQUIVALENT', 'REPLACEMENT');

-- Trạng thái kết quả sinh viên
CREATE TYPE "StudentResultStatus" AS ENUM ('PASSED', 'FAILED', 'IN_PROGRESS', 'TRANSFERRED', 'WITHDRAWN');

-- Loại học kỳ
CREATE TYPE "SemesterType" AS ENUM ('MAIN', 'SUMMER');

-- Hình thức học
CREATE TYPE "LearningMode" AS ENUM ('OFFLINE', 'ONLINE', 'BLENDED');


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║  PHẦN 2: TẠO CÁC BẢNG DỮ LIỆU                                         ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- --------------------------------------------------------------------------
-- Bảng: User (Người dùng - Sinh viên, Giảng viên, Phòng đào tạo, Admin)
-- --------------------------------------------------------------------------
CREATE TABLE "User" (
    "id"                    TEXT NOT NULL,
    "code"                  TEXT,
    "username"              TEXT NOT NULL,
    "email"                 TEXT NOT NULL,
    "fullName"              TEXT NOT NULL,
    "phone"                 TEXT,
    "secondaryEmail"        TEXT,
    "roles"                 JSONB NOT NULL,
    "status"                "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "passwordDigest"        TEXT NOT NULL,
    "failedLoginAttempts"   INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt"           TIMESTAMP(3),
    "campus"                TEXT,
    "department"            TEXT,
    "dateOfBirth"           TIMESTAMP(3),
    "gender"                TEXT,
    "citizenId"             TEXT,
    "nationality"           TEXT,
    "ethnicity"             TEXT,
    "religion"              TEXT,
    "birthPlace"            TEXT,
    "address"               TEXT,
    "homeTown"              TEXT,
    "program"               TEXT,
    "cohort"                TEXT,
    "faculty"               TEXT,
    "majorCode"             TEXT,
    "majorName"             TEXT,
    "studentClass"          TEXT,
    "educationProgram"      TEXT,
    "academicPeriod"        TEXT,
    "studentStatus"         TEXT,
    "classificationStatus"  TEXT,
    "title"                 TEXT,
    "position"              TEXT,
    "specialization"        TEXT,
    "yearLevel"             TEXT,
    "gpa"                   DOUBLE PRECISION,
    "attendanceRate"        DOUBLE PRECISION,
    "completedCredits"      INTEGER,
    "interests"             JSONB,
    "assignedSectionIds"    JSONB,
    "bio"                   TEXT,
    "avatarUrl"             TEXT,
    "refreshToken"          TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "registrationLocked"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: Course (Môn học)
-- --------------------------------------------------------------------------
CREATE TABLE "Course" (
    "id"                          TEXT NOT NULL,
    "code"                        TEXT NOT NULL,
    "name"                        TEXT NOT NULL,
    "credits"                     INTEGER NOT NULL,
    "status"                      "CourseStatus" NOT NULL DEFAULT 'ACTIVE',
    "department"                  TEXT NOT NULL,
    "campus"                      TEXT NOT NULL,
    "description"                 TEXT NOT NULL,
    "prerequisites"               JSONB NOT NULL DEFAULT '[]',
    "prestudy"                    JSONB NOT NULL DEFAULT '[]',
    "corequisites"                JSONB NOT NULL DEFAULT '[]',
    "category"                    "CourseCategory" NOT NULL,
    "faculty"                     TEXT,
    "courseType"                   TEXT,
    "academicBlock"               TEXT,
    "suggestedSemester"           INTEGER,
    "lectureHours"                INTEGER,
    "practiceHours"               INTEGER,
    "labHours"                    INTEGER,
    "passingScore"                DOUBLE PRECISION,
    "maxStudents"                 INTEGER,
    "classSectionCount"           INTEGER,
    "gradingWeight"               JSONB,
    "majorsSupported"             JSONB,
    "majorCodesSupported"         JSONB,
    "track"                       TEXT,
    "applicableSpecializations"   JSONB,
    "requiredAccumulatedCredits"  INTEGER DEFAULT 0,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: SemesterOption (Học kỳ)
-- --------------------------------------------------------------------------
CREATE TABLE "SemesterOption" (
    "id"                 TEXT NOT NULL,
    "label"              TEXT NOT NULL,
    "isCurrent"          BOOLEAN NOT NULL DEFAULT false,
    "academicYear"       TEXT,
    "termCode"           TEXT,
    "registrationStatus" "SemesterRegistrationStatus",
    "registrationStart"  TIMESTAMP(3),
    "registrationEnd"    TIMESTAMP(3),
    "adjustmentStart"    TIMESTAMP(3),
    "adjustmentEnd"      TIMESTAMP(3),
    "type"               "SemesterType" NOT NULL DEFAULT 'MAIN',
    "endDate"            TIMESTAMP(3),
    "startDate"          TIMESTAMP(3),

    CONSTRAINT "SemesterOption_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: Room (Phòng học)
-- --------------------------------------------------------------------------
CREATE TABLE "Room" (
    "id"        TEXT NOT NULL,
    "code"      TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "capacity"  INTEGER NOT NULL,
    "campus"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: Section (Lớp học phần)
-- --------------------------------------------------------------------------
CREATE TABLE "Section" (
    "id"                  TEXT NOT NULL,
    "sectionCode"         TEXT NOT NULL,
    "courseCode"           TEXT NOT NULL,
    "semesterId"          TEXT NOT NULL,
    "group"               TEXT NOT NULL,
    "subGroup"            TEXT NOT NULL,
    "lecturerId"          TEXT NOT NULL,
    "room"                TEXT NOT NULL,
    "weekday"             INTEGER NOT NULL,
    "startPeriod"         INTEGER NOT NULL,
    "periodCount"         INTEGER NOT NULL,
    "weeks"               TEXT NOT NULL,
    "capacity"            INTEGER NOT NULL,
    "registeredCount"     INTEGER NOT NULL DEFAULT 0,
    "waitlistCount"       INTEGER NOT NULL DEFAULT 0,
    "allowWaitlist"       BOOLEAN NOT NULL DEFAULT true,
    "status"              "SectionStatus" NOT NULL DEFAULT 'OPEN',
    "campus"              TEXT NOT NULL,
    "notes"               TEXT,
    "examSlot"            TEXT,
    "roomId"              TEXT,
    "additionalSchedules" JSONB DEFAULT '[]',
    "cancelledDates"      JSONB DEFAULT '[]',
    "makeUpSchedules"     JSONB DEFAULT '[]',
    "minCapacity"         INTEGER NOT NULL DEFAULT 0,
    "startDate"           TIMESTAMP(3),
    "endDate"             TIMESTAMP(3),
    "learningMode"        "LearningMode" NOT NULL DEFAULT 'OFFLINE',

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: CourseCondition (Điều kiện môn học: tiên quyết, song hành, ...)
-- --------------------------------------------------------------------------
CREATE TABLE "CourseCondition" (
    "id"                 TEXT NOT NULL,
    "courseCode"          TEXT NOT NULL,
    "requiredCourseCode"  TEXT NOT NULL,
    "type"               "CourseConditionType" NOT NULL,
    "note"               TEXT,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCondition_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: Enrollment (Đăng ký học phần)
-- --------------------------------------------------------------------------
CREATE TABLE "Enrollment" (
    "id"               TEXT NOT NULL,
    "studentId"        TEXT NOT NULL,
    "sectionId"        TEXT NOT NULL,
    "semesterId"       TEXT NOT NULL,
    "status"           "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    "cancelledAt"      TIMESTAMP(3),
    "droppedAt"        TIMESTAMP(3),
    "reasonCode"       TEXT,
    "waitlistOrder"    INTEGER,
    "timeline"         JSONB NOT NULL DEFAULT '[]',
    "isImprovement"    BOOLEAN NOT NULL DEFAULT false,
    "isRetake"         BOOLEAN NOT NULL DEFAULT false,
    "hasPartialGrades" BOOLEAN NOT NULL DEFAULT false,
    "isMandatory"      BOOLEAN NOT NULL DEFAULT false,
    "tuitionStatus"    TEXT NOT NULL DEFAULT 'UNPAID',

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: StudentResult (Kết quả học tập)
-- --------------------------------------------------------------------------
CREATE TABLE "StudentResult" (
    "id"           TEXT NOT NULL,
    "studentId"    TEXT NOT NULL,
    "courseCode"   TEXT NOT NULL,
    "semesterId"   TEXT,
    "letterGrade"  TEXT,
    "numericGrade" DOUBLE PRECISION,
    "status"       "StudentResultStatus" NOT NULL,
    "passed"       BOOLEAN NOT NULL DEFAULT false,
    "attemptNo"    INTEGER NOT NULL DEFAULT 1,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentResult_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: RegistrationErrorCode (Mã lỗi đăng ký)
-- --------------------------------------------------------------------------
CREATE TABLE "RegistrationErrorCode" (
    "code"        TEXT NOT NULL,
    "message"     TEXT NOT NULL,
    "description" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationErrorCode_pkey" PRIMARY KEY ("code")
);

-- --------------------------------------------------------------------------
-- Bảng: WishRequest (Yêu cầu nguyện vọng mở lớp)
-- --------------------------------------------------------------------------
CREATE TABLE "WishRequest" (
    "id"             TEXT NOT NULL,
    "studentId"      TEXT NOT NULL,
    "semesterId"     TEXT NOT NULL,
    "courseCode"     TEXT NOT NULL,
    "preferredGroup" TEXT,
    "reason"         TEXT NOT NULL,
    "reviewNote"     TEXT,
    "reviewerId"     TEXT,
    "reviewedAt"     TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status"         "WishStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "WishRequest_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: AuditLog (Nhật ký kiểm toán)
-- --------------------------------------------------------------------------
CREATE TABLE "AuditLog" (
    "id"        TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId"   TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "action"    TEXT NOT NULL,
    "targetId"  TEXT NOT NULL,
    "result"    "AuditResult" NOT NULL,
    "message"   TEXT NOT NULL,
    "metadata"  JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: SystemSetting (Cài đặt hệ thống)
-- --------------------------------------------------------------------------
CREATE TABLE "SystemSetting" (
    "id"                         INTEGER NOT NULL DEFAULT 1,
    "simulationNow"              TIMESTAMP(3) NOT NULL,
    "registrationStart"          TIMESTAMP(3) NOT NULL,
    "registrationEnd"            TIMESTAMP(3) NOT NULL,
    "adjustmentStart"            TIMESTAMP(3) NOT NULL,
    "adjustmentEnd"              TIMESTAMP(3) NOT NULL,
    "minCredits"                 INTEGER NOT NULL,
    "maintenanceMode"            BOOLEAN NOT NULL,
    "allowWaitlist"              BOOLEAN NOT NULL,
    "sessionTimeoutMinutes"      INTEGER NOT NULL,
    "warningBeforeLogoutSeconds" INTEGER NOT NULL,
    "maxClassesPerDay"           INTEGER NOT NULL,
    "maxClassesPerSemester"      INTEGER NOT NULL,
    "currentSemesterId"          TEXT NOT NULL,
    "maintenanceMessage"         TEXT NOT NULL,
    "allowGradeImprovement"      BOOLEAN NOT NULL DEFAULT true,
    "maxCreditsMain"             INTEGER NOT NULL DEFAULT 24,
    "maxCreditsSummer"           INTEGER NOT NULL DEFAULT 12,
    "maxRetakeAttempts"          INTEGER NOT NULL DEFAULT 3,
    "countWaitlistCredits"       BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng: ElectiveGroup (Nhóm môn tự chọn)
-- --------------------------------------------------------------------------
CREATE TABLE "ElectiveGroup" (
    "id"         TEXT NOT NULL,
    "code"       TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "majorCode"  TEXT,
    "minCredits" INTEGER NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectiveGroup_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- Bảng trung gian: _CourseElectiveGroups (Quan hệ N-N giữa Course và ElectiveGroup)
-- --------------------------------------------------------------------------
CREATE TABLE "_CourseElectiveGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- --------------------------------------------------------------------------
-- Bảng: RegistrationPhase (Đợt đăng ký theo học kỳ)
-- --------------------------------------------------------------------------
CREATE TABLE "RegistrationPhase" (
    "id"             TEXT NOT NULL,
    "semesterId"     TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "startDate"      TIMESTAMP(3) NOT NULL,
    "endDate"        TIMESTAMP(3) NOT NULL,
    "allowedCohorts" JSONB,
    "allowedMajors"  JSONB,
    "maxCredits"     INTEGER,
    "allowRegister"  BOOLEAN NOT NULL DEFAULT true,
    "allowCancel"    BOOLEAN NOT NULL DEFAULT false,
    "allowWithdraw"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationPhase_pkey" PRIMARY KEY ("id")
);


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║  PHẦN 3: TẠO CÁC INDEX                                                  ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- User
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_status_idx" ON "User"("status");

-- Course
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE INDEX "Course_status_idx" ON "Course"("status");
CREATE INDEX "Course_department_idx" ON "Course"("department");

-- SemesterOption
CREATE INDEX "SemesterOption_isCurrent_idx" ON "SemesterOption"("isCurrent");

-- Room
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- Section
CREATE UNIQUE INDEX "Section_sectionCode_semesterId_key" ON "Section"("sectionCode", "semesterId");
CREATE INDEX "Section_courseCode_idx" ON "Section"("courseCode");
CREATE INDEX "Section_semesterId_idx" ON "Section"("semesterId");
CREATE INDEX "Section_lecturerId_idx" ON "Section"("lecturerId");
CREATE INDEX "Section_roomId_idx" ON "Section"("roomId");
CREATE INDEX "Section_status_idx" ON "Section"("status");

-- CourseCondition
CREATE UNIQUE INDEX "CourseCondition_courseCode_requiredCourseCode_type_key"
    ON "CourseCondition"("courseCode", "requiredCourseCode", "type");
CREATE INDEX "CourseCondition_courseCode_idx" ON "CourseCondition"("courseCode");
CREATE INDEX "CourseCondition_requiredCourseCode_idx" ON "CourseCondition"("requiredCourseCode");
CREATE INDEX "CourseCondition_type_idx" ON "CourseCondition"("type");

-- Enrollment
CREATE UNIQUE INDEX "Enrollment_studentId_sectionId_key" ON "Enrollment"("studentId", "sectionId");
CREATE INDEX "Enrollment_studentId_semesterId_idx" ON "Enrollment"("studentId", "semesterId");
CREATE INDEX "Enrollment_sectionId_idx" ON "Enrollment"("sectionId");
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- StudentResult
CREATE UNIQUE INDEX "StudentResult_studentId_courseCode_semesterId_attemptNo_key"
    ON "StudentResult"("studentId", "courseCode", "semesterId", "attemptNo");
CREATE INDEX "StudentResult_studentId_idx" ON "StudentResult"("studentId");
CREATE INDEX "StudentResult_courseCode_idx" ON "StudentResult"("courseCode");
CREATE INDEX "StudentResult_semesterId_idx" ON "StudentResult"("semesterId");
CREATE INDEX "StudentResult_passed_idx" ON "StudentResult"("passed");

-- WishRequest
CREATE INDEX "WishRequest_studentId_semesterId_idx" ON "WishRequest"("studentId", "semesterId");
CREATE INDEX "WishRequest_status_idx" ON "WishRequest"("status");

-- AuditLog
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");
CREATE INDEX "AuditLog_result_idx" ON "AuditLog"("result");

-- ElectiveGroup
CREATE UNIQUE INDEX "ElectiveGroup_code_key" ON "ElectiveGroup"("code");

-- _CourseElectiveGroups (Bảng trung gian)
CREATE UNIQUE INDEX "_CourseElectiveGroups_AB_unique" ON "_CourseElectiveGroups"("A", "B");
CREATE INDEX "_CourseElectiveGroups_B_index" ON "_CourseElectiveGroups"("B");

-- RegistrationPhase
CREATE INDEX "RegistrationPhase_semesterId_idx" ON "RegistrationPhase"("semesterId");


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║  PHẦN 4: TẠO CÁC RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEY)                   ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- Section → Course (qua courseCode)
ALTER TABLE "Section"
    ADD CONSTRAINT "Section_courseCode_fkey"
    FOREIGN KEY ("courseCode") REFERENCES "Course"("code")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Section → User/Lecturer (qua lecturerId)
ALTER TABLE "Section"
    ADD CONSTRAINT "Section_lecturerId_fkey"
    FOREIGN KEY ("lecturerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Section → Room (qua roomId, tùy chọn)
ALTER TABLE "Section"
    ADD CONSTRAINT "Section_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Section → SemesterOption (qua semesterId)
ALTER TABLE "Section"
    ADD CONSTRAINT "Section_semesterId_fkey"
    FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CourseCondition → Course (qua courseCode)
ALTER TABLE "CourseCondition"
    ADD CONSTRAINT "CourseCondition_courseCode_fkey"
    FOREIGN KEY ("courseCode") REFERENCES "Course"("code")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CourseCondition → Course (qua requiredCourseCode)
ALTER TABLE "CourseCondition"
    ADD CONSTRAINT "CourseCondition_requiredCourseCode_fkey"
    FOREIGN KEY ("requiredCourseCode") REFERENCES "Course"("code")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enrollment → User/Student (qua studentId)
ALTER TABLE "Enrollment"
    ADD CONSTRAINT "Enrollment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enrollment → Section (qua sectionId)
ALTER TABLE "Enrollment"
    ADD CONSTRAINT "Enrollment_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "Section"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enrollment → SemesterOption (qua semesterId)
ALTER TABLE "Enrollment"
    ADD CONSTRAINT "Enrollment_semesterId_fkey"
    FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- StudentResult → User/Student (qua studentId)
ALTER TABLE "StudentResult"
    ADD CONSTRAINT "StudentResult_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- StudentResult → Course (qua courseCode)
ALTER TABLE "StudentResult"
    ADD CONSTRAINT "StudentResult_courseCode_fkey"
    FOREIGN KEY ("courseCode") REFERENCES "Course"("code")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- StudentResult → SemesterOption (qua semesterId, tùy chọn)
ALTER TABLE "StudentResult"
    ADD CONSTRAINT "StudentResult_semesterId_fkey"
    FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- WishRequest → User/Student (qua studentId)
ALTER TABLE "WishRequest"
    ADD CONSTRAINT "WishRequest_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- WishRequest → SemesterOption (qua semesterId)
ALTER TABLE "WishRequest"
    ADD CONSTRAINT "WishRequest_semesterId_fkey"
    FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AuditLog → User/Actor (qua actorId)
ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- SystemSetting → SemesterOption (qua currentSemesterId)
ALTER TABLE "SystemSetting"
    ADD CONSTRAINT "SystemSetting_currentSemesterId_fkey"
    FOREIGN KEY ("currentSemesterId") REFERENCES "SemesterOption"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- _CourseElectiveGroups → Course (qua A)
ALTER TABLE "_CourseElectiveGroups"
    ADD CONSTRAINT "_CourseElectiveGroups_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Course"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- _CourseElectiveGroups → ElectiveGroup (qua B)
ALTER TABLE "_CourseElectiveGroups"
    ADD CONSTRAINT "_CourseElectiveGroups_B_fkey"
    FOREIGN KEY ("B") REFERENCES "ElectiveGroup"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- RegistrationPhase → SemesterOption (qua semesterId)
ALTER TABLE "RegistrationPhase"
    ADD CONSTRAINT "RegistrationPhase_semesterId_fkey"
    FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║  KẾT THÚC - DATABASE ĐÃ ĐƯỢC TẠO THÀNH CÔNG                           ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- Tổng kết:
--   • 14 bảng dữ liệu (bao gồm 1 bảng trung gian N-N)
--   • 12 kiểu ENUM
--   • 30+ INDEX (bao gồm UNIQUE INDEX)
--   • 17 ràng buộc FOREIGN KEY
--
-- Để seed dữ liệu mẫu, chạy: npx prisma db seed
-- Nguồn schema: backend/prisma/schema.prisma
