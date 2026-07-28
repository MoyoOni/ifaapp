-- AlterTable
ALTER TABLE "users" ADD COLUMN     "showInDirectory" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ConnectionRequest" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConnectionRequest_toUserId_status_idx" ON "ConnectionRequest"("toUserId", "status");

-- CreateIndex
CREATE INDEX "ConnectionRequest_fromUserId_idx" ON "ConnectionRequest"("fromUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionRequest_fromUserId_toUserId_key" ON "ConnectionRequest"("fromUserId", "toUserId");

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
