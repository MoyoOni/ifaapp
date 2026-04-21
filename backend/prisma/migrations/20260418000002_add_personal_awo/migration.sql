-- EXP-020: Personal Awo relationship
ALTER TABLE "users" ADD COLUMN "personalAwoId" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_personalAwoId_fkey" FOREIGN KEY ("personalAwoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "users_personalAwoId_idx" ON "users"("personalAwoId");
