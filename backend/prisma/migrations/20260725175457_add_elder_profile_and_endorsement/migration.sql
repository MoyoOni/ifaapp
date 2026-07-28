-- AlterTable
ALTER TABLE "ForumThread" ADD COLUMN     "isTeachingSeries" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seriesName" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "availabilityNote" TEXT,
ADD COLUMN     "specialization" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ElderEndorsement" (
    "id" TEXT NOT NULL,
    "endorserId" TEXT NOT NULL,
    "endorseeId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElderEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ElderEndorsement_endorseeId_idx" ON "ElderEndorsement"("endorseeId");

-- CreateIndex
CREATE UNIQUE INDEX "ElderEndorsement_endorserId_endorseeId_key" ON "ElderEndorsement"("endorserId", "endorseeId");

-- AddForeignKey
ALTER TABLE "ElderEndorsement" ADD CONSTRAINT "ElderEndorsement_endorserId_fkey" FOREIGN KEY ("endorserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElderEndorsement" ADD CONSTRAINT "ElderEndorsement_endorseeId_fkey" FOREIGN KEY ("endorseeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

