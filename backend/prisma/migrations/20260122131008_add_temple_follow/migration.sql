-- AlterTable
ALTER TABLE "Temple" ADD COLUMN     "followerCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TempleFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TempleFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TempleFollow_userId_idx" ON "TempleFollow"("userId");

-- CreateIndex
CREATE INDEX "TempleFollow_templeId_idx" ON "TempleFollow"("templeId");

-- CreateIndex
CREATE UNIQUE INDEX "TempleFollow_userId_templeId_key" ON "TempleFollow"("userId", "templeId");

-- AddForeignKey
ALTER TABLE "TempleFollow" ADD CONSTRAINT "TempleFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempleFollow" ADD CONSTRAINT "TempleFollow_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
