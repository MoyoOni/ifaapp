-- AlterTable
ALTER TABLE "ClientSessionNote" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ConsultationNote" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CourseCertificate" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DreamEntry" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OralHistoryEntry" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ServiceOffering" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ClientSessionNote_deletedAt_idx" ON "ClientSessionNote"("deletedAt");

-- CreateIndex
CREATE INDEX "ConsultationNote_deletedAt_idx" ON "ConsultationNote"("deletedAt");

-- CreateIndex
CREATE INDEX "CourseCertificate_deletedAt_idx" ON "CourseCertificate"("deletedAt");

-- CreateIndex
CREATE INDEX "DreamEntry_deletedAt_idx" ON "DreamEntry"("deletedAt");

-- CreateIndex
CREATE INDEX "Event_deletedAt_idx" ON "Event"("deletedAt");

-- CreateIndex
CREATE INDEX "Lesson_deletedAt_idx" ON "Lesson"("deletedAt");

-- CreateIndex
CREATE INDEX "OralHistoryEntry_deletedAt_idx" ON "OralHistoryEntry"("deletedAt");

-- CreateIndex
CREATE INDEX "ServiceOffering_deletedAt_idx" ON "ServiceOffering"("deletedAt");
