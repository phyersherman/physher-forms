-- AlterTable
ALTER TABLE "TemplateModule" ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "TemplateModuleBlock" (
    "id" TEXT NOT NULL,
    "template_module_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "config" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateModuleBlock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TemplateModuleBlock" ADD CONSTRAINT "TemplateModuleBlock_template_module_id_fkey" FOREIGN KEY ("template_module_id") REFERENCES "TemplateModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
