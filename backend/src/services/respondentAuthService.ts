/**
 * Respondent Authentication Service
 *
 * Handles email-domain validation, 6-digit verification code generation/sending,
 * and JWT issuance for respondents. Respondents are NOT system Users — they
 * authenticate only via email OTP and receive a short-lived respondent JWT.
 *
 * Privacy rules:
 * - Plaintext email lives only in VerificationCode (temporary) and the JWT
 *   payload (in-memory / stateless).
 * - It is NEVER persisted to any other table.
 */

import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import prisma from '../db/client'
import { sendEmail } from './emailService'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const CODE_TTL_MS = 10 * 60 * 1000   // 10 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000  // 10 minutes
const RATE_LIMIT_MAX = 3             // max 3 send-code requests per window

/** Mask an email address: first char + *** + @ + domain */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local[0]}***@${domain}`
}

/** SHA-256 hash of an email address (lowercased) */
export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

/** Generate a cryptographically random 6-digit code */
function generateCode(): string {
  // Use crypto.randomInt for uniform distribution (avoid Math.random bias)
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * Validate that an email's domain is allowed for the given tenant.
 * Throws if domain is not in allowedDomains.
 */
export async function validateEmailDomain(email: string, tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { allowedDomains: true },
  })

  if (!tenant) throw new Error('Tenant not found')

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) throw new Error('Invalid email address')

  const allowed = tenant.allowedDomains.map((d) => d.toLowerCase())
  if (allowed.length === 0) {
    throw new Error('No approved email domains are configured for this form access')
  }

  if (!allowed.includes(domain)) {
    throw new Error('This email domain is not authorized')
  }
}

/**
 * Check rate limit: max RATE_LIMIT_MAX send attempts per email per window.
 * Returns true if allowed, false if rate-limited.
 */
async function checkRateLimit(email: string, tenantId: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
  const count = await prisma.verificationCode.count({
    where: {
      email: email.toLowerCase().trim(),
      tenantId,
      createdAt: { gte: windowStart },
    },
  })
  return count < RATE_LIMIT_MAX
}

/**
 * Generate a verification code and send it to the respondent's email.
 * Validates domain and rate-limits before sending.
 */
export async function sendVerificationCode(
  email: string,
  tenantId: string
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim()

  // 1. Validate email domain
  await validateEmailDomain(normalizedEmail, tenantId)

  // 2. Rate limit check
  const allowed = await checkRateLimit(normalizedEmail, tenantId)
  if (!allowed) {
    throw new Error(
      `Too many code requests. Please wait before requesting another code.`
    )
  }

  // 3. Generate code and store
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)

  await prisma.verificationCode.create({
    data: {
      email: normalizedEmail,
      code,
      tenantId,
      expiresAt,
      used: false,
    },
  })

  // 4. Send email
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  })

  // In development without a working email config, log the code to console
  if (process.env.NODE_ENV === 'development') {
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: `Your verification code for ${tenant?.name || 'PhysherForms'}`,
        templateName: 'verification-code',
        variables: {
          recipientName: normalizedEmail.split('@')[0] || 'there',
          magicCode: code,
          code,
          organizationName: tenant?.name || 'PhysherForms',
          expiryMinutes: '10',
        },
        tenantId,
      })
    } catch (emailErr) {
      console.warn('[DEV] Email send failed — verification code for console use:', code)
    }
    return
  }

  await sendEmail({
    to: normalizedEmail,
    subject: `Your verification code for ${tenant?.name || 'PhysherForms'}`,
    templateName: 'verification-code',
    variables: {
      recipientName: normalizedEmail.split('@')[0] || 'there',
      magicCode: code,
      code,
      organizationName: tenant?.name || 'PhysherForms',
      expiryMinutes: '10',
    },
    tenantId,
  })
}

/**
 * Verify a code and, if valid, return a respondent JWT.
 * The JWT payload contains the plaintext email (never persisted to DB).
 */
export async function verifyCode(
  email: string,
  code: string,
  tenantId: string
): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim()

  const record = await prisma.verificationCode.findFirst({
    where: {
      email: normalizedEmail,
      tenantId,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) {
    throw new Error('Invalid or expired code')
  }

  // Mark code as used (single-use)
  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  })

  // Issue respondent JWT (short-lived, 2 hours)
  const token = jwt.sign(
    {
      sub: normalizedEmail,
      email: normalizedEmail,
      role: 'respondent',
      tenantId,
    },
    JWT_SECRET,
    { expiresIn: '2h' }
  )

  return token
}

/**
 * Verify a respondent JWT and return its payload.
 * Returns null if invalid or not a respondent token.
 */
export function verifyRespondentToken(
  token: string
): { email: string; tenantId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload.role !== 'respondent') return null
    return { email: payload.email, tenantId: payload.tenantId }
  } catch {
    return null
  }
}

/**
 * Delete expired and used VerificationCode records.
 * Called by the cleanup cron job.
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const result = await prisma.verificationCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true },
      ],
    },
  })
  return result.count
}
