-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isCommunityCarer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WellbeingCheckIn" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WellbeingCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WellbeingCheckIn_status_idx" ON "WellbeingCheckIn"("status");

-- CreateIndex
CREATE INDEX "WellbeingCheckIn_requesterId_idx" ON "WellbeingCheckIn"("requesterId");

-- AddForeignKey
ALTER TABLE "WellbeingCheckIn" ADD CONSTRAINT "WellbeingCheckIn_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellbeingCheckIn" ADD CONSTRAINT "WellbeingCheckIn_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
