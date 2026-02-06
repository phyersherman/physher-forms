import { Request, Response } from 'express'
import authService from '../services/authService'

function cookieOptions(maxAgeDays: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    path: '/'
  }
}

// Login sets an HttpOnly cookie with JWT and returns the user object.
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  const result = await authService.authenticate(email, password)
  if (!result) return res.status(401).json({ error: 'invalid credentials' })

  const accessToken = result.accessToken
  const refresh = result.refresh

  // set access token (short-lived)
  res.cookie('token', accessToken, cookieOptions(0.0104)) // ~15 minutes

  // set refresh token (long-lived)
  const refreshMaxDays = 30
  res.cookie('refreshToken', refresh.token, cookieOptions(refreshMaxDays))

  res.json({ user: { id: result.user.id, email: result.user.email, role: result.user.role, tenantId: result.user.tenantId } })
}

const register = async (req: Request, res: Response) => {
  const { email, password, tenantId, fullName } = req.body
  if (!email || !password || !tenantId) return res.status(400).json({ error: 'email, password, tenantId required' })
  const user = await authService.register(email, password, tenantId, fullName)
  res.status(201).json({ id: user.id, email: user.email })
}

const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken
  if (refreshToken) {
    try { await authService.revokeRefreshToken(refreshToken) } catch (e) { /* ignore */ }
  }
  res.clearCookie('token')
  res.clearCookie('refreshToken')
  res.json({ ok: true })
}

const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken
  if (!refreshToken) return res.status(401).json({ error: 'missing refresh token' })

  const user = await authService.verifyRefreshToken(refreshToken)
  if (!user) return res.status(401).json({ error: 'invalid refresh token' })

  // rotate: revoke old and issue new
  try { await authService.revokeRefreshToken(refreshToken) } catch (e) { }
  const newRefresh = await authService.createRefreshToken(user.id)
  const newAccess = authService.createAccessToken(user)

  res.cookie('token', newAccess, cookieOptions(0.0104))
  res.cookie('refreshToken', newRefresh.token, cookieOptions(30))
  res.json({ user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId } })
}

export default { login, register, logout, refresh }
