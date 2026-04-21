CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "userId" TEXT,
  "role" TEXT,
  "data" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_event_idx" ON "AnalyticsEvent"("event");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
