/**
 * Respondent Authentication Controller
 *
 * Public endpoints for respondent email-gate authentication:
 *   POST /api/respondent/send-code   – validate domain, send 6-digit OTP
 *   POST /api/respondent/verify-code – verify OTP, set respondent session cookie
 *   POST /api/respondent/logout      – clear respondent session cookie
 */

import { Request, Response } from 'express'
import {
  sendVerificationCode,
  verifyCode,
} from '../services/respondentAuthService'

const COOKIE_NAME = 'respondent_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 2 * 60 * 60 * 1000, // 2 hours
}

/**
 * POST /api/respondent/send-code
 * Body: { email: string, tenantId: string }
 *
 * Validates the email domain against the tenant's allowedDomains,
 * generates a 6-digit OTP, and sends it via email.
 * Rate-limited to 3 requests per email per 10-minute window.
 */
export async function sendCode(req: Request, res: Response) {
  try {
    const { email, tenantId } = req.body

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Use tenant resolved from host, or fall back to body-supplied tenantId
    const resolvedTenantId: string | undefined = req.tenantId || tenantId
    if (!resolvedTenantId) {
      return res.status(400).json({ error: 'Tenant could not be determined' })
    }

    await sendVerificationCode(email, resolvedTenantId)

    return res.json({ message: 'Verification code sent' })
  } catch (error: any) {
    console.error('[RespondentAuth] send-code error:', error.message)
    // Distinguish domain errors (400) from rate-limit errors (429)
    if (error.message?.includes('not authorized')) {
      return res.status(403).json({ error: error.message })
    }
    if (error.message?.includes('Too many')) {
      return res.status(429).json({ error: error.message })
    }
    return res.status(400).json({ error: error.message || 'Failed to send code' })
  }
}

/**
 * POST /api/respondent/verify-code
 * Body: { email: string, code: string, tenantId?: string }
 *
 * Verifies the OTP. On success, sets an HTTP-only cookie containing the
 * respondent JWT and returns success.
 */
export async function verifyCodeHandler(req: Request, res: Response) {
  try {
    const { email, code, tenantId } = req.body

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' })
    }
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' })
    }

    const resolvedTenantId: string | undefined = req.tenantId || tenantId
    if (!resolvedTenantId) {
      return res.status(400).json({ error: 'Tenant could not be determined' })
    }

    const token = await verifyCode(email, code, resolvedTenantId)

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
    return res.json({ message: 'Authenticated successfully' })
  } catch (error: any) {
    console.error('[RespondentAuth] verify-code error:', error.message)
    return res.status(401).json({ error: error.message || 'Verification failed' })
  }
}

/**
 * POST /api/respondent/logout
 * Clears the respondent session cookie.
 */
export function logout(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME)
  return res.json({ message: 'Logged out' })
}
