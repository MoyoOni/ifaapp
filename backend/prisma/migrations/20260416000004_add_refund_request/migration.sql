-- ADM-012: RefundRequest model
CREATE TABLE IF NOT EXISTS "RefundRequest" (
    "id" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "orderId" TEXT,
    "appointmentId" TEXT,
    "amount" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "approvedAmount" DOUBLE PRECISION,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RefundRequest_requestedBy_idx" ON "RefundRequest"("requestedBy");
CREATE INDEX IF NOT EXISTS "RefundRequest_status_idx" ON "RefundRequest"("status");
CREATE INDEX IF NOT EXISTS "RefundRequest_orderId_idx" ON "RefundRequest"("orderId");
CREATE INDEX IF NOT EXISTS "RefundRequest_appointmentId_idx" ON "RefundRequest"("appointmentId");
CREATE INDEX IF NOT EXISTS "RefundRequest_createdAt_idx" ON "RefundRequest"("createdAt");

ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_requestedBy_fkey"
    FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_processedBy_fkey"
    FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
