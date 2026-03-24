-- AlterTable: Add refund fields to Order
ALTER TABLE "Order" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "refundAmount" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "refundReason" TEXT;
