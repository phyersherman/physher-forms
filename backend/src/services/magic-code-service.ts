/**
 * Magic Code Service
 * 
 * Handles generation, validation, and management of 6-digit magic codes
 * for passwordless authentication. Codes expire after 10 minutes and are
 * single-use only.
 */

import { PrismaClient } from '@prisma/client';
import { sendMagicCodeEmail } from './emailService';

const prisma = new PrismaClient();

/**
 * Generate a random 6-digit code
 */
function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if user can request a new magic code (rate limiting)
 * Limit: 1 code per 60 seconds per user
 */
async function canRequestMagicCode(userId: string): Promise<{ allowed: boolean; waitTimeSeconds?: number }> {
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
  
  const recentCode = await prisma.magicCode.findFirst({
    where: {
      userId,
      createdAt: { gte: sixtySecondsAgo },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentCode) {
    const timeSinceCreation = Date.now() - recentCode.createdAt.getTime();
    const waitTime = Math.ceil((60 * 1000 - timeSinceCreation) / 1000);
    return { allowed: false, waitTimeSeconds: waitTime };
  }

  return { allowed: true };
}

/**
 * Generate a magic code for a user and send email
 * 
 * @param userId - ID of user requesting the code
 * @param tenantId - Optional tenant ID
 * @returns The generated magic code
 * @throws Error if rate limit exceeded or user not found
 */
async function generateMagicCode(userId: string, tenantId?: string): Promise<{ code: string; expiresAt: Date }> {
  // Check rate limiting
  const rateCheck = await canRequestMagicCode(userId);
  if (!rateCheck.allowed) {
    throw new Error(`Please wait ${rateCheck.waitTimeSeconds} seconds before requesting a new code`);
  }

  // Verify user exists and has passwordless auth method
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      authMethod: true, 
      email: true, 
      fullName: true,
      tenantId: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.authMethod !== 'passwordless') {
    throw new Error('This user does not use passwordless authentication');
  }

  // Generate unique 6-digit code
  let code = generateSixDigitCode();
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure code is unique (very unlikely collision, but check anyway)
  while (attempts < maxAttempts) {
    const existing = await prisma.magicCode.findUnique({
      where: { code },
    });

    if (!existing) {
      break; // Code is unique
    }

    code = generateSixDigitCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique magic code');
  }

  // Expire in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Create magic code
  const magicCode = await prisma.magicCode.create({
    data: {
      userId,
      code,
      expiresAt,
      isUsed: false,
    },
  });

  // Get tenant name for the email
  let organizationName = 'Our Platform';
  const userTenantId = user.tenantId || tenantId;
  if (userTenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: userTenantId },
      select: { name: true },
    });
    if (tenant) {
      organizationName = tenant.name;
    }
  }

  // Send magic code email
  try {
    await sendMagicCodeEmail(
      user.email,
      user.fullName || 'User',
      code,
      organizationName,
      userTenantId
    );
    console.log(`[Magic Code] Generated code ${code} for user ${userId}, email sent to ${user.email}`);
  } catch (error: any) {
    // Log email error but don't fail code generation
    console.error(`[Magic Code] Failed to send email for code ${code}:`, error.message);
    // Still return the code - frontend can show it if needed for testing
    console.log(`[Magic Code] Generated code ${code} for user ${userId}, expires at ${expiresAt.toISOString()}`);
  }

  return {
    code: magicCode.code,
    expiresAt: magicCode.expiresAt,
  };
}

/**
 * Generate magic code by email address
 * 
 * @param email - Email address of the user
 * @param tenantId - Optional tenant ID for multi-tenant systems
 * @returns Magic code information
 * @throws Error if user not found or rate limit exceeded
 */
async function generateMagicCodeByEmail(email: string, tenantId?: string): Promise<{ code: string; expiresAt: Date; userId: string }> {
  const user = await prisma.user.findFirst({
    where: { 
      email: email.toLowerCase().trim(),
      tenantId: tenantId || undefined,
    },
    select: { id: true, authMethod: true },
  });

  if (!user) {
    throw new Error('No account found with this email address');
  }

  if (user.authMethod !== 'passwordless') {
    throw new Error('This account does not use passwordless authentication');
  }

  const result = await generateMagicCode(user.id, tenantId);

  return {
    ...result,
    userId: user.id,
  };
}

/**
 * Validate a magic code and mark it as used
 * 
 * @param email - Email address of the user
 * @param code - 6-digit magic code
 * @param tenantId - Optional tenant ID for multi-tenant systems
 * @returns User ID if code is valid
 * @throws Error if code is invalid, expired, or already used
 */
async function validateMagicCode(email: string, code: string, tenantId?: string): Promise<{ userId: string; isValid: boolean }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();
  
  console.log(`[Magic Code Validation] Validating code for email: ${cleanEmail}, tenantId: ${tenantId || 'none'}`);

  // Find user by email
  const user = await prisma.user.findFirst({
    where: { 
      email: cleanEmail,
      tenantId: tenantId || undefined,
    },
    select: { id: true, authMethod: true },
  });

  if (!user) {
    console.log(`[Magic Code Validation] User not found for email: ${cleanEmail}`);
    throw new Error('Invalid email or code');
  }

  if (user.authMethod !== 'passwordless') {
    console.log(`[Magic Code Validation] User ${user.id} has authMethod: ${user.authMethod}, not passwordless`);
    throw new Error('This account does not use passwordless authentication');
  }

  // Find the magic code
  const magicCode = await prisma.magicCode.findFirst({
    where: {
      userId: user.id,
      code: cleanCode,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!magicCode) {
    console.log(`[Magic Code Validation] Code ${cleanCode} not found for user ${user.id}`);
    console.log(`[Magic Code Validation] Looking for codes with userId=${user.id}, got codes:`, 
      await prisma.magicCode.findMany({
        where: { userId: user.id },
        select: { code: true, isUsed: true, expiresAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    );
    throw new Error('Invalid code');
  }

  // Check if already used
  if (magicCode.isUsed) {
    console.log(`[Magic Code Validation] Code ${cleanCode} for user ${user.id} has already been used`);
    throw new Error('This code has already been used');
  }

  // Check if expired
  if (new Date() > magicCode.expiresAt) {
    console.log(`[Magic Code Validation] Code ${cleanCode} for user ${user.id} has expired (expiresAt: ${magicCode.expiresAt})`);
    throw new Error('This code has expired. Please request a new one.');
  }

  console.log(`[Magic Code Validation] Code ${cleanCode} for user ${user.id} is valid, marking as used`);

  // Mark code as used
  await prisma.magicCode.update({
    where: { id: magicCode.id },
    data: { isUsed: true },
  });

  return {
    userId: user.id,
    isValid: true,
  };
}

/**
 * Cleanup expired codes (to be run as a background job)
 * Deletes codes that expired more than 24 hours ago
 */
async function cleanupExpiredCodes(): Promise<{ deletedCount: number }> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.magicCode.deleteMany({
    where: {
      expiresAt: { lt: twentyFourHoursAgo },
    },
  });

  console.log(`[Magic Code Cleanup] Deleted ${result.count} expired codes`);

  return { deletedCount: result.count };
}

/**
 * Get active codes for a user (for debugging/admin purposes)
 */
async function getActiveCodesForUser(userId: string): Promise<any[]> {
  return prisma.magicCode.findMany({
    where: {
      userId,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      code: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

export default {
  generateMagicCode,
  generateMagicCodeByEmail,
  validateMagicCode,
  cleanupExpiredCodes,
  getActiveCodesForUser,
  canRequestMagicCode,
};
