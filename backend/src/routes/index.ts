import { Router } from 'express'
import tenantController from '../controllers/tenantController'
import authController from '../controllers/authController'
import * as userController from '../controllers/userController'
import emailController from '../controllers/emailController'
import requireAuth from '../middleware/authGuard'
import { requireAuth as requireRoleAuth } from '../middleware/authGuard'
import { authLimiter, inviteLimiter } from '../middleware/rateLimiters'
import courseController from '../controllers/courseController'
import courseTemplateController from '../controllers/courseTemplateController'
import quizController from '../controllers/quiz-controller'
import { Request, Response } from 'express'

const router = Router()

router.get('/health', (_req, res) => res.json({ ok: true }))

// tenant management (admin)
router.get('/tenants', requireRoleAuth(['admin']), tenantController.listTenants)
router.get('/tenants/:id', requireRoleAuth(['admin']), tenantController.getTenant)
router.post('/tenants', requireRoleAuth(['admin']), tenantController.createTenant)
router.put('/tenants/:id', requireRoleAuth(['admin']), tenantController.updateTenant)
router.delete('/tenants/:id', requireRoleAuth(['admin']), tenantController.deleteTenant)

// user management (admin) - tenant-scoped
router.get('/tenants/:tenantId/users', requireRoleAuth(['admin']), userController.listUsers)
router.get('/tenants/:tenantId/users/:userId', requireRoleAuth(['admin']), userController.getUser)
router.post('/tenants/:tenantId/users', requireRoleAuth(['admin']), userController.createUser)
router.put('/tenants/:tenantId/users/:userId', requireRoleAuth(['admin']), userController.updateUser)
router.delete('/tenants/:tenantId/users/:userId', requireRoleAuth(['admin']), userController.deleteUser)
router.post('/tenants/:tenantId/users/:userId/disable', requireRoleAuth(['admin']), userController.disableUser)
router.post('/tenants/:tenantId/users/:userId/enable', requireRoleAuth(['admin']), userController.enableUser)
router.post('/tenants/:tenantId/users/:userId/invite', requireRoleAuth(['admin']), inviteLimiter, userController.inviteUser)

// user self-service (any authenticated user)
router.post('/users/:userId/password', requireAuth, userController.changePassword)

// email configuration (admin)
router.get('/email-config', requireRoleAuth(['admin']), emailController.getEmailConfig)
router.get('/email-config/:id', requireRoleAuth(['admin']), emailController.getEmailConfigById)
router.get('/email-configs', requireRoleAuth(['admin']), emailController.listEmailConfigs)
router.post('/email-config', requireRoleAuth(['admin']), emailController.createEmailConfig)
router.put('/email-config/:id', requireRoleAuth(['admin']), emailController.updateEmailConfig)
router.delete('/email-config/:id', requireRoleAuth(['admin']), emailController.deleteEmailConfig)
router.post('/email-config/:id/test', requireRoleAuth(['admin']), emailController.testEmailConfig)
router.get('/email-logs', requireRoleAuth(['admin']), emailController.getEmailLogs)

// global courses (admin - available across all tenants)
router.get('/courses/global', requireRoleAuth(['admin']), courseController.listGlobalCourses)
router.post('/courses', requireRoleAuth(['admin']), courseController.createCourse)
router.post('/courses/assign-to-tenant', requireRoleAuth(['admin']), courseController.assignCourseToTenant)
router.post('/courses/:courseId/copy', requireRoleAuth(['admin']), courseController.copyCourse)

// tenant-specific courses (admin)
router.post('/tenants/:tenantId/courses', requireRoleAuth(['admin']), courseController.createCourse)
router.get('/tenants/:tenantId/courses', requireRoleAuth(['admin']), courseController.listCourses)
router.get('/courses/:id', requireRoleAuth(['admin']), courseController.getCourse)
router.put('/courses/:id', requireRoleAuth(['admin']), courseController.updateCourse)
router.delete('/courses/:id', requireRoleAuth(['admin']), courseController.deleteCourse)

// course templates (admin)
router.post('/course-templates', requireRoleAuth(['admin']), courseTemplateController.createTemplate)
router.get('/course-templates', requireRoleAuth(['admin']), courseTemplateController.listTemplates)
router.get('/course-templates/:id', requireRoleAuth(['admin']), courseTemplateController.getTemplate)
router.put('/course-templates/:id', requireRoleAuth(['admin']), courseTemplateController.updateTemplate)
router.delete('/course-templates/:id', requireRoleAuth(['admin']), courseTemplateController.deleteTemplate)

