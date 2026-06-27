-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CourseConditionType" ADD VALUE 'EQUIVALENT';
ALTER TYPE "CourseConditionType" ADD VALUE 'REPLACEMENT';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "requiredAccumulatedCredits" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "ElectiveGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "majorCode" TEXT,
    "minCredits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectiveGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseElectiveGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ElectiveGroup_code_key" ON "ElectiveGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "_CourseElectiveGroups_AB_unique" ON "_CourseElectiveGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_CourseElectiveGroups_B_index" ON "_CourseElectiveGroups"("B");

-- AddForeignKey
ALTER TABLE "_CourseElectiveGroups" ADD CONSTRAINT "_CourseElectiveGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseElectiveGroups" ADD CONSTRAINT "_CourseElectiveGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "ElectiveGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
