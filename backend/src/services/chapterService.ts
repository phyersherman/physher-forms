import prisma from '../db/client'

/**
 * Chapter Service
 * Handles all chapter-related operations
 */

export const createChapter = async (data: {
  course_id: string
  title: string
  order_index?: number
  tenant_id?: string
}) => {
  return prisma.chapter.create({
    data: {
      course_id: data.course_id,
      title: data.title,
      order_index: data.order_index || 0,
      tenant_id: data.tenant_id || null,
    },
  })
}

export const getChapterById = async (id: string) => {
  return prisma.chapter.findUnique({
    where: { id },
    include: { modules: { include: { blocks: true } } },
  })
}

export const updateChapter = async (
  id: string,
  data: { title?: string; order_index?: number }
) => {
  return prisma.chapter.update({ where: { id }, data })
}

export const deleteChapter = async (id: string) => {
  // Get all modules in this chapter
  const modules = await prisma.module.findMany({
    where: { chapter_id: id },
    include: { blocks: true }
  })

  // Delete all blocks in all modules
  for (const module of modules) {
    await prisma.block.deleteMany({ where: { module_id: module.id } })
  }

  // Delete all modules
  await prisma.module.deleteMany({ where: { chapter_id: id } })

  // Finally delete the chapter
  return prisma.chapter.delete({ where: { id } })
}
