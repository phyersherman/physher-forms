/**
 * Bulk Enrollment Service
 * Handles bulk course assignments and course management for multiple users
 */

import { PrismaClient, Enrollment } from '@prisma/client'
import prisma from '../db/client'

interface BulkEnrollmentData {
  userIds: string[]
  courseIds: string[]
  tenantId: string
}

interface EnrollmentResultItem {
  userId: string
  courseId: string
  success: boolean
  error?: string
}

interface BulkEnrollmentResult {
  totalAttempted: number
  successCount: number
  failedCount: number
  enrollments: EnrollmentResultItem[]
}

/**
 * Assign multiple courses to multiple users
 * Creates enrollments in bulk
 */
export async function bulkAssignCourses(
  data: BulkEnrollmentData
): Promise<BulkEnrollmentResult> {
  const { userIds, courseIds, tenantId } = data

  const enrollments: EnrollmentResultItem[] = []
  let successCount = 0
  let failedCount = 0

  // Validate inputs
  if (!userIds || userIds.length === 0) {
    throw new Error('At least one user ID is required')
  }

  if (!courseIds || courseIds.length === 0) {
    throw new Error('At least one course ID is required')
  }

  // Verify users exist in tenant
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      tenantId
    },
    select: { id: true }
  })

  const validUserIds = new Set(users.map(u => u.id))

  // Verify courses exist
  const courses = await prisma.course.findMany({
    where: {
      id: { in: courseIds }
    },
    select: { id: true }
  })

  const validCourseIds = new Set(courses.map(c => c.id))

  // Check invalid user IDs
  for (const userId of userIds) {
    if (!validUserIds.has(userId)) {
      for (const courseId of courseIds) {
        enrollments.push({
          userId,
          courseId,
          success: false,
          error: 'User not found or not in tenant'
        })
        failedCount++
      }
    }
  }

  // Check invalid course IDs
  for (const courseId of courseIds) {
    if (!validCourseIds.has(courseId)) {
      for (const userId of userIds) {
        if (validUserIds.has(userId)) {
          enrollments.push({
            userId,
            courseId,
            success: false,
            error: 'Course not found'
          })
          failedCount++
        }
      }
    }
  }

  // Create enrollments for valid user-course pairs
  for (const userId of userIds) {
    if (!validUserIds.has(userId)) continue

    for (const courseId of courseIds) {
      if (!validCourseIds.has(courseId)) continue

      try {
        // Check if enrollment already exists
        const existing = await prisma.enrollment.findUnique({
          where: {
            tenantId_courseId_userId: {
              tenantId,
              courseId,
              userId
            }
          }
        })

        if (existing) {
          enrollments.push({
            userId,
            courseId,
            success: false,
            error: 'User already enrolled in this course'
          })
          failedCount++
          continue
        }

        // Create enrollment
        await prisma.enrollment.create({
          data: {
            userId,
            courseId,
            tenantId
          }
        })

        enrollments.push({
          userId,
          courseId,
          success: true
        })
        successCount++
      } catch (error) {
        enrollments.push({
          userId,
          courseId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        failedCount++
      }
    }
  }

  return {
    totalAttempted: userIds.length * courseIds.length,
    successCount,
    failedCount,
    enrollments
  }
}

/**
 * Remove course assignments from multiple users
 */
export async function bulkUnassignCourses(
  data: BulkEnrollmentData
): Promise<BulkEnrollmentResult> {
  const { userIds, courseIds, tenantId } = data

  const enrollments: EnrollmentResultItem[] = []
  let successCount = 0
  let failedCount = 0

  // Validate inputs
  if (!userIds || userIds.length === 0) {
    throw new Error('At least one user ID is required')
  }

  if (!courseIds || courseIds.length === 0) {
    throw new Error('At least one course ID is required')
  }

  // Delete enrollments
  for (const userId of userIds) {
    for (const courseId of courseIds) {
      try {
        const deleted = await prisma.enrollment.deleteMany({
          where: {
            userId,
            courseId,
            tenantId
          }
        })

        if (deleted.count === 0) {
          enrollments.push({
            userId,
            courseId,
            success: false,
            error: 'Enrollment not found'
          })
          failedCount++
        } else {
          enrollments.push({
            userId,
            courseId,
            success: true
          })
          successCount++
        }
      } catch (error) {
        enrollments.push({
          userId,
          courseId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        failedCount++
      }
    }
  }

  return {
    totalAttempted: userIds.length * courseIds.length,
    successCount,
    failedCount,
    enrollments
  }
}

/**
 * Get summary of all courses for a user
 */
export async function getUserCourseSummary(tenantId: string, userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      tenantId
    },
    orderBy: {
      enrolledAt: 'desc'
    }
  })

  // Fetch course details for each enrollment
  const enrollmentsWithCourses = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = await prisma.course.findUnique({
        where: { id: enrollment.courseId },
        select: {
          id: true,
          title: true,
          description: true
        }
      })

      return {
        ...enrollment,
        course
      }
    })
  )

  return enrollmentsWithCourses
}

/**
 * Get users enrolled in a specific course
 */
export async function getCourseEnrollments(tenantId: string, courseId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      tenantId
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          organization: true
        }
      }
    },
    orderBy: {
      enrolledAt: 'desc'
    }
  })

  return enrollments
}

export default {
  bulkAssignCourses,
  bulkUnassignCourses,
  getUserCourseSummary,
  getCourseEnrollments
}
