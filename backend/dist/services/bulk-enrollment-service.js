"use strict";
/**
 * Bulk Enrollment Service
 * Handles bulk course assignments and course management for multiple users
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkAssignCourses = bulkAssignCourses;
exports.bulkUnassignCourses = bulkUnassignCourses;
exports.getUserCourseSummary = getUserCourseSummary;
exports.getCourseEnrollments = getCourseEnrollments;
const client_1 = __importDefault(require("../db/client"));
/**
 * Assign multiple courses to multiple users
 * Creates enrollments in bulk
 */
async function bulkAssignCourses(data) {
    const { userIds, courseIds, tenantId } = data;
    const enrollments = [];
    let successCount = 0;
    let failedCount = 0;
    // Validate inputs
    if (!userIds || userIds.length === 0) {
        throw new Error('At least one user ID is required');
    }
    if (!courseIds || courseIds.length === 0) {
        throw new Error('At least one course ID is required');
    }
    // Verify users exist in tenant
    const users = await client_1.default.user.findMany({
        where: {
            id: { in: userIds },
            tenantId
        },
        select: { id: true }
    });
    const validUserIds = new Set(users.map(u => u.id));
    // Verify courses exist
    const courses = await client_1.default.course.findMany({
        where: {
            id: { in: courseIds }
        },
        select: { id: true }
    });
    const validCourseIds = new Set(courses.map(c => c.id));
    // Check invalid user IDs
    for (const userId of userIds) {
        if (!validUserIds.has(userId)) {
            for (const courseId of courseIds) {
                enrollments.push({
                    userId,
                    courseId,
                    success: false,
                    error: 'User not found or not in tenant'
                });
                failedCount++;
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
                    });
                    failedCount++;
                }
            }
        }
    }
    // Create enrollments for valid user-course pairs
    for (const userId of userIds) {
        if (!validUserIds.has(userId))
            continue;
        for (const courseId of courseIds) {
            if (!validCourseIds.has(courseId))
                continue;
            try {
                // Check if enrollment already exists
                const existing = await client_1.default.enrollment.findUnique({
                    where: {
                        tenantId_courseId_userId: {
                            tenantId,
                            courseId,
                            userId
                        }
                    }
                });
                if (existing) {
                    enrollments.push({
                        userId,
                        courseId,
                        success: false,
                        error: 'User already enrolled in this course'
                    });
                    failedCount++;
                    continue;
                }
                // Create enrollment
                await client_1.default.enrollment.create({
                    data: {
                        userId,
                        courseId,
                        tenantId
                    }
                });
                enrollments.push({
                    userId,
                    courseId,
                    success: true
                });
                successCount++;
            }
            catch (error) {
                enrollments.push({
                    userId,
                    courseId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                failedCount++;
            }
        }
    }
    return {
        totalAttempted: userIds.length * courseIds.length,
        successCount,
        failedCount,
        enrollments
    };
}
/**
 * Remove course assignments from multiple users
 */
async function bulkUnassignCourses(data) {
    const { userIds, courseIds, tenantId } = data;
    const enrollments = [];
    let successCount = 0;
    let failedCount = 0;
    // Validate inputs
    if (!userIds || userIds.length === 0) {
        throw new Error('At least one user ID is required');
    }
    if (!courseIds || courseIds.length === 0) {
        throw new Error('At least one course ID is required');
    }
    // Delete enrollments
    for (const userId of userIds) {
        for (const courseId of courseIds) {
            try {
                const deleted = await client_1.default.enrollment.deleteMany({
                    where: {
                        userId,
                        courseId,
                        tenantId
                    }
                });
                if (deleted.count === 0) {
                    enrollments.push({
                        userId,
                        courseId,
                        success: false,
                        error: 'Enrollment not found'
                    });
                    failedCount++;
                }
                else {
                    enrollments.push({
                        userId,
                        courseId,
                        success: true
                    });
                    successCount++;
                }
            }
            catch (error) {
                enrollments.push({
                    userId,
                    courseId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                failedCount++;
            }
        }
    }
    return {
        totalAttempted: userIds.length * courseIds.length,
        successCount,
        failedCount,
        enrollments
    };
}
/**
 * Get summary of all courses for a user
 */
async function getUserCourseSummary(tenantId, userId) {
    const enrollments = await client_1.default.enrollment.findMany({
        where: {
            userId,
            tenantId
        },
        orderBy: {
            enrolledAt: 'desc'
        }
    });
    // Fetch course details for each enrollment
    const enrollmentsWithCourses = await Promise.all(enrollments.map(async (enrollment) => {
        const course = await client_1.default.course.findUnique({
            where: { id: enrollment.courseId },
            select: {
                id: true,
                title: true,
                description: true
            }
        });
        return {
            ...enrollment,
            course
        };
    }));
    return enrollmentsWithCourses;
}
/**
 * Get users enrolled in a specific course
 */
async function getCourseEnrollments(tenantId, courseId) {
    const enrollments = await client_1.default.enrollment.findMany({
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
    });
    return enrollments;
}
exports.default = {
    bulkAssignCourses,
    bulkUnassignCourses,
    getUserCourseSummary,
    getCourseEnrollments
};
