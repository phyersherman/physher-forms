import { Request, Response } from 'express'
import progressService from '../services/progressService'

/**
 * POST /modules/:moduleId/complete
 * Mark a module as completed
 * Also handles auto-completing chapters and courses, and returns next chapter for navigation
 */
export const completeModule = async (req: Request, res: Response) => {
  try {
    const moduleId = Array.isArray(req.params.moduleId) ? req.params.moduleId[0] : req.params.moduleId
    const { courseId } = req.body
    const userId = req.user?.id
    const tenantId = req.user?.tenantId

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!moduleId || !courseId) {
      return res.status(400).json({ error: 'Missing moduleId or courseId' })
    }

    const completion = await progressService.completeModule(moduleId, userId, courseId, tenantId)
    
    // Return completion data along with chapter/course completion info
    res.json({
      success: true,
      moduleCompletion: completion,
      // Client can use these to handle UI navigation and celebrations
      chapterCompleted: completion.isLastModuleInChapter,
      nextChapter: completion.nextChapter,
      courseCompleted: completion.courseCompleted,
    })
  } catch (error: any) {
    console.error('Error completing module:', error)
    const status = error.message?.includes('must pass') ? 400 : 500
    res.status(status).json({ error: error.message || 'Failed to complete module' })
  }
}

/**
 * POST /chapters/:chapterId/complete
 * Mark a chapter as completed
 */
export const completeChapter = async (req: Request, res: Response) => {
  try {
    const chapterId = Array.isArray(req.params.chapterId) ? req.params.chapterId[0] : req.params.chapterId
    const { courseId } = req.body
    const userId = req.user?.id
    const tenantId = req.user?.tenantId

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!chapterId || !courseId) {
      return res.status(400).json({ error: 'Missing chapterId or courseId' })
    }

    const completion = await progressService.completeChapter(chapterId, userId, courseId, tenantId)
    res.json(completion)
  } catch (error: any) {
    console.error('Error completing chapter:', error)
    res.status(500).json({ error: error.message || 'Failed to complete chapter' })
  }
}

/**
 * POST /courses/:courseId/complete
 * Mark a course as completed
 */
export const completeCourse = async (req: Request, res: Response) => {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId
    const userId = req.user?.id
    const tenantId = req.user?.tenantId

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!courseId) {
      return res.status(400).json({ error: 'Missing courseId' })
    }

    const enrollment = await progressService.completeCourse(courseId, userId, tenantId)
    res.json(enrollment)
  } catch (error: any) {
    console.error('Error completing course:', error)
    res.status(500).json({ error: error.message || 'Failed to complete course' })
  }
}

/**
 * GET /courses/:courseId/progress
 * Get course progress for the current user
 */
export const getCourseProgress = async (req: Request, res: Response) => {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId
    const userId = req.user?.id
    const tenantId = req.user?.tenantId

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!courseId) {
      return res.status(400).json({ error: 'Missing courseId' })
    }

    const progress = await progressService.getCourseProgress(courseId, userId, tenantId)
    res.json(progress)
  } catch (error: any) {
    console.error('Error getting course progress:', error)
    res.status(500).json({ error: error.message || 'Failed to get course progress' })
  }
}

/**
 * GET /courses/:courseId/structure-with-progress
 * Get course structure with completion status
 */
export const getCourseStructureWithProgress = async (req: Request, res: Response) => {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!courseId) {
      return res.status(400).json({ error: 'Missing courseId' })
    }

    const structure = await progressService.getCourseStructureWithProgress(courseId, userId)
    res.json(structure)
  } catch (error: any) {
    console.error('Error getting course structure:', error)
    res.status(500).json({ error: error.message || 'Failed to get course structure' })
  }
}

export default {
  completeModule,
  completeChapter,
  completeCourse,
  getCourseProgress,
  getCourseStructureWithProgress,
}
