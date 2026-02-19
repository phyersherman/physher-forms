"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenantController_1 = __importDefault(require("../controllers/tenantController"));
const authController_1 = __importDefault(require("../controllers/authController"));
const authGuard_1 = __importDefault(require("../middleware/authGuard"));
const authGuard_2 = require("../middleware/authGuard");
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
// auth
router.post('/auth/login', authController_1.default.login);
router.post('/auth/register', authController_1.default.register);
router.post('/auth/logout', authController_1.default.logout);
router.post('/auth/refresh', authController_1.default.refresh);
// protected example — any authenticated user
router.get('/me', authGuard_1.default, (req, res) => {
    res.json({ user: req.user, tenant: req.tenant || null });
});
exports.default = router;
