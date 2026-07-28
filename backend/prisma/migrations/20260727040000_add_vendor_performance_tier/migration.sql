-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "performanceTier" TEXT NOT NULL DEFAULT 'NEW_VENDOR',
ADD COLUMN     "performanceTierUpdatedAt" TIMESTAMP(3);

