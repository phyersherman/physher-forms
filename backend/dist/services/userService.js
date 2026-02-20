"use strict";
/**
 * User Service
 * Handles user CRUD operations with tenant scoping
 * Reuses bcrypt patterns from authService
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGlobalUsers = exports.inviteUser = exports.enableUser = exports.disableUser = exports.deleteUser = exports.changePassword = exports.updateUser = exports.createUser = exports.getUserById = exports.listUsersByTenant = void 0;
const client_1 = __importDefault(require("../db/client"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validators_1 = require("../utils/validators");
/**
 * Lists all users for a specific tenant
 * Optionally filter by role
 */
const listUsersByTenant = async (tenantId, role) => {
    const where = { tenantId };
    if (role)
        where.role = role;
    return client_1.default.user.findMany({
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
    });
};
exports.listUsersByTenant = listUsersByTenant;
/**
 * Gets a single user by ID
 * Returns null if user not found
 */
const getUserById = async (id) => {
    return client_1.default.user.findUnique({
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
    });
};
exports.getUserById = getUserById;
/**
 * Creates a new user in a tenant or as a global user
 * Password is optional - if not provided, user will be in 'invited' status
 */
const createUser = async (tenantId, email, fullName, role, password) => {
    // Validate inputs
    if (!(0, validators_1.isValidEmail)(email)) {
        throw new Error('Invalid email format');
    }
    if (!(0, validators_1.isValidRole)(role)) {
        throw new Error('Invalid role. Must be admin, instructor, or learner');
    }
    // If password provided, validate and hash it
    let hashedPassword;
    let status = 'active';
    if (password) {
        if (!(0, validators_1.isValidPassword)(password)) {
            throw new Error('Password must be at least 8 characters with at least 1 number and 1 letter');
        }
        hashedPassword = await bcryptjs_1.default.hash(password, 10);
    }
    else {
        // No password = user needs to be invited
        status = 'invited';
    }
    // Check for duplicate email in this tenant (or global if tenantId is null)
    // Note: Use findFirst instead of findUnique because tenantId can be null
    const existing = await client_1.default.user.findFirst({
        where: {
            email: email,
            tenantId: tenantId
        },
    });
    if (existing) {
        const scope = tenantId ? 'this tenant' : 'global users';
        throw new Error(`User with this email already exists in ${scope}`);
    }
    const user = await client_1.default.user.create({
        data: {
            email: email,
            password: hashedPassword,
            fullName: fullName,
            role: role,
            tenantId: tenantId,
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
    });
    return user;
};
exports.createUser = createUser;
/**
 * Updates a user
 * Cannot change password through this method (use changePassword instead)
 */
const updateUser = async (id, data) => {
    // Validate inputs
    if (data.email && !(0, validators_1.isValidEmail)(data.email)) {
        throw new Error('Invalid email format');
    }
    if (data.role && !(0, validators_1.isValidRole)(data.role)) {
        throw new Error('Invalid role');
    }
    if (data.status && !(0, validators_1.isValidStatus)(data.status)) {
        throw new Error('Invalid status');
    }
    // If email is changing, check for duplicates in the same tenant
    if (data.email) {
        const user = await client_1.default.user.findUnique({ where: { id } });
        if (!user)
            throw new Error('User not found');
        const duplicate = await client_1.default.user.findFirst({
            where: {
                email: data.email,
                tenantId: user.tenantId,
                id: { not: id },
            },
        });
        if (duplicate) {
            throw new Error('Another user with this email already exists in this tenant');
        }
    }
    return client_1.default.user.update({
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
    });
};
exports.updateUser = updateUser;
/**
 * Changes a user's password
 * Validates current password before changing
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await client_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
    });
    if (!user || !user.password) {
        throw new Error('User not found or password not set');
    }
    // Verify current password
    const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!valid) {
        throw new Error('Current password is incorrect');
    }
    // Validate new password
    if (!(0, validators_1.isValidPassword)(newPassword)) {
        throw new Error('New password must be at least 8 characters with at least 1 number and 1 letter');
    }
    // Hash and update
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    await client_1.default.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });
    return { success: true };
};
exports.changePassword = changePassword;
/**
 * Deletes a user
 * This will cascade to refresh tokens
 */
const deleteUser = async (id) => {
    await client_1.default.user.delete({ where: { id } });
    return { success: true };
};
exports.deleteUser = deleteUser;
/**
 * Disable a user (soft delete)
 * Prefers this over hard delete to maintain data integrity
 */
const disableUser = async (id) => {
    return client_1.default.user.update({
        where: { id },
        data: { status: 'disabled' },
        select: {
            id: true,
            email: true,
            status: true,
        },
    });
};
exports.disableUser = disableUser;
/**
 * Enable a previously disabled user
 */
const enableUser = async (id) => {
    return client_1.default.user.update({
        where: { id },
        data: { status: 'active' },
        select: {
            id: true,
            email: true,
            status: true,
        },
    });
};
exports.enableUser = enableUser;
/**
 * Generates an invite token for a user and sets status to 'invited'
 * Returns the token so it can be sent via email
 */
const inviteUser = async (userId) => {
    const user = await (0, exports.getUserById)(userId);
    if (!user) {
        throw new Error('User not found');
    }
    if (user.status === 'active' && user.lastLoginAt) {
        throw new Error('User has already accepted their invite and logged in');
    }
    const authService = await Promise.resolve().then(() => __importStar(require('./authService')));
    const token = await authService.default.generateInviteToken(userId);
    return {
        token,
        userId: user.id,
        userEmail: user.email,
        userFullName: user.fullName,
        tenantId: user.tenantId,
    };
};
exports.inviteUser = inviteUser;
/**
 * Lists all global users (users not tied to a tenant)
 * Optionally filter by role
 */
const listGlobalUsers = async (role) => {
    const where = { tenantId: null };
    if (role)
        where.role = role;
    return client_1.default.user.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
    });
};
exports.listGlobalUsers = listGlobalUsers;
