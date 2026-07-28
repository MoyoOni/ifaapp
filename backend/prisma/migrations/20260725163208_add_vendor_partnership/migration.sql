-- CreateTable
CREATE TABLE "VendorPartnership" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "memberVendorIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plannedEventId" TEXT,
    "coordinationThreadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPartnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorPartnership_coordinationThreadId_key" ON "VendorPartnership"("coordinationThreadId");

-- CreateIndex
CREATE INDEX "VendorPartnership_createdBy_idx" ON "VendorPartnership"("createdBy");

-- CreateIndex
CREATE INDEX "VendorPartnership_plannedEventId_idx" ON "VendorPartnership"("plannedEventId");

-- AddForeignKey
ALTER TABLE "VendorPartnership" ADD CONSTRAINT "VendorPartnership_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPartnership" ADD CONSTRAINT "VendorPartnership_plannedEventId_fkey" FOREIGN KEY ("plannedEventId") REFERENCES "SacredCalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

