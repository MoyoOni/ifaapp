/*
  Warnings:

  - You are about to drop the `Prescription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_babalawoId_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_escrowId_fkey";

-- DropTable
DROP TABLE "Prescription";

-- CreateTable
CREATE TABLE "GuidancePlan" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "babalawoId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'AKOSE',
    "items" JSONB NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "platformServiceFee" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "escrowId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuidancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuidancePlan_appointmentId_key" ON "GuidancePlan"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "GuidancePlan_escrowId_key" ON "GuidancePlan"("escrowId");

-- CreateIndex
CREATE INDEX "GuidancePlan_appointmentId_idx" ON "GuidancePlan"("appointmentId");

-- CreateIndex
CREATE INDEX "GuidancePlan_babalawoId_idx" ON "GuidancePlan"("babalawoId");

-- CreateIndex
CREATE INDEX "GuidancePlan_clientId_idx" ON "GuidancePlan"("clientId");

-- CreateIndex
CREATE INDEX "GuidancePlan_status_idx" ON "GuidancePlan"("status");

-- CreateIndex
CREATE INDEX "GuidancePlan_createdAt_idx" ON "GuidancePlan"("createdAt");

-- AddForeignKey
ALTER TABLE "GuidancePlan" ADD CONSTRAINT "GuidancePlan_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidancePlan" ADD CONSTRAINT "GuidancePlan_babalawoId_fkey" FOREIGN KEY ("babalawoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidancePlan" ADD CONSTRAINT "GuidancePlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidancePlan" ADD CONSTRAINT "GuidancePlan_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
