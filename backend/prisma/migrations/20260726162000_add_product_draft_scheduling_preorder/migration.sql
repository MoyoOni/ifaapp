-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "expectedDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "isPreOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "showComingSoon" BOOLEAN NOT NULL DEFAULT false;
