-- FOR-015/FOR-017: admin-managed support directory.
CREATE TABLE "SupportResource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "url" TEXT,
    "helpsWith" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportResource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportResource_isActive_sortOrder_idx" ON "SupportResource"("isActive", "sortOrder");
