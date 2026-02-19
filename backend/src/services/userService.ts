/**
 * User Service
 * Handles user CRUD operations with tenant scoping
 * Reuses bcrypt patterns from authService
 */

import prisma from '../db/client'
import bcrypt from 'bcryptjs'
import { isValidEmail, isValidPassword, isValidRole, isValidStatus } from '../utils/validators'

/**
 * Lists all users for a specific tenant
 * Optionally filter by role
 */
export const listUsersByTenant = async (tenantId: string, role?: string) => {
  const where: any = { tenantId }
  if (role) where.role = role
  
  return prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      // Exclude password, tokens
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Gets a single user by ID
 * Returns null if user not found
 */
export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      tenantId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      // Exclude password, tokens
    },
  })
}

/**
 * Creates a new user in a tenant
 * Password is optional - if not provided, user will be in 'invited' status
 */
export const createUser = async (data: {
  email: string
  tenantId: string
  role: string
  fullName?: string
  password?: string
}) => {
  // Validate inputs
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email format')
  }
  if (!isValidRole(data.role)) {
    throw new Error('Invalid role. Must be admin, instructor, or learner')
  }

  // If password provided, validate and hash it
  let hashedPassword: string | undefined
  let status = 'active'
  
  if (data.password) {
    if (!isValidPassword(data.password)) {
      throw new Error('Password must be at least 8 characters with at least 1 number and 1 letter')
    }
    hashedPassword = await bcrypt.hash(data.password, 10)
  } else {
    // No password = user needs to be invited
    status = 'invited'
  }

  // Check for duplicate email in this tenant
  const existing = await prisma.user.findUnique({
    where: { 
      email_tenantId: { 
        email: data.email, 
        tenantId: data.tenantId 
      } 
    },
  })
  if (existing) {
    throw new Error('User with this email already exists in this tenant')
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role,
      tenantId: data.tenantId,
      status,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      tenantId: true,
      createdAt: true,
    },
  })

  return user
}

/**
 * Updates a user
 * Cannot change password through this method (use changePassword instead)
 */
export const updateUser = async (id: string, data: {
  email?: string
  fullName?: string
  role?: string
  status?: string
}) => {
  // Validate inputs
  if (data.email && !isValidEmail(data.email)) {
    throw new Error('Invalid email format')
  }
  if (data.role && !isValidRole(data.role)) {
    throw new Error('Invalid role')
  }
  if (data.status && !isValidStatus(data.status)) {
    throw new Error('Invalid status')
  }

  // If email is changing, check for duplicates in the same tenant
  if (data.email) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new Error('User not found')
    
    const duplicate = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: user.tenantId,
        id: { not: id },
      },
    })
    if (duplicate) {
      throw new Error('Another user with this email already exists in this tenant')
    }
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...(data.email && { email: data.email }),
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.role && { role: data.role }),
      ...(data.status && { status: data.status }),
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      tenantId: true,
      updatedAt: true,
    },
  })
}

/**
 * Changes a user's password
 * Validates current password before changing
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { id: true, password: true },
  })
  
  if (!user || !user.password) {
    throw new Error('User not found or password not set')
  }

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    throw new Error('Current password is incorrect')
  }

  // Validate new password
  if (!isValidPassword(newPassword)) {
    throw new Error('New password must be at least 8 characters with at least 1 number and 1 letter')
  }

  // Hash and update
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })

  return { success: true }
}

/**
 * Deletes a user
 * This will cascade to refresh tokens
 */
export const deleteUser = async (id: string) => {
  await prisma.user.delete({ where: { id } })
  return { success: true }
}

/**
 * Disable a user (soft delete)
 * Prefers this over hard delete to maintain data integrity
 */
export const disableUser = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { status: 'disabled' },
    select: {
      id: true,
      email: true,
      status: true,
    },
  })
}

/**
 * Enable a previously disabled user
 */
export const enableUser = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { status: 'active' },
    select: {
      id: true,
      email: true,
      status: true,
    },
  })
}

/**
 * Generates an invite token for a user and sets status to 'invited'
 * Returns the token so it can be sent via email
 */
export const inviteUser = async (userId: string) => {
  const user = await getUserById(userId)
  if (!user) {
    throw new Error('User not found')
  }
  
  if (user.status === 'active' && user.lastLoginAt) {
    throw new Error('User has already accepted their invite and logged in')
  }
  
  const authService = await import('./authService')
  const token = await authService.default.generateInviteToken(userId)
  
  return { 
    token, 
    userId: user.id, 
    userEmail: user.email, 
    userFullName: user.fullName,
    tenantId: user.tenantId,
  }
}
