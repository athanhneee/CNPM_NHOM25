-- CreateEnum
CREATE TYPE "LearningMode" AS ENUM ('OFFLINE', 'ONLINE', 'BLENDED');

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "learningMode" "LearningMode" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "startDate" TIMESTAMP(3);
