/**
 * Bulk Enrollment Controller
 * Handles HTTP requests for bulk course assignment operations
 */

import { Request, Response } from 'express'
import * as bulkEnrollmentService from '../services/bulk-enrollment-service'

/**
 * POST /api/enrollments/bulk-assign
 * Assign multiple courses to multiple users
 * Requires: admin role
 */
export async function bulkAssignCourses(req: Request, res: Response) {
  try {
    const { userIds, courseIds, tenantId } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'At least one user ID is required'
      })
    }

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        error: 'At least one course ID is required'
      })
    }

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID is required'
      })
    }

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const result = await bulkEnrollmentService.bulkAssignCourses({
      userIds,
      courseIds,
      tenantId
    })

    res.json(result)
  } catch (error) {
    console.error('Error bulk assigning courses:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to assign courses'
    })
  }
}

/**
 * POST /api/enrollments/bulk-unassign
 * Remove course assignments from multiple users
 * Requires: admin role
 */
export async function bulkUnassignCourses(req: Request, res: Response) {
  try {
    const { userIds, courseIds, tenantId } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'At least one user ID is required'
      })
    }

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        error: 'At least one course ID is required'
      })
    }

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID is required'
      })
    }

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const result = await bulkEnrollmentService.bulkUnassignCourses({
      userIds,
      courseIds,
      tenantId
    })

    res.json(result)
  } catch (error) {
    console.error('Error bulk unassigning courses:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to unassign courses'
    })
  }
}

/**
 * GET /api/tenants/:tenantId/users/:userId/courses
 * Get all courses for a specific user
 * Requires: admin role
 */
export async function getUserCourses(req: Request, res: Response) {
  try {
    const tenantId = Array.isArray(req.params.tenantId)
      ? req.params.tenantId[0]
      : req.params.tenantId

    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const courses = await bulkEnrollmentService.getUserCourseSummary(tenantId, userId)

    res.json(courses)
  } catch (error) {
    console.error('Error fetching user courses:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch user courses'
    })
  }
}

/**
 * GET /api/tenants/:tenantId/courses/:courseId/enrollments
 * Get all users enrolled in a specific course
 * Requires: admin role
 */
export async function getCourseEnrollments(req: Request, res: Response) {
  try {
    const tenantId = Array.isArray(req.params.tenantId)
      ? req.params.tenantId[0]
      : req.params.tenantId

    const courseId = Array.isArray(req.params.courseId)
      ? req.params.courseId[0]
      : req.params.courseId

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const enrollments = await bulkEnrollmentService.getCourseEnrollments(tenantId, courseId)

    res.json(enrollments)
  } catch (error) {
    console.error('Error fetching course enrollments:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch course enrollments'
    })
  }
}

export default {
  bulkAssignCourses,
  bulkUnassignCourses,
  getUserCourses,
  getCourseEnrollments
}
