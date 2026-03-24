-- F9-705: Add ForumTip table for micro-tip feature
CREATE TABLE "ForumTip" (
  "id"         TEXT NOT NULL,
  "postId"     TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId"   TEXT NOT NULL,
  "amount"     DOUBLE PRECISION NOT NULL,
  "currency"   TEXT NOT NULL DEFAULT 'NGN',
  "status"     TEXT NOT NULL DEFAULT 'COMPLETED',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForumTip_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "ForumTip_postId_idx" ON "ForumTip"("postId");
CREATE INDEX "ForumTip_fromUserId_idx" ON "ForumTip"("fromUserId");
CREATE INDEX "ForumTip_toUserId_idx" ON "ForumTip"("toUserId");

-- Foreign keys
ALTER TABLE "ForumTip" ADD CONSTRAINT "ForumTip_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumTip" ADD CONSTRAINT "ForumTip_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ForumTip" ADD CONSTRAINT "ForumTip_toUserId_fkey"
  FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
