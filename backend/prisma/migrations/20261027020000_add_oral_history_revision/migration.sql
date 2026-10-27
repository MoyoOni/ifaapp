-- FOR-024: revision history for oral history entries (snapshot of the
-- previous version, written alongside each content-changing edit).

-- CreateTable
CREATE TABLE "OralHistoryRevision" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "babalawoName" TEXT,
    "recordingDate" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "editedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OralHistoryRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OralHistoryRevision_entryId_createdAt_idx" ON "OralHistoryRevision"("entryId", "createdAt");

-- AddForeignKey
ALTER TABLE "OralHistoryRevision" ADD CONSTRAINT "OralHistoryRevision_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "OralHistoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OralHistoryRevision" ADD CONSTRAINT "OralHistoryRevision_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

