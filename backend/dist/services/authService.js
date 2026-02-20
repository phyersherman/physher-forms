"use strict";
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
const client_1 = __importDefault(require("../db/client"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const register = async (email, password, tenantId, fullName, role = 'learner') => {
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await client_1.default.user.create({ data: { email, password: hashed, tenantId, fullName, role } });
    return user;
};
// create JWT access token (short-lived)
const createAccessToken = (user) => {
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    // short expiry for access token
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};
// create and persist refresh token (long-lived)
const createRefreshToken = async (userId, days = 30) => {
    const token = crypto_1.default.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await client_1.default.refreshToken.create({ data: { token, userId, expiresAt } });
    return { token, expiresAt };
};
const authenticate = async (email, password, tenantId) => {
    // If tenantId provided, use compound unique lookup
    // Otherwise, find first matching email (backward compatibility)
    const user = tenantId
        ? await client_1.default.user.findUnique({ where: { email_tenantId: { email, tenantId } } })
        : await client_1.default.user.findFirst({ where: { email } });
    if (!user || !user.password)
        return null;
    // Check if user is disabled
    if (user.status === 'disabled')
        return null;
    const ok = await bcryptjs_1.default.compare(password, user.password);
    if (!ok)
        return null;
    // Update last login timestamp
    await client_1.default.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });
    const accessToken = createAccessToken(user);
    const refresh = await createRefreshToken(user.id);
    return { accessToken, refresh, user };
};
const verifyToken = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return { sub: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tenantId };
    }
    catch (err) {
        return null;
    }
};
const verifyRefreshToken = async (token) => {
    const rec = await client_1.default.refreshToken.findUnique({ where: { token } });
    if (!rec)
        return null;
    if (rec.revoked)
        return null;
    if (rec.expiresAt < new Date())
        return null;
    const user = await client_1.default.user.findUnique({ where: { id: rec.userId } });
    return user;
};
const revokeRefreshToken = async (token) => {
    await client_1.default.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
};
/**
 * Generates an invite token for a user
 * Token expires in 72 hours
 */
const generateInviteToken = async (userId) => {
    const token = crypto_1.default.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
    await client_1.default.user.update({
        where: { id: userId },
        data: {
            inviteToken: token,
            inviteExpires: expiresAt,
            status: 'invited',
        },
    });
    return token;
};
/**
 * Accepts an invite and sets the user's password
 * Token is single-use and cleared after acceptance
 */
const acceptInvite = async (token, password) => {
    const user = await client_1.default.user.findUnique({ where: { inviteToken: token } });
    if (!user) {
        throw new Error('Invalid invite token');
    }
    if (!user.inviteExpires || user.inviteExpires < new Date()) {
        throw new Error('Invite token has expired');
    }
    // Validate password strength
    const { isValidPassword } = await Promise.resolve().then(() => __importStar(require('../utils/validators')));
    if (!isValidPassword(password)) {
        throw new Error('Password must be at least 8 characters with at least 1 number and 1 letter');
    }
    // Hash password and clear invite token
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const updatedUser = await client_1.default.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            status: 'active',
            inviteToken: null,
            inviteExpires: null,
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            tenantId: true,
        },
    });
    return updatedUser;
};
/**
 * Initiates password reset by generating a reset token
 * Token expires in 1 hour
 * Always returns success (don't reveal if email exists)
 */
const forgotPassword = async (email, tenantId) => {
    // Find user by email and optional tenantId
    const user = tenantId
        ? await client_1.default.user.findUnique({ where: { email_tenantId: { email, tenantId } } })
        : await client_1.default.user.findFirst({ where: { email } });
    // Don't reveal if user exists (security best practice)
    if (!user) {
        return { success: true };
    }
    // Generate reset token
    const token = crypto_1.default.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await client_1.default.user.update({
        where: { id: user.id },
        data: {
            resetToken: token,
            resetExpires: expiresAt,
        },
    });
    // Return token so email service can send it
    return { success: true, token, userId: user.id, userEmail: user.email };
};
/**
 * Resets password using a valid reset token
 * Token is single-use and cleared after reset
 */
const resetPassword = async (token, newPassword) => {
    const user = await client_1.default.user.findUnique({ where: { resetToken: token } });
    if (!user) {
        throw new Error('Invalid reset token');
    }
    if (!user.resetExpires || user.resetExpires < new Date()) {
        throw new Error('Reset token has expired');
    }
    // Validate password strength
    const { isValidPassword } = await Promise.resolve().then(() => __importStar(require('../utils/validators')));
    if (!isValidPassword(newPassword)) {
        throw new Error('Password must be at least 8 characters with at least 1 number and 1 letter');
    }
    // Hash password and clear reset token
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    await client_1.default.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetExpires: null,
        },
    });
    return { success: true };
};
exports.default = {
    register,
    authenticate,
    verifyToken,
    verifyRefreshToken,
    revokeRefreshToken,
    createRefreshToken,
    createAccessToken,
    generateInviteToken,
    acceptInvite,
    forgotPassword,
    resetPassword,
};
