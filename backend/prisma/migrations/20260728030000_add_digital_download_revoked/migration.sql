-- AlterTable
-- VENDOR_BACKLOG.md VND-010: digital-item "revoke access on return" fix.
ALTER TABLE "DigitalProductDownload" ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false;
