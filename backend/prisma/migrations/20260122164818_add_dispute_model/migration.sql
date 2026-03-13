-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "escrowId" TEXT,
    "appointmentId" TEXT,
    "complainantId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "routedTo" TEXT,
    "assignedTo" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionType" TEXT,
    "advisoryBoardVotes" JSONB,
    "advisoryBoardDecision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dispute_complainantId_idx" ON "Dispute"("complainantId");

-- CreateIndex
CREATE INDEX "Dispute_respondentId_idx" ON "Dispute"("respondentId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_type_idx" ON "Dispute"("type");

-- CreateIndex
CREATE INDEX "Dispute_category_idx" ON "Dispute"("category");

-- CreateIndex
CREATE INDEX "Dispute_routedTo_idx" ON "Dispute"("routedTo");

-- CreateIndex
CREATE INDEX "Dispute_orderId_idx" ON "Dispute"("orderId");

-- CreateIndex
CREATE INDEX "Dispute_escrowId_idx" ON "Dispute"("escrowId");

-- CreateIndex
CREATE INDEX "Dispute_appointmentId_idx" ON "Dispute"("appointmentId");

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
