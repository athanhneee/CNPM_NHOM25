/*
  Warnings:

  - You are about to drop the column `maxCredits` on the `SystemSetting` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('MAIN', 'SUMMER');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "isImprovement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRetake" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SemesterOption" ADD COLUMN     "type" "SemesterType" NOT NULL DEFAULT 'MAIN';

-- AlterTable
ALTER TABLE "SystemSetting" DROP COLUMN "maxCredits",
ADD COLUMN     "allowGradeImprovement" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxCreditsMain" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "maxCreditsSummer" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "maxRetakeAttempts" INTEGER NOT NULL DEFAULT 3;
