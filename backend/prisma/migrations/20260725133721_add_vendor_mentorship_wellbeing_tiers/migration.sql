-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "apprenticeshipTier" TEXT NOT NULL DEFAULT 'APPRENTICE',
ADD COLUMN     "tierUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "tierUpdatedBy" TEXT;

-- CreateTable
CREATE TABLE "VendorMentorship" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorMentorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorWellnessCheckIn" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorWellnessCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSpiritualLeave" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorSpiritualLeave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorMentorship_mentorId_idx" ON "VendorMentorship"("mentorId");

-- CreateIndex
CREATE INDEX "VendorMentorship_menteeId_idx" ON "VendorMentorship"("menteeId");

-- CreateIndex
CREATE INDEX "VendorMentorship_status_idx" ON "VendorMentorship"("status");

-- CreateIndex
CREATE INDEX "VendorWellnessCheckIn_vendorId_idx" ON "VendorWellnessCheckIn"("vendorId");

-- CreateIndex
CREATE INDEX "VendorWellnessCheckIn_createdAt_idx" ON "VendorWellnessCheckIn"("createdAt");

-- CreateIndex
CREATE INDEX "VendorSpiritualLeave_vendorId_idx" ON "VendorSpiritualLeave"("vendorId");

-- AddForeignKey
ALTER TABLE "VendorMentorship" ADD CONSTRAINT "VendorMentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorMentorship" ADD CONSTRAINT "VendorMentorship_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorWellnessCheckIn" ADD CONSTRAINT "VendorWellnessCheckIn_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSpiritualLeave" ADD CONSTRAINT "VendorSpiritualLeave_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
