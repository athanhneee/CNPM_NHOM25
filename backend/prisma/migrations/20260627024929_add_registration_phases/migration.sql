-- AlterTable
ALTER TABLE "SemesterOption" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RegistrationPhase" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allowedCohorts" JSONB,
    "allowedMajors" JSONB,
    "maxCredits" INTEGER,
    "allowRegister" BOOLEAN NOT NULL DEFAULT true,
    "allowCancel" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationPhase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistrationPhase_semesterId_idx" ON "RegistrationPhase"("semesterId");

-- AddForeignKey
ALTER TABLE "RegistrationPhase" ADD CONSTRAINT "RegistrationPhase_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "SemesterOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
