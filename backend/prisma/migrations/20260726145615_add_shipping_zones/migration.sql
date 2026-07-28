-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCountry" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "weight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countries" TEXT[],
    "rateType" TEXT NOT NULL DEFAULT 'FLAT',
    "flatRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perKgRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processingTime" TEXT NOT NULL DEFAULT '3-5 business days',
    "combinedShippingDiscountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingZone_vendorId_idx" ON "ShippingZone"("vendorId");

-- AddForeignKey
ALTER TABLE "ShippingZone" ADD CONSTRAINT "ShippingZone_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
