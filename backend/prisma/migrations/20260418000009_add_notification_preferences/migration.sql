-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;