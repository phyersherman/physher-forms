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

const authenticate = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) return null
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return null

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

export default { register, authenticate, verifyToken, verifyRefreshToken, revokeRefreshToken, createRefreshToken, createAccessToken }
