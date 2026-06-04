import { Router } from 'express'
import tenantController from '../controllers/tenantController'
import authController from '../controllers/authController'
import * as userController from '../controllers/userController'
import emailController from '../controllers/emailController'
import * as passwordlessAuthController from '../controllers/passwordless-auth-controller'
import * as bulkUserController from '../controllers/bulk-user-controller'
import * as respondentAuthController from '../controllers/respondentAuthController'
import * as formController from '../controllers/formController'
import * as respondentFormController from '../controllers/respondentFormController'
import * as adminCompletionController from '../controllers/adminCompletionController'
import requireAuth from '../middleware/authGuard'
import { requireAuth as requireRoleAuth } from '../middleware/authGuard'
import { requireRespondentAuth } from '../middleware/respondentAuthGuard'
import { authLimiter, inviteLimiter } from '../middleware/rateLimiters'
import { Request, Response } from 'express'

const router = Router()

router.get('/health', (_req: Request, res: Response) => res.json({ ok: true }))

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

// global user management (admin) - platform-wide users
router.get('/users', requireRoleAuth(['admin']), userController.listGlobalUsers)
router.get('/users/:userId', requireRoleAuth(['admin']), userController.getGlobalUser)
router.post('/users', requireRoleAuth(['admin']), userController.createGlobalUser)
router.put('/users/:userId', requireRoleAuth(['admin']), userController.updateGlobalUser)
router.delete('/users/:userId', requireRoleAuth(['admin']), userController.deleteGlobalUser)
router.post('/users/:userId/disable', requireRoleAuth(['admin']), userController.disableGlobalUser)
router.post('/users/:userId/enable', requireRoleAuth(['admin']), userController.enableGlobalUser)
router.post('/users/:userId/invite', requireRoleAuth(['admin']), inviteLimiter, userController.inviteGlobalUser)

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

// bulk user operations
router.post('/tenants/:tenantId/users/import-csv', requireRoleAuth(['admin']), bulkUserController.importUsersFromCSV)
router.post('/tenants/:tenantId/users/bulk-create', requireRoleAuth(['admin']), bulkUserController.bulkCreateUsers)
router.get('/tenants/:tenantId/bulk-imports', requireRoleAuth(['admin']), bulkUserController.getBulkImportJobs)
router.get('/bulk-imports/:jobId', requireRoleAuth(['admin']), bulkUserController.getBulkImportJob)

// magic code cleanup (admin - for cron jobs)
router.post('/admin/magic-codes/cleanup', requireRoleAuth(['admin']), passwordlessAuthController.cleanupExpiredCodes)

// ─── Respondent Auth (public, rate-limited) ───────────────────────────────
router.post('/respondent/send-code', authLimiter, respondentAuthController.sendCode)
router.post('/respondent/verify-code', authLimiter, respondentAuthController.verifyCodeHandler)
router.post('/respondent/logout', respondentAuthController.logout)

// ─── Respondent Forms (requires respondent session) ───────────────────────
router.get('/respondent/forms', requireRespondentAuth, respondentFormController.listForms)
router.get('/respondent/forms/:id', requireRespondentAuth, respondentFormController.getForm)
router.post('/respondent/forms/:id/complete', requireRespondentAuth, respondentFormController.completeForm)
// JotForm Thank You page redirect callback (also requires respondent session via cookie)
router.get('/respondent/form-complete', requireRespondentAuth, respondentFormController.formCompleteCallback)

// ─── Admin: Form Management ───────────────────────────────────────────────
router.get('/admin/forms', requireRoleAuth(['admin']), formController.listForms)
router.post('/admin/forms', requireRoleAuth(['admin']), formController.createForm)
router.get('/admin/forms/:id', requireRoleAuth(['admin']), formController.getForm)
router.put('/admin/forms/:id', requireRoleAuth(['admin']), formController.updateForm)
router.delete('/admin/forms/:id', requireRoleAuth(['admin']), formController.deleteForm)

// ─── Admin: Completion Tracking ───────────────────────────────────────────
router.get('/admin/completions', requireRoleAuth(['admin']), adminCompletionController.listCompletions)
router.get('/admin/completions/export', requireRoleAuth(['admin']), adminCompletionController.exportCompletionsCSV)
router.delete('/admin/completions/:id', requireRoleAuth(['admin']), adminCompletionController.resetCompletion)

// auth
router.post('/auth/login', authController.login)
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
