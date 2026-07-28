-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "reviewRequestSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN     "vendorRespondedAt" TIMESTAMP(3),
ADD COLUMN     "vendorResponse" TEXT;
