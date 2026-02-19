import prisma from '../db/client'

/**
 * Course Data Service
 * Handles complex course operations like copying and template assignment
 * Maintains ID mappings and prerequisite relationships during complex operations
 */

/**
 * Maps old IDs to new IDs during copy operations
 * Used to maintain prerequisite relationships when copying courses
 */
interface IdMappings {
  moduleIdMap: Map<string, string>
  chapterIdMap: Map<string, string>
}

/**
 * Helper function to copy course structure (chapters, modules, blocks)
 * Returns ID mappings for prerequisite remapping
 */
const copyCourseStructure = async (
  sourceCourse: any,
  newCourse: any,
  tenantId: string
): Promise<IdMappings> => {
  const moduleIdMap = new Map<string, string>()
  const chapterIdMap = new Map<string, string>()

  // Copy chapters and their content
  for (const chapter of sourceCourse.chapters) {
    const newChapter = await prisma.chapter.create({
      data: {
        course_id: newCourse.id,
        title: chapter.title,
        order_index: chapter.order_index,
        tenant_id: tenantId,
        assessment_title: chapter.assessment_title || undefined,
        assessment_required: chapter.assessment_required || false,
        prerequisite_chapter_ids: [], // Will update after all chapters are created
      },
    })

    chapterIdMap.set(chapter.id, newChapter.id)

    // Copy modules in each chapter (first pass: create modules without prerequisites)
    for (const module of chapter.modules) {
      const newModule = await prisma.module.create({
        data: {
          chapter_id: newChapter.id,
          title: module.title,
          slug: module.slug,
          summary: module.summary,
          order_index: module.order_index,
          required: module.required,
          prerequisite_module_ids: [], // Will update after all modules are created
          requires_quiz_pass_to_continue: module.requires_quiz_pass_to_continue,
          tenant_id: tenantId,
        },
      })

      moduleIdMap.set(module.id, newModule.id)

      // Copy blocks in each module
      for (const block of module.blocks) {
        await prisma.block.create({
          data: {
            module_id: newModule.id,
            type: block.type,
            content: block.content,
            config: block.config,
            order_index: block.order_index,
            tenant_id: tenantId,
          },
        })
      }
    }
  }

  return { moduleIdMap, chapterIdMap }
}

/**
 * Helper function to remap prerequisites after copying
 * Uses ID mappings to update prerequisite fields to point to new IDs
 */
const remapPrerequisites = async (
  sourceCourse: any,
  idMappings: IdMappings,
  logPrefix: string
): Promise<void> => {
  const { moduleIdMap, chapterIdMap } = idMappings

  // Second pass: update prerequisites using the ID mappings
  for (const chapter of sourceCourse.chapters) {
    const newChapterId = chapterIdMap.get(chapter.id)
    if (!newChapterId) continue

    // Update chapter prerequisites
    if (chapter.prerequisite_chapter_ids?.length) {
      const remappedChapterPrereqs = chapter.prerequisite_chapter_ids
        .map((id: string) => chapterIdMap.get(id))
        .filter((id: string | undefined): id is string => !!id)

      if (remappedChapterPrereqs.length > 0) {
        console.log(
          `[${logPrefix}] Updating chapter ${newChapterId} prerequisites: ${remappedChapterPrereqs}`
        )
        await prisma.chapter.update({
          where: { id: newChapterId },
          data: { prerequisite_chapter_ids: remappedChapterPrereqs },
        })
      }
    }

    // Update module prerequisites
    for (const module of chapter.modules) {
      const newModuleId = moduleIdMap.get(module.id)
      if (newModuleId && module.prerequisite_module_ids?.length) {
        const remappedModulePrereqs = module.prerequisite_module_ids
          .map((id: string) => moduleIdMap.get(id))
          .filter((id: string | undefined): id is string => !!id)

        if (remappedModulePrereqs.length > 0) {
          console.log(
            `[${logPrefix}] Updating module ${newModuleId} prerequisites: ${remappedModulePrereqs}`
          )
          await prisma.module.update({
            where: { id: newModuleId },
            data: { prerequisite_module_ids: remappedModulePrereqs },
          })
        }
      }
    }
  }
}

/**
 * Assigns a global course to a specific tenant
 * Creates a copy of the course with all its structure in the tenant space
 */
export const assignCourseToTenant = async (
  globalCourseId: string,
  tenantId: string,
  overrideTitle?: string
) => {
  try {
    // Get the global course with all its structure
    const globalCourse = await prisma.course.findUnique({
      where: { id: globalCourseId },
      include: {
        chapters: {
          include: {
            modules: {
              include: {
                blocks: true,
              },
            },
          },
        },
      },
    })

    if (!globalCourse) throw new Error('Course not found')

    // Check if already assigned
    const existing = await prisma.course.findFirst({
      where: {
        global_course_id: globalCourseId,
        tenant_id: tenantId,
      },
    })
    if (existing) throw new Error('Course already assigned to this tenant')

    console.log(
      `[assignCourseToTenant] Starting copy of course ${globalCourseId} to tenant ${tenantId}`
    )

    // Create new tenant-specific course
    const newCourse = await prisma.course.create({
      data: {
        title: overrideTitle || globalCourse.title,
        description: globalCourse.description,
        tenant_id: tenantId,
        global_course_id: globalCourseId,
      },
    })

    console.log(`[assignCourseToTenant] Created new course ${newCourse.id}`)

    // Copy course structure
    const idMappings = await copyCourseStructure(globalCourse, newCourse, tenantId)

    console.log(
      `[assignCourseToTenant] Created ${idMappings.chapterIdMap.size} chapters and ${idMappings.moduleIdMap.size} modules`
    )

    // Remap prerequisites
    await remapPrerequisites(globalCourse, idMappings, 'assignCourseToTenant')

    console.log(`[assignCourseToTenant] Successfully completed course copy`)

    // Return the complete new course
    const courseService = require('./courseService').default
    return courseService.getById(newCourse.id)
  } catch (error) {
    console.error(`[assignCourseToTenant] Error:`, error)
    throw error
  }
}

/**
 * Creates a new course from a template
 * Copies the template's structure to a new course in the specified tenant
 */
export const copyFromTemplate = async (
  templateId: string,
  data: { title: string; description?: string; tenant_id: string }
) => {
  try {
    console.log(
      `[copyFromTemplate] Starting copy of template ${templateId} to tenant ${data.tenant_id}`
    )

    // Get the template course with all its structure
    const template = await prisma.course.findUnique({
      where: { id: templateId },
      include: {
        chapters: {
          include: {
            modules: {
              include: {
                blocks: true,
              },
            },
          },
        },
      },
    })

    if (!template) throw new Error('Template not found')

    // Create new course in the target tenant
    const newCourse = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description || null,
        tenant_id: data.tenant_id,
      },
    })

    console.log(`[copyFromTemplate] Created new course ${newCourse.id}`)

    // Copy course structure
    const idMappings = await copyCourseStructure(template, newCourse, data.tenant_id)

    console.log(
      `[copyFromTemplate] Created ${idMappings.chapterIdMap.size} chapters and ${idMappings.moduleIdMap.size} modules`
    )

    // Remap prerequisites
    await remapPrerequisites(template, idMappings, 'copyFromTemplate')

    console.log(`[copyFromTemplate] Successfully completed course copy`)

    // Return the complete new course
    const courseService = require('./courseService').default
    return courseService.getById(newCourse.id)
  } catch (error) {
    console.error(`[copyFromTemplate] Error:`, error)
    throw error
  }
}
