-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "digitalFileKey" TEXT,
ADD COLUMN     "digitalFileName" TEXT,
ADD COLUMN     "digitalFileSizeBytes" INTEGER,
ADD COLUMN     "digitalFileUrl" TEXT;

-- CreateTable
CREATE TABLE "DigitalProductDownload" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "maxDownloads" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalProductDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalProductDownload_customerId_idx" ON "DigitalProductDownload"("customerId");

-- CreateIndex
CREATE INDEX "DigitalProductDownload_orderId_idx" ON "DigitalProductDownload"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProductDownload_orderId_productId_key" ON "DigitalProductDownload"("orderId", "productId");

-- AddForeignKey
ALTER TABLE "DigitalProductDownload" ADD CONSTRAINT "DigitalProductDownload_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalProductDownload" ADD CONSTRAINT "DigitalProductDownload_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

