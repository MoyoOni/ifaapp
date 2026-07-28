-- AlterTable
ALTER TABLE "GuidancePlanTemplate" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MemorialEntry" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "GuidancePlanTemplate_deletedAt_idx" ON "GuidancePlanTemplate"("deletedAt");

-- CreateIndex
CREATE INDEX "MemorialEntry_deletedAt_idx" ON "MemorialEntry"("deletedAt");
