-- DropForeignKey
ALTER TABLE "Block" DROP CONSTRAINT "Block_module_id_fkey";

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
