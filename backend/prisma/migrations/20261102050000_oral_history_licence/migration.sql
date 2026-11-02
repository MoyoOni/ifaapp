-- FOR-024: the licence a member grants when submitting a story, and withdrawal.
ALTER TABLE "OralHistoryEntry" ADD COLUMN "licenceVersion" TEXT;
ALTER TABLE "OralHistoryEntry" ADD COLUMN "licenceAcceptedAt" TIMESTAMP(3);
ALTER TABLE "OralHistoryEntry" ADD COLUMN "withdrawnAt" TIMESTAMP(3);
