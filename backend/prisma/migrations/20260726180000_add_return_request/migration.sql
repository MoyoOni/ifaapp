-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "reasonCategory" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "vendorResponse" TEXT,
    "offeredRefundAmount" DOUBLE PRECISION,
    "returnAddress" TEXT,
    "respondedAt" TIMESTAMP(3),
    "customerConfirmedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "disputeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_orderId_key" ON "ReturnRequest"("orderId");

-- CreateIndex
CREATE INDEX "ReturnRequest_vendorId_idx" ON "ReturnRequest"("vendorId");

-- CreateIndex
CREATE INDEX "ReturnRequest_customerId_idx" ON "ReturnRequest"("customerId");

-- CreateIndex
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

