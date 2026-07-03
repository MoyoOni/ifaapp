-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "manuallyVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manuallyVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "manuallyVerifiedBy" TEXT,
ADD COLUMN     "webhookReceived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "webhookReceivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "templeId" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "artisanHeritageProof" TEXT,
ADD COLUMN     "culturalAuthenticityNotes" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "yorubaProficiencyLevel" TEXT,
ADD COLUMN     "yorubaProficiencyProof" TEXT;

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "babalawoId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'AKOSE',
    "items" JSONB NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
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

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Temple" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yorubaName" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "history" TEXT,
    "mission" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "location" TEXT,
    "coordinates" JSONB,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "bannerImage" TEXT,
    "images" TEXT[],
    "founderId" TEXT,
    "foundedYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "type" TEXT NOT NULL DEFAULT 'STUDY_CIRCLE',
    "lineage" TEXT,
    "tradition" TEXT,
    "specialties" TEXT[],
    "socialLinks" JSONB,
    "babalawoCount" INTEGER NOT NULL DEFAULT 0,
    "clientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Temple_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_appointmentId_key" ON "Prescription"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_escrowId_key" ON "Prescription"("escrowId");

-- CreateIndex
CREATE INDEX "Prescription_appointmentId_idx" ON "Prescription"("appointmentId");

-- CreateIndex
CREATE INDEX "Prescription_babalawoId_idx" ON "Prescription"("babalawoId");

-- CreateIndex
CREATE INDEX "Prescription_clientId_idx" ON "Prescription"("clientId");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- CreateIndex
CREATE INDEX "Prescription_createdAt_idx" ON "Prescription"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Temple_slug_key" ON "Temple"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Temple_founderId_key" ON "Temple"("founderId");

-- CreateIndex
CREATE INDEX "Temple_slug_idx" ON "Temple"("slug");

-- CreateIndex
CREATE INDEX "Temple_status_idx" ON "Temple"("status");

-- CreateIndex
CREATE INDEX "Temple_verified_idx" ON "Temple"("verified");

-- CreateIndex
CREATE INDEX "Temple_city_state_idx" ON "Temple"("city", "state");

-- CreateIndex
CREATE INDEX "Temple_founderId_idx" ON "Temple"("founderId");

-- CreateIndex
CREATE INDEX "Temple_type_idx" ON "Temple"("type");

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Transaction_webhookReceived_idx" ON "Transaction"("webhookReceived");

-- CreateIndex
CREATE INDEX "User_templeId_idx" ON "User"("templeId");

-- CreateIndex
CREATE INDEX "Vendor_createdAt_idx" ON "Vendor"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_babalawoId_fkey" FOREIGN KEY ("babalawoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Temple" ADD CONSTRAINT "Temple_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
