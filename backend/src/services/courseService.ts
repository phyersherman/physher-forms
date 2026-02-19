import prisma from '../db/client'
import * as chapterService from './chapterService'
import * as moduleService from './moduleService'
import * as blockService from './blockService'
import { assignCourseToTenant, copyFromTemplate } from './courseDataService'

/**
 * Course Service (Facade)
 * Aggregates core course CRUD operations and delegates to specialized services
 * Maintains backward compatibility through re-exported functions
 */

/**
 * Creates a new course
 */
const createCourse = async (data: { title: string; description?: string; tenant_id?: string; chapters?: any[] }) => {
  const course = await prisma.course.create({ 
    data: { 
      title: data.title, 
      description: data.description || null, 
      tenant_id: data.tenant_id || null 
    } 
  })

  // Create chapters if provided
  if (data.chapters && data.chapters.length > 0) {
    for (const chapter of data.chapters) {
      const createdChapter = await chapterService.createChapter({
        course_id: course.id,
        title: chapter.title,
        order_index: chapter.order_index
      })

      // Create modules if provided
      if (chapter.modules && chapter.modules.length > 0) {
        for (const module of chapter.modules) {
          const createdModule = await moduleService.createModule({
            chapter_id: createdChapter.id,
            title: module.title,
            slug: module.slug,
            summary: module.summary,
            order_index: module.order_index
          })

          // Create blocks if provided
          if (module.blocks && module.blocks.length > 0) {
            for (const block of module.blocks) {
              await blockService.createBlock({
                module_id: createdModule.id,
                type: block.type,
                content: block.content,
                config: block.config,
                order_index: block.order_index
              })
            }
          }
        }
      }
    }
  }

  return getById(course.id)
}

/**
 * Lists all global courses (tenant_id is null)
 */
const listGlobalCourses = async () => {
  return prisma.course.findMany({ 
    where: { tenant_id: null }, 
    include: { chapters: { include: { modules: { include: { blocks: true } } } } } 
  })
}

/**
 * Lists all courses for a specific tenant
 */
const listByTenant = async (tenant_id: string) => {
  return prisma.course.findMany({ 
    where: { tenant_id }, 
    include: { chapters: { include: { modules: { include: { blocks: true } } } } } 
  })
}

/**
 * Gets a single course by ID with all its structure
 */
const getById = async (id: string) => {
  return prisma.course.findUnique({ 
    where: { id }, 
    include: { chapters: { include: { modules: { include: { blocks: true } } } } } 
  })
}

/**
 * Updates course basic info and/or structure
 */
const updateCourse = async (id: string, data: { title?: string; description?: string; chapters?: any[] }) => {
  // Update course basic info
  const course = await prisma.course.update({ 
    where: { id }, 
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description })
    }
  })

  // If chapters provided, sync them with existing chapters
  if (data.chapters !== undefined) {
    const existingChapters = await prisma.chapter.findMany({ where: { course_id: id } })
    const existingChapterIds = new Set(existingChapters.map(c => c.id))
    const incomingChapterIds = new Set(data.chapters.filter(c => c.id).map(c => c.id))

    // Delete chapters not in incoming data
    const chaptersToDelete = existingChapters.filter(c => !incomingChapterIds.has(c.id))
    for (const ch of chaptersToDelete) {
      await chapterService.deleteChapter(ch.id)
    }

    // Upsert chapters
    for (const chapter of data.chapters) {
      let chapterId: string
      
      if (chapter.id && existingChapterIds.has(chapter.id)) {
        // Update existing chapter
        await chapterService.updateChapter(chapter.id, {
          title: chapter.title,
          order_index: chapter.order_index
        })
        chapterId = chapter.id
      } else {
        // Create new chapter
        const created = await chapterService.createChapter({
          course_id: id,
          title: chapter.title,
          order_index: chapter.order_index
        })
        chapterId = created.id
      }

      // Handle modules
      if (chapter.modules && chapter.modules.length > 0) {
        const existingModules = await prisma.module.findMany({ where: { chapter_id: chapterId } })
        const existingModuleIds = new Set(existingModules.map((m: any) => m.id))
        const incomingModuleIds = new Set(chapter.modules.filter((m: any) => m.id).map((m: any) => m.id))

        // Delete modules not in incoming data
        const modulesToDelete = existingModules.filter(m => !incomingModuleIds.has(m.id))
        for (const mod of modulesToDelete) {
          await moduleService.deleteModule(mod.id)
        }

        // Upsert modules
        for (const module of chapter.modules) {
          let moduleId: string
          
          if (module.id && existingModuleIds.has(module.id)) {
            // Update existing module
            await moduleService.updateModule(module.id, {
              title: module.title,
              slug: module.slug,
              summary: module.summary,
              order_index: module.order_index
            })
            moduleId = module.id
          } else {
            // Create new module
            const created = await moduleService.createModule({
              chapter_id: chapterId,
              title: module.title,
              slug: module.slug,
              summary: module.summary,
              order_index: module.order_index
            })
            moduleId = created.id
          }

          // Handle blocks
          if (module.blocks && module.blocks.length > 0) {
            const existingBlocks = await prisma.block.findMany({ where: { module_id: moduleId } })
            const existingBlockIds = new Set(existingBlocks.map((b: any) => b.id))
            const incomingBlockIds = new Set(module.blocks.filter((b: any) => b.id).map((b: any) => b.id))

            // Delete blocks not in incoming data
            const blocksToDelete = existingBlocks.filter(b => !incomingBlockIds.has(b.id))
            for (const blk of blocksToDelete) {
              await blockService.deleteBlock(blk.id)
            }

            // Upsert blocks
            for (const block of module.blocks) {
              if (block.id && existingBlockIds.has(block.id)) {
                // Update existing block
                await blockService.updateBlock(block.id, {
                  type: block.type,
                  content: block.content,
                  config: block.config,
                  order_index: block.order_index
                })
              } else {
                // Create new block
                await blockService.createBlock({
                  module_id: moduleId,
                  type: block.type,
                  content: block.content,
                  config: block.config,
                  order_index: block.order_index
                })
              }
            }
          }
        }
      }
    }
  }

  return getById(id)
}

/**
 * Deletes a course
 */
const deleteCourse = async (id: string) => {
  return prisma.course.delete({ where: { id } })
}

export default { 
  // Core course CRUD
  createCourse, 
  listGlobalCourses,
  listByTenant,
  getById,
  updateCourse,
  deleteCourse,
  // Data operations (complex)
  assignCourseToTenant,
  copyFromTemplate,
  // Chapter operations (delegated)
  createChapter: chapterService.createChapter,
  getChapterById: chapterService.getChapterById,
  updateChapter: chapterService.updateChapter,
  deleteChapter: chapterService.deleteChapter,
  // Module operations (delegated)
  createModule: moduleService.createModule, 
  getModuleById: moduleService.getModuleById, 
  updateModule: moduleService.updateModule, 
  deleteModule: moduleService.deleteModule,
  // Block operations (delegated)
  createBlock: blockService.createBlock,
  updateBlock: blockService.updateBlock,
  deleteBlock: blockService.deleteBlock,
  listBlocksByModule: blockService.listBlocksByModule,
  reorderBlocks: blockService.reorderBlocks
}
