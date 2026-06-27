-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "hasPartialGrades" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMandatory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tuitionStatus" TEXT NOT NULL DEFAULT 'UNPAID';
