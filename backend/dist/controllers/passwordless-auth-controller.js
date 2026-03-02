"use strict";
/**
 * Passwordless Authentication Controller
 *
 * Handles public endpoints for passwordless authentication flow:
 * - Magic code generation and validation
 * - Passwordless link registration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordlessToken = validatePasswordlessToken;
exports.registerViaPasswordlessLink = registerViaPasswordlessLink;
exports.sendMagicCode = sendMagicCode;
exports.verifyMagicCode = verifyMagicCode;
exports.resendMagicCode = resendMagicCode;
exports.cleanupExpiredCodes = cleanupExpiredCodes;
const client_1 = require("@prisma/client");
const magic_code_service_1 = __importDefault(require("../services/magic-code-service"));
const passwordless_access_service_1 = __importDefault(require("../services/passwordless-access-service"));
const authService_1 = __importDefault(require("../services/authService"));
const prisma = new client_1.PrismaClient();
/**
 * PUBLIC: Validate a passwordless access token
 * GET /api/public/passwordless-links/validate?token={TOKEN}
 */
async function validatePasswordlessToken(req, res) {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Token is required' });
        }
        const linkInfo = await passwordless_access_service_1.default.validatePasswordlessToken(token);
        res.json(linkInfo);
    }
    catch (error) {
        console.error('[Passwordless Auth] Validate token error:', error);
        res.status(400).json({ error: error.message || 'Invalid token' });
    }
}
/**
 * PUBLIC: Register via passwordless link
 * POST /api/public/passwordless-links/register
 * Body: { token, fullName, email, organization? }
 */
async function registerViaPasswordlessLink(req, res) {
    try {
        const { token, fullName, email, organization } = req.body;
        // Validate required fields
        if (!token)
            return res.status(400).json({ error: 'Token is required' });
        if (!fullName)
            return res.status(400).json({ error: 'Full name is required' });
        if (!email)
            return res.status(400).json({ error: 'Email is required' });
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        // Register the user
        const result = await passwordless_access_service_1.default.registerViaPasswordlessLink({ token, fullName, email, organization }, ipAddress);
        // Generate magic code for immediate login - email will be sent automatically
        await magic_code_service_1.default.generateMagicCode(result.user.id, result.user.tenantId || undefined);
        res.json({
            message: 'Registration successful! Check your email for the login code.',
            user: {
                id: result.user.id,
                email: result.user.email,
                fullName: result.user.fullName,
            },
            enrolledCourses: result.courses,
        });
    }
    catch (error) {
        console.error('[Passwordless Auth] Registration error:', error);
        res.status(400).json({ error: error.message || 'Registration failed' });
    }
}
/**
 * PUBLIC: Send magic code to email
 * POST /api/public/auth/send-code
 * Body: { email }
 * Rate limited: 1 request per 60 seconds per email
 */
async function sendMagicCode(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        // Generate magic code - email will be sent automatically
        const result = await magic_code_service_1.default.generateMagicCodeByEmail(email);
        res.json({
            message: 'Login code sent to your email',
            expiresAt: result.expiresAt,
        });
    }
    catch (error) {
        console.error('[Passwordless Auth] Send code error:', error);
        // Handle rate limiting specifically
        if (error.message.includes('wait')) {
            return res.status(429).json({
                error: error.message,
                rateLimited: true,
            });
        }
        res.status(400).json({ error: error.message || 'Failed to send login code' });
    }
}
/**
 * PUBLIC: Verify magic code and login
 * POST /api/public/auth/verify-code
 * Body: { email, code }
 */
async function verifyMagicCode(req, res) {
    try {
        const { email, code } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email is required' });
        if (!code)
            return res.status(400).json({ error: 'Code is required' });
        // Get tenantId from request (set by tenantResolver middleware)
        const tenantId = req.tenantId;
        console.log(`[Passwordless Auth] Verify code endpoint called - email: "${email}", code: "${code}", tenantId: ${tenantId || 'none'}`);
        // Validate the magic code (pass tenantId for proper tenant scoping)
        const validation = await magic_code_service_1.default.validateMagicCode(email, code, tenantId);
        if (!validation.isValid) {
            console.log(`[Passwordless Auth] Validation returned false for code`);
            return res.status(400).json({ error: 'Invalid or expired code' });
        }
        console.log(`[Passwordless Auth] Code validation successful for user ${validation.userId}`);
        // Get user details directly from Prisma
        const user = await prisma.user.findUnique({
            where: { id: validation.userId },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Generate JWT tokens
        const accessToken = authService_1.default.createAccessToken(user);
        const refreshToken = await authService_1.default.createRefreshToken(user.id);
        // Set HTTP-only cookies (match standard authController cookie names)
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie('refreshToken', refreshToken.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                tenantId: user.tenantId,
            },
        });
    }
    catch (error) {
        console.error('[Passwordless Auth] Verify code error:', error);
        res.status(400).json({ error: error.message || 'Invalid code' });
    }
}
/**
 * PUBLIC: Resend magic code
 * POST /api/public/auth/resend-code
 * Body: { email }
 * Rate limited: 1 request per 60 seconds per email (same as send-code)
 */
async function resendMagicCode(req, res) {
    // Reuse the send-code logic
    return sendMagicCode(req, res);
}
/**
 * ADMIN: Cleanup expired magic codes (should be called by a cron job)
 * POST /api/admin/magic-codes/cleanup
 */
async function cleanupExpiredCodes(req, res) {
    try {
        const result = await magic_code_service_1.default.cleanupExpiredCodes();
        res.json({
            message: 'Cleanup completed',
            deletedCount: result.deletedCount,
        });
    }
    catch (error) {
        console.error('[Passwordless Auth] Cleanup error:', error);
        res.status(500).json({ error: 'Cleanup failed' });
    }
}
