"use strict";
/**
 * User Controller
 * Thin controller layer that delegates to userService
 * Follows same pattern as tenantController.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteGlobalUser = exports.enableGlobalUser = exports.disableGlobalUser = exports.deleteGlobalUser = exports.updateGlobalUser = exports.createGlobalUser = exports.getGlobalUser = exports.listGlobalUsers = exports.inviteUser = exports.changePassword = exports.enableUser = exports.disableUser = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUser = exports.listUsers = void 0;
const userService = __importStar(require("../services/userService"));
const emailService = __importStar(require("../services/emailService"));
const validators_1 = require("../utils/validators");
/**
 * GET /api/tenants/:tenantId/users
 * Lists all users for a tenant (optionally filtered by role)
 */
const listUsers = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;
        const { role } = req.query;
        // Allow global admins or tenant admins who belong to this tenant
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Not authorized to view users in this tenant' });
        }
        const users = await userService.listUsersByTenant(tenantId, role);
        res.json(users);
    }
    catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: error.message || 'Failed to list users' });
    }
};
exports.listUsers = listUsers;
/**
 * GET /api/tenants/:tenantId/users/:userId
 * Gets a single user by ID
 */
const getUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify requesting user can view this user
        if (req.user?.tenantId !== user.tenantId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to view this user' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: error.message || 'Failed to get user' });
    }
};
exports.getUser = getUser;
/**
 * POST /api/tenants/:tenantId/users
 * Creates a new user in a tenant
 */
const createUser = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;
        const { email, fullName, role, password } = req.body;
        // Allow global admins or tenant admins who belong to this tenant
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Not authorized to create users in this tenant' });
        }
        // Validate required fields
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }
        const user = await userService.createUser(tenantId, (0, validators_1.sanitizeString)(email), fullName ? (0, validators_1.sanitizeString)(fullName) : undefined, role, password);
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Create user error:', error);
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(400).json({ error: error.message || 'Failed to create user' });
    }
};
exports.createUser = createUser;
/**
 * PUT /api/tenants/:tenantId/users/:userId
 * Updates a user
 */
const updateUser = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;
        const userId = req.params.userId;
        const { email, fullName, role, status } = req.body;
        // Allow global admins or tenant admins who belong to this tenant
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Not authorized to update users in this tenant' });
        }
        // Get user to verify they belong to this tenant
        const existingUser = await userService.getUserById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (existingUser.tenantId !== tenantId) {
            return res.status(403).json({ error: 'User does not belong to this tenant' });
        }
        const user = await userService.updateUser(userId, {
            email: email ? (0, validators_1.sanitizeString)(email) : undefined,
            fullName: fullName !== undefined ? (0, validators_1.sanitizeString)(fullName) : undefined,
            role,
            status,
        });
        res.json(user);
    }
    catch (error) {
        console.error('Update user error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(400).json({ error: error.message || 'Failed to update user' });
    }
};
exports.updateUser = updateUser;
/**
 * DELETE /api/tenants/:tenantId/users/:userId
 * Deletes a user (hard delete)
 */
const deleteUser = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;
        const userId = req.params.userId;
        // Allow global admins or tenant admins who belong to this tenant
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Not authorized to delete users in this tenant' });
        }
        // Get user to verify they belong to this tenant
        const existingUser = await userService.getUserById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (existingUser.tenantId !== tenantId) {
            return res.status(403).json({ error: 'User does not belong to this tenant' });
        }
        // Prevent deleting self
        if (userId === req.user?.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        await userService.deleteUser(userId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
/**
 * POST /api/tenants/:tenantId/users/:userId/disable
 * Disables a user (soft delete)
 */
const disableUser = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;
        const userId = req.params.userId;
        // Allow global admins or tenant admins who belong to this tenant
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Not authorized to disable users in this tenant' });
        }
        // Get user to verify they belong to this tenant
        const existingUser = await userService.getUserById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (existingUser.tenantId !== tenantId) {
            return res.status(403).json({ error: 'User does not belong to this tenant' });
        }
        // Prevent disabling self
        if (userId === req.user?.id) {
            return res.status(400).json({ error: 'Cannot disable your own account' });
        }
        const user = await userService.disableUser(userId);
        res.json(user);
    }
    catch (error) {
        console.error('Disable user error:', error);
        res.status(500).json({ error: error.message || 'Failed to disable user' });
    }
};
exports.disableUser = disableUser;
/**
 * POST /api/tenants/:tenantId/users/:userId/enable
 * Re-enables a disabled user
 */
const enableUser = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;
        const userId = req.params.userId;
        // Allow global admins or tenant admins who belong to this tenant
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Not authorized to enable users in this tenant' });
        }
        // Get user to verify they belong to this tenant
        const existingUser = await userService.getUserById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (existingUser.tenantId !== tenantId) {
            return res.status(403).json({ error: 'User does not belong to this tenant' });
        }
        const user = await userService.enableUser(userId);
        res.json(user);
    }
    catch (error) {
        console.error('Enable user error:', error);
        res.status(500).json({ error: error.message || 'Failed to enable user' });
    }
};
exports.enableUser = enableUser;
/**
 * POST /api/users/:userId/password
 * Changes user's password (authenticated user only for their own account)
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { currentPassword, newPassword } = req.body;
        // Users can only change their own password
        if (req.user?.id !== userId) {
            return res.status(403).json({ error: 'Can only change your own password' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        await userService.changePassword(userId, currentPassword, newPassword);
        res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        if (error.message.includes('incorrect')) {
            return res.status(401).json({ error: error.message });
        }
        res.status(400).json({ error: error.message || 'Failed to change password' });
    }
};
exports.changePassword = changePassword;
/**
 * POST /api/tenants/:tenantId/users/:userId/invite
 * Generates an invite token for a user (admin only)
 */
