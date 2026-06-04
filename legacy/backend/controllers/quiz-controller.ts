import { Request, Response } from 'express'
import quizService from '../services/quiz-service'
import quizAnalyticsService from '../services/quiz-analytics-service'

const submitQuizAttempt = async (req: Request, res: Response) => {
  try {
    const { blockId, courseId, answers } = req.body
    const userId = req.user?.id as string
    const tenantId = req.user?.tenantId as string

    if (!blockId || !courseId || !answers || !userId || !tenantId) {
      return res.status(400).json({
        error: 'blockId, courseId, and answers are required',
      })
    }

    const result = await quizService.submitQuizAttempt({
      blockId,
      userId,
      tenantId,
      courseId,
      answers,
    })

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit quiz'
    console.error('[submitQuizAttempt]', message)
    res.status(400).json({ error: message })
  }
}

const checkModuleAccess = async (req: Request, res: Response) => {
  try {
    const moduleId = req.params.moduleId as string
    const courseId = req.params.courseId as string
    const userId = req.user?.id as string

    if (!moduleId || !courseId || !userId) {
      return res.status(400).json({
        error: 'moduleId, courseId, and user ID are required',
      })
    }

    const result = await quizService.isModuleAccessible(moduleId, userId, courseId)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to check module access'
    console.error('[checkModuleAccess]', message)
    res.status(400).json({ error: message })
  }
}

const markModuleComplete = async (req: Request, res: Response) => {
  try {
    const { moduleId, courseId } = req.body
    const userId = req.user?.id as string
    const tenantId = req.user?.tenantId as string

    if (!moduleId || !courseId || !userId) {
      return res.status(400).json({
        error: 'moduleId and courseId are required',
      })
    }

    const completion = await quizService.markModuleComplete(
      moduleId,
      userId,
      courseId,
      tenantId
    )

    res.json(completion)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark module complete'
    console.error('[markModuleComplete]', message)
    res.status(400).json({ error: message })
  }
}

const getQuizAttempts = async (req: Request, res: Response) => {
  try {
    const blockId = req.params.blockId as string
    const userId = req.user?.id as string

    if (!blockId || !userId) {
      return res.status(400).json({
        error: 'blockId required',
      })
    }

    const attempts = await quizService.getQuizAttempts(blockId, userId)
    res.json(attempts)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get quiz attempts'
    console.error('[getQuizAttempts]', message)
    res.status(400).json({ error: message })
  }
}

const getLatestQuizAttempt = async (req: Request, res: Response) => {
  try {
    const blockId = req.params.blockId as string
    const userId = req.user?.id as string

    if (!blockId || !userId) {
      return res.status(400).json({
        error: 'blockId required',
      })
    }

    const attempt = await quizService.getLatestQuizAttempt(blockId, userId)
    res.json(attempt || null)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get latest quiz attempt'
    console.error('[getLatestQuizAttempt]', message)
    res.status(400).json({ error: message })
  }
}

const getQuizAnalytics = async (req: Request, res: Response) => {
  try {
    const blockId = req.params.blockId as string
    const courseId = req.query.courseId as string
    const daysBack = req.query.daysBack ? parseInt(req.query.daysBack as string) : 30

    if (!blockId || !courseId) {
      return res.status(400).json({
        error: 'blockId and courseId are required',
      })
    }

    // For global admins (tenantId === null), fetch the course's tenantId
    let tenantId = req.user?.tenantId as string | null
    
    if (tenantId === null || tenantId === undefined) {
      // Global admin - get the course's tenant
      const prisma = (await import('../db/client')).default
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { tenant_id: true }
      })
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' })
      }
      
      tenantId = course.tenant_id
    }

    if (!tenantId) {
      return res.status(400).json({
        error: 'Course must be associated with a tenant',
      })
    }

    const analytics = await quizAnalyticsService.getQuizAnalytics(blockId, tenantId, courseId, daysBack)
    res.json(analytics)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get quiz analytics'
    console.error('[getQuizAnalytics]', message)
    res.status(400).json({ error: message })
  }
}

const getCourseQuizAnalytics = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId as string
    const daysBack = req.query.daysBack ? parseInt(req.query.daysBack as string) : 30

    if (!courseId) {
      return res.status(400).json({
        error: 'courseId is required',
      })
    }

    // For global admins (tenantId === null), fetch the course's tenantId
    let tenantId = req.user?.tenantId as string | null
    
    if (tenantId === null || tenantId === undefined) {
      // Global admin - get the course's tenant
      const prisma = (await import('../db/client')).default
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { tenant_id: true }
      })
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' })
      }
      
      tenantId = course.tenant_id
    }

    if (!tenantId) {
      return res.status(400).json({
        error: 'Course must be associated with a tenant',
      })
    }

    const analytics = await quizAnalyticsService.getCourseQuizAnalytics(courseId, tenantId, daysBack)
    res.json(analytics)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get course quiz analytics'
    console.error('[getCourseQuizAnalytics]', message)
    res.status(400).json({ error: message })
  }
}

const getTopPerformers = async (req: Request, res: Response) => {
  try {
    const blockId = req.params.blockId as string
    const courseId = req.query.courseId as string
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

    if (!blockId || !courseId) {
      return res.status(400).json({
        error: 'blockId and courseId are required',
      })
    }

    // For global admins (tenantId === null), fetch the course's tenantId
    let tenantId = req.user?.tenantId as string | null
    
    if (tenantId === null || tenantId === undefined) {
      // Global admin - get the course's tenant
      const prisma = (await import('../db/client')).default
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { tenant_id: true }
      })
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' })
      }
      
      tenantId = course.tenant_id
    }

    if (!tenantId) {
      return res.status(400).json({
        error: 'Course must be associated with a tenant',
      })
    }

    const performers = await quizAnalyticsService.getTopPerformers(blockId, tenantId, courseId, limit)
    res.json(performers)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get top performers'
    console.error('[getTopPerformers]', message)
    res.status(400).json({ error: message })
  }
}

const getTenantAnalytics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId as string
    const daysBack = req.query.daysBack ? parseInt(req.query.daysBack as string) : 30

    if (!tenantId) {
      return res.status(400).json({
        error: 'tenantId is required',
      })
    }

    const analytics = await quizAnalyticsService.getTenantQuizAnalytics(tenantId, daysBack)
    res.json(analytics)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get tenant analytics'
    console.error('[getTenantAnalytics]', message)
    res.status(400).json({ error: message })
  }
}

const getAdminDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await quizAnalyticsService.getAdminDashboardAnalytics()
    res.json(analytics)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get admin analytics'
    console.error('[getAdminDashboardAnalytics]', message)
    res.status(400).json({ error: message })
  }
}

const getTenantCourseAnalytics = async (req: Request, res: Response) => {
  try {
    let tenantId = req.query.tenantId as string
    
    // If no tenantId provided, use the logged-in user's tenant
    if (!tenantId) {
      tenantId = req.user?.tenantId as string
    }

    if (!tenantId) {
      return res.status(400).json({
        error: 'tenantId is required',
      })
    }

    const analytics = await quizAnalyticsService.getTenantCourseAnalytics(tenantId)
    res.json(analytics)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get tenant course analytics'
    console.error('[getTenantCourseAnalytics]', message)
    res.status(400).json({ error: message })
  }
}

export default {
  submitQuizAttempt,
  checkModuleAccess,
  markModuleComplete,
  getQuizAttempts,
  getLatestQuizAttempt,
  getQuizAnalytics,
  getCourseQuizAnalytics,
  getTopPerformers,
  getTenantAnalytics,
  getAdminDashboardAnalytics,
  getTenantCourseAnalytics,
}
