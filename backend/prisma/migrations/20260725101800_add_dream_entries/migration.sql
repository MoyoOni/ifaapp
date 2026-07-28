-- CreateTable
CREATE TABLE "DreamEntry" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "interpretationRequested" BOOLEAN NOT NULL DEFAULT false,
    "interpretation" TEXT,
    "interpretedById" TEXT,
    "interpretedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DreamEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DreamEntry_authorId_idx" ON "DreamEntry"("authorId");

-- CreateIndex
CREATE INDEX "DreamEntry_isPublic_idx" ON "DreamEntry"("isPublic");

-- CreateIndex
CREATE INDEX "DreamEntry_interpretationRequested_idx" ON "DreamEntry"("interpretationRequested");

-- AddForeignKey
ALTER TABLE "DreamEntry" ADD CONSTRAINT "DreamEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamEntry" ADD CONSTRAINT "DreamEntry_interpretedById_fkey" FOREIGN KEY ("interpretedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
