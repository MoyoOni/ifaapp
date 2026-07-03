-- CreateTable
CREATE TABLE "ConsultationNote" (
    "id" TEXT NOT NULL,
    "babalawoId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultationNote_babalawoId_idx" ON "ConsultationNote"("babalawoId");

-- CreateIndex
CREATE INDEX "ConsultationNote_clientId_idx" ON "ConsultationNote"("clientId");

-- CreateIndex
CREATE INDEX "ConsultationNote_createdAt_idx" ON "ConsultationNote"("createdAt");

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_babalawoId_fkey" 
    FOREIGN KEY ("babalawoId") REFERENCES "users"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "users"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;