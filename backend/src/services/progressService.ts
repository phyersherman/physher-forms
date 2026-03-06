import prisma from '../db/client'
import * as certificateService from './certificate-service'

/**
 * Progress Service
 * Handles tracking and retrieving course progression including module, chapter, and course completions
 */

/**
 * Helper: Get the chapter containing a module
 */
const getChapterContainingModule = async (moduleId: string, courseId: string, _tenantId: string) => {
  const chapter = await prisma.chapter.findFirst({
    where: {
      course_id: courseId,
      modules: {
        some: {
          id: moduleId,
        },
      },
    },
    include: {
      modules: {
        orderBy: { order_index: 'asc' },
      },
    },
  })
  return chapter
}

/**
 * Helper: Check if a module is the last module in its chapter
 */
const isLastModuleInChapter = (chapter: any, moduleId: string): boolean => {
  if (!chapter || !chapter.modules || chapter.modules.length === 0) return false
  return chapter.modules[chapter.modules.length - 1].id === moduleId
}

/**
 * Helper: Get the next chapter in the course
 */
const getNextChapter = async (currentChapterId: string, courseId: string, _tenantId: string) => {
  // Get the current chapter's order
  const currentChapter = await prisma.chapter.findUnique({
    where: { id: currentChapterId },
    select: { order_index: true },
  })

  if (!currentChapter) return null

  // Find the next chapter
  const nextChapter = await prisma.chapter.findFirst({
    where: {
      course_id: courseId,
      order_index: {
        gt: currentChapter.order_index,
      },
    },
    orderBy: { order_index: 'asc' },
    include: {
      modules: {
        orderBy: { order_index: 'asc' },
      },
    },
  })

  return nextChapter || null
}

/**
 * Helper: Check if all required modules in a course are completed
 */
const areAllRequiredModulesCompleted = async (
  courseId: string,
  userId: string,
  tenantId: string
): Promise<boolean> => {
  // Get all required modules in this course by finding chapters first
  const chapters = await prisma.chapter.findMany({
    where: {
      course_id: courseId,
    },
    include: {
      modules: {
        where: { required: true },
        select: { id: true },
      },
    },
  })

  const requiredModuleIds = chapters.flatMap(c => c.modules.map((m: any) => m.id))

  if (requiredModuleIds.length === 0) return true

  // Check which are completed
  const completedModules = await prisma.moduleCompletion.findMany({
    where: {
      courseId,
      userId,
      tenantId,
      moduleId: {
        in: requiredModuleIds,
      },
    },
    select: { moduleId: true },
  })

  const completedModuleIds = new Set(completedModules.map(c => c.moduleId))
  return requiredModuleIds.every(id => completedModuleIds.has(id))
}

/**
 * Mark a module as completed
 * Also handles:
 * - Auto-completing the chapter if this is the last module
 * - Auto-completing the course if all required modules are done
 * - Returning next chapter info for navigation
 */
const completeModule = async (moduleId: string, userId: string, courseId: string, tenantId: string) => {
  // Check if already completed
  const existing = await prisma.moduleCompletion.findFirst({
    where: { moduleId, userId, courseId },
  })

  if (existing) {
    // Return enriched response even for already-completed modules
    const chapter = await getChapterContainingModule(moduleId, courseId, tenantId)
    let nextChapter = null
    if (chapter && isLastModuleInChapter(chapter, moduleId)) {
      nextChapter = await getNextChapter(chapter.id, courseId, tenantId)
    }
    return {
      ...existing,
      chapterId: chapter?.id,
      isLastModuleInChapter: chapter ? isLastModuleInChapter(chapter, moduleId) : false,
      nextChapter: nextChapter ? {
        id: nextChapter.id,
        title: nextChapter.title,
        order_index: nextChapter.order_index,
        modules: nextChapter.modules.map((m: any) => ({
          id: m.id,
          title: m.title,
          order_index: m.order_index,
        })),
      } : null,
      courseCompleted: false,
    }
  }

  // Check if this module requires a quiz pass before it can be marked complete
  const moduleData = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { blocks: { where: { type: 'quiz' } } },
  })

  if (moduleData?.requires_quiz_pass_to_continue) {
    const quizBlock = moduleData.blocks[0]
    if (quizBlock) {
      const passedAttempt = await prisma.quizAttempt.findFirst({
        where: { blockId: quizBlock.id, userId, passed: true },
      })
      if (!passedAttempt) {
        throw new Error('You must pass the quiz in this module before marking it complete.')
      }
    }
  }

  // Mark module as completed
  const moduleCompletion = await prisma.moduleCompletion.create({
    data: {
      moduleId,
      userId,
      courseId,
      tenantId,
    },
  })

  // Get the chapter containing this module
  const chapter = await getChapterContainingModule(moduleId, courseId, tenantId)

  let nextChapter = null
  let courseCompleted = false

  if (chapter) {
    // Check if this is the last module in the chapter
    if (isLastModuleInChapter(chapter, moduleId)) {
      // Auto-mark the chapter as completed
      await completeChapter(chapter.id, userId, courseId, tenantId)
      // Check if there's a next chapter
      nextChapter = await getNextChapter(chapter.id, courseId, tenantId)
    }
  }

  // Check if all required modules are now completed
  const allRequiredCompleted = await areAllRequiredModulesCompleted(courseId, userId, tenantId)
  if (allRequiredCompleted) {
    try {
      await completeCourse(courseId, userId, tenantId)
      courseCompleted = true
    } catch (err) {
      console.error('Error auto-completing course:', err)
    }
  }

  return {
    ...moduleCompletion,
    chapterId: chapter?.id,
    isLastModuleInChapter: chapter ? isLastModuleInChapter(chapter, moduleId) : false,
    nextChapter: nextChapter ? {
      id: nextChapter.id,
      title: nextChapter.title,
      order_index: nextChapter.order_index,
      modules: nextChapter.modules.map((m: any) => ({
        id: m.id,
        title: m.title,
        order_index: m.order_index,
      })),
    } : null,
    courseCompleted,
  }
}

