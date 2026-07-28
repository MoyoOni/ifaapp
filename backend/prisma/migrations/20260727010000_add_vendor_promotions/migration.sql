-- CreateTable
CREATE TABLE "VendorPromotion" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "value" DOUBLE PRECISION NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "eligibleProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "productId" TEXT,
    "minQuantity" INTEGER,
    "bundleProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPromotionRedemption" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "discountNgn" DOUBLE PRECISION NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPromotionRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorPromotion_vendorId_idx" ON "VendorPromotion"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPromotion_code_idx" ON "VendorPromotion"("code");

-- CreateIndex
CREATE INDEX "VendorPromotion_type_idx" ON "VendorPromotion"("type");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPromotion_vendorId_code_key" ON "VendorPromotion"("vendorId", "code");

-- CreateIndex
CREATE INDEX "VendorPromotionRedemption_promotionId_idx" ON "VendorPromotionRedemption"("promotionId");

-- CreateIndex
CREATE INDEX "VendorPromotionRedemption_orderId_idx" ON "VendorPromotionRedemption"("orderId");

-- AddForeignKey
ALTER TABLE "VendorPromotion" ADD CONSTRAINT "VendorPromotion_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPromotionRedemption" ADD CONSTRAINT "VendorPromotionRedemption_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "VendorPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

