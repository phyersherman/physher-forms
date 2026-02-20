/**
 * User Controller
 * Thin controller layer that delegates to userService
 * Follows same pattern as tenantController.ts
 */

import { Request, Response } from 'express'
import * as userService from '../services/userService'
import * as emailService from '../services/emailService'
import { sanitizeString } from '../utils/validators'

/**
 * GET /api/tenants/:tenantId/users
 * Lists all users for a tenant (optionally filtered by role)
 */
export const listUsers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string
    const { role } = req.query
    
    // Allow global admins or tenant admins who belong to this tenant
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'
    
    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Not authorized to view users in this tenant' })
    }

    const users = await userService.listUsersByTenant(
      tenantId, 
      role as string | undefined
    )
    res.json(users)
  } catch (error: any) {
    console.error('List users error:', error)
    res.status(500).json({ error: error.message || 'Failed to list users' })
  }
}

/**
 * GET /api/tenants/:tenantId/users/:userId
 * Gets a single user by ID
 */
export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string
    const user = await userService.getUserById(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify requesting user can view this user
    if (req.user?.tenantId !== user.tenantId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this user' })
    }

    res.json(user)
  } catch (error: any) {
    console.error('Get user error:', error)
    res.status(500).json({ error: error.message || 'Failed to get user' })
  }
}

/**
 * POST /api/tenants/:tenantId/users
 * Creates a new user in a tenant
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string
    const { email, fullName, role, password } = req.body

    // Allow global admins or tenant admins who belong to this tenant
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'
    
    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Not authorized to create users in this tenant' })
    }

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    if (!role) {
      return res.status(400).json({ error: 'Role is required' })
    }

    const user = await userService.createUser(
      tenantId,
      sanitizeString(email),
      fullName ? sanitizeString(fullName) : undefined,
      role,
      password
    )

    res.status(201).json(user)
  } catch (error: any) {
    console.error('Create user error:', error)
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message })
    }
    res.status(400).json({ error: error.message || 'Failed to create user' })
  }
}

/**
 * PUT /api/tenants/:tenantId/users/:userId
 * Updates a user
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string
    const userId = req.params.userId as string
    const { email, fullName, role, status } = req.body

    // Allow global admins or tenant admins who belong to this tenant
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'
    
    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Not authorized to update users in this tenant' })
    }

    // Get user to verify they belong to this tenant
    const existingUser = await userService.getUserById(userId)
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (existingUser.tenantId !== tenantId) {
      return res.status(403).json({ error: 'User does not belong to this tenant' })
    }

    const user = await userService.updateUser(userId, {
      email: email ? sanitizeString(email) : undefined,
      fullName: fullName !== undefined ? sanitizeString(fullName) : undefined,
      role,
      status,
    })

    res.json(user)
  } catch (error: any) {
    console.error('Update user error:', error)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message })
    }
    res.status(400).json({ error: error.message || 'Failed to update user' })
  }
}

/**
 * DELETE /api/tenants/:tenantId/users/:userId
 * Deletes a user (hard delete)
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string
    const userId = req.params.userId as string

    // Allow global admins or tenant admins who belong to this tenant
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'
    
    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete users in this tenant' })
    }

    // Get user to verify they belong to this tenant
    const existingUser = await userService.getUserById(userId)
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (existingUser.tenantId !== tenantId) {
      return res.status(403).json({ error: 'User does not belong to this tenant' })
    }

    // Prevent deleting self
    if (userId === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    await userService.deleteUser(userId)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: error.message || 'Failed to delete user' })
  }
}

/**
 * POST /api/tenants/:tenantId/users/:userId/disable
 * Disables a user (soft delete)
 */
export const disableUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string
    const userId = req.params.userId as string

    // Allow global admins or tenant admins who belong to this tenant
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'
    
    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Not authorized to disable users in this tenant' })
    }

    // Get user to verify they belong to this tenant
    const existingUser = await userService.getUserById(userId)
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (existingUser.tenantId !== tenantId) {
      return res.status(403).json({ error: 'User does not belong to this tenant' })
    }

    // Prevent disabling self
    if (userId === req.user?.id) {
      return res.status(400).json({ error: 'Cannot disable your own account' })
    }

    const user = await userService.disableUser(userId)
    res.json(user)
  } catch (error: any) {
    console.error('Disable user error:', error)
    res.status(500).json({ error: error.message || 'Failed to disable user' })
  }
}

/**
 * POST /api/tenants/:tenantId/users/:userId/enable
 * Re-enables a disabled user
 */
export const enableUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string
    const userId = req.params.userId as string

    // Allow global admins or tenant admins who belong to this tenant
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'
    
    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Not authorized to enable users in this tenant' })
    }

    // Get user to verify they belong to this tenant
    const existingUser = await userService.getUserById(userId)
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (existingUser.tenantId !== tenantId) {
      return res.status(403).json({ error: 'User does not belong to this tenant' })
    }

    const user = await userService.enableUser(userId)
    res.json(user)
  } catch (error: any) {
    console.error('Enable user error:', error)
    res.status(500).json({ error: error.message || 'Failed to enable user' })
  }
}

/**
 * POST /api/users/:userId/password
 * Changes user's password (authenticated user only for their own account)
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string
    const { currentPassword, newPassword } = req.body

    // Users can only change their own password
    if (req.user?.id !== userId) {
      return res.status(403).json({ error: 'Can only change your own password' })
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    await userService.changePassword(userId, currentPassword, newPassword)
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error: any) {
    console.error('Change password error:', error)
    if (error.message.includes('incorrect')) {
      return res.status(401).json({ error: error.message })
    }
    res.status(400).json({ error: error.message || 'Failed to change password' })
  }
}

/**
 * POST /api/tenants/:tenantId/users/:userId/invite
 * Generates an invite token for a user (admin only)
 */
