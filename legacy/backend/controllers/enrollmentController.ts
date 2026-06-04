import { Request, Response } from 'express'
import * as enrollmentService from '../services/enrollmentService'

/**
 * POST /api/enrollments
 * Admin enrolls user in course
 */
export const enrollUserInCourse = async (req: Request, res: Response) => {
  try {
    const { userId, courseId, tenantId } = req.body

    // Authorization: admin only
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (!userId || !courseId || !tenantId) {
      return res.status(400).json({ error: 'userId, courseId, and tenantId are required' })
    }

    const enrollment = await enrollmentService.enrollUser(userId, courseId, tenantId)

    res.status(201).json(enrollment)
  } catch (err) {
    console.error('Error enrolling user:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to enroll user',
    })
  }
}

/**
 * GET /api/enrollments/me
 * Get current user's enrollments with progress
 */
export const getMyEnrollments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const tenantId = req.user?.tenantId

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!tenantId) {
      return res.status(400).json({ error: 'User must be associated with a tenant' })
    }

    const enrollments = await enrollmentService.getUserEnrollments(userId, tenantId)

    res.json(enrollments)
  } catch (err) {
    console.error('Error fetching enrollments:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch enrollments',
    })
  }
}

/**
 * GET /api/enrollments/:enrollmentId/progress
 * Get detailed progress for an enrollment
 */
export const getEnrollmentProgress = async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!enrollmentId || typeof enrollmentId !== 'string') {
      return res.status(400).json({ error: 'Invalid enrollment ID' })
    }

    // Get the enrollment to check ownership
    const progress = await enrollmentService.getEnrollmentProgress(enrollmentId)

    res.json(progress)
  } catch (err) {
    console.error('Error fetching enrollment progress:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch enrollment progress',
    })
  }
}

/**
 * DELETE /api/enrollments/:enrollmentId
 * Unenroll user from course (admin only)
 */
export const unenrollUser = async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params

    if (!enrollmentId || typeof enrollmentId !== 'string') {
      return res.status(400).json({ error: 'Invalid enrollment ID' })
    }

    // Get enrollment first to check tenantId
    const progress = await enrollmentService.getEnrollmentProgress(enrollmentId)

    // Authorization: admin only
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === req.user?.tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    res.json({ success: true, message: 'User unenrolled successfully' })
  } catch (err) {
    console.error('Error unenrolling user:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to unenroll user',
    })
  }
}

export default {
  enrollUserInCourse,
  getMyEnrollments,
  getEnrollmentProgress,
  unenrollUser,
}
