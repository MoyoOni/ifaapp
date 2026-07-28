-- AlterTable
ALTER TABLE "CircleSuggestion" ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "threadId" DROP NOT NULL;

