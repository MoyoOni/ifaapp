-- CreateTable
CREATE TABLE "MemorialEntry" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "message" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemorialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemorialEntry_authorId_idx" ON "MemorialEntry"("authorId");

-- CreateIndex
CREATE INDEX "MemorialEntry_isPublic_idx" ON "MemorialEntry"("isPublic");

-- AddForeignKey
ALTER TABLE "MemorialEntry" ADD CONSTRAINT "MemorialEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
