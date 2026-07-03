-- CreateTable
CREATE TABLE "CircleFeedPost" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "patronOnly" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleFeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CircleFeedPost_circleId_idx" ON "CircleFeedPost"("circleId");

-- CreateIndex
CREATE INDEX "CircleFeedPost_authorId_idx" ON "CircleFeedPost"("authorId");

-- AddForeignKey
ALTER TABLE "CircleFeedPost" ADD CONSTRAINT "CircleFeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleFeedPost" ADD CONSTRAINT "CircleFeedPost_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
