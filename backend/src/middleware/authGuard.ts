import { Request, Response, NextFunction } from 'express'
import authService from '../services/authService'

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string; tenantId: string }
    }
  }
}

// Factory to create an auth middleware that optionally enforces roles
export const requireAuth = (roles?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Accept token from Authorization header or HttpOnly cookie named 'token'
    let token: string | undefined
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1]
    if (!token && req.cookies && req.cookies.token) token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'missing token' })

    const payload = authService.verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'invalid token' })

    // attach user info
    req.user = { id: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tenantId }

    // if tenant resolved from host, enforce token tenant matches request tenant
    if (req.tenantId && req.tenantId !== payload.tenantId) {
      return res.status(403).json({ error: 'token tenant mismatch' })
    }

    // enforce roles if provided
    if (roles && roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'insufficient role' })
    }

    return next()
  }
}

// default export for backward compatibility
export default requireAuth()
