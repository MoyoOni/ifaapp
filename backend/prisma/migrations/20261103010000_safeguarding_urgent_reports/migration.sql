-- Safeguarding (SAFE-01/04): urgent reports sort first. Existing keyword-
-- flagged reports were the only "urgent" signal before, so carry them over.
ALTER TABLE "PractitionerComplaint" ADD COLUMN "urgent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserReport" ADD COLUMN "urgent" BOOLEAN NOT NULL DEFAULT false;
UPDATE "PractitionerComplaint" SET "urgent" = true WHERE "flaggedByKeywordRule" = true;
UPDATE "UserReport" SET "urgent" = true WHERE "flaggedByKeywordRule" = true;
