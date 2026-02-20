/**
 * Bulk User Controller
 * Handles HTTP requests for bulk user operations
 */

import { Request, Response } from 'express'
import * as bulkUserService from '../services/bulk-user-service'

/**
 * POST /api/tenants/:tenantId/users/import-csv
 * Import users from CSV file
 * Requires: admin role
 */
export async function importUsersFromCSV(req: Request, res: Response) {
  try {
    const tenantId = Array.isArray(req.params.tenantId)
      ? req.params.tenantId[0]
      : req.params.tenantId

    const { csvContent, sendInvites, fileName } = req.body

    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({
        error: 'CSV content is required'
      })
    }

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await bulkUserService.importUsersFromCSV(
      tenantId,
      csvContent,
      sendInvites === true,
      req.user.id,
      fileName
    )

    res.json(result)
  } catch (error) {
    console.error('Error importing users from CSV:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to import users'
    })
  }
}

/**
 * POST /api/tenants/:tenantId/users/bulk-create
 * Create multiple users from array of user data
 * Requires: admin role
 */
export async function bulkCreateUsers(req: Request, res: Response) {
  try {
    const tenantId = Array.isArray(req.params.tenantId)
      ? req.params.tenantId[0]
      : req.params.tenantId

    const { users, sendInvites } = req.body

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        error: 'Users array is required'
      })
    }

    if (users.length > 500) {
      return res.status(400).json({
        error: 'Maximum 500 users per request'
      })
    }

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await bulkUserService.createUsersInBulk(
      tenantId,
      users,
      sendInvites === true,
      req.user.id
    )

    res.json(result)
  } catch (error) {
    console.error('Error creating users in bulk:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create users'
    })
  }
}

/**
 * GET /api/tenants/:tenantId/bulk-imports
 * List all bulk import jobs for a tenant
 * Requires: admin role
 */
export async function getBulkImportJobs(req: Request, res: Response) {
  try {
    const tenantId = Array.isArray(req.params.tenantId)
      ? req.params.tenantId[0]
      : req.params.tenantId

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const jobs = await bulkUserService.getBulkImportJobs(tenantId)

    res.json(jobs)
  } catch (error) {
    console.error('Error fetching bulk import jobs:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch import jobs'
    })
  }
}

/**
 * GET /api/bulk-imports/:jobId
 * Get details of a specific bulk import job
 * Requires: admin role
 */
export async function getBulkImportJob(req: Request, res: Response) {
  try {
    const jobId = Array.isArray(req.params.jobId)
      ? req.params.jobId[0]
      : req.params.jobId

    const job = await bulkUserService.getBulkImportJob(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Import job not found' })
    }

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === job.tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    res.json(job)
  } catch (error) {
    console.error('Error fetching bulk import job:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch import job'
    })
  }
}

export default {
  importUsersFromCSV,
  bulkCreateUsers,
  getBulkImportJobs,
  getBulkImportJob
}
