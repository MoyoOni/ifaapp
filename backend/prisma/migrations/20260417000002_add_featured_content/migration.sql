-- ADM-016: Add isFeatured + featuredUntil to ForumThread, Product, Course, Circle

ALTER TABLE "ForumThread" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ForumThread" ADD COLUMN "featuredUntil" TIMESTAMP(3);

ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "featuredUntil" TIMESTAMP(3);

ALTER TABLE "Course" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "featuredUntil" TIMESTAMP(3);

ALTER TABLE "Circle" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Circle" ADD COLUMN "featuredUntil" TIMESTAMP(3);

CREATE INDEX "ForumThread_isFeatured_idx" ON "ForumThread"("isFeatured");
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");
CREATE INDEX "Course_isFeatured_idx" ON "Course"("isFeatured");
CREATE INDEX "Circle_isFeatured_idx" ON "Circle"("isFeatured");
