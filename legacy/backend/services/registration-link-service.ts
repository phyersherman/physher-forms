/**
 * Registration Link Service
 * Handles registration link creation, validation, and usage tracking
 */

import { PrismaClient, RegistrationLink, RegistrationLinkUsage } from '@prisma/client'
import prisma from '../db/client'
import crypto from 'crypto'

interface CreateRegistrationLinkData {
  tenantId: string
  courseIds: string[]
  name: string
  maxUses?: number | null
  expiresAt?: Date | null
  createdBy: string
}

interface UpdateRegistrationLinkData {
  name?: string
  courseIds?: string[]
  maxUses?: number | null
  expiresAt?: Date | null
  isActive?: boolean
}

interface RegistrationLinkWithStats extends RegistrationLink {
  usages?: RegistrationLinkUsage[]
}

interface ValidateTokenResult {
  valid: boolean
  error?: string
  registrationLink?: RegistrationLink
  courseDetails?: Array<{
    id: string
    title: string
    description: string | null
  }>
  tenantInfo?: {
    id: string
    name: string
  }
}

/**
 * Generate a cryptographically random URL-safe token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Create a new registration link
 */
export async function createRegistrationLink(
  data: CreateRegistrationLinkData
): Promise<RegistrationLink> {
  // Generate unique token
  let token = generateToken()
  let attempts = 0
  const maxAttempts = 10

  // Ensure uniqueness
  while (attempts < maxAttempts) {
    const existing = await prisma.registrationLink.findUnique({
      where: { token }
    })
    if (!existing) break
    token = generateToken()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique registration token')
  }

  // Create registration link
  const registrationLink = await prisma.registrationLink.create({
    data: {
      tenantId: data.tenantId,
      courseIds: data.courseIds,
      token,
      name: data.name,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt,
      createdBy: data.createdBy,
      isActive: true,
      usedCount: 0
    }
  })

  return registrationLink
}

/**
 * Get all registration links for a tenant
 */
export async function getRegistrationLinks(
  tenantId: string
): Promise<RegistrationLinkWithStats[]> {
  const links = await prisma.registrationLink.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  })

  return links
}

/**
 * Get a single registration link with usage details
 */
export async function getRegistrationLink(
  id: string
): Promise<RegistrationLinkWithStats | null> {
  const link = await prisma.registrationLink.findUnique({
    where: { id },
    include: {
      usages: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        },
        orderBy: { usedAt: 'desc' }
      }
    }
  })

  return link
}

/**
 * Validate a registration token
 * Returns validation result with course and tenant info if valid
 */
export async function validateToken(token: string): Promise<ValidateTokenResult> {
  const registrationLink = await prisma.registrationLink.findUnique({
    where: { token }
  })

  if (!registrationLink) {
    return {
      valid: false,
      error: 'Invalid registration link'
    }
  }

  if (!registrationLink.isActive) {
    return {
      valid: false,
      error: 'This registration link has been deactivated'
    }
  }

  if (registrationLink.expiresAt && registrationLink.expiresAt < new Date()) {
    return {
      valid: false,
      error: 'This registration link has expired'
    }
  }

  if (
    registrationLink.maxUses !== null &&
    registrationLink.usedCount >= registrationLink.maxUses
  ) {
    return {
      valid: false,
      error: 'This registration link has reached its maximum usage limit'
    }
  }

  // Fetch course details
  const courses = await prisma.course.findMany({
    where: {
      id: { in: registrationLink.courseIds }
    },
    select: {
      id: true,
      title: true,
      description: true
    }
  })

  // Fetch tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: registrationLink.tenantId },
    select: {
      id: true,
      name: true
    }
  })

  if (!tenant) {
    return {
      valid: false,
      error: 'Tenant not found'
    }
  }

  return {
    valid: true,
    registrationLink,
    courseDetails: courses,
    tenantInfo: tenant
  }
}

/**
 * Record usage of a registration link
 */
export async function useRegistrationLink(
  token: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  const registrationLink = await prisma.registrationLink.findUnique({
    where: { token }
  })

  if (!registrationLink) {
    throw new Error('Registration link not found')
  }

  // Check if user has already used this link
  const existingUsage = await prisma.registrationLinkUsage.findUnique({
    where: {
      registrationLinkId_userId: {
        registrationLinkId: registrationLink.id,
        userId
      }
    }
  })

  if (existingUsage) {
    // Already recorded, don't increment count again
    return
  }

  // Record usage and increment counter
  await prisma.$transaction([
    prisma.registrationLinkUsage.create({
      data: {
        registrationLinkId: registrationLink.id,
        userId,
        ipAddress
      }
    }),
    prisma.registrationLink.update({
      where: { id: registrationLink.id },
      data: {
        usedCount: {
          increment: 1
        }
      }
    })
  ])
}

/**
 * Update a registration link
 */
export async function updateRegistrationLink(
  id: string,
  data: UpdateRegistrationLinkData
): Promise<RegistrationLink> {
  const link = await prisma.registrationLink.update({
    where: { id },
    data: {
      name: data.name,
      courseIds: data.courseIds,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt,
      isActive: data.isActive
    }
  })

  return link
}

/**
 * Toggle registration link active status
 */
export async function toggleRegistrationLink(id: string): Promise<RegistrationLink> {
  const link = await prisma.registrationLink.findUnique({
    where: { id }
  })

  if (!link) {
    throw new Error('Registration link not found')
  }

  const updated = await prisma.registrationLink.update({
    where: { id },
    data: {
      isActive: !link.isActive
    }
  })

  return updated
}

/**
 * Delete a registration link
 */
export async function deleteRegistrationLink(id: string): Promise<void> {
  await prisma.registrationLink.delete({
    where: { id }
  })
}

export default {
  createRegistrationLink,
  getRegistrationLinks,
  getRegistrationLink,
  validateToken,
  useRegistrationLink,
  updateRegistrationLink,
  toggleRegistrationLink,
  deleteRegistrationLink
}
