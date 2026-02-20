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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quiz_service_1 = __importDefault(require("../services/quiz-service"));
const quiz_analytics_service_1 = __importDefault(require("../services/quiz-analytics-service"));
const submitQuizAttempt = async (req, res) => {
    try {
        const { blockId, courseId, answers } = req.body;
        const userId = req.user?.id;
        const tenantId = req.user?.tenantId;
        if (!blockId || !courseId || !answers || !userId || !tenantId) {
            return res.status(400).json({
                error: 'blockId, courseId, and answers are required',
            });
        }
        const result = await quiz_service_1.default.submitQuizAttempt({
            blockId,
            userId,
            tenantId,
            courseId,
            answers,
        });
        res.json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit quiz';
        console.error('[submitQuizAttempt]', message);
        res.status(400).json({ error: message });
    }
};
const checkModuleAccess = async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        const courseId = req.params.courseId;
        const userId = req.user?.id;
        if (!moduleId || !courseId || !userId) {
            return res.status(400).json({
                error: 'moduleId, courseId, and user ID are required',
            });
        }
        const result = await quiz_service_1.default.isModuleAccessible(moduleId, userId, courseId);
        res.json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check module access';
        console.error('[checkModuleAccess]', message);
        res.status(400).json({ error: message });
    }
};
const markModuleComplete = async (req, res) => {
    try {
        const { moduleId, courseId } = req.body;
        const userId = req.user?.id;
        const tenantId = req.user?.tenantId;
        if (!moduleId || !courseId || !userId) {
            return res.status(400).json({
                error: 'moduleId and courseId are required',
            });
        }
        const completion = await quiz_service_1.default.markModuleComplete(moduleId, userId, courseId, tenantId);
        res.json(completion);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark module complete';
        console.error('[markModuleComplete]', message);
        res.status(400).json({ error: message });
    }
};
const getQuizAttempts = async (req, res) => {
    try {
        const blockId = req.params.blockId;
        const userId = req.user?.id;
        if (!blockId || !userId) {
            return res.status(400).json({
                error: 'blockId required',
            });
        }
        const attempts = await quiz_service_1.default.getQuizAttempts(blockId, userId);
        res.json(attempts);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get quiz attempts';
        console.error('[getQuizAttempts]', message);
        res.status(400).json({ error: message });
    }
};
const getLatestQuizAttempt = async (req, res) => {
    try {
        const blockId = req.params.blockId;
        const userId = req.user?.id;
        if (!blockId || !userId) {
            return res.status(400).json({
                error: 'blockId required',
            });
        }
        const attempt = await quiz_service_1.default.getLatestQuizAttempt(blockId, userId);
        res.json(attempt || null);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get latest quiz attempt';
        console.error('[getLatestQuizAttempt]', message);
        res.status(400).json({ error: message });
    }
};
const getQuizAnalytics = async (req, res) => {
    try {
        const blockId = req.params.blockId;
        const courseId = req.query.courseId;
        const daysBack = req.query.daysBack ? parseInt(req.query.daysBack) : 30;
        if (!blockId || !courseId) {
            return res.status(400).json({
                error: 'blockId and courseId are required',
            });
        }
        // For global admins (tenantId === null), fetch the course's tenantId
        let tenantId = req.user?.tenantId;
        if (tenantId === null || tenantId === undefined) {
            // Global admin - get the course's tenant
            const prisma = (await Promise.resolve().then(() => __importStar(require('../db/client')))).default;
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { tenant_id: true }
            });
            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }
            tenantId = course.tenant_id;
        }
        if (!tenantId) {
            return res.status(400).json({
                error: 'Course must be associated with a tenant',
            });
        }
        const analytics = await quiz_analytics_service_1.default.getQuizAnalytics(blockId, tenantId, courseId, daysBack);
        res.json(analytics);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get quiz analytics';
        console.error('[getQuizAnalytics]', message);
        res.status(400).json({ error: message });
    }
};
const getCourseQuizAnalytics = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const daysBack = req.query.daysBack ? parseInt(req.query.daysBack) : 30;
        if (!courseId) {
            return res.status(400).json({
                error: 'courseId is required',
            });
        }
        // For global admins (tenantId === null), fetch the course's tenantId
        let tenantId = req.user?.tenantId;
        if (tenantId === null || tenantId === undefined) {
            // Global admin - get the course's tenant
            const prisma = (await Promise.resolve().then(() => __importStar(require('../db/client')))).default;
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { tenant_id: true }
            });
            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }
            tenantId = course.tenant_id;
        }
        if (!tenantId) {
            return res.status(400).json({
                error: 'Course must be associated with a tenant',
            });
        }
        const analytics = await quiz_analytics_service_1.default.getCourseQuizAnalytics(courseId, tenantId, daysBack);
        res.json(analytics);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get course quiz analytics';
        console.error('[getCourseQuizAnalytics]', message);
        res.status(400).json({ error: message });
    }
};
const getTopPerformers = async (req, res) => {
    try {
        const blockId = req.params.blockId;
        const courseId = req.query.courseId;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        if (!blockId || !courseId) {
            return res.status(400).json({
                error: 'blockId and courseId are required',
            });
        }
        // For global admins (tenantId === null), fetch the course's tenantId
        let tenantId = req.user?.tenantId;
        if (tenantId === null || tenantId === undefined) {
            // Global admin - get the course's tenant
            const prisma = (await Promise.resolve().then(() => __importStar(require('../db/client')))).default;
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { tenant_id: true }
            });
            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }
            tenantId = course.tenant_id;
        }
        if (!tenantId) {
            return res.status(400).json({
                error: 'Course must be associated with a tenant',
            });
        }
        const performers = await quiz_analytics_service_1.default.getTopPerformers(blockId, tenantId, courseId, limit);
        res.json(performers);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get top performers';
        console.error('[getTopPerformers]', message);
        res.status(400).json({ error: message });
    }
};
const getTenantAnalytics = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const daysBack = req.query.daysBack ? parseInt(req.query.daysBack) : 30;
        if (!tenantId) {
            return res.status(400).json({
                error: 'tenantId is required',
            });
        }
        const analytics = await quiz_analytics_service_1.default.getTenantQuizAnalytics(tenantId, daysBack);
        res.json(analytics);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get tenant analytics';
        console.error('[getTenantAnalytics]', message);
        res.status(400).json({ error: message });
    }
};
const getAdminDashboardAnalytics = async (req, res) => {
    try {
        const analytics = await quiz_analytics_service_1.default.getAdminDashboardAnalytics();
        res.json(analytics);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get admin analytics';
        console.error('[getAdminDashboardAnalytics]', message);
        res.status(400).json({ error: message });
    }
};
const getTenantCourseAnalytics = async (req, res) => {
    try {
        let tenantId = req.query.tenantId;
        // If no tenantId provided, use the logged-in user's tenant
        if (!tenantId) {
            tenantId = req.user?.tenantId;
        }
        if (!tenantId) {
            return res.status(400).json({
                error: 'tenantId is required',
            });
        }
        const analytics = await quiz_analytics_service_1.default.getTenantCourseAnalytics(tenantId);
        res.json(analytics);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get tenant course analytics';
        console.error('[getTenantCourseAnalytics]', message);
        res.status(400).json({ error: message });
    }
};
exports.default = {
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
};
