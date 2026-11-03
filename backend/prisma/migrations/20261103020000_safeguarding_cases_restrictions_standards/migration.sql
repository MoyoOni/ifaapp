-- docs/safeguarding SAFE-02 (cases), SAFE-05 (restrictions), SAFE-12 (practitioner standards).
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "standardsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "standardsVersionAccepted" TEXT;

-- CreateTable
CREATE TABLE "SafeguardingCase" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "subjectId" TEXT,
    "reporterId" TEXT,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "handlerId" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafeguardingCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeguardingCaseEntry" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafeguardingCaseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountRestriction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "protectedUserId" TEXT,
    "reason" TEXT NOT NULL,
    "caseId" TEXT,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "liftedAt" TIMESTAMP(3),
    "liftedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SafeguardingCase_ref_key" ON "SafeguardingCase"("ref");

-- CreateIndex
CREATE INDEX "SafeguardingCase_status_priority_idx" ON "SafeguardingCase"("status", "priority");

-- CreateIndex
CREATE INDEX "SafeguardingCase_subjectId_idx" ON "SafeguardingCase"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SafeguardingCase_source_sourceId_key" ON "SafeguardingCase"("source", "sourceId");

-- CreateIndex
CREATE INDEX "SafeguardingCaseEntry_caseId_idx" ON "SafeguardingCaseEntry"("caseId");

-- CreateIndex
CREATE INDEX "AccountRestriction_userId_type_idx" ON "AccountRestriction"("userId", "type");

-- CreateIndex
CREATE INDEX "AccountRestriction_protectedUserId_idx" ON "AccountRestriction"("protectedUserId");

-- AddForeignKey
ALTER TABLE "SafeguardingCaseEntry" ADD CONSTRAINT "SafeguardingCaseEntry_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SafeguardingCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