// template modules (direct, no chapter layer)
router.post('/course-templates/:templateId/modules', requireRoleAuth(['admin']), courseTemplateController.addTemplateModule)
router.get('/template-modules/:moduleId', requireRoleAuth(['admin']), courseTemplateController.getTemplateModule)
router.put('/template-modules/:moduleId', requireRoleAuth(['admin']), courseTemplateController.updateTemplateModule)
router.delete('/template-modules/:moduleId', requireRoleAuth(['admin']), courseTemplateController.deleteTemplateModule)

// template module blocks
router.post('/template-modules/:moduleId/blocks', requireRoleAuth(['admin']), courseTemplateController.addTemplateModuleBlock)
router.get('/template-modules/:moduleId/blocks', requireRoleAuth(['admin']), courseTemplateController.getTemplateModuleBlocks)
router.delete('/template-module-blocks/:blockId', requireRoleAuth(['admin']), courseTemplateController.deleteTemplateModuleBlock)

// course chapters
router.post('/courses/:courseId/chapters', requireRoleAuth(['admin']), courseController.addChapter)
router.get('/chapters/:chapterId', requireRoleAuth(['admin']), courseController.getChapter)
router.put('/chapters/:chapterId', requireRoleAuth(['admin']), courseController.updateChapter)
router.delete('/chapters/:chapterId', requireRoleAuth(['admin']), courseController.deleteChapter)

// course modules (now under chapters) - backward compatibility
router.post('/courses/:courseId/modules', requireRoleAuth(['admin']), courseController.addModuleToCourse)
router.get('/modules/:moduleId', requireRoleAuth(['admin']), courseController.getModule)
router.put('/modules/:moduleId', requireRoleAuth(['admin']), courseController.updateModule)
router.delete('/modules/:moduleId', requireRoleAuth(['admin']), courseController.deleteModule)

// module blocks
router.post('/modules/:moduleId/blocks', requireRoleAuth(['admin']), courseController.addBlock)
router.get('/modules/:moduleId/blocks', requireRoleAuth(['admin']), courseController.listBlocksByModule)
router.post('/modules/:moduleId/blocks/reorder', requireRoleAuth(['admin']), courseController.reorderBlocks)
router.put('/blocks/:blockId', requireRoleAuth(['admin']), courseController.updateBlock)
router.delete('/blocks/:blockId', requireRoleAuth(['admin']), courseController.deleteBlock)

// quiz endpoints (learner-facing)
router.post('/quiz/submit', requireAuth, quizController.submitQuizAttempt)
router.get('/quiz/attempts/:blockId', requireAuth, quizController.getQuizAttempts)
router.get('/quiz/latest/:blockId', requireAuth, quizController.getLatestQuizAttempt)
router.get('/modules/:moduleId/courses/:courseId/access', requireAuth, quizController.checkModuleAccess)
router.post('/modules/complete', requireAuth, quizController.markModuleComplete)

// quiz analytics endpoints (admin)
router.get('/analytics/quiz/:blockId', requireRoleAuth(['admin']), quizController.getQuizAnalytics)
router.get('/analytics/course/:courseId/quizzes', requireRoleAuth(['admin']), quizController.getCourseQuizAnalytics)
router.get('/analytics/quiz/:blockId/top-performers', requireRoleAuth(['admin']), quizController.getTopPerformers)
router.get('/analytics/tenant', requireRoleAuth(['admin']), quizController.getTenantAnalytics)
router.get('/analytics/tenant/courses', requireRoleAuth(['admin']), quizController.getTenantCourseAnalytics)
router.get('/analytics/admin', requireRoleAuth(['admin']), quizController.getAdminDashboardAnalytics)

// auth
router.post('/auth/login', authLimiter, authController.login)
router.post('/auth/register', authLimiter, authController.register)
router.post('/auth/logout', authController.logout)
router.post('/auth/refresh', authController.refresh)
router.post('/auth/accept-invite', authLimiter, authController.acceptInvite)
router.post('/auth/forgot-password', inviteLimiter, authController.forgotPassword)
router.post('/auth/reset-password', authLimiter, authController.resetPassword)

// protected example — any authenticated user
router.get('/me', requireAuth, (req: Request, res: Response) => {
	res.json({ user: req.user, tenant: req.tenant || null })
})

export default router
