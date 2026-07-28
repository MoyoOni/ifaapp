-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "culturalCertificationTier" TEXT NOT NULL DEFAULT 'COMMUNITY_LISTED';

-- CreateTable
CREATE TABLE "VendorCertificationApplication" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "requestedTier" TEXT NOT NULL,
    "documentation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "declineReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCertificationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorCertificationApplication_vendorId_idx" ON "VendorCertificationApplication"("vendorId");

-- CreateIndex
CREATE INDEX "VendorCertificationApplication_status_idx" ON "VendorCertificationApplication"("status");

-- AddForeignKey
ALTER TABLE "VendorCertificationApplication" ADD CONSTRAINT "VendorCertificationApplication_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

