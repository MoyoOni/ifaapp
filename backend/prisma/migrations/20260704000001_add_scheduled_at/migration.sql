-- P2-03: add a UTC-normalized scheduledAt alongside the existing date/time/timezone
-- string fields on Appointment and TutorSession. Backfilled here per-row inside an
-- exception-handling loop rather than a single bulk UPDATE, so that any pre-existing
-- row with a malformed date/time string or an unrecognized timezone name is simply
-- left with scheduledAt = NULL instead of aborting the whole migration on a live
-- financial platform's booking data.

ALTER TABLE "Appointment" ADD COLUMN "scheduledAt" TIMESTAMPTZ;
ALTER TABLE "TutorSession" ADD COLUMN "scheduledAt" TIMESTAMPTZ;

DO $$
DECLARE
  rec RECORD;
  computed TIMESTAMPTZ;
BEGIN
  FOR rec IN SELECT id, date, time, timezone FROM "Appointment" LOOP
    BEGIN
      computed := ((rec.date || ' ' || rec.time)::timestamp AT TIME ZONE COALESCE(rec.timezone, 'Africa/Lagos'));
      UPDATE "Appointment" SET "scheduledAt" = computed WHERE id = rec.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Appointment %: could not backfill scheduledAt from date=% time=% timezone=% (%)',
        rec.id, rec.date, rec.time, rec.timezone, SQLERRM;
    END;
  END LOOP;

  FOR rec IN SELECT id, date, time, timezone FROM "TutorSession" LOOP
    BEGIN
      computed := ((rec.date || ' ' || rec.time)::timestamp AT TIME ZONE COALESCE(rec.timezone, 'Africa/Lagos'));
      UPDATE "TutorSession" SET "scheduledAt" = computed WHERE id = rec.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'TutorSession %: could not backfill scheduledAt from date=% time=% timezone=% (%)',
        rec.id, rec.date, rec.time, rec.timezone, SQLERRM;
    END;
  END LOOP;
END $$;

CREATE INDEX "Appointment_scheduledAt_idx" ON "Appointment"("scheduledAt");
CREATE INDEX "TutorSession_scheduledAt_idx" ON "TutorSession"("scheduledAt");
