/**
 * Passwordless Authentication Controller
 * 
 * Handles public endpoints for passwordless authentication flow:
 * - Magic code generation and validation
 * - Passwordless link registration
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import magicCodeService from '../services/magic-code-service';
import authService from '../services/authService';

const prisma = new PrismaClient();

/**
 * PUBLIC: Validate a passwordless access token
 * GET /api/public/passwordless-links/validate?token={TOKEN}
 */
export async function validatePasswordlessToken(req: Request, res: Response) {
  return res.status(410).json({ error: 'Passwordless access links are not available in PhysherForms' });
}

/**
 * PUBLIC: Register via passwordless link
 * POST /api/public/passwordless-links/register
 * Body: { token, fullName, email, organization? }
 */
export async function registerViaPasswordlessLink(req: Request, res: Response) {
  return res.status(410).json({ error: 'Passwordless access links are not available in PhysherForms' });
}

/**
 * PUBLIC: Send magic code to email
 * POST /api/public/auth/send-code
 * Body: { email }
 * Rate limited: 1 request per 60 seconds per email
 */
export async function sendMagicCode(req: Request, res: Response) {
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
    const result = await magicCodeService.generateMagicCodeByEmail(email);

    res.json({
      message: 'Login code sent to your email',
      expiresAt: result.expiresAt,
    });
  } catch (error: any) {
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
export async function verifyMagicCode(req: Request, res: Response) {
  try {
    const { email, code } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!code) return res.status(400).json({ error: 'Code is required' });

    // Get tenantId from request (set by tenantResolver middleware)
    const tenantId = req.tenantId as string | undefined;

    console.log(`[Passwordless Auth] Verify code endpoint called - email: "${email}", code: "${code}", tenantId: ${tenantId || 'none'}`);

    // Validate the magic code (pass tenantId for proper tenant scoping)
    const validation = await magicCodeService.validateMagicCode(email, code, tenantId);

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
    const accessToken = authService.createAccessToken(user);
    const refreshToken = await authService.createRefreshToken(user.id);

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
  } catch (error: any) {
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
export async function resendMagicCode(req: Request, res: Response) {
  // Reuse the send-code logic
  return sendMagicCode(req, res);
}

/**
 * ADMIN: Cleanup expired magic codes (should be called by a cron job)
 * POST /api/admin/magic-codes/cleanup
 */
export async function cleanupExpiredCodes(req: Request, res: Response) {
  try {
    const result = await magicCodeService.cleanupExpiredCodes();
    res.json({
      message: 'Cleanup completed',
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('[Passwordless Auth] Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
}
