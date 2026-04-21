-- CreateTable: cultural_quiz_questions
CREATE TABLE "cultural_quiz_questions" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_quiz_questions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cultural_quiz_questions_isActive_idx" ON "cultural_quiz_questions"("isActive");
CREATE INDEX "cultural_quiz_questions_sortOrder_idx" ON "cultural_quiz_questions"("sortOrder");

-- Alter PlatformSettings: add quizPassThreshold
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "quizPassThreshold" INTEGER NOT NULL DEFAULT 2;

-- Alter users: add culturalQuizFailCount
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "culturalQuizFailCount" INTEGER NOT NULL DEFAULT 0;

-- Seed default questions
INSERT INTO "cultural_quiz_questions" ("id", "questionText", "options", "correctIndex", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'What is the primary purpose of the Ifá divination system?', '["Entertainment and fortune telling","A sacred framework for understanding divine wisdom and ethical guidance","A system for predicting the future with 100% accuracy","A business model to make money from clients"]', 1, 0, true, NOW(), NOW()),
  (gen_random_uuid(), 'How should one approach the teachings in restricted forum spaces?', '["As casual entertainment","With skepticism and doubt","With respect, humility, and readiness to learn from experienced practitioners","As entertainment and nothing else"]', 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'What is expected of practitioners in the Inner Circle?', '["Maximum profit from consultations","Adherence to ethical standards, continuous learning, and service to community","Keeping all knowledge secret","None of the above"]', 1, 2, true, NOW(), NOW());
