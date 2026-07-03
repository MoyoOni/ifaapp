-- CreateTable
CREATE TABLE "PostAcknowledgment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostAcknowledgment_postId_idx" ON "PostAcknowledgment"("postId");

-- CreateIndex
CREATE INDEX "PostAcknowledgment_userId_idx" ON "PostAcknowledgment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostAcknowledgment_postId_userId_key" ON "PostAcknowledgment"("postId", "userId");

-- AddForeignKey
ALTER TABLE "PostAcknowledgment" ADD CONSTRAINT "PostAcknowledgment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAcknowledgment" ADD CONSTRAINT "PostAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
