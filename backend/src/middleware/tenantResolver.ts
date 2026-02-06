import { Request, Response, NextFunction } from 'express'
import tenantService from '../services/tenantService'

// Attach `tenantId` and `tenant` to the request object.
// Resolution strategy: inspect `Host` header (request hostname) and map to tenant.
// For on-prem deployments, tenant domains are configured via admin UI and persisted in DB.
// This middleware is the single place to implement host -> tenant resolution.

declare global {
  namespace Express {
    interface Request {
      tenantId?: string
      tenant?: any
    }
  }
}

export const tenantResolver = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const host = (req.headers.host || '').split(':')[0]
    if (!host) return next()

    const tenant = await tenantService.getByHost(host)
    if (tenant) {
      req.tenantId = tenant.id
      req.tenant = tenant
    }
    return next()
  } catch (err) {
    return next(err)
  }
}

export default tenantResolver
