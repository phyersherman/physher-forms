/**
 * Bulk User Service
 * Handles bulk user creation, CSV import, and import job tracking
 */

import { PrismaClient, BulkImportJob, User } from '@prisma/client'
import prisma from '../db/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

interface BulkUserData {
  email: string
  fullName?: string
  role?: 'admin' | 'instructor' | 'learner'
  organization?: string
}

interface BulkImportResult {
  jobId: string
  totalRows: number
  successCount: number
  failedCount: number
  errors: Array<{ row: number; email: string; error: string }>
}

interface CreateBulkImportJobData {
  tenantId: string
  importedBy: string
  fileName?: string
  totalRows: number
  sendInvites: boolean
}

/**
 * Parse CSV data into user objects
 * Expected format: email,fullName,role,organization
 */
export function parseCSV(csvContent: string): BulkUserData[] {
  const lines = csvContent.trim().split('\n')
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  
  // Validate required column
  if (!header.includes('email')) {
    throw new Error('CSV must include "email" column')
  }

  const users: BulkUserData[] = []

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    const values = line.split(',').map(v => v.trim())
    const user: BulkUserData = { email: '' }

    header.forEach((col, index) => {
      const value = values[index] || ''
      
      switch (col) {
        case 'email':
          user.email = value
          break
        case 'fullname':
        case 'full_name':
        case 'name':
          user.fullName = value
          break
        case 'role':
          if (['admin', 'instructor', 'learner'].includes(value.toLowerCase())) {
            user.role = value.toLowerCase() as 'admin' | 'instructor' | 'learner'
          }
          break
        case 'organization':
        case 'org':
        case 'company':
          user.organization = value
          break
      }
    })

    users.push(user)
  }

  return users
}

/**
 * Validate user data
 */
function validateUser(user: BulkUserData, row: number): string | null {
  // Email validation
  if (!user.email) {
    return `Row ${row}: Email is required`
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(user.email)) {
    return `Row ${row}: Invalid email format: ${user.email}`
  }

  // Role validation
  if (user.role && !['admin', 'instructor', 'learner'].includes(user.role)) {
    return `Row ${row}: Invalid role: ${user.role}. Must be admin, instructor, or learner`
  }

  return null
}

/**
 * Create a bulk import job record
 */
export async function createBulkImportJob(
  data: CreateBulkImportJobData
): Promise<BulkImportJob> {
  const job = await prisma.bulkImportJob.create({
    data: {
      tenantId: data.tenantId,
      importedBy: data.importedBy,
      fileName: data.fileName,
      totalRows: data.totalRows,
      sendInvites: data.sendInvites,
      status: 'processing'
    }
  })

  return job
}

/**
 * Update bulk import job with results
 */
export async function updateBulkImportJob(
  jobId: string,
  data: {
    successCount: number
    failedCount: number
    status: 'processing' | 'completed' | 'failed'
    errors?: Array<{ row: number; email: string; error: string }>
  }
): Promise<BulkImportJob> {
  const job = await prisma.bulkImportJob.update({
    where: { id: jobId },
    data: {
      successCount: data.successCount,
      failedCount: data.failedCount,
      status: data.status,
      errors: data.errors ? JSON.stringify(data.errors) : null,
      completedAt: new Date()
    }
  })

  return job
}

/**
 * Generate a random password for bulk-created users
 */
function generateRandomPassword(): string {
  return crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Create users in bulk from parsed data
 */
export async function createUsersInBulk(
  tenantId: string,
  users: BulkUserData[],
  sendInvites: boolean,
  importedBy: string
): Promise<BulkImportResult> {
  // Create import job
  const job = await createBulkImportJob({
    tenantId,
    importedBy,
    totalRows: users.length,
    sendInvites
  })

  const errors: Array<{ row: number; email: string; error: string }> = []
  let successCount = 0
  let failedCount = 0

  // Validate all users first
  const validationErrors: Array<{ row: number; email: string; error: string }> = []
  
  for (let i = 0; i < users.length; i++) {
    const validationError = validateUser(users[i], i + 1)
    if (validationError) {
      validationErrors.push({
        row: i + 1,
        email: users[i].email,
        error: validationError
      })
    }
  }

  if (validationErrors.length > 0) {
    await updateBulkImportJob(job.id, {
      successCount: 0,
      failedCount: validationErrors.length,
      status: 'failed',
      errors: validationErrors
    })

    return {
      jobId: job.id,
      totalRows: users.length,
      successCount: 0,
      failedCount: validationErrors.length,
      errors: validationErrors
    }
  }

  // Check for duplicate emails within CSV
  const emailSet = new Set<string>()
  const duplicates: Array<{ row: number; email: string; error: string }> = []
  
  for (let i = 0; i < users.length; i++) {
    const email = users[i].email.toLowerCase()
    if (emailSet.has(email)) {
      duplicates.push({
        row: i + 1,
        email: users[i].email,
        error: 'Duplicate email in CSV'
      })
    } else {
      emailSet.add(email)
    }
  }

  if (duplicates.length > 0) {
    errors.push(...duplicates)
    failedCount += duplicates.length
  }

  // Create users
  for (let i = 0; i < users.length; i++) {
    const userData = users[i]
    
    // Skip if duplicate within CSV
    if (duplicates.find(d => d.row === i + 1)) {
      continue
    }

    try {
      // Check if user already exists
      const existing = await prisma.user.findFirst({
        where: {
          email: userData.email,
          tenantId
        }
      })

      if (existing) {
        errors.push({
          row: i + 1,
          email: userData.email,
          error: 'User with this email already exists'
        })
        failedCount++
        continue
      }

      // Generate password
      const password = generateRandomPassword()
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          fullName: userData.fullName || userData.email.split('@')[0],
          password: hashedPassword,
          role: userData.role || 'learner',
          organization: userData.organization,
          tenantId,
          status: sendInvites ? 'pending' : 'active'
        }
      })

      // TODO: If sendInvites is true, send invitation email with password
      // This would integrate with the email service
      // await emailService.sendUserInvite(user, password)

      successCount++
    } catch (error) {
      errors.push({
        row: i + 1,
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      failedCount++
    }
  }

  // Update job with results
  await updateBulkImportJob(job.id, {
    successCount,
    failedCount,
    status: failedCount === 0 ? 'completed' : 'completed',
    errors: errors.length > 0 ? errors : undefined
  })

  return {
    jobId: job.id,
    totalRows: users.length,
    successCount,
    failedCount,
    errors
  }
}

/**
 * Import users from CSV content
 */
export async function importUsersFromCSV(
  tenantId: string,
  csvContent: string,
  sendInvites: boolean,
  importedBy: string,
  fileName?: string
): Promise<BulkImportResult> {
  // Parse CSV
  const users = parseCSV(csvContent)

  // Limit to 500 users per import
  if (users.length > 500) {
    throw new Error('Maximum 500 users per import. Please split your CSV file.')
  }

  // Create users
  return await createUsersInBulk(tenantId, users, sendInvites, importedBy)
}

/**
 * Get a bulk import job by ID
 */
export async function getBulkImportJob(jobId: string): Promise<BulkImportJob | null> {
  const job = await prisma.bulkImportJob.findUnique({
    where: { id: jobId }
  })

  return job
}

/**
 * Get all bulk import jobs for a tenant
 */
export async function getBulkImportJobs(tenantId: string): Promise<BulkImportJob[]> {
  const jobs = await prisma.bulkImportJob.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  })

  return jobs
}

export default {
  parseCSV,
  createUsersInBulk,
  importUsersFromCSV,
  getBulkImportJob,
  getBulkImportJobs
}
