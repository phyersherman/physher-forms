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
import passwordlessAccessService from '../services/passwordless-access-service';
import authService from '../services/authService';

const prisma = new PrismaClient();

/**
 * PUBLIC: Validate a passwordless access token
 * GET /api/public/passwordless-links/validate?token={TOKEN}
 */
export async function validatePasswordlessToken(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    const linkInfo = await passwordlessAccessService.validatePasswordlessToken(token);

    res.json(linkInfo);
  } catch (error: any) {
    console.error('[Passwordless Auth] Validate token error:', error);
    res.status(400).json({ error: error.message || 'Invalid token' });
  }
}

/**
 * PUBLIC: Register via passwordless link
 * POST /api/public/passwordless-links/register
 * Body: { token, fullName, email, organization? }
 */
export async function registerViaPasswordlessLink(req: Request, res: Response) {
  try {
    const { token, fullName, email, organization } = req.body;

    // Validate required fields
    if (!token) return res.status(400).json({ error: 'Token is required' });
    if (!fullName) return res.status(400).json({ error: 'Full name is required' });
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const ipAddress = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;

    // Register the user
    const result = await passwordlessAccessService.registerViaPasswordlessLink(
      { token, fullName, email, organization },
      ipAddress
    );

    // Generate magic code for immediate login
    const magicCodeResult = await magicCodeService.generateMagicCode(result.user.id);

    // TODO: Send email with magic code
    // For now, return it in the response (in production, only send via email)
    console.log(`[Passwordless Auth] Magic code for ${email}: ${magicCodeResult.code}`);

    res.json({
      message: 'Registration successful! Check your email for the login code.',
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
      },
      enrolledCourses: result.courses,
      // In production, remove this and only send via email:
      magicCode: process.env.NODE_ENV === 'development' ? magicCodeResult.code : undefined,
    });
  } catch (error: any) {
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

    // Generate magic code
    const result = await magicCodeService.generateMagicCodeByEmail(email);

    // TODO: Send email with magic code via email service
    // For now, log it (in production, never expose the code in the response)
    console.log(`[Passwordless Auth] Magic code for ${email}: ${result.code}, expires at ${result.expiresAt.toISOString()}`);

    res.json({
      message: 'Login code sent to your email',
      expiresAt: result.expiresAt,
      // In production, remove this and only send via email:
      magicCode: process.env.NODE_ENV === 'development' ? result.code : undefined,
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

    // Validate the magic code
    const validation = await magicCodeService.validateMagicCode(email, code);

    if (!validation.isValid) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

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

    // Set HTTP-only cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
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
