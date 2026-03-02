"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEmailConfig = exports.deleteEmailConfig = exports.updateEmailConfig = exports.createEmailConfig = exports.listEmailConfigs = exports.getEmailConfigById = exports.getEmailConfig = void 0;
const client_1 = __importDefault(require("../db/client"));
const crypto_1 = require("../utils/crypto");
const validators_1 = require("../utils/validators");
/**
 * Build a config object from environment variables
 * Used as fallback if no database config exists
 */
const buildEnvEmailConfig = () => {
    if (!process.env.MAILGUN_API_KEY ||
        !process.env.MAILGUN_DOMAIN ||
        !process.env.EMAIL_FROM_ADDRESS ||
        !process.env.EMAIL_FROM_NAME) {
        return null;
    }
    return {
        id: 'env-fallback',
        tenantId: null,
        provider: 'mailgun',
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        fromEmail: process.env.EMAIL_FROM_ADDRESS,
        fromName: process.env.EMAIL_FROM_NAME,
        replyToEmail: process.env.EMAIL_REPLY_TO || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
/**
 * Get email configuration for a tenant
 * Falls back to global config if tenant config doesn't exist or is inactive
 * Falls back to environment variables as last resort
 */
const getEmailConfig = async (tenantId) => {
    let config = null;
    // Try tenant-specific config first if tenantId provided
    if (tenantId) {
        config = await client_1.default.emailConfig.findFirst({
            where: { tenantId, isActive: true },
        });
    }
    // Fall back to global config if no tenant config found
    if (!config) {
        config = await client_1.default.emailConfig.findFirst({
            where: { tenantId: null, isActive: true },
        });
    }
    // Fall back to environment variables if no database config found
    if (!config) {
        config = buildEnvEmailConfig();
    }
    if (!config) {
        throw new Error('No active email configuration found. ' +
            'Please configure email settings via the admin panel or set environment variables: ' +
            'MAILGUN_API_KEY, MAILGUN_DOMAIN, EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME');
    }
    // Decrypt API key before returning (if it's from database)
    if (config.id !== 'env-fallback') {
        const decryptedApiKey = (0, crypto_1.decrypt)(config.apiKey);
        return {
            ...config,
            apiKey: decryptedApiKey,
        };
    }
    return config;
};
exports.getEmailConfig = getEmailConfig;
/**
 * Get email configuration by ID
 */
const getEmailConfigById = async (id) => {
    const config = await client_1.default.emailConfig.findUnique({
        where: { id },
    });
    if (!config) {
        throw new Error('Email configuration not found');
    }
    // Decrypt API key before returning
    const decryptedApiKey = (0, crypto_1.decrypt)(config.apiKey);
    return {
        ...config,
        apiKey: decryptedApiKey,
    };
};
exports.getEmailConfigById = getEmailConfigById;
/**
 * List email configurations
 * Can filter by tenantId (null for global)
 */
const listEmailConfigs = async (tenantId) => {
    const where = tenantId !== undefined ? { tenantId } : {};
    const configs = await client_1.default.emailConfig.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
    // Return configs with masked API keys (don't expose in list view)
    return configs.map((config) => ({
        ...config,
        apiKey: '••••••••', // Mask API key in list view
    }));
};
exports.listEmailConfigs = listEmailConfigs;
/**
 * Create email configuration
 */
const createEmailConfig = async (data, tenantId) => {
    // Validate email addresses
    if (!(0, validators_1.isValidEmail)(data.fromEmail)) {
        throw new Error('Invalid from email address');
    }
    if (data.replyToEmail && !(0, validators_1.isValidEmail)(data.replyToEmail)) {
        throw new Error('Invalid reply-to email address');
    }
    // Validate required fields
    if (!data.provider || !data.apiKey || !data.domain) {
        throw new Error('Provider, API key, and domain are required');
    }
    // Check if config already exists for this tenant
    const existing = await client_1.default.emailConfig.findFirst({
        where: { tenantId: tenantId || null },
    });
    if (existing) {
        throw new Error(tenantId
            ? 'Email configuration already exists for this tenant'
            : 'Global email configuration already exists');
    }
    // Encrypt API key before storing
    const encryptedApiKey = (0, crypto_1.encrypt)(data.apiKey);
    const config = await client_1.default.emailConfig.create({
        data: {
            tenantId: tenantId || null,
            provider: data.provider,
            apiKey: encryptedApiKey,
            domain: data.domain,
            fromEmail: data.fromEmail,
            fromName: data.fromName,
            replyToEmail: data.replyToEmail || null,
            isActive: data.isActive,
        },
    });
    return {
        ...config,
        apiKey: '••••••••', // Don't return actual API key
    };
};
exports.createEmailConfig = createEmailConfig;
/**
 * Update email configuration
 */
const updateEmailConfig = async (id, data) => {
    // Validate email addresses if provided
    if (data.fromEmail && !(0, validators_1.isValidEmail)(data.fromEmail)) {
        throw new Error('Invalid from email address');
    }
    if (data.replyToEmail && !(0, validators_1.isValidEmail)(data.replyToEmail)) {
        throw new Error('Invalid reply-to email address');
    }
    const updateData = { ...data };
    // Encrypt API key if provided
    if (data.apiKey) {
        updateData.apiKey = (0, crypto_1.encrypt)(data.apiKey);
    }
    const config = await client_1.default.emailConfig.update({
        where: { id },
        data: updateData,
    });
    return {
        ...config,
        apiKey: '••••••••', // Don't return actual API key
    };
};
exports.updateEmailConfig = updateEmailConfig;
/**
 * Delete email configuration
 */
const deleteEmailConfig = async (id) => {
    await client_1.default.emailConfig.delete({
        where: { id },
    });
};
exports.deleteEmailConfig = deleteEmailConfig;
/**
 * Test email configuration by trying to decrypt API key
 */
const testEmailConfig = async (id) => {
    const config = await (0, exports.getEmailConfigById)(id);
    // If we can get and decrypt the config, it's valid
    return {
        valid: true,
        provider: config.provider,
        domain: config.domain,
        fromEmail: config.fromEmail,
    };
};
exports.testEmailConfig = testEmailConfig;
exports.default = {
    getEmailConfig: exports.getEmailConfig,
    getEmailConfigById: exports.getEmailConfigById,
    listEmailConfigs: exports.listEmailConfigs,
    createEmailConfig: exports.createEmailConfig,
    updateEmailConfig: exports.updateEmailConfig,
    deleteEmailConfig: exports.deleteEmailConfig,
    testEmailConfig: exports.testEmailConfig,
};
