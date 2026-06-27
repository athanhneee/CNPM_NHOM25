-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "additionalSchedules" JSONB DEFAULT '[]',
ADD COLUMN     "cancelledDates" JSONB DEFAULT '[]',
ADD COLUMN     "makeUpSchedules" JSONB DEFAULT '[]';
