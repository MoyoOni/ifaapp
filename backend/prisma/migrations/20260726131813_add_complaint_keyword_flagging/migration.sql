-- AlterTable
ALTER TABLE "PractitionerComplaint" ADD COLUMN     "flaggedByKeywordRule" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "PractitionerComplaint_flaggedByKeywordRule_idx" ON "PractitionerComplaint"("flaggedByKeywordRule");
