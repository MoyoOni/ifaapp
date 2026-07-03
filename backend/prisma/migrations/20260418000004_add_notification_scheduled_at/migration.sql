ALTER TABLE "Notification" ADD COLUMN "scheduledAt" TIMESTAMP(3);
CREATE INDEX "Notification_scheduledAt_idx" ON "Notification"("scheduledAt");
