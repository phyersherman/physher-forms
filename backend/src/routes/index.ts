import { Router } from 'express'
import tenantController from '../controllers/tenantController'
import authController from '../controllers/authController'
import requireAuth from '../middleware/authGuard'
import { requireAuth as requireRoleAuth } from '../middleware/authGuard'
import courseController from '../controllers/courseController'
import courseTemplateController from '../controllers/courseTemplateController'
import { Request, Response } from 'express'

const router = Router()

router.get('/health', (_req, res) => res.json({ ok: true }))

// tenant management (admin)
router.get('/tenants', requireRoleAuth(['admin']), tenantController.listTenants)
router.get('/tenants/:id', requireRoleAuth(['admin']), tenantController.getTenant)
router.post('/tenants', requireRoleAuth(['admin']), tenantController.createTenant)
router.put('/tenants/:id', requireRoleAuth(['admin']), tenantController.updateTenant)
router.delete('/tenants/:id', requireRoleAuth(['admin']), tenantController.deleteTenant)

// global courses (admin - available across all tenants)
router.get('/courses/global', requireRoleAuth(['admin']), courseController.listGlobalCourses)
router.post('/courses', requireRoleAuth(['admin']), courseController.createCourse)
router.post('/courses/assign-to-tenant', requireRoleAuth(['admin']), courseController.assignCourseToTenant)

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

// auth
router.post('/auth/login', authController.login)
router.post('/auth/register', authController.register)
router.post('/auth/logout', authController.logout)
router.post('/auth/refresh', authController.refresh)

// protected example — any authenticated user
router.get('/me', requireAuth, (req: Request, res: Response) => {
	res.json({ user: req.user, tenant: req.tenant || null })
})

export default router