const inviteUser = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;
        const userId = req.params.userId;
        // Allow global admins or tenant admins who belong to this tenant
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        // Verify user belongs to this tenant
        const user = await userService.getUserById(userId);
        if (!user || user.tenantId !== tenantId) {
            return res.status(404).json({ error: 'User not found' });
        }
        const inviteData = await userService.inviteUser(userId);
        // Send invite email
        try {
            await emailService.sendInviteEmail(inviteData.userEmail, inviteData.userFullName || inviteData.userEmail, inviteData.token, inviteData.tenantId || undefined);
        }
        catch (emailError) {
            console.error('Failed to send invite email:', emailError);
            // Continue even if email fails - user can be re-invited
        }
        res.json({
            success: true,
            message: 'Invite sent successfully',
            // TEMP: Include token in non-production for testing
            ...(process.env.NODE_ENV !== 'production' ? { inviteToken: inviteData.token } : {})
        });
    }
    catch (error) {
        console.error('Invite user error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('already')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to invite user' });
    }
};
exports.inviteUser = inviteUser;
/**
 * ========================================
 * Global User Management (Platform-wide)
 * ========================================
 */
/**
 * GET /api/users
 * Lists all global users (users not tied to a tenant)
 */
const listGlobalUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const users = await userService.listGlobalUsers(role);
        res.json(users);
    }
    catch (error) {
        console.error('List global users error:', error);
        res.status(500).json({ error: error.message || 'Failed to list global users' });
    }
};
exports.listGlobalUsers = listGlobalUsers;
/**
 * GET /api/users/:userId
 * Gets a single global user by ID
 */
const getGlobalUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify this is a global user (no tenant)
        if (user.tenantId !== null) {
            return res.status(400).json({ error: 'Not a global user' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get global user error:', error);
        res.status(500).json({ error: error.message || 'Failed to get user' });
    }
};
exports.getGlobalUser = getGlobalUser;
/**
 * POST /api/users
 * Creates a new global user (platform admin)
 */
const createGlobalUser = async (req, res) => {
    try {
        const { email, fullName, role, password } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }
        const sanitizedEmail = (0, validators_1.sanitizeString)(email).toLowerCase();
        const sanitizedFullName = fullName ? (0, validators_1.sanitizeString)(fullName) : undefined;
        const sanitizedRole = (0, validators_1.sanitizeString)(role);
        // Create global user (tenantId = null)
        const user = await userService.createUser(null, // No tenant for global users
        sanitizedEmail, sanitizedFullName, sanitizedRole, password);
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Create global user error:', error);
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to create user' });
    }
};
exports.createGlobalUser = createGlobalUser;
/**
 * PUT /api/users/:userId
 * Updates a global user
 */
const updateGlobalUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const updates = req.body;
        // Verify this is a global user
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.tenantId !== null) {
            return res.status(400).json({ error: 'Not a global user' });
        }
        const updated = await userService.updateUser(userId, updates);
        res.json(updated);
    }
    catch (error) {
        console.error('Update global user error:', error);
        res.status(500).json({ error: error.message || 'Failed to update user' });
    }
};
exports.updateGlobalUser = updateGlobalUser;
/**
 * DELETE /api/users/:userId
 * Deletes a global user
 */
const deleteGlobalUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        // Verify this is a global user
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.tenantId !== null) {
            return res.status(400).json({ error: 'Not a global user' });
        }
        await userService.deleteUser(userId);
        res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete global user error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
};
exports.deleteGlobalUser = deleteGlobalUser;
/**
 * POST /api/users/:userId/disable
 * Disables a global user
 */
const disableGlobalUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        // Verify this is a global user
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.tenantId !== null) {
            return res.status(400).json({ error: 'Not a global user' });
        }
        const updated = await userService.disableUser(userId);
        res.json(updated);
    }
    catch (error) {
        console.error('Disable global user error:', error);
        res.status(500).json({ error: error.message || 'Failed to disable user' });
    }
};
exports.disableGlobalUser = disableGlobalUser;
/**
 * POST /api/users/:userId/enable
 * Enables a global user
 */
const enableGlobalUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        // Verify this is a global user
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.tenantId !== null) {
            return res.status(400).json({ error: 'Not a global user' });
        }
        const updated = await userService.enableUser(userId);
        res.json(updated);
    }
    catch (error) {
        console.error('Enable global user error:', error);
        res.status(500).json({ error: error.message || 'Failed to enable user' });
    }
};
exports.enableGlobalUser = enableGlobalUser;
/**
 * POST /api/users/:userId/invite
 * Generates an invite token for a global user
 */
const inviteGlobalUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        // Verify this is a global user
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.tenantId !== null) {
            return res.status(400).json({ error: 'Not a global user' });
        }
        const inviteData = await userService.inviteUser(userId);
        // Send invite email (global email config will be used)
        try {
            await emailService.sendInviteEmail(inviteData.userEmail, inviteData.userFullName || inviteData.userEmail, inviteData.token, undefined // No tenant for global users
            );
        }
        catch (emailError) {
            console.error('Failed to send invite email:', emailError);
            // Continue even if email fails
        }
        res.json({
            success: true,
            message: 'Invite sent successfully',
            ...(process.env.NODE_ENV !== 'production' ? { inviteToken: inviteData.token } : {})
        });
    }
    catch (error) {
        console.error('Invite global user error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('already')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to invite user' });
    }
};
exports.inviteGlobalUser = inviteGlobalUser;
