-- CreateTable
CREATE TABLE "HealingCase" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "respondentId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedElderId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealingCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealingCase_reporterId_idx" ON "HealingCase"("reporterId");

-- CreateIndex
CREATE INDEX "HealingCase_respondentId_idx" ON "HealingCase"("respondentId");

-- CreateIndex
CREATE INDEX "HealingCase_status_idx" ON "HealingCase"("status");

-- AddForeignKey
ALTER TABLE "HealingCase" ADD CONSTRAINT "HealingCase_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealingCase" ADD CONSTRAINT "HealingCase_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealingCase" ADD CONSTRAINT "HealingCase_assignedElderId_fkey" FOREIGN KEY ("assignedElderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
