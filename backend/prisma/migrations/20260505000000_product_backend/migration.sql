-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'LOCKED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CourseCategory" AS ENUM ('FOUNDATION', 'CORE', 'ELECTIVE', 'THESIS');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'REGISTERED', 'CANCELLED', 'REJECTED', 'COMPLETED', 'FAILED', 'WAITLISTED', 'DROPPED');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('OPEN', 'CLOSED', 'FULL', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WishStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILURE', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "SemesterRegistrationStatus" AS ENUM ('UPCOMING', 'OPEN', 'ADJUSTMENT', 'CLOSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "secondaryEmail" TEXT,
    "roles" JSONB NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "passwordDigest" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "campus" TEXT,
    "department" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "citizenId" TEXT,
    "nationality" TEXT,
    "ethnicity" TEXT,
    "religion" TEXT,
    "birthPlace" TEXT,
    "address" TEXT,
    "homeTown" TEXT,
    "program" TEXT,
    "cohort" TEXT,
    "faculty" TEXT,
    "majorCode" TEXT,
    "majorName" TEXT,
    "studentClass" TEXT,
    "educationProgram" TEXT,
    "academicPeriod" TEXT,
    "studentStatus" TEXT,
    "classificationStatus" TEXT,
    "title" TEXT,
    "position" TEXT,
    "specialization" TEXT,
    "yearLevel" TEXT,
    "gpa" DOUBLE PRECISION,
    "attendanceRate" DOUBLE PRECISION,
    "completedCredits" INTEGER,
    "interests" JSONB,
    "assignedSectionIds" JSONB,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'ACTIVE',
    "department" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prerequisites" JSONB NOT NULL DEFAULT '[]',
    "prestudy" JSONB NOT NULL DEFAULT '[]',
    "corequisites" JSONB NOT NULL DEFAULT '[]',
    "category" "CourseCategory" NOT NULL,
    "faculty" TEXT,
    "courseType" TEXT,
    "academicBlock" TEXT,
    "suggestedSemester" INTEGER,
    "lectureHours" INTEGER,
    "practiceHours" INTEGER,
    "labHours" INTEGER,
    "passingScore" DOUBLE PRECISION,
    "maxStudents" INTEGER,
    "classSectionCount" INTEGER,
    "gradingWeight" JSONB,
    "majorsSupported" JSONB,
    "majorCodesSupported" JSONB,
    "track" TEXT,
    "applicableSpecializations" JSONB,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "academicYear" TEXT,
    "termCode" TEXT,
    "registrationStatus" "SemesterRegistrationStatus",
    "registrationStart" TIMESTAMP(3),
    "registrationEnd" TIMESTAMP(3),
    "adjustmentStart" TIMESTAMP(3),
    "adjustmentEnd" TIMESTAMP(3),

    CONSTRAINT "SemesterOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "sectionCode" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "subGroup" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startPeriod" INTEGER NOT NULL,
    "periodCount" INTEGER NOT NULL,
    "weeks" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "waitlistCount" INTEGER NOT NULL DEFAULT 0,
    "allowWaitlist" BOOLEAN NOT NULL DEFAULT true,
    "status" "SectionStatus" NOT NULL DEFAULT 'OPEN',
    "campus" TEXT NOT NULL,
    "notes" TEXT,
    "examSlot" TEXT,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "droppedAt" TIMESTAMP(3),
    "reasonCode" TEXT,
    "waitlistOrder" INTEGER,
    "timeline" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "preferredGroup" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "WishStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "WishRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "result" "AuditResult" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "simulationNow" TIMESTAMP(3) NOT NULL,
    "registrationStart" TIMESTAMP(3) NOT NULL,
    "registrationEnd" TIMESTAMP(3) NOT NULL,
    "adjustmentStart" TIMESTAMP(3) NOT NULL,
    "adjustmentEnd" TIMESTAMP(3) NOT NULL,
    "withdrawalDeadline" TIMESTAMP(3) NOT NULL,
    "maxCredits" INTEGER NOT NULL,
    "minCredits" INTEGER NOT NULL,
    "maintenanceMode" BOOLEAN NOT NULL,
    "allowWaitlist" BOOLEAN NOT NULL,
    "sessionTimeoutMinutes" INTEGER NOT NULL,
    "warningBeforeLogoutSeconds" INTEGER NOT NULL,
    "maxClassesPerDay" INTEGER NOT NULL,
    "maxClassesPerSemester" INTEGER NOT NULL,
    "currentSemesterId" TEXT NOT NULL,
    "maintenanceMessage" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE INDEX "Course_department_idx" ON "Course"("department");

-- CreateIndex
CREATE INDEX "SemesterOption_isCurrent_idx" ON "SemesterOption"("isCurrent");

-- CreateIndex
CREATE INDEX "Section_courseCode_idx" ON "Section"("courseCode");

-- CreateIndex
CREATE INDEX "Section_semesterId_idx" ON "Section"("semesterId");

-- CreateIndex
CREATE INDEX "Section_lecturerId_idx" ON "Section"("lecturerId");

-- CreateIndex
CREATE INDEX "Section_status_idx" ON "Section"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Section_sectionCode_semesterId_key" ON "Section"("sectionCode", "semesterId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_semesterId_idx" ON "Enrollment"("studentId", "semesterId");

-- CreateIndex
CREATE INDEX "Enrollment_sectionId_idx" ON "Enrollment"("sectionId");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE INDEX "WishRequest_studentId_semesterId_idx" ON "WishRequest"("studentId", "semesterId");

-- CreateIndex
CREATE INDEX "WishRequest_status_idx" ON "WishRequest"("status");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AuditLog_result_idx" ON "AuditLog"("result");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseCode_fkey" FOREIGN KEY ("courseCode") REFERENCES "Course"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishRequest" ADD CONSTRAINT "WishRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishRequest" ADD CONSTRAINT "WishRequest_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_currentSemesterId_fkey" FOREIGN KEY ("currentSemesterId") REFERENCES "SemesterOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