export const inviteUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string
    const userId = req.params.userId as string

    // Allow global admins or tenant admins who belong to this tenant
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'
    
    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Verify user belongs to this tenant
    const user = await userService.getUserById(userId)
    if (!user || user.tenantId !== tenantId) {
      return res.status(404).json({ error: 'User not found' })
    }

    const inviteData = await userService.inviteUser(userId)
    
    // Send invite email
    try {
      await emailService.sendInviteEmail(
        inviteData.userEmail,
        inviteData.userFullName || inviteData.userEmail,
        inviteData.token,
        inviteData.tenantId || undefined
      )
    } catch (emailError: any) {
      console.error('Failed to send invite email:', emailError)
      // Continue even if email fails - user can be re-invited
    }
    
    res.json({ 
      success: true, 
      message: 'Invite sent successfully',
      // TEMP: Include token in non-production for testing
      ...(process.env.NODE_ENV !== 'production' ? { inviteToken: inviteData.token } : {})
    })
  } catch (error: any) {
    console.error('Invite user error:', error)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    if (error.message.includes('already')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Failed to invite user' })
  }
}
/**
 * ========================================
 * Global User Management (Platform-wide)
 * ========================================
 */

/**
 * GET /api/users
 * Lists all global users (users not tied to a tenant)
 */
export const listGlobalUsers = async (req: Request, res: Response) => {
  try {
    const { role } = req.query
    const users = await userService.listGlobalUsers(role as string | undefined)
    res.json(users)
  } catch (error: any) {
    console.error('List global users error:', error)
    res.status(500).json({ error: error.message || 'Failed to list global users' })
  }
}

/**
 * GET /api/users/:userId
 * Gets a single global user by ID
 */
export const getGlobalUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string
    const user = await userService.getUserById(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify this is a global user (no tenant)
    if (user.tenantId !== null) {
      return res.status(400).json({ error: 'Not a global user' })
    }

    res.json(user)
  } catch (error: any) {
    console.error('Get global user error:', error)
    res.status(500).json({ error: error.message || 'Failed to get user' })
  }
}

/**
 * POST /api/users
 * Creates a new global user (platform admin)
 */
export const createGlobalUser = async (req: Request, res: Response) => {
  try {
    const { email, fullName, role, password } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    if (!role) {
      return res.status(400).json({ error: 'Role is required' })
    }

    const sanitizedEmail = sanitizeString(email).toLowerCase()
    const sanitizedFullName = fullName ? sanitizeString(fullName) : undefined
    const sanitizedRole = sanitizeString(role)

    // Create global user (tenantId = null)
    const user = await userService.createUser(
      null, // No tenant for global users
      sanitizedEmail,
      sanitizedFullName,
      sanitizedRole,
      password
    )
    
    res.status(201).json(user)
  } catch (error: any) {
    console.error('Create global user error:', error)
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Failed to create user' })
  }
}

/**
 * PUT /api/users/:userId
 * Updates a global user
 */
export const updateGlobalUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string
    const updates = req.body

    // Verify this is a global user
    const user = await userService.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (user.tenantId !== null) {
      return res.status(400).json({ error: 'Not a global user' })
    }

    const updated = await userService.updateUser(userId, updates)
    res.json(updated)
  } catch (error: any) {
    console.error('Update global user error:', error)
    res.status(500).json({ error: error.message || 'Failed to update user' })
  }
}

/**
 * DELETE /api/users/:userId
 * Deletes a global user
 */
export const deleteGlobalUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string

    // Verify this is a global user
    const user = await userService.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (user.tenantId !== null) {
      return res.status(400).json({ error: 'Not a global user' })
    }

    await userService.deleteUser(userId)
    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('Delete global user error:', error)
    res.status(500).json({ error: error.message || 'Failed to delete user' })
  }
}

/**
 * POST /api/users/:userId/disable
 * Disables a global user
 */
export const disableGlobalUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string

    // Verify this is a global user
    const user = await userService.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (user.tenantId !== null) {
      return res.status(400).json({ error: 'Not a global user' })
    }

    const updated = await userService.disableUser(userId)
    res.json(updated)
  } catch (error: any) {
    console.error('Disable global user error:', error)
    res.status(500).json({ error: error.message || 'Failed to disable user' })
  }
}

/**
 * POST /api/users/:userId/enable
 * Enables a global user
 */
export const enableGlobalUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string

    // Verify this is a global user
    const user = await userService.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (user.tenantId !== null) {
      return res.status(400).json({ error: 'Not a global user' })
    }

    const updated = await userService.enableUser(userId)
    res.json(updated)
  } catch (error: any) {
    console.error('Enable global user error:', error)
    res.status(500).json({ error: error.message || 'Failed to enable user' })
  }
}

/**
 * POST /api/users/:userId/invite
 * Generates an invite token for a global user
 */
export const inviteGlobalUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string

    // Verify this is a global user
    const user = await userService.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (user.tenantId !== null) {
      return res.status(400).json({ error: 'Not a global user' })
    }

    const inviteData = await userService.inviteUser(userId)
    
    // Send invite email (global email config will be used)
    try {
      await emailService.sendInviteEmail(
        inviteData.userEmail,
        inviteData.userFullName || inviteData.userEmail,
        inviteData.token,
        undefined // No tenant for global users
      )
    } catch (emailError: any) {
      console.error('Failed to send invite email:', emailError)
      // Continue even if email fails
    }
    
    res.json({ 
      success: true, 
      message: 'Invite sent successfully',
      ...(process.env.NODE_ENV !== 'production' ? { inviteToken: inviteData.token } : {})
    })
  } catch (error: any) {
    console.error('Invite global user error:', error)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    if (error.message.includes('already')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Failed to invite user' })
  }
}