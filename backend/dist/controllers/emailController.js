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
exports.getEmailLogs = exports.testEmailConfig = exports.deleteEmailConfig = exports.updateEmailConfig = exports.createEmailConfig = exports.listEmailConfigs = exports.getEmailConfigById = exports.getEmailConfig = void 0;
const emailConfigService = __importStar(require("../services/emailConfigService"));
const emailService = __importStar(require("../services/emailService"));
const validators_1 = require("../utils/validators");
/**
 * GET /api/email-config
 * Get email configuration (global or tenant-specific)
 * Admin only
 */
const getEmailConfig = async (req, res) => {
    try {
        const tenantId = req.query.tenantId;
        // If tenantId provided, verify admin belongs to that tenant
        if (tenantId && req.user?.tenantId !== tenantId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const config = await emailConfigService.getEmailConfig(tenantId);
        res.json(config);
    }
    catch (error) {
        console.error('Get email config error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to get email configuration' });
    }
};
exports.getEmailConfig = getEmailConfig;
/**
 * GET /api/email-config/:id
 * Get email configuration by ID
 * Admin only
 */
const getEmailConfigById = async (req, res) => {
    try {
        const id = req.params.id;
        const config = await emailConfigService.getEmailConfigById(id);
        // Verify admin belongs to this tenant (or is super admin for global config)
        if (config.tenantId && req.user?.tenantId !== config.tenantId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        res.json(config);
    }
    catch (error) {
        console.error('Get email config by ID error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to get email configuration' });
    }
};
exports.getEmailConfigById = getEmailConfigById;
/**
 * GET /api/email-configs
 * List email configurations
 * Admin only
 */
const listEmailConfigs = async (req, res) => {
    try {
        const tenantId = req.query.tenantId;
        // If tenantId provided, verify admin belongs to that tenant
        if (tenantId && req.user?.tenantId !== tenantId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const configs = await emailConfigService.listEmailConfigs(tenantId !== undefined ? tenantId : undefined);
        res.json(configs);
    }
    catch (error) {
        console.error('List email configs error:', error);
        res.status(500).json({ error: 'Failed to list email configurations' });
    }
};
exports.listEmailConfigs = listEmailConfigs;
/**
 * POST /api/email-config
 * Create email configuration
 * Admin only
 */
const createEmailConfig = async (req, res) => {
    try {
        const tenantId = req.query.tenantId;
        const { provider, apiKey, domain, fromEmail, fromName, replyToEmail, isActive } = req.body;
        // If tenantId provided, verify admin belongs to that tenant
        if (tenantId && req.user?.tenantId !== tenantId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        // Validate required fields
        if (!provider || !apiKey || !domain || !fromEmail || !fromName) {
            return res.status(400).json({
                error: 'Provider, API key, domain, from email, and from name are required'
            });
        }
        const config = await emailConfigService.createEmailConfig({ provider, apiKey, domain, fromEmail, fromName, replyToEmail, isActive: isActive ?? true }, tenantId);
        res.status(201).json(config);
    }
    catch (error) {
        console.error('Create email config error:', error);
        if (error.message.includes('Invalid') || error.message.includes('required')) {
            return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create email configuration' });
    }
};
exports.createEmailConfig = createEmailConfig;
/**
 * PUT /api/email-config/:id
 * Update email configuration
 * Admin only
 */
const updateEmailConfig = async (req, res) => {
    try {
        const id = req.params.id;
        const { provider, apiKey, domain, fromEmail, fromName, replyToEmail, isActive } = req.body;
        // Get existing config to verify ownership
        const existingConfig = await emailConfigService.getEmailConfigById(id);
        // Verify admin belongs to this tenant (or is super admin for global config)
        if (existingConfig.tenantId && req.user?.tenantId !== existingConfig.tenantId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const config = await emailConfigService.updateEmailConfig(id, {
            provider,
            apiKey,
            domain,
            fromEmail,
            fromName,
            replyToEmail,
            isActive,
        });
        res.json(config);
    }
    catch (error) {
        console.error('Update email config error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Invalid')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update email configuration' });
    }
};
exports.updateEmailConfig = updateEmailConfig;
/**
 * DELETE /api/email-config/:id
 * Delete email configuration
 * Admin only
 */
const deleteEmailConfig = async (req, res) => {
    try {
        const id = req.params.id;
        // Get existing config to verify ownership
        const existingConfig = await emailConfigService.getEmailConfigById(id);
        // Verify admin belongs to this tenant (or is super admin for global config)
        if (existingConfig.tenantId && req.user?.tenantId !== existingConfig.tenantId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await emailConfigService.deleteEmailConfig(id);
        res.json({ success: true, message: 'Email configuration deleted' });
    }
    catch (error) {
        console.error('Delete email config error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to delete email configuration' });
    }
};
exports.deleteEmailConfig = deleteEmailConfig;
/**
 * POST /api/email-config/:id/test
 * Test email configuration by sending a test email
 * Admin only
 */
const testEmailConfig = async (req, res) => {
    try {
        const id = req.params.id;
        const { recipientEmail } = req.body;
        if (!recipientEmail || !(0, validators_1.isValidEmail)(recipientEmail)) {
            return res.status(400).json({ error: 'Valid recipient email is required' });
        }
        // Get existing config to verify ownership
        const existingConfig = await emailConfigService.getEmailConfigById(id);
        // Verify admin belongs to this tenant (or is super admin for global config)
        if (existingConfig.tenantId && req.user?.tenantId !== existingConfig.tenantId) {
            return res.status(403).json({ error: 'Not authorized' });
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
        });
        res.json({ success: true, message: 'Test email sent successfully' });
    }
    catch (error) {
        console.error('Test email config error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: `Failed to send test email: ${error.message}` });
    }
};
exports.testEmailConfig = testEmailConfig;
/**
 * GET /api/email-logs
 * Get email logs for a tenant
 * Admin only
 */
const getEmailLogs = async (req, res) => {
    try {
        const tenantId = req.query.tenantId;
        const limit = parseInt(req.query.limit) || 50;
        // Global admins (tenantId === null) can view any logs
        // Tenant admins can only view logs for their tenant
        const isGlobalAdmin = req.user?.tenantId === null || req.user?.tenantId === undefined;
        if (!isGlobalAdmin && tenantId && req.user?.tenantId !== tenantId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        // If tenant admin and no tenantId specified, default to their tenant
        const effectiveTenantId = isGlobalAdmin ? tenantId : (tenantId || req.user?.tenantId);
        const logs = await emailService.getEmailLogs(effectiveTenantId, limit);
        res.json(logs);
    }
    catch (error) {
        console.error('Get email logs error:', error);
        res.status(500).json({ error: 'Failed to get email logs' });
    }
};
exports.getEmailLogs = getEmailLogs;
exports.default = {
    getEmailConfig: exports.getEmailConfig,
    getEmailConfigById: exports.getEmailConfigById,
    listEmailConfigs: exports.listEmailConfigs,
    createEmailConfig: exports.createEmailConfig,
    updateEmailConfig: exports.updateEmailConfig,
    deleteEmailConfig: exports.deleteEmailConfig,
    testEmailConfig: exports.testEmailConfig,
    getEmailLogs: exports.getEmailLogs,
};
