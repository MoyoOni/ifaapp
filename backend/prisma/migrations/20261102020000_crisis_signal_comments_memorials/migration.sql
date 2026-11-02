-- Z1-803: crisis language in circle comments and on the remembrance wall
-- reaches the admin crisis queue (previously only forum and circle posts).
ALTER TABLE "CircleFeedComment" ADD COLUMN "hasCrisisSignal" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "CircleFeedComment_hasCrisisSignal_idx" ON "CircleFeedComment"("hasCrisisSignal");
ALTER TABLE "MemorialEntry" ADD COLUMN "hasCrisisSignal" BOOLEAN NOT NULL DEFAULT false;
