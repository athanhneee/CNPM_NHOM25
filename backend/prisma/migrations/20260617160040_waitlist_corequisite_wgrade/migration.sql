-- AlterEnum
ALTER TYPE "StudentResultStatus" ADD VALUE 'WITHDRAWN';

-- AlterTable
ALTER TABLE "SystemSetting" ADD COLUMN     "countWaitlistCredits" BOOLEAN NOT NULL DEFAULT false;
