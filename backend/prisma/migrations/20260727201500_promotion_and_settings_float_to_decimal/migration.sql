-- AlterTable
ALTER TABLE "PlatformSettings" ALTER COLUMN "consultationCommissionPct" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "marketplaceCommissionPct" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "VendorPromotion" ALTER COLUMN "value" SET DATA TYPE DECIMAL(14,2);

