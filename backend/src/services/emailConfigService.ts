import prisma from '../db/client'
import { encrypt, decrypt } from '../utils/crypto'
import { isValidEmail } from '../utils/validators'

export interface EmailConfigData {
  provider: string
  apiKey: string
  domain: string
  fromEmail: string
  fromName: string
  replyToEmail?: string
  isActive: boolean
}

/**
 * Build a config object from environment variables
 * Used as fallback if no database config exists
 */
const buildEnvEmailConfig = () => {
  if (
    !process.env.MAILGUN_API_KEY ||
    !process.env.MAILGUN_DOMAIN ||
    !process.env.EMAIL_FROM_ADDRESS ||
    !process.env.EMAIL_FROM_NAME
  ) {
    return null
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
  }
}

/**
 * Get email configuration for a tenant
 * Falls back to global config if tenant config doesn't exist or is inactive
 * Falls back to environment variables as last resort
 */
export const getEmailConfig = async (tenantId?: string) => {
  let config = null

  // Try tenant-specific config first if tenantId provided
  if (tenantId) {
    config = await prisma.emailConfig.findFirst({
      where: { tenantId, isActive: true },
    })
  }

  // Fall back to global config if no tenant config found
  if (!config) {
    config = await prisma.emailConfig.findFirst({
      where: { tenantId: null, isActive: true },
    })
  }

  // Fall back to environment variables if no database config found
  if (!config) {
    config = buildEnvEmailConfig()
  }

  if (!config) {
    throw new Error(
      'No active email configuration found. ' +
      'Please configure email settings via the admin panel or set environment variables: ' +
      'MAILGUN_API_KEY, MAILGUN_DOMAIN, EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME'
    )
  }

  // Decrypt API key before returning (if it's from database)
  if (config.id !== 'env-fallback') {
    const decryptedApiKey = decrypt(config.apiKey)
    return {
      ...config,
      apiKey: decryptedApiKey,
    }
  }

  return config
}

/**
 * Get email configuration by ID
 */
export const getEmailConfigById = async (id: string) => {
  const config = await prisma.emailConfig.findUnique({
    where: { id },
  })

  if (!config) {
    throw new Error('Email configuration not found')
  }

  // Decrypt API key before returning
  const decryptedApiKey = decrypt(config.apiKey)

  return {
    ...config,
    apiKey: decryptedApiKey,
  }
}

/**
 * List email configurations
 * Can filter by tenantId (null for global)
 */
export const listEmailConfigs = async (tenantId?: string | null) => {
  const where = tenantId !== undefined ? { tenantId } : {}

  const configs = await prisma.emailConfig.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  // Return configs with masked API keys (don't expose in list view)
  return configs.map((config) => ({
    ...config,
    apiKey: '••••••••', // Mask API key in list view
  }))
}

/**
 * Create email configuration
 */
export const createEmailConfig = async (
  data: EmailConfigData,
  tenantId?: string
) => {
  // Validate email addresses
  if (!isValidEmail(data.fromEmail)) {
    throw new Error('Invalid from email address')
  }
  if (data.replyToEmail && !isValidEmail(data.replyToEmail)) {
    throw new Error('Invalid reply-to email address')
  }

  // Validate required fields
  if (!data.provider || !data.apiKey || !data.domain) {
    throw new Error('Provider, API key, and domain are required')
  }

  // Check if config already exists for this tenant
  const existing = await prisma.emailConfig.findFirst({
    where: { tenantId: tenantId || null },
  })

  if (existing) {
    throw new Error(
      tenantId
        ? 'Email configuration already exists for this tenant'
        : 'Global email configuration already exists'
    )
  }

  // Encrypt API key before storing
  const encryptedApiKey = encrypt(data.apiKey)

  const config = await prisma.emailConfig.create({
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
  })

  return {
    ...config,
    apiKey: '••••••••', // Don't return actual API key
  }
}

/**
 * Update email configuration
 */
export const updateEmailConfig = async (
  id: string,
  data: Partial<EmailConfigData>
) => {
  // Validate email addresses if provided
  if (data.fromEmail && !isValidEmail(data.fromEmail)) {
    throw new Error('Invalid from email address')
  }
  if (data.replyToEmail && !isValidEmail(data.replyToEmail)) {
    throw new Error('Invalid reply-to email address')
  }

  const updateData: any = { ...data }

  // Encrypt API key if provided
  if (data.apiKey) {
    updateData.apiKey = encrypt(data.apiKey)
  }

  const config = await prisma.emailConfig.update({
    where: { id },
    data: updateData,
  })

  return {
    ...config,
    apiKey: '••••••••', // Don't return actual API key
  }
}

/**
 * Delete email configuration
 */
export const deleteEmailConfig = async (id: string) => {
  await prisma.emailConfig.delete({
    where: { id },
  })
}

/**
 * Test email configuration by trying to decrypt API key
 */
export const testEmailConfig = async (id: string) => {
  const config = await getEmailConfigById(id)
  
  // If we can get and decrypt the config, it's valid
  return {
    valid: true,
    provider: config.provider,
    domain: config.domain,
    fromEmail: config.fromEmail,
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
}
