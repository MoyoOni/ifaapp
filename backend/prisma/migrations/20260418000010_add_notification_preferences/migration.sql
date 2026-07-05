-- This migration is byte-for-byte identical to 20260418000009_add_notification_preferences
-- (same table, index, and FK) -- an accidental duplicate that was never caught because
-- `prisma migrate deploy` had never been run against a fresh database until this was found.
-- Wrapped in an existence check so it's a safe no-op wherever 20260418000009 already ran,
-- rather than rewriting/deleting already-applied migration history.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'NotificationPreferences') THEN
    CREATE TABLE "NotificationPreferences" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "emailBooking" BOOLEAN NOT NULL DEFAULT true,
        "emailReminder" BOOLEAN NOT NULL DEFAULT true,
        "emailDigest" BOOLEAN NOT NULL DEFAULT false,
        "emailPlan" BOOLEAN NOT NULL DEFAULT true,
        "emailMessages" BOOLEAN NOT NULL DEFAULT true,
        "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
        "pushReminder" BOOLEAN NOT NULL DEFAULT true,
        "pushMessages" BOOLEAN NOT NULL DEFAULT true,
        "pushFollowup" BOOLEAN NOT NULL DEFAULT true,
        "pushForum" BOOLEAN NOT NULL DEFAULT false,
        "pushCircles" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

    ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