/**
 * Mark a chapter as completed
 */
const completeChapter = async (chapterId: string, userId: string, courseId: string, tenantId: string) => {
  // Check if already completed
  const existing = await prisma.chapterCompletion.findFirst({
    where: { chapterId, userId, courseId },
  })

  if (existing) {
    return existing
  }

  return await prisma.chapterCompletion.create({
    data: {
      chapterId,
      userId,
      courseId,
      tenantId,
    },
  })
}

/**
 * Complete a course (mark enrollment as completed and generate certificate)
 */
const completeCourse = async (courseId: string, userId: string, tenantId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      tenantId_courseId_userId: { tenantId, courseId, userId },
    },
  })

  if (!enrollment) {
    throw new Error('Enrollment not found')
  }

  // Mark as completed
  const updatedEnrollment = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      completedAt: new Date(),
    },
  })

  // Generate certificate automatically
  try {
    const certificate = await certificateService.generateCertificate({
      enrollmentId: enrollment.id,
      userId,
      courseId,
      tenantId,
    })

    // Link certificate to enrollment
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { certificateId: certificate.id },
    })

    return { ...updatedEnrollment, certificateId: certificate.id }
  } catch (err) {
    console.error('Error generating certificate:', err)
    // Return enrollment even if certificate generation fails
    return updatedEnrollment
  }
}

/**
 * Get course progress for a user
 * Returns completed modules, chapters, and overall progress percentage
 */
const getCourseProgress = async (courseId: string, userId: string, tenantId: string) => {
  // Get the course with all chapters and modules
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        include: {
          modules: true,
        },
      },
    },
  })

  if (!course) {
    throw new Error('Course not found')
  }

  // Count total modules and chapters
  let totalModules = 0
  let totalChapters = course.chapters.length
  for (const chapter of course.chapters) {
    totalModules += chapter.modules.length
  }

  // Get completed modules and chapters
  const completedModulesRaw = await prisma.moduleCompletion.findMany({
    where: { userId, courseId },
  })
  const completedChaptersRaw = await prisma.chapterCompletion.findMany({
    where: { userId, courseId },
  })

  const completedModules = new Set(completedModulesRaw.map(c => c.moduleId))
  const completedChapters = new Set(completedChaptersRaw.map(c => c.chapterId))

  // Calculate progress percentage
  const moduleProgressPercent = totalModules > 0 ? (completedModules.size / totalModules) * 100 : 0
  const chapterProgressPercent = totalChapters > 0 ? (completedChapters.size / totalChapters) * 100 : 0

  // Check course completion
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      tenantId_courseId_userId: { tenantId, courseId, userId },
    },
  })

  return {
    courseId,
    userId,
    totalModules,
    totalChapters,
    completedModulesCount: completedModules.size,
    completedChaptersCount: completedChapters.size,
    completedModules: Array.from(completedModules),
    completedChapters: Array.from(completedChapters),
    moduleProgressPercent: Math.round(moduleProgressPercent),
    chapterProgressPercent: Math.round(chapterProgressPercent),
    courseCompleted: enrollment?.completedAt ? true : false,
    courseCompletedAt: enrollment?.completedAt,
    certificateId: enrollment?.certificateId || null,
  }
}

/**
 * Get chapters and modules progress for a user in a course
 * Returns chapter structure with completion status
 */
const getCourseStructureWithProgress = async (courseId: string, userId: string) => {
  // Get the course with all chapters and modules
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        include: {
          modules: {
            orderBy: { order_index: 'asc' },
          },
        },
        orderBy: { order_index: 'asc' },
      },
    },
  })

  if (!course) {
    throw new Error('Course not found')
  }

  // Get completed modules and chapters
  const completedModulesRaw = await prisma.moduleCompletion.findMany({
    where: { userId, courseId },
  })
  const completedChaptersRaw = await prisma.chapterCompletion.findMany({
    where: { userId, courseId },
  })

  const completedModules = new Set(completedModulesRaw.map(c => c.moduleId))
  const completedChapters = new Set(completedChaptersRaw.map(c => c.chapterId))

  // Build structure with progress
  const chaptersWithProgress = course.chapters.map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    order_index: chapter.order_index,
    completed: completedChapters.has(chapter.id),
    modules: chapter.modules.map(module => ({
      id: module.id,
      title: module.title,
      order_index: module.order_index,
      completed: completedModules.has(module.id),
    })),
  }))

  return chaptersWithProgress
}

/**
 * Check if a module is the first module of a chapter
 */
const isFirstModule = (chapter: any, moduleId: string): boolean => {
  return chapter.modules.length > 0 && chapter.modules[0].id === moduleId
}

/**
 * Check if a module is the last module of a chapter
 */
const isLastModule = (chapter: any, moduleId: string): boolean => {
  return chapter.modules.length > 0 && chapter.modules[chapter.modules.length - 1].id === moduleId
}

export default {
  completeModule,
  completeChapter,
  completeCourse,
  getCourseProgress,
  getCourseStructureWithProgress,
  isFirstModule,
  isLastModule,
}
