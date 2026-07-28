-- AlterTable
ALTER TABLE "ProductBundle" ADD COLUMN     "guideSourceUrl" TEXT,
ADD COLUMN     "reflectionThreadId" TEXT,
ADD COLUMN     "ritualGuide" TEXT,
ADD COLUMN     "supportThreadId" TEXT;

-- CreateTable
CREATE TABLE "BundleCustomizationRequest" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "haveItems" TEXT NOT NULL,
    "needItems" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "vendorResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "BundleCustomizationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BundleCustomizationRequest_bundleId_idx" ON "BundleCustomizationRequest"("bundleId");

-- CreateIndex
CREATE INDEX "BundleCustomizationRequest_requesterId_idx" ON "BundleCustomizationRequest"("requesterId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBundle_supportThreadId_key" ON "ProductBundle"("supportThreadId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBundle_reflectionThreadId_key" ON "ProductBundle"("reflectionThreadId");

-- AddForeignKey
ALTER TABLE "BundleCustomizationRequest" ADD CONSTRAINT "BundleCustomizationRequest_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ProductBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleCustomizationRequest" ADD CONSTRAINT "BundleCustomizationRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

