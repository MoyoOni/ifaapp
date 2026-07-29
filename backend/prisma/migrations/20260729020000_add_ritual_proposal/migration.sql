-- FOR-013: community-generated-ritual approval, mirrors CircleSuggestion's shape.

CREATE TABLE "RitualProposal" (
    "id" TEXT NOT NULL,
    "proposedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RitualProposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RitualProposal_status_idx" ON "RitualProposal"("status");

ALTER TABLE "RitualProposal" ADD CONSTRAINT "RitualProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RitualProposal" ADD CONSTRAINT "RitualProposal_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
