/*
  Warnings:

  - You are about to drop the column `content` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Module` table. All the data in the column will be lost.
  - Added the required column `course_id` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `Module` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Module` table without a default value. This is not possible if the table is not empty.

*/
-- Add new columns first
ALTER TABLE "Module" ADD COLUMN     "assessment_type" TEXT,
ADD COLUMN     "attachment_urls" TEXT[],
ADD COLUMN     "attempts_allowed" INTEGER DEFAULT 1,
ADD COLUMN     "certificate_eligible_at_course_level" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completion_criteria" TEXT NOT NULL DEFAULT 'viewed',
ADD COLUMN     "content_type" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "enable_discussion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enable_gamification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enable_surveys" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estimated_duration_minutes" INTEGER,
ADD COLUMN     "external_activity_id" TEXT,
ADD COLUMN     "external_links" TEXT[],
ADD COLUMN     "feedback_options" TEXT,
ADD COLUMN     "last_updated_by" TEXT,
ADD COLUMN     "max_score" DOUBLE PRECISION,
ADD COLUMN     "media_urls" TEXT[],
ADD COLUMN     "order_index" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passing_score" DOUBLE PRECISION,
ADD COLUMN     "required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rich_content" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "tenant_id" TEXT,
ADD COLUMN     "tracking_mode" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Populate new columns
UPDATE "Module" SET "course_id" = "courseId", "tenant_id" = (SELECT "tenantId" FROM "Course" WHERE "id" = "courseId");

-- Make required
ALTER TABLE "Module" ALTER COLUMN "course_id" SET NOT NULL,
ALTER COLUMN "tenant_id" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_courseId_fkey";

-- Drop old columns
ALTER TABLE "Module" DROP COLUMN "content",
DROP COLUMN "courseId";

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
