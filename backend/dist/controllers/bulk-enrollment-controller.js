"use strict";
/**
 * Bulk Enrollment Controller
 * Handles HTTP requests for bulk course assignment operations
 */
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
exports.bulkAssignCourses = bulkAssignCourses;
exports.bulkUnassignCourses = bulkUnassignCourses;
exports.getUserCourses = getUserCourses;
exports.getCourseEnrollments = getCourseEnrollments;
const bulkEnrollmentService = __importStar(require("../services/bulk-enrollment-service"));
/**
 * POST /api/enrollments/bulk-assign
 * Assign multiple courses to multiple users
 * Requires: admin role
 */
async function bulkAssignCourses(req, res) {
    try {
        const { userIds, courseIds, tenantId } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                error: 'At least one user ID is required'
            });
        }
        if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({
                error: 'At least one course ID is required'
            });
        }
        if (!tenantId) {
            return res.status(400).json({
                error: 'Tenant ID is required'
            });
        }
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const result = await bulkEnrollmentService.bulkAssignCourses({
            userIds,
            courseIds,
            tenantId
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error bulk assigning courses:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to assign courses'
        });
    }
}
/**
 * POST /api/enrollments/bulk-unassign
 * Remove course assignments from multiple users
 * Requires: admin role
 */
async function bulkUnassignCourses(req, res) {
    try {
        const { userIds, courseIds, tenantId } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                error: 'At least one user ID is required'
            });
        }
        if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({
                error: 'At least one course ID is required'
            });
        }
        if (!tenantId) {
            return res.status(400).json({
                error: 'Tenant ID is required'
            });
        }
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const result = await bulkEnrollmentService.bulkUnassignCourses({
            userIds,
            courseIds,
            tenantId
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error bulk unassigning courses:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to unassign courses'
        });
    }
}
/**
 * GET /api/tenants/:tenantId/users/:userId/courses
 * Get all courses for a specific user
 * Requires: admin role
 */
async function getUserCourses(req, res) {
    try {
        const tenantId = Array.isArray(req.params.tenantId)
            ? req.params.tenantId[0]
            : req.params.tenantId;
        const userId = Array.isArray(req.params.userId)
            ? req.params.userId[0]
            : req.params.userId;
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const courses = await bulkEnrollmentService.getUserCourseSummary(tenantId, userId);
        res.json(courses);
    }
    catch (error) {
        console.error('Error fetching user courses:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch user courses'
        });
    }
}
/**
 * GET /api/tenants/:tenantId/courses/:courseId/enrollments
 * Get all users enrolled in a specific course
 * Requires: admin role
 */
async function getCourseEnrollments(req, res) {
    try {
        const tenantId = Array.isArray(req.params.tenantId)
            ? req.params.tenantId[0]
            : req.params.tenantId;
        const courseId = Array.isArray(req.params.courseId)
            ? req.params.courseId[0]
            : req.params.courseId;
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const enrollments = await bulkEnrollmentService.getCourseEnrollments(tenantId, courseId);
        res.json(enrollments);
    }
    catch (error) {
        console.error('Error fetching course enrollments:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch course enrollments'
        });
    }
}
exports.default = {
    bulkAssignCourses,
    bulkUnassignCourses,
    getUserCourses,
    getCourseEnrollments
};
