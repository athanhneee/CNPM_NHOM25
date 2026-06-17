-- Add ERD support tables while keeping the existing frontend-compatible columns.

CREATE TYPE "CourseConditionType" AS ENUM ('PREREQUISITE', 'PRESTUDY', 'COREQUISITE');
CREATE TYPE "StudentResultStatus" AS ENUM ('PASSED', 'FAILED', 'IN_PROGRESS', 'TRANSFERRED');

CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "campus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseCondition" (
    "id" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "requiredCourseCode" TEXT NOT NULL,
    "type" "CourseConditionType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseCondition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "semesterId" TEXT,
    "letterGrade" TEXT,
    "numericGrade" DOUBLE PRECISION,
    "status" "StudentResultStatus" NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegistrationErrorCode" (
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationErrorCode_pkey" PRIMARY KEY ("code")
);

ALTER TABLE "Section" ADD COLUMN "roomId" TEXT;

CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");
CREATE UNIQUE INDEX "CourseCondition_courseCode_requiredCourseCode_type_key" ON "CourseCondition"("courseCode", "requiredCourseCode", "type");
CREATE INDEX "CourseCondition_courseCode_idx" ON "CourseCondition"("courseCode");
CREATE INDEX "CourseCondition_requiredCourseCode_idx" ON "CourseCondition"("requiredCourseCode");
CREATE INDEX "CourseCondition_type_idx" ON "CourseCondition"("type");
CREATE INDEX "StudentResult_studentId_idx" ON "StudentResult"("studentId");
CREATE INDEX "StudentResult_courseCode_idx" ON "StudentResult"("courseCode");
CREATE INDEX "StudentResult_semesterId_idx" ON "StudentResult"("semesterId");
CREATE INDEX "StudentResult_passed_idx" ON "StudentResult"("passed");
CREATE INDEX "Section_roomId_idx" ON "Section"("roomId");

ALTER TABLE "Section" ADD CONSTRAINT "Section_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CourseCondition" ADD CONSTRAINT "CourseCondition_courseCode_fkey" FOREIGN KEY ("courseCode") REFERENCES "Course"("code") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseCondition" ADD CONSTRAINT "CourseCondition_requiredCourseCode_fkey" FOREIGN KEY ("requiredCourseCode") REFERENCES "Course"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentResult" ADD CONSTRAINT "StudentResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentResult" ADD CONSTRAINT "StudentResult_courseCode_fkey" FOREIGN KEY ("courseCode") REFERENCES "Course"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentResult" ADD CONSTRAINT "StudentResult_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
