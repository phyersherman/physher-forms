import Mailgun from 'mailgun.js'
import formData from 'form-data'
import prisma from '../db/client'
import { getEmailConfig } from './emailConfigService'
import fs from 'fs'
import path from 'path'

export interface EmailData {
  to: string
  subject: string
  templateName: string
  variables: Record<string, any>
  tenantId?: string
}

export interface BulkEmailData {
  recipients: Array<{ email: string; variables?: Record<string, any> }>
  subject: string
  templateName: string
  globalVariables?: Record<string, any>
  tenantId?: string
}

/**
 * Get Mailgun client for a tenant
 */
const getMailgunClient = async (tenantId?: string) => {
  const config = await getEmailConfig(tenantId)

  const mailgun = new Mailgun(formData)
  const client = mailgun.client({
    username: 'api',
    key: config.apiKey,
  })

  return { client, config }
}

/**
 * Load and render email template
 */
const renderTemplate = (templateName: string, variables: Record<string, any>): string => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`)

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templateName}`)
  }

  let html = fs.readFileSync(templatePath, 'utf-8')

  // Simple variable substitution: {{variableName}}
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    html = html.replace(regex, variables[key] || '')
  })

  return html
}

/**
 * Log email send attempt
 */
const logEmail = async (
  tenantId: string | null,
  recipientEmail: string,
  subject: string,
  templateName: string,
  status: 'sent' | 'failed',
  providerMsgId?: string,
  errorMessage?: string
) => {
  await prisma.emailLog.create({
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
  })
}

/**
 * Send a single email
 */
export const sendEmail = async (data: EmailData) => {
  try {
    const { client, config } = await getMailgunClient(data.tenantId)

    // Render template
    const html = renderTemplate(data.templateName, data.variables)

    // Send email
    const result = await client.messages.create(config.domain, {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: [data.to],
      subject: data.subject,
      html,
      ...(config.replyToEmail && { 'h:Reply-To': config.replyToEmail }),
    })

    // Log success
    await logEmail(
      data.tenantId || null,
      data.to,
      data.subject,
      data.templateName,
      'sent',
      result.id
    )

    return { success: true, messageId: result.id }
  } catch (error: any) {
    console.error('Email send error:', error)

    // Log failure
    await logEmail(
      data.tenantId || null,
      data.to,
      data.subject,
      data.templateName,
      'failed',
      undefined,
      error.message
    )

    throw new Error(`Failed to send email: ${error.message}`)
  }
}

/**
 * Send bulk emails (same template, different variables per recipient)
 */
export const sendBulkEmail = async (data: BulkEmailData) => {
  const results = []

  for (const recipient of data.recipients) {
    try {
      const variables = { ...data.globalVariables, ...recipient.variables }
      
      const result = await sendEmail({
        to: recipient.email,
        subject: data.subject,
        templateName: data.templateName,
        variables,
        tenantId: data.tenantId,
      })

      results.push({
        email: recipient.email,
        success: true,
        messageId: result.messageId,
      })
    } catch (error: any) {
      results.push({
        email: recipient.email,
        success: false,
        error: error.message,
      })
    }
  }

  return {
    total: results.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  }
}

/**
 * Send user invite email
 */
export const sendInviteEmail = async (
  recipientEmail: string,
  recipientName: string,
  inviteToken: string,
  tenantId?: string
) => {
  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}`

  return sendEmail({
    to: recipientEmail,
    subject: 'You\'ve been invited to join our learning platform',
    templateName: 'invite',
    variables: {
      recipientName,
      inviteUrl,
    },
    tenantId,
  })
}

/**
 * Send password reset email
 */
export const sendResetPasswordEmail = async (
  recipientEmail: string,
  recipientName: string,
  resetToken: string,
  tenantId?: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

  return sendEmail({
    to: recipientEmail,
    subject: 'Reset your password',
    templateName: 'reset-password',
    variables: {
      recipientName,
      resetUrl,
    },
    tenantId,
  })
}

/**
 * Send welcome email (after user accepts invite)
 */
export const sendWelcomeEmail = async (
  recipientEmail: string,
  recipientName: string,
  tenantId?: string
) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`

  return sendEmail({
    to: recipientEmail,
    subject: 'Welcome to our learning platform',
    templateName: 'welcome',
    variables: {
      recipientName,
      loginUrl,
    },
    tenantId,
  })
}

/**
 * Get email logs for a tenant
 */
export const getEmailLogs = async (tenantId?: string, limit = 50) => {
  const where = tenantId ? { tenantId } : {}

  return prisma.emailLog.findMany({
    where,
    orderBy: { sentAt: 'desc' },
    take: limit,
  })
}

export default {
  sendEmail,
  sendBulkEmail,
  sendInviteEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
  getEmailLogs,
}
