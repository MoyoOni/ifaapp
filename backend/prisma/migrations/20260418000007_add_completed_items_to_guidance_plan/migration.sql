-- AlterTable
ALTER TABLE "GuidancePlan" ADD COLUMN     "completedItems" TEXT[] DEFAULT ARRAY[]::TEXT[];