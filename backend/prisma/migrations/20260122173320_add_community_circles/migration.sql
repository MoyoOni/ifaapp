-- CreateTable
CREATE TABLE "Circle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "privacy" TEXT NOT NULL DEFAULT 'PUBLIC',
    "topics" TEXT[],
    "location" TEXT,
    "avatar" TEXT,
    "banner" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleMember" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "CircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Circle_slug_key" ON "Circle"("slug");

-- CreateIndex
CREATE INDEX "Circle_creatorId_idx" ON "Circle"("creatorId");

-- CreateIndex
CREATE INDEX "Circle_slug_idx" ON "Circle"("slug");

-- CreateIndex
CREATE INDEX "Circle_privacy_idx" ON "Circle"("privacy");

-- CreateIndex
CREATE INDEX "Circle_active_idx" ON "Circle"("active");

-- CreateIndex
CREATE INDEX "Circle_topics_idx" ON "Circle"("topics");

-- CreateIndex
CREATE INDEX "CircleMember_circleId_idx" ON "CircleMember"("circleId");

-- CreateIndex
CREATE INDEX "CircleMember_userId_idx" ON "CircleMember"("userId");

-- CreateIndex
CREATE INDEX "CircleMember_status_idx" ON "CircleMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CircleMember_circleId_userId_key" ON "CircleMember"("circleId", "userId");

-- AddForeignKey
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
