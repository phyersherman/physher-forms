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
const express_1 = require("express");
const tenantController_1 = __importDefault(require("../controllers/tenantController"));
const authController_1 = __importDefault(require("../controllers/authController"));
const userController = __importStar(require("../controllers/userController"));
const emailController_1 = __importDefault(require("../controllers/emailController"));
const enrollmentController_1 = __importDefault(require("../controllers/enrollmentController"));
const authGuard_1 = __importDefault(require("../middleware/authGuard"));
const authGuard_2 = require("../middleware/authGuard");
const rateLimiters_1 = require("../middleware/rateLimiters");
const courseController_1 = __importDefault(require("../controllers/courseController"));
const courseTemplateController_1 = __importDefault(require("../controllers/courseTemplateController"));
const quiz_controller_1 = __importDefault(require("../controllers/quiz-controller"));
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => res.json({ ok: true }));
// tenant management (admin)
router.get('/tenants', (0, authGuard_2.requireAuth)(['admin']), tenantController_1.default.listTenants);
router.get('/tenants/:id', (0, authGuard_2.requireAuth)(['admin']), tenantController_1.default.getTenant);
router.post('/tenants', (0, authGuard_2.requireAuth)(['admin']), tenantController_1.default.createTenant);
router.put('/tenants/:id', (0, authGuard_2.requireAuth)(['admin']), tenantController_1.default.updateTenant);
router.delete('/tenants/:id', (0, authGuard_2.requireAuth)(['admin']), tenantController_1.default.deleteTenant);
// user management (admin) - tenant-scoped
router.get('/tenants/:tenantId/users', (0, authGuard_2.requireAuth)(['admin']), userController.listUsers);
router.get('/tenants/:tenantId/users/:userId', (0, authGuard_2.requireAuth)(['admin']), userController.getUser);
router.post('/tenants/:tenantId/users', (0, authGuard_2.requireAuth)(['admin']), userController.createUser);
router.put('/tenants/:tenantId/users/:userId', (0, authGuard_2.requireAuth)(['admin']), userController.updateUser);
router.delete('/tenants/:tenantId/users/:userId', (0, authGuard_2.requireAuth)(['admin']), userController.deleteUser);
router.post('/tenants/:tenantId/users/:userId/disable', (0, authGuard_2.requireAuth)(['admin']), userController.disableUser);
router.post('/tenants/:tenantId/users/:userId/enable', (0, authGuard_2.requireAuth)(['admin']), userController.enableUser);
router.post('/tenants/:tenantId/users/:userId/invite', (0, authGuard_2.requireAuth)(['admin']), rateLimiters_1.inviteLimiter, userController.inviteUser);
// global user management (admin) - platform-wide users
router.get('/users', (0, authGuard_2.requireAuth)(['admin']), userController.listGlobalUsers);
router.get('/users/:userId', (0, authGuard_2.requireAuth)(['admin']), userController.getGlobalUser);
router.post('/users', (0, authGuard_2.requireAuth)(['admin']), userController.createGlobalUser);
router.put('/users/:userId', (0, authGuard_2.requireAuth)(['admin']), userController.updateGlobalUser);
router.delete('/users/:userId', (0, authGuard_2.requireAuth)(['admin']), userController.deleteGlobalUser);
router.post('/users/:userId/disable', (0, authGuard_2.requireAuth)(['admin']), userController.disableGlobalUser);
router.post('/users/:userId/enable', (0, authGuard_2.requireAuth)(['admin']), userController.enableGlobalUser);
router.post('/users/:userId/invite', (0, authGuard_2.requireAuth)(['admin']), rateLimiters_1.inviteLimiter, userController.inviteGlobalUser);
// user self-service (any authenticated user)
router.post('/users/:userId/password', authGuard_1.default, userController.changePassword);
// email configuration (admin)
router.get('/email-config', (0, authGuard_2.requireAuth)(['admin']), emailController_1.default.getEmailConfig);
router.get('/email-config/:id', (0, authGuard_2.requireAuth)(['admin']), emailController_1.default.getEmailConfigById);
router.get('/email-configs', (0, authGuard_2.requireAuth)(['admin']), emailController_1.default.listEmailConfigs);
router.post('/email-config', (0, authGuard_2.requireAuth)(['admin']), emailController_1.default.createEmailConfig);
router.put('/email-config/:id', (0, authGuard_2.requireAuth)(['admin']), emailController_1.default.updateEmailConfig);
router.delete('/email-config/:id', (0, authGuard_2.requireAuth)(['admin']), emailController_1.default.deleteEmailConfig);
router.post('/email-config/:id/test', (0, authGuard_2.requireAuth)(['admin']), emailController_1.default.testEmailConfig);
router.get('/email-logs', (0, authGuard_2.requireAuth)(['admin']), emailController_1.default.getEmailLogs);
// global courses (admin - available across all tenants)
router.get('/courses/global', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.listGlobalCourses);
router.post('/courses', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.createCourse);
router.post('/courses/assign-to-tenant', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.assignCourseToTenant);
router.post('/courses/:courseId/copy', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.copyCourse);
// tenant-specific courses (admin)
router.post('/tenants/:tenantId/courses', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.createCourse);
router.get('/tenants/:tenantId/courses', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.listCourses);
router.get('/courses/:id', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.getCourse);
router.put('/courses/:id', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.updateCourse);
router.delete('/courses/:id', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.deleteCourse);
// course templates (admin)
router.post('/course-templates', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.createTemplate);
router.get('/course-templates', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.listTemplates);
router.get('/course-templates/:id', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.getTemplate);
router.put('/course-templates/:id', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.updateTemplate);
router.delete('/course-templates/:id', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.deleteTemplate);
// template modules (direct, no chapter layer)
router.post('/course-templates/:templateId/modules', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.addTemplateModule);
router.get('/template-modules/:moduleId', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.getTemplateModule);
router.put('/template-modules/:moduleId', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.updateTemplateModule);
router.delete('/template-modules/:moduleId', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.deleteTemplateModule);
// template module blocks
router.post('/template-modules/:moduleId/blocks', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.addTemplateModuleBlock);
router.get('/template-modules/:moduleId/blocks', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.getTemplateModuleBlocks);
router.delete('/template-module-blocks/:blockId', (0, authGuard_2.requireAuth)(['admin']), courseTemplateController_1.default.deleteTemplateModuleBlock);
// course chapters
router.post('/courses/:courseId/chapters', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.addChapter);
router.get('/chapters/:chapterId', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.getChapter);
router.put('/chapters/:chapterId', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.updateChapter);
router.delete('/chapters/:chapterId', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.deleteChapter);
// course modules (now under chapters) - backward compatibility
router.post('/courses/:courseId/modules', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.addModuleToCourse);
router.get('/modules/:moduleId', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.getModule);
router.put('/modules/:moduleId', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.updateModule);
router.delete('/modules/:moduleId', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.deleteModule);
// module blocks
router.post('/modules/:moduleId/blocks', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.addBlock);
router.get('/modules/:moduleId/blocks', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.listBlocksByModule);
router.post('/modules/:moduleId/blocks/reorder', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.reorderBlocks);
router.put('/blocks/:blockId', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.updateBlock);
router.delete('/blocks/:blockId', (0, authGuard_2.requireAuth)(['admin']), courseController_1.default.deleteBlock);
// quiz endpoints (learner-facing)
router.post('/quiz/submit', authGuard_1.default, quiz_controller_1.default.submitQuizAttempt);
router.get('/quiz/attempts/:blockId', authGuard_1.default, quiz_controller_1.default.getQuizAttempts);
router.get('/quiz/latest/:blockId', authGuard_1.default, quiz_controller_1.default.getLatestQuizAttempt);
router.get('/modules/:moduleId/courses/:courseId/access', authGuard_1.default, quiz_controller_1.default.checkModuleAccess);
router.post('/modules/complete', authGuard_1.default, quiz_controller_1.default.markModuleComplete);
// quiz analytics endpoints (admin)
router.get('/analytics/quiz/:blockId', (0, authGuard_2.requireAuth)(['admin']), quiz_controller_1.default.getQuizAnalytics);
router.get('/analytics/course/:courseId/quizzes', (0, authGuard_2.requireAuth)(['admin']), quiz_controller_1.default.getCourseQuizAnalytics);
router.get('/analytics/quiz/:blockId/top-performers', (0, authGuard_2.requireAuth)(['admin']), quiz_controller_1.default.getTopPerformers);
router.get('/analytics/tenant', (0, authGuard_2.requireAuth)(['admin']), quiz_controller_1.default.getTenantAnalytics);
router.get('/analytics/tenant/courses', (0, authGuard_2.requireAuth)(['admin']), quiz_controller_1.default.getTenantCourseAnalytics);
router.get('/analytics/admin', (0, authGuard_2.requireAuth)(['admin']), quiz_controller_1.default.getAdminDashboardAnalytics);
// enrollments (Phase 9 - Feature 1)
router.post('/enrollments', (0, authGuard_2.requireAuth)(['admin']), enrollmentController_1.default.enrollUserInCourse);
router.get('/enrollments/me', authGuard_1.default, enrollmentController_1.default.getMyEnrollments);
router.get('/enrollments/:enrollmentId/progress', authGuard_1.default, enrollmentController_1.default.getEnrollmentProgress);
router.delete('/enrollments/:enrollmentId', (0, authGuard_2.requireAuth)(['admin']), enrollmentController_1.default.unenrollUser);
// auth
router.post('/auth/login', rateLimiters_1.authLimiter, authController_1.default.login);
router.post('/auth/register', rateLimiters_1.authLimiter, authController_1.default.register);
router.post('/auth/logout', authController_1.default.logout);
router.post('/auth/refresh', authController_1.default.refresh);
router.post('/auth/accept-invite', rateLimiters_1.authLimiter, authController_1.default.acceptInvite);
router.post('/auth/forgot-password', rateLimiters_1.inviteLimiter, authController_1.default.forgotPassword);
router.post('/auth/reset-password', rateLimiters_1.authLimiter, authController_1.default.resetPassword);
// protected example — any authenticated user
router.get('/me', authGuard_1.default, (req, res) => {
    res.json({ user: req.user, tenant: req.tenant || null });
});
exports.default = router;
