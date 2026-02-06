/*
  Warnings:

  - You are about to drop the column `tenantId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `assessment_type` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `attachment_urls` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `attempts_allowed` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `certificate_eligible_at_course_level` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `completion_criteria` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `content_type` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `course_id` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `due_date` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `enable_discussion` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `enable_gamification` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `enable_surveys` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_duration_minutes` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `external_activity_id` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `external_links` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `feedback_options` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `last_updated_by` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `max_score` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `media_urls` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `passing_score` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `rich_content` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `tracking_mode` on the `Module` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chapter_id` to the `Module` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_course_id_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "tenantId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "global_course_id" TEXT,
ADD COLUMN     "tenant_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "assessment_type",
DROP COLUMN "attachment_urls",
DROP COLUMN "attempts_allowed",
DROP COLUMN "certificate_eligible_at_course_level",
DROP COLUMN "completion_criteria",
DROP COLUMN "content_type",
DROP COLUMN "course_id",
DROP COLUMN "created_by",
DROP COLUMN "due_date",
DROP COLUMN "enable_discussion",
DROP COLUMN "enable_gamification",
DROP COLUMN "enable_surveys",
DROP COLUMN "estimated_duration_minutes",
DROP COLUMN "external_activity_id",
DROP COLUMN "external_links",
DROP COLUMN "feedback_options",
DROP COLUMN "last_updated_by",
DROP COLUMN "max_score",
DROP COLUMN "media_urls",
DROP COLUMN "passing_score",
DROP COLUMN "rich_content",
DROP COLUMN "tracking_mode",
ADD COLUMN     "chapter_id" TEXT NOT NULL,
ADD COLUMN     "prerequisite_module_ids" TEXT[],
ADD COLUMN     "requires_quiz_pass_to_continue" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "tenant_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "is_template" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "tenant_id" TEXT,
    "assessment_title" TEXT,
    "assessment_required" BOOLEAN NOT NULL DEFAULT false,
    "prerequisite_chapter_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateModule" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "config" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizWidget" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "passing_score" DOUBLE PRECISION,
    "attempts_allowed" INTEGER NOT NULL DEFAULT 1,
    "feedback_options" TEXT,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizWidget_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_global_course_id_fkey" FOREIGN KEY ("global_course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateModule" ADD CONSTRAINT "TemplateModule_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "CourseTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizWidget" ADD CONSTRAINT "QuizWidget_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
