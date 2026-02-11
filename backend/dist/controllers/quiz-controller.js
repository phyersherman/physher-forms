"use strict";
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
        const tenantId = req.user?.tenantId;
        const daysBack = req.query.daysBack ? parseInt(req.query.daysBack) : 30;
        if (!blockId || !courseId || !tenantId) {
            return res.status(400).json({
                error: 'blockId, courseId, and tenantId are required',
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
        const tenantId = req.user?.tenantId;
        const daysBack = req.query.daysBack ? parseInt(req.query.daysBack) : 30;
        if (!courseId || !tenantId) {
            return res.status(400).json({
                error: 'courseId and tenantId are required',
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
        const tenantId = req.user?.tenantId;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        if (!blockId || !courseId || !tenantId) {
            return res.status(400).json({
                error: 'blockId, courseId, and tenantId are required',
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
exports.default = {
    submitQuizAttempt,
    checkModuleAccess,
    markModuleComplete,
    getQuizAttempts,
    getLatestQuizAttempt,
    getQuizAnalytics,
    getCourseQuizAnalytics,
    getTopPerformers,
};
