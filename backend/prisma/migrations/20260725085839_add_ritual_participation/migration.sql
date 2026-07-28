-- CreateTable
CREATE TABLE "RitualParticipation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intention" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RitualParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RitualParticipation_eventId_idx" ON "RitualParticipation"("eventId");

-- CreateIndex
CREATE INDEX "RitualParticipation_userId_idx" ON "RitualParticipation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RitualParticipation_eventId_userId_key" ON "RitualParticipation"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "RitualParticipation" ADD CONSTRAINT "RitualParticipation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SacredCalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RitualParticipation" ADD CONSTRAINT "RitualParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
