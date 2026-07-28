-- CreateTable
CREATE TABLE "ServiceOffering" (
    "id" TEXT NOT NULL,
    "babalawoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceAmount" DOUBLE PRECISION NOT NULL,
    "priceCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxSessionsPerDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOffering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceOffering_babalawoId_idx" ON "ServiceOffering"("babalawoId");

-- AddForeignKey
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_babalawoId_fkey" FOREIGN KEY ("babalawoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

