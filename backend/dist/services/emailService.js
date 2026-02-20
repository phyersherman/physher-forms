"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailLogs = exports.sendWelcomeEmail = exports.sendResetPasswordEmail = exports.sendInviteEmail = exports.sendBulkEmail = exports.sendEmail = void 0;
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const form_data_1 = __importDefault(require("form-data"));
const client_1 = __importDefault(require("../db/client"));
const emailConfigService_1 = require("./emailConfigService");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Get Mailgun client for a tenant
 */
const getMailgunClient = async (tenantId) => {
    const config = await (0, emailConfigService_1.getEmailConfig)(tenantId);
    const mailgun = new mailgun_js_1.default(form_data_1.default);
    const client = mailgun.client({
        username: 'api',
        key: config.apiKey,
    });
    return { client, config };
};
/**
 * Load and render email template
 */
const renderTemplate = (templateName, variables) => {
    const templatePath = path_1.default.join(__dirname, '../templates/emails', `${templateName}.html`);
    if (!fs_1.default.existsSync(templatePath)) {
        throw new Error(`Email template not found: ${templateName}`);
    }
    let html = fs_1.default.readFileSync(templatePath, 'utf-8');
    // Simple variable substitution: {{variableName}}
    Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, variables[key] || '');
    });
    return html;
};
/**
 * Log email send attempt
 */
const logEmail = async (tenantId, recipientEmail, subject, templateName, status, providerMsgId, errorMessage) => {
    await client_1.default.emailLog.create({
        data: {
            tenantId,
            recipientEmail,
            subject,
            templateName,
            status,
            providerMsgId: providerMsgId || null,
            errorMessage: errorMessage || null,
            sentAt: new Date(),
        },
    });
};
/**
 * Send a single email
 */
const sendEmail = async (data) => {
    try {
        const { client, config } = await getMailgunClient(data.tenantId);
        // Render template
        const html = renderTemplate(data.templateName, data.variables);
        // Send email
        const result = await client.messages.create(config.domain, {
            from: `${config.fromName} <${config.fromEmail}>`,
            to: [data.to],
            subject: data.subject,
            html,
            ...(config.replyToEmail && { 'h:Reply-To': config.replyToEmail }),
        });
        // Log success
        await logEmail(data.tenantId || null, data.to, data.subject, data.templateName, 'sent', result.id);
        return { success: true, messageId: result.id };
    }
    catch (error) {
        console.error('Email send error:', error);
        // Log failure
        await logEmail(data.tenantId || null, data.to, data.subject, data.templateName, 'failed', undefined, error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};
exports.sendEmail = sendEmail;
/**
 * Send bulk emails (same template, different variables per recipient)
 */
const sendBulkEmail = async (data) => {
    const results = [];
    for (const recipient of data.recipients) {
        try {
            const variables = { ...data.globalVariables, ...recipient.variables };
            const result = await (0, exports.sendEmail)({
                to: recipient.email,
                subject: data.subject,
                templateName: data.templateName,
                variables,
                tenantId: data.tenantId,
            });
            results.push({
                email: recipient.email,
                success: true,
                messageId: result.messageId,
            });
        }
        catch (error) {
            results.push({
                email: recipient.email,
                success: false,
                error: error.message,
            });
        }
    }
    return {
        total: results.length,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
    };
};
exports.sendBulkEmail = sendBulkEmail;
/**
 * Send user invite email
 */
const sendInviteEmail = async (recipientEmail, recipientName, inviteToken, tenantId) => {
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}`;
    return (0, exports.sendEmail)({
        to: recipientEmail,
        subject: 'You\'ve been invited to join our learning platform',
        templateName: 'invite',
        variables: {
            recipientName,
            inviteUrl,
        },
        tenantId,
    });
};
exports.sendInviteEmail = sendInviteEmail;
/**
 * Send password reset email
 */
const sendResetPasswordEmail = async (recipientEmail, recipientName, resetToken, tenantId) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    return (0, exports.sendEmail)({
        to: recipientEmail,
        subject: 'Reset your password',
        templateName: 'reset-password',
        variables: {
            recipientName,
            resetUrl,
        },
        tenantId,
    });
};
exports.sendResetPasswordEmail = sendResetPasswordEmail;
/**
 * Send welcome email (after user accepts invite)
 */
const sendWelcomeEmail = async (recipientEmail, recipientName, tenantId) => {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    return (0, exports.sendEmail)({
        to: recipientEmail,
        subject: 'Welcome to our learning platform',
        templateName: 'welcome',
        variables: {
            recipientName,
            loginUrl,
        },
        tenantId,
    });
};
exports.sendWelcomeEmail = sendWelcomeEmail;
/**
 * Get email logs for a tenant
 */
const getEmailLogs = async (tenantId, limit = 50) => {
    const where = tenantId ? { tenantId } : {};
    return client_1.default.emailLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit,
    });
};
exports.getEmailLogs = getEmailLogs;
exports.default = {
    sendEmail: exports.sendEmail,
    sendBulkEmail: exports.sendBulkEmail,
    sendInviteEmail: exports.sendInviteEmail,
    sendResetPasswordEmail: exports.sendResetPasswordEmail,
    sendWelcomeEmail: exports.sendWelcomeEmail,
    getEmailLogs: exports.getEmailLogs,
};
