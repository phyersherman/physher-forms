"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.unenrollUser = exports.getEnrollmentProgress = exports.getMyEnrollments = exports.enrollUserInCourse = void 0;
const enrollmentService = __importStar(require("../services/enrollmentService"));
/**
 * POST /api/enrollments
 * Admin enrolls user in course
 */
const enrollUserInCourse = async (req, res) => {
    try {
        const { userId, courseId, tenantId } = req.body;
        // Authorization: admin only
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        if (!userId || !courseId || !tenantId) {
            return res.status(400).json({ error: 'userId, courseId, and tenantId are required' });
        }
        const enrollment = await enrollmentService.enrollUser(userId, courseId, tenantId);
        res.status(201).json(enrollment);
    }
    catch (err) {
        console.error('Error enrolling user:', err);
        res.status(500).json({
            error: err instanceof Error ? err.message : 'Failed to enroll user',
        });
    }
};
exports.enrollUserInCourse = enrollUserInCourse;
/**
 * GET /api/enrollments/me
 * Get current user's enrollments with progress
 */
const getMyEnrollments = async (req, res) => {
    try {
        const userId = req.user?.id;
        const tenantId = req.user?.tenantId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!tenantId) {
            return res.status(400).json({ error: 'User must be associated with a tenant' });
        }
        const enrollments = await enrollmentService.getUserEnrollments(userId, tenantId);
        res.json(enrollments);
    }
    catch (err) {
        console.error('Error fetching enrollments:', err);
        res.status(500).json({
            error: err instanceof Error ? err.message : 'Failed to fetch enrollments',
        });
    }
};
exports.getMyEnrollments = getMyEnrollments;
/**
 * GET /api/enrollments/:enrollmentId/progress
 * Get detailed progress for an enrollment
 */
const getEnrollmentProgress = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!enrollmentId || typeof enrollmentId !== 'string') {
            return res.status(400).json({ error: 'Invalid enrollment ID' });
        }
        // Get the enrollment to check ownership
        const progress = await enrollmentService.getEnrollmentProgress(enrollmentId);
        res.json(progress);
    }
    catch (err) {
        console.error('Error fetching enrollment progress:', err);
        res.status(500).json({
            error: err instanceof Error ? err.message : 'Failed to fetch enrollment progress',
        });
    }
};
exports.getEnrollmentProgress = getEnrollmentProgress;
/**
 * DELETE /api/enrollments/:enrollmentId
 * Unenroll user from course (admin only)
 */
const unenrollUser = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        if (!enrollmentId || typeof enrollmentId !== 'string') {
            return res.status(400).json({ error: 'Invalid enrollment ID' });
        }
        // Get enrollment first to check tenantId
        const progress = await enrollmentService.getEnrollmentProgress(enrollmentId);
        // Authorization: admin only
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === req.user?.tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        res.json({ success: true, message: 'User unenrolled successfully' });
    }
    catch (err) {
        console.error('Error unenrolling user:', err);
        res.status(500).json({
            error: err instanceof Error ? err.message : 'Failed to unenroll user',
        });
    }
};
exports.unenrollUser = unenrollUser;
exports.default = {
    enrollUserInCourse: exports.enrollUserInCourse,
    getMyEnrollments: exports.getMyEnrollments,
    getEnrollmentProgress: exports.getEnrollmentProgress,
    unenrollUser: exports.unenrollUser,
};
