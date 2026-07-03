-- P0-03: soft-delete for Document (documents.service.ts previously hard-deleted
-- rows on `deleteDocument`, permanently destroying uploaded files' metadata
-- with no recovery path).
ALTER TABLE "Document" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");
