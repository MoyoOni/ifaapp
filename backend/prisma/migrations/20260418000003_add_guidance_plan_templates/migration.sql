-- CreateTable
CREATE TABLE "GuidancePlanTemplate" (
    "id" TEXT NOT NULL,
    "babalawoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'AKOSE',
    "items" JSONB NOT NULL,
    "instructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuidancePlanTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuidancePlanTemplate_babalawoId_idx" ON "GuidancePlanTemplate"("babalawoId");

-- AddForeignKey
ALTER TABLE "GuidancePlanTemplate" ADD CONSTRAINT "GuidancePlanTemplate_babalawoId_fkey" FOREIGN KEY ("babalawoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
