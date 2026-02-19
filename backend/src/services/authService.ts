import prisma from '../db/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/entities'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

type TokenPayload = {
  sub: string
  email: string
  role: string
  tenantId: string
}

const register = async (email: string, password: string, tenantId: string, fullName?: string, role = 'learner') => {
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, password: hashed, tenantId, fullName, role } })
  return user as unknown as User
}

// create JWT access token (short-lived)
const createAccessToken = (user: any) => {
  const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId }
  // short expiry for access token
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

// create and persist refresh token (long-lived)
const createRefreshToken = async (userId: string, days = 30) => {
  const token = crypto.randomBytes(40).toString('hex')
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } })
  return { token, expiresAt }
}

const authenticate = async (email: string, password: string, tenantId?: string) => {
  // If tenantId provided, use compound unique lookup
  // Otherwise, find first matching email (backward compatibility)
  const user = tenantId 
    ? await prisma.user.findUnique({ where: { email_tenantId: { email, tenantId } } })
    : await prisma.user.findFirst({ where: { email } })
  
  if (!user || !user.password) return null
  
  // Check if user is disabled
  if (user.status === 'disabled') return null
  
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return null

  // Update last login timestamp
  await prisma.user.update({ 
    where: { id: user.id }, 
    data: { lastLoginAt: new Date() } 
  })

  const accessToken = createAccessToken(user)
  const refresh = await createRefreshToken(user.id)
  return { accessToken, refresh, user }
}

const verifyToken = (token: string): TokenPayload | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return { sub: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tenantId }
  } catch (err) {
    return null
  }
}

const verifyRefreshToken = async (token: string) => {
  const rec = await prisma.refreshToken.findUnique({ where: { token } })
  if (!rec) return null
  if (rec.revoked) return null
  if (rec.expiresAt < new Date()) return null
  const user = await prisma.user.findUnique({ where: { id: rec.userId } })
  return user
}

const revokeRefreshToken = async (token: string) => {
  await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } })
}

/**
 * Generates an invite token for a user
 * Token expires in 72 hours
 */
const generateInviteToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      inviteToken: token,
      inviteExpires: expiresAt,
      status: 'invited',
    },
  })
  
  return token
}

/**
 * Accepts an invite and sets the user's password
 * Token is single-use and cleared after acceptance
 */
const acceptInvite = async (token: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { inviteToken: token } })
  
  if (!user) {
    throw new Error('Invalid invite token')
  }
  
  if (!user.inviteExpires || user.inviteExpires < new Date()) {
    throw new Error('Invite token has expired')
  }
  
  // Validate password strength
  const { isValidPassword } = await import('../utils/validators')
  if (!isValidPassword(password)) {
    throw new Error('Password must be at least 8 characters with at least 1 number and 1 letter')
  }
  
  // Hash password and clear invite token
  const hashedPassword = await bcrypt.hash(password, 10)
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      status: 'active',
      inviteToken: null,
      inviteExpires: null,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      tenantId: true,
    },
  })
  
  return updatedUser
}

/**
 * Initiates password reset by generating a reset token
 * Token expires in 1 hour
 * Always returns success (don't reveal if email exists)
 */
const forgotPassword = async (email: string, tenantId?: string) => {
  // Find user by email and optional tenantId
  const user = tenantId
    ? await prisma.user.findUnique({ where: { email_tenantId: { email, tenantId } } })
    : await prisma.user.findFirst({ where: { email } })
  
  // Don't reveal if user exists (security best practice)
  if (!user) {
    return { success: true }
  }
  
  // Generate reset token
  const token = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetExpires: expiresAt,
    },
  })
  
  // Return token so email service can send it
  return { success: true, token, userId: user.id, userEmail: user.email }
}

/**
 * Resets password using a valid reset token
 * Token is single-use and cleared after reset
 */
const resetPassword = async (token: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { resetToken: token } })
  
  if (!user) {
    throw new Error('Invalid reset token')
  }
  
  if (!user.resetExpires || user.resetExpires < new Date()) {
    throw new Error('Reset token has expired')
  }
  
  // Validate password strength
  const { isValidPassword } = await import('../utils/validators')
  if (!isValidPassword(newPassword)) {
    throw new Error('Password must be at least 8 characters with at least 1 number and 1 letter')
  }
  
  // Hash password and clear reset token
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null,
    },
  })
  
  return { success: true }
}

export default { 
  register, 
  authenticate, 
  verifyToken, 
  verifyRefreshToken, 
  revokeRefreshToken, 
  createRefreshToken, 
  createAccessToken,
  generateInviteToken,
  acceptInvite,
  forgotPassword,
  resetPassword,
}
