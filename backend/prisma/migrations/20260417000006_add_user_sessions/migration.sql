-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "location" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loggedOutAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failReason" TEXT,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");
CREATE INDEX "user_sessions_isActive_idx" ON "user_sessions"("isActive");
CREATE INDEX "user_sessions_loginAt_idx" ON "user_sessions"("loginAt");
CREATE INDEX "user_sessions_ipAddress_idx" ON "user_sessions"("ipAddress");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
