-- Marketing email is opt-in. NotificationPreferences rows were created with
-- emailMarketing = true by default, and the preferences API was never
-- registered, so no member can have chosen `true` themselves: reset it.
UPDATE "NotificationPreferences" SET "emailMarketing" = false WHERE "emailMarketing" = true;
