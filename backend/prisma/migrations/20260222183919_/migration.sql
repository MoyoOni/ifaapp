/*
  Warnings:

  - A unique constraint covering the columns `[suggestionThreadId]` on the table `Circle` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "topic" TEXT;

-- AlterTable
ALTER TABLE "Circle" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "suggestedBy" TEXT,
ADD COLUMN     "suggestionThreadId" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "scanMethod" TEXT,
ADD COLUMN     "scanTimestamp" TIMESTAMP(3),
ADD COLUMN     "threatDetected" BOOLEAN,
ADD COLUMN     "threatName" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "adminSubRole" TEXT,
ADD COLUMN     "availability" JSONB;

-- CreateTable
CREATE TABLE "CircleSuggestion" (
    "id" TEXT NOT NULL,
    "suggestedBy" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "circleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceInfo" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CircleSuggestion_threadId_key" ON "CircleSuggestion"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "CircleSuggestion_circleId_key" ON "CircleSuggestion"("circleId");

-- CreateIndex
CREATE INDEX "CircleSuggestion_status_idx" ON "CircleSuggestion"("status");

-- CreateIndex
CREATE INDEX "CircleSuggestion_suggestedBy_idx" ON "CircleSuggestion"("suggestedBy");

-- CreateIndex
CREATE INDEX "CircleSuggestion_threadId_idx" ON "CircleSuggestion"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_active_idx" ON "DeviceToken"("userId", "active");

-- CreateIndex
CREATE INDEX "DeviceToken_platform_idx" ON "DeviceToken"("platform");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Circle_suggestionThreadId_key" ON "Circle"("suggestionThreadId");

-- CreateIndex
CREATE INDEX "Circle_status_idx" ON "Circle"("status");

-- AddForeignKey
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_suggestedBy_fkey" FOREIGN KEY ("suggestedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_suggestionThreadId_fkey" FOREIGN KEY ("suggestionThreadId") REFERENCES "ForumThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleSuggestion" ADD CONSTRAINT "CircleSuggestion_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleSuggestion" ADD CONSTRAINT "CircleSuggestion_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleSuggestion" ADD CONSTRAINT "CircleSuggestion_suggestedBy_fkey" FOREIGN KEY ("suggestedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleSuggestion" ADD CONSTRAINT "CircleSuggestion_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
