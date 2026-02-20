"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unenrollUser = exports.markCourseComplete = exports.getEnrollmentProgress = exports.calculateEnrollmentProgress = exports.getUserEnrollments = exports.enrollUser = void 0;
const client_1 = __importDefault(require("../db/client"));
/**
 * Enroll a user in a course
 */
const enrollUser = async (userId, courseId, tenantId) => {
    // Check if already enrolled
    const existing = await client_1.default.enrollment.findUnique({
        where: {
            tenantId_courseId_userId: {
                tenantId,
                courseId,
                userId,
            },
        },
    });
    if (existing) {
        throw new Error('User is already enrolled in this course');
    }
    const enrollment = await client_1.default.enrollment.create({
        data: {
            userId,
            courseId,
            tenantId,
        },
    });
    return enrollment;
};
exports.enrollUser = enrollUser;
/**
 * Get all enrollments for a user with progress
 */
const getUserEnrollments = async (userId, tenantId) => {
    const enrollments = await client_1.default.enrollment.findMany({
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
    });
    // Get courses details (manually since we can't include Course directly due to schema)
    const courseIds = enrollments.map((e) => e.courseId);
    const courses = await client_1.default.course.findMany({
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
    });
    // Map courses by ID
    const courseMap = new Map(courses.map((c) => [c.id, c]));
    // Build enrollments with progress
    const enrollmentsWithProgress = [];
    for (const enrollment of enrollments) {
        const course = courseMap.get(enrollment.courseId);
        if (!course)
            continue;
        const progress = await (0, exports.calculateEnrollmentProgress)(enrollment.id, enrollment.courseId, enrollment.userId);
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
        });
    }
    return enrollmentsWithProgress;
};
exports.getUserEnrollments = getUserEnrollments;
/**
 * Calculate progress for a specific enrollment
 */
const calculateEnrollmentProgress = async (enrollmentId, courseId, userId) => {
    // Get all modules for the course
    const modules = await client_1.default.module.findMany({
        where: {
            chapter: {
                course_id: courseId,
            },
        },
        select: {
            id: true,
            required: true,
        },
    });
    // Get completed modules
    const completedModules = await client_1.default.moduleCompletion.findMany({
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
    });
    const completedModuleIds = new Set(completedModules.map((cm) => cm.moduleId));
    const requiredModules = modules.filter((m) => m.required);
    const requiredModulesCompleted = requiredModules.filter((m) => completedModuleIds.has(m.id));
    const totalModules = modules.length;
    const completedCount = completedModules.length;
    const requiredTotal = requiredModules.length;
    const requiredCompleted = requiredModulesCompleted.length;
    const percentComplete = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
    // Can receive certificate if all required modules are complete
    const canReceiveCertificate = requiredCompleted === requiredTotal;
    return {
        totalModules,
        completedModules: completedCount,
        percentComplete,
        requiredModulesComplete: requiredCompleted,
        requiredModulesTotal: requiredTotal,
        canReceiveCertificate,
    };
};
exports.calculateEnrollmentProgress = calculateEnrollmentProgress;
/**
 * Get detailed progress for an enrollment
 */
const getEnrollmentProgress = async (enrollmentId) => {
    const enrollment = await client_1.default.enrollment.findUnique({
        where: {
            id: enrollmentId,
        },
    });
    if (!enrollment) {
        throw new Error('Enrollment not found');
    }
    return (0, exports.calculateEnrollmentProgress)(enrollment.id, enrollment.courseId, enrollment.userId);
};
exports.getEnrollmentProgress = getEnrollmentProgress;
/**
 * Mark a course as complete and issue certificate
 */
const markCourseComplete = async (enrollmentId) => {
    const enrollment = await client_1.default.enrollment.findUnique({
        where: {
            id: enrollmentId,
        },
    });
    if (!enrollment) {
        throw new Error('Enrollment not found');
    }
    const progress = await (0, exports.calculateEnrollmentProgress)(enrollment.id, enrollment.courseId, enrollment.userId);
    if (!progress.canReceiveCertificate) {
        throw new Error('All required modules must be completed before marking course as complete');
    }
    // Update enrollment
    const updated = await client_1.default.enrollment.update({
        where: {
            id: enrollmentId,
        },
        data: {
            completedAt: new Date(),
        },
    });
    return updated;
};
exports.markCourseComplete = markCourseComplete;
/**
 * Unenroll a user from a course
 */
const unenrollUser = async (userId, courseId, tenantId) => {
    const enrollment = await client_1.default.enrollment.findUnique({
        where: {
            tenantId_courseId_userId: {
                tenantId,
                courseId,
                userId,
            },
        },
    });
    if (!enrollment) {
        throw new Error('Enrollment not found');
    }
    // Delete related module completions and quiz attempts
    await client_1.default.$transaction([
        client_1.default.moduleCompletion.deleteMany({
            where: {
                userId,
                courseId,
            },
        }),
        client_1.default.quizAttempt.deleteMany({
            where: {
                userId,
                courseId,
            },
        }),
        client_1.default.enrollment.delete({
            where: {
                id: enrollment.id,
            },
        }),
    ]);
    return { success: true };
};
exports.unenrollUser = unenrollUser;
