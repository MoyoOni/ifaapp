-- Add idempotencyKey column to Transaction table for payment deduplication
ALTER TABLE "Transaction" ADD COLUMN "idempotencyKey" TEXT;

-- Create unique index for idempotency key lookups
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");
