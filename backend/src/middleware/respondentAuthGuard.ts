/**
 * Respondent Authentication Middleware
 *
 * Validates the respondent JWT (set as HTTP-only cookie 'respondent_token'
 * or Authorization: Bearer header) and attaches respondent info to the request.
 *
 * Returns 401 if token is missing, invalid, or not a respondent token.
 */

import { Request, Response, NextFunction } from 'express'
import { verifyRespondentToken } from '../services/respondentAuthService'

declare global {
  namespace Express {
    interface Request {
      respondentEmail?: string
      respondentTenantId?: string
    }
  }
}

export function requireRespondentAuth(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }
  if (!token && req.cookies?.respondent_token) {
    token = req.cookies.respondent_token
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const payload = verifyRespondentToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  req.respondentEmail = payload.email
  req.respondentTenantId = payload.tenantId

  return next()
}
