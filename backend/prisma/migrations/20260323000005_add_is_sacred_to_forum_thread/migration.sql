-- F9-601: Add isSacred field to ForumThread for Sacred Knowledge Tag feature
ALTER TABLE "ForumThread" ADD COLUMN "isSacred" BOOLEAN NOT NULL DEFAULT false;
