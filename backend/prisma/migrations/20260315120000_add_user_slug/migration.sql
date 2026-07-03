-- AlterTable
ALTER TABLE "users" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");

-- CreateIndex
CREATE INDEX "users_slug_idx" ON "users"("slug");
