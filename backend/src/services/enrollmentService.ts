import prisma from '../db/client'

export interface EnrollmentWithProgress {
  id: string
  courseId: string
  tenantId: string
  userId: string
  enrolledAt: Date
  completedAt: Date | null
  certificateId: string | null
  course: {
    id: string
    title: string
    description: string | null
  }
  progress: {
    totalModules: number
    completedModules: number
    percentComplete: number
    requiredModulesComplete: number
    requiredModulesTotal: number
    canReceiveCertificate: boolean
  }
}

/**
 * Enroll a user in a course
 */
export const enrollUser = async (
  userId: string,
  courseId: string,
  tenantId: string
) => {
  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: {
      tenantId_courseId_userId: {
        tenantId,
        courseId,
        userId,
      },
    },
  })

  if (existing) {
    throw new Error('User is already enrolled in this course')
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      courseId,
      tenantId,
    },
  })

  return enrollment
}

/**
 * Get all enrollments for a user with progress
 */
export const getUserEnrollments = async (
  userId: string,
  tenantId: string
): Promise<EnrollmentWithProgress[]> => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      tenantId,
    },
    include: {
      certificate: true,
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  })

  // Get courses details (manually since we can't include Course directly due to schema)
  const courseIds = enrollments.map((e) => e.courseId)
  const courses = await prisma.course.findMany({
    where: {
      id: {
        in: courseIds,
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
  })

  // Map courses by ID
  const courseMap = new Map(courses.map((c) => [c.id, c]))

  // Build enrollments with progress
  const enrollmentsWithProgress: EnrollmentWithProgress[] = []

  for (const enrollment of enrollments) {
    const course = courseMap.get(enrollment.courseId)
    if (!course) continue

    const progress = await calculateEnrollmentProgress(
      enrollment.id,
      enrollment.courseId,
      enrollment.userId
    )

    enrollmentsWithProgress.push({
      id: enrollment.id,
      courseId: enrollment.courseId,
      tenantId: enrollment.tenantId,
      userId: enrollment.userId,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      certificateId: enrollment.certificateId,
      course,
      progress,
    })
  }

  return enrollmentsWithProgress
}

/**
 * Calculate progress for a specific enrollment
 */
export const calculateEnrollmentProgress = async (
  enrollmentId: string,
  courseId: string,
  userId: string
) => {
  // Get all modules for the course
  const modules = await prisma.module.findMany({
    where: {
      chapter: {
        course_id: courseId,
      },
    },
    select: {
      id: true,
      required: true,
    },
  })

  // Get completed modules
  const completedModules = await prisma.moduleCompletion.findMany({
    where: {
      userId,
      courseId,
      moduleId: {
        in: modules.map((m) => m.id),
      },
    },
    select: {
      moduleId: true,
    },
  })

  const completedModuleIds = new Set(completedModules.map((cm) => cm.moduleId))
  const requiredModules = modules.filter((m) => m.required)
  const requiredModulesCompleted = requiredModules.filter((m) =>
    completedModuleIds.has(m.id)
  )

  const totalModules = modules.length
  const completedCount = completedModules.length
  const requiredTotal = requiredModules.length
  const requiredCompleted = requiredModulesCompleted.length

  const percentComplete =
    totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

  // Can receive certificate if all required modules are complete
  const canReceiveCertificate = requiredCompleted === requiredTotal

  return {
    totalModules,
    completedModules: completedCount,
    percentComplete,
    requiredModulesComplete: requiredCompleted,
    requiredModulesTotal: requiredTotal,
    canReceiveCertificate,
  }
}

/**
 * Get detailed progress for an enrollment
 */
export const getEnrollmentProgress = async (enrollmentId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      id: enrollmentId,
    },
  })

  if (!enrollment) {
    throw new Error('Enrollment not found')
  }

  return calculateEnrollmentProgress(
    enrollment.id,
    enrollment.courseId,
    enrollment.userId
  )
}

/**
 * Mark a course as complete and issue certificate
 */
export const markCourseComplete = async (enrollmentId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      id: enrollmentId,
    },
  })

  if (!enrollment) {
    throw new Error('Enrollment not found')
  }

  const progress = await calculateEnrollmentProgress(
    enrollment.id,
    enrollment.courseId,
    enrollment.userId
  )

  if (!progress.canReceiveCertificate) {
    throw new Error('All required modules must be completed before marking course as complete')
  }

  // Update enrollment
  const updated = await prisma.enrollment.update({
    where: {
      id: enrollmentId,
    },
    data: {
      completedAt: new Date(),
    },
  })

  return updated
}

/**
 * Unenroll a user from a course
 */
export const unenrollUser = async (
  userId: string,
  courseId: string,
  tenantId: string
) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      tenantId_courseId_userId: {
        tenantId,
        courseId,
        userId,
      },
    },
  })

  if (!enrollment) {
    throw new Error('Enrollment not found')
  }

  // Delete related module completions and quiz attempts
  await prisma.$transaction([
    prisma.moduleCompletion.deleteMany({
      where: {
        userId,
        courseId,
      },
    }),
    prisma.quizAttempt.deleteMany({
      where: {
        userId,
        courseId,
      },
    }),
    prisma.enrollment.delete({
      where: {
        id: enrollment.id,
      },
    }),
  ])

  return { success: true }
}
