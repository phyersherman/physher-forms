import { Request, Response } from 'express'
import * as emailConfigService from '../services/emailConfigService'
import * as emailService from '../services/emailService'
import { isValidEmail } from '../utils/validators'

/**
 * GET /api/email-config
 * Get email configuration (global or tenant-specific)
 * Admin only
 */
export const getEmailConfig = async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string | undefined

    // If tenantId provided, verify admin belongs to that tenant
    if (tenantId && req.user?.tenantId !== tenantId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const config = await emailConfigService.getEmailConfig(tenantId)
    res.json(config)
  } catch (error: any) {
    console.error('Get email config error:', error)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to get email configuration' })
  }
}

/**
 * GET /api/email-config/:id
 * Get email configuration by ID
 * Admin only
 */
export const getEmailConfigById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const config = await emailConfigService.getEmailConfigById(id)
    
    // Verify admin belongs to this tenant (or is super admin for global config)
    if (config.tenantId && req.user?.tenantId !== config.tenantId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    res.json(config)
  } catch (error: any) {
    console.error('Get email config by ID error:', error)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to get email configuration' })
  }
}

/**
 * GET /api/email-configs
 * List email configurations
 * Admin only
 */
export const listEmailConfigs = async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string | undefined

    // If tenantId provided, verify admin belongs to that tenant
    if (tenantId && req.user?.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const configs = await emailConfigService.listEmailConfigs(
      tenantId !== undefined ? tenantId : undefined
    )
    res.json(configs)
  } catch (error: any) {
    console.error('List email configs error:', error)
    res.status(500).json({ error: 'Failed to list email configurations' })
  }
}

/**
 * POST /api/email-config
 * Create email configuration
 * Admin only
 */
export const createEmailConfig = async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string | undefined
    const { provider, apiKey, domain, fromEmail, fromName, replyToEmail, isActive } = req.body

    // If tenantId provided, verify admin belongs to that tenant
    if (tenantId && req.user?.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Validate required fields
    if (!provider || !apiKey || !domain || !fromEmail || !fromName) {
      return res.status(400).json({ 
        error: 'Provider, API key, domain, from email, and from name are required' 
      })
    }

    const config = await emailConfigService.createEmailConfig(
      { provider, apiKey, domain, fromEmail, fromName, replyToEmail, isActive: isActive ?? true },
      tenantId
    )

    res.status(201).json(config)
  } catch (error: any) {
    console.error('Create email config error:', error)
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(400).json({ error: error.message })
    }
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to create email configuration' })
  }
}

/**
 * PUT /api/email-config/:id
 * Update email configuration
 * Admin only
 */
export const updateEmailConfig = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { provider, apiKey, domain, fromEmail, fromName, replyToEmail, isActive } = req.body

    // Get existing config to verify ownership
    const existingConfig = await emailConfigService.getEmailConfigById(id)
    
    // Verify admin belongs to this tenant (or is super admin for global config)
    if (existingConfig.tenantId && req.user?.tenantId !== existingConfig.tenantId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const config = await emailConfigService.updateEmailConfig(id, {
      provider,
      apiKey,
      domain,
      fromEmail,
      fromName,
      replyToEmail,
      isActive,
    })

    res.json(config)
  } catch (error: any) {
    console.error('Update email config error:', error)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to update email configuration' })
  }
}

/**
 * DELETE /api/email-config/:id
 * Delete email configuration
 * Admin only
 */
export const deleteEmailConfig = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    // Get existing config to verify ownership
    const existingConfig = await emailConfigService.getEmailConfigById(id)
    
    // Verify admin belongs to this tenant (or is super admin for global config)
    if (existingConfig.tenantId && req.user?.tenantId !== existingConfig.tenantId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await emailConfigService.deleteEmailConfig(id)
    res.json({ success: true, message: 'Email configuration deleted' })
  } catch (error: any) {
    console.error('Delete email config error:', error)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to delete email configuration' })
  }
}

/**
 * POST /api/email-config/:id/test
 * Test email configuration by sending a test email
 * Admin only
 */
export const testEmailConfig = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { recipientEmail } = req.body

    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      return res.status(400).json({ error: 'Valid recipient email is required' })
    }

    // Get existing config to verify ownership
    const existingConfig = await emailConfigService.getEmailConfigById(id)
    
    // Verify admin belongs to this tenant (or is super admin for global config)
    if (existingConfig.tenantId && req.user?.tenantId !== existingConfig.tenantId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Send test email
    await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Test Email from LMS',
      templateName: 'welcome',
      variables: {
        recipientName: 'Test User',
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      },
      tenantId: existingConfig.tenantId || undefined,
    })

    res.json({ success: true, message: 'Test email sent successfully' })
  } catch (error: any) {
    console.error('Test email config error:', error)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: `Failed to send test email: ${error.message}` })
  }
}

/**
 * GET /api/email-logs
 * Get email logs for a tenant
 * Admin only
 */
export const getEmailLogs = async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string | undefined
    const limit = parseInt(req.query.limit as string) || 50

    // If tenantId provided, verify admin belongs to that tenant
    if (tenantId && req.user?.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const logs = await emailService.getEmailLogs(tenantId, limit)
    res.json(logs)
  } catch (error: any) {
    console.error('Get email logs error:', error)
    res.status(500).json({ error: 'Failed to get email logs' })
  }
}

export default {
  getEmailConfig,
  getEmailConfigById,
  listEmailConfigs,
  createEmailConfig,
  updateEmailConfig,
  deleteEmailConfig,
  testEmailConfig,
  getEmailLogs,
}
