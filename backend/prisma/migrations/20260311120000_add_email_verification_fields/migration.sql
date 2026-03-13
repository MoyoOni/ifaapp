-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailVerificationToken" TEXT,
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
