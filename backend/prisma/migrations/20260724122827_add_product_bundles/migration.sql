-- CreateTable
CREATE TABLE "ProductBundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProductBundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductBundle_createdBy_idx" ON "ProductBundle"("createdBy");

-- CreateIndex
CREATE INDEX "ProductBundle_status_idx" ON "ProductBundle"("status");

-- CreateIndex
CREATE INDEX "ProductBundleItem_bundleId_idx" ON "ProductBundleItem"("bundleId");

-- CreateIndex
CREATE INDEX "ProductBundleItem_productId_idx" ON "ProductBundleItem"("productId");

-- AddForeignKey
ALTER TABLE "ProductBundle" ADD CONSTRAINT "ProductBundle_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBundleItem" ADD CONSTRAINT "ProductBundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ProductBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBundleItem" ADD CONSTRAINT "ProductBundleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
