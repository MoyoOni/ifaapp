-- P1-03: push-notification.service.ts referenced users.fcmTokens throughout
-- (subscribeUser/unsubscribeUser/sendNotificationToUser/etc.) but the column
-- was never added to the schema, meaning this file has never type-checked
-- and blocked the entire integration test suite (any test that transitively
-- imports NotificationService -> PushNotificationService fails to compile).
ALTER TABLE "users" ADD COLUMN "fcmTokens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
