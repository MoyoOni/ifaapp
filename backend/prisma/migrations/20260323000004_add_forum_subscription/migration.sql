CREATE TABLE "ForumSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumSubscription_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ForumSubscription" ADD CONSTRAINT "ForumSubscription_userId_threadId_key" UNIQUE ("userId", "threadId");
CREATE INDEX "ForumSubscription_userId_idx" ON "ForumSubscription"("userId");
CREATE INDEX "ForumSubscription_threadId_idx" ON "ForumSubscription"("threadId");

ALTER TABLE "ForumSubscription" ADD CONSTRAINT "ForumSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumSubscription" ADD CONSTRAINT "ForumSubscription_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
