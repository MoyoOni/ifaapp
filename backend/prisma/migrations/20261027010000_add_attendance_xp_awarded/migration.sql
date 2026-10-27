-- V8-305: one-time attendance XP guard for event registrations.

ALTER TABLE "EventRegistration" ADD COLUMN "attendanceXpAwarded" BOOLEAN NOT NULL DEFAULT false;
