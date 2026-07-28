-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isMadeToOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "madeToOrderProcessingTime" TEXT;

-- CreateTable
CREATE TABLE "StockChangeLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "previousStock" INTEGER,
    "newStock" INTEGER,
    "source" TEXT NOT NULL,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockChangeLog_productId_idx" ON "StockChangeLog"("productId");

-- CreateIndex
CREATE INDEX "StockChangeLog_createdAt_idx" ON "StockChangeLog"("createdAt");

-- AddForeignKey
ALTER TABLE "StockChangeLog" ADD CONSTRAINT "StockChangeLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
