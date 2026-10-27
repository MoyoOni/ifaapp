-- FOR-007: auto-created "gathering" forum thread for a sacred-calendar event,
-- highlighted on the forum home while the event is upcoming/underway.

ALTER TABLE "SacredCalendarEvent" ADD COLUMN "gatheringThreadId" TEXT;

CREATE UNIQUE INDEX "SacredCalendarEvent_gatheringThreadId_key" ON "SacredCalendarEvent"("gatheringThreadId");
