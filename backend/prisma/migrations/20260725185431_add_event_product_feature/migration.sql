-- AlterTable
ALTER TABLE "SacredCalendarEvent" ADD COLUMN     "reflectionThreadId" TEXT;

-- CreateTable
CREATE TABLE "EventProductFeature" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "EventProductFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventProductFeature_eventId_idx" ON "EventProductFeature"("eventId");

-- CreateIndex
CREATE INDEX "EventProductFeature_status_idx" ON "EventProductFeature"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EventProductFeature_eventId_productId_key" ON "EventProductFeature"("eventId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "SacredCalendarEvent_reflectionThreadId_key" ON "SacredCalendarEvent"("reflectionThreadId");

-- AddForeignKey
ALTER TABLE "EventProductFeature" ADD CONSTRAINT "EventProductFeature_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SacredCalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventProductFeature" ADD CONSTRAINT "EventProductFeature_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventProductFeature" ADD CONSTRAINT "EventProductFeature_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

