-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "autoDeleteAt" TIMESTAMP(3),
ADD COLUMN     "autoDeleteDays" INTEGER,
ADD COLUMN     "confidential" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "privacyLevel" TEXT NOT NULL DEFAULT 'PRIVATE';

-- CreateIndex
CREATE INDEX "Message_autoDeleteAt_idx" ON "Message"("autoDeleteAt");

-- CreateIndex
CREATE INDEX "Message_confidential_idx" ON "Message"("confidential");

-- CreateIndex
CREATE INDEX "Message_privacyLevel_idx" ON "Message"("privacyLevel");
