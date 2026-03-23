-- V8-203/204: Add isDevoted gating flags to Course and Circle

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isDevoted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Circle" ADD COLUMN IF NOT EXISTS "isDevoted" BOOLEAN NOT NULL DEFAULT false;
