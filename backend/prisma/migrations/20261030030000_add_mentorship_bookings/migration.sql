-- SHOP_BACKLOG.md MSP-023: paid mentorship sessions (booked and paid here, held elsewhere).
-- AlterTable
ALTER TABLE "ServiceOffering" ADD COLUMN     "isMentorship" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionCount" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "MentorshipBooking" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "babalawoId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "sessionsTotal" INTEGER NOT NULL DEFAULT 1,
    "sessionsHeld" INTEGER NOT NULL DEFAULT 0,
    "sessionsConfirmed" INTEGER NOT NULL DEFAULT 0,
    "clientNote" TEXT,
    "meetingLink" TEXT,
    "meetingDetails" TEXT,
    "escrowId" TEXT,
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MentorshipBooking_babalawoId_status_idx" ON "MentorshipBooking"("babalawoId", "status");

-- CreateIndex
CREATE INDEX "MentorshipBooking_clientId_status_idx" ON "MentorshipBooking"("clientId", "status");

-- AddForeignKey
ALTER TABLE "MentorshipBooking" ADD CONSTRAINT "MentorshipBooking_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "ServiceOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipBooking" ADD CONSTRAINT "MentorshipBooking_babalawoId_fkey" FOREIGN KEY ("babalawoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipBooking" ADD CONSTRAINT "MentorshipBooking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

