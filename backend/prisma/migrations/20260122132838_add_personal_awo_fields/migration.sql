-- AlterTable
ALTER TABLE "BabalawoClient" ADD COLUMN     "covenantAgreed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "covenantText" TEXT,
ADD COLUMN     "durationMonths" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "exclusivityAcknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "gracePeriodEnd" TIMESTAMP(3),
ADD COLUMN     "gracePeriodStart" TIMESTAMP(3),
ADD COLUMN     "inGracePeriod" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "relationshipType" TEXT NOT NULL DEFAULT 'ONE_OFF',
ADD COLUMN     "renewalPromptSentAt" TIMESTAMP(3),
ADD COLUMN     "renewalPrompted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "BabalawoClient_relationshipType_idx" ON "BabalawoClient"("relationshipType");

-- CreateIndex
CREATE INDEX "BabalawoClient_endDate_idx" ON "BabalawoClient"("endDate");

-- CreateIndex
CREATE INDEX "BabalawoClient_inGracePeriod_idx" ON "BabalawoClient"("inGracePeriod");
