/**
 * Passwordless Access Service
 * 
 * Manages passwordless access links that allow users to register and access
 * courses without creating a password. Authentication is done via email magic codes.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface CreatePasswordlessLinkData {
  tenantId: string;
  courseIds: string[];
  name: string;
  organization?: string;
  maxUses?: number;
  expiresAt?: Date;
  createdBy: string;
}

interface UpdatePasswordlessLinkData {
  name?: string;
  organization?: string;
  maxUses?: number;
  expiresAt?: Date;
  isActive?: boolean;
}

interface PasswordlessRegistrationData {
  token: string;
  fullName: string;
  email: string;
  organization?: string;
}

/**
 * Generate a secure random token for the passwordless link
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create a new passwordless access link
 * 
 * @param data - Link configuration
 * @returns Created passwordless link with generated token
 */
async function createPasswordlessLink(data: CreatePasswordlessLinkData) {
  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: data.tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Verify all courses exist and belong to the tenant
  const courses = await prisma.course.findMany({
    where: {
      id: { in: data.courseIds },
      tenant_id: data.tenantId,
    },
  });

  if (courses.length !== data.courseIds.length) {
    throw new Error('One or more courses not found or do not belong to this tenant');
  }

  // Generate unique token
  let token = generateToken();
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const existing = await prisma.passwordlessAccessLink.findUnique({
      where: { token },
    });

    if (!existing) {
      break; // Token is unique
    }

    token = generateToken();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique token');
  }

  // Create the passwordless link
  const link = await prisma.passwordlessAccessLink.create({
    data: {
      tenantId: data.tenantId,
      courseIds: data.courseIds,
      name: data.name,
      organization: data.organization,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt,
      createdBy: data.createdBy,
      token,
      isActive: true,
      usedCount: 0,
    },
    include: {
      tenant: {
        select: { id: true, name: true },
      },
    },
  });

  // Fetch creator details separately (no relation in schema)
  const creator = await prisma.user.findUnique({
    where: { id: link.createdBy },
    select: { id: true, fullName: true, email: true },
  });

  return {
    ...link,
    creator,
  };
}

/**
 * Get all passwordless links for a tenant
 * 
 * @param tenantId - ID of the tenant
 * @param courseId - Optional: filter by specific course
 */
async function getPasswordlessLinks(tenantId: string, courseId?: string) {
  const where: any = { tenantId };

  if (courseId) {
    where.courseIds = { has: courseId };
  }

  const links = await prisma.passwordlessAccessLink.findMany({
    where,
    include: {
      tenant: {
        select: { id: true, name: true },
      },
      _count: {
        select: { usages: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch creator details for each link separately
  const linksWithCreators = await Promise.all(
    links.map(async (link) => {
      const creator = await prisma.user.findUnique({
        where: { id: link.createdBy },
        select: { id: true, fullName: true, email: true },
      });
      return { ...link, creator };
    })
  );

  return linksWithCreators;
}

/**
 * Get a single passwordless link by ID
 */
async function getPasswordlessLinkById(linkId: string) {
  const link = await prisma.passwordlessAccessLink.findUnique({
    where: { id: linkId },
    include: {
      tenant: {
        select: { id: true, name: true },
      },
      usages: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { usedAt: 'desc' },
      },
    },
  });

  if (!link) {
    throw new Error('Passwordless link not found');
  }

  // Fetch creator details separately
  const creator = await prisma.user.findUnique({
    where: { id: link.createdBy },
    select: { id: true, fullName: true, email: true },
  });

  return {
    ...link,
    creator,
  };
}

/**
 * Validate a passwordless token (public endpoint, used before registration)
 * 
 * @param token - The passwordless link token
 * @returns Link details and associated courses
 */
async function validatePasswordlessToken(token: string) {
  const link = await prisma.passwordlessAccessLink.findUnique({
    where: { token },
  });

  if (!link) {
    throw new Error('Invalid or expired link');
  }

  if (!link.isActive) {
    throw new Error('This link has been deactivated');
  }

  // Check if expired
  if (link.expiresAt && new Date() > link.expiresAt) {
    throw new Error('This link has expired');
  }

  // Check if usage limit reached
  if (link.maxUses && link.usedCount >= link.maxUses) {
    throw new Error('This link has reached its maximum usage limit');
  }

  // Fetch tenant details
  const tenant = await prisma.tenant.findUnique({
    where: { id: link.tenantId },
    select: { id: true, name: true },
  });

  // Fetch course details
  const courses = await prisma.course.findMany({
    where: {
      id: { in: link.courseIds },
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });

  return {
    linkId: link.id,
    linkName: link.name,
    organization: link.organization,
    tenant,
    courses,
  };
}

/**
 * Register a new user via passwordless link and enroll them in courses
 * 
 * @param data - Registration data
 * @param ipAddress - IP address of the registrant
 * @returns Created user and enrollments
 */
async function registerViaPasswordlessLink(data: PasswordlessRegistrationData, ipAddress?: string) {
  // Validate the token first
  const linkInfo = await validatePasswordlessToken(data.token);

  // Get the full link details
  const link = await prisma.passwordlessAccessLink.findUnique({
    where: { token: data.token },
  });

  if (!link) {
    throw new Error('Link not found');
  }

  const email = data.email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      tenantId: link.tenantId,
    },
  });

  if (existingUser) {
    throw new Error('An account with this email already exists. Please use the login page.');
  }

  // Create user with passwordless auth method (no password)
  const user = await prisma.user.create({
    data: {
      tenantId: link.tenantId,
      email,
      fullName: data.fullName.trim(),
      role: 'learner',
      authMethod: 'passwordless',
      organization: data.organization?.trim() || link.organization,
      // No password field for passwordless users
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      authMethod: true,
      organization: true,
      tenantId: true,
    },
  });

  // Enroll user in all courses from the link
  const enrollmentPromises = link.courseIds.map((courseId) =>
    prisma.enrollment.create({
      data: {
        userId: user.id,
        tenantId: link.tenantId,
        courseId,
      },
    })
  );

  const enrollments = await Promise.all(enrollmentPromises);

  // Record usage
  await prisma.$transaction([
    prisma.passwordlessAccessUsage.create({
      data: {
        passwordlessAccessLinkId: link.id,
        userId: user.id,
        ipAddress,
      },
    }),
    prisma.passwordlessAccessLink.update({
      where: { id: link.id },
      data: { usedCount: { increment: 1 } },
    }),
  ]);

  console.log(`[Passwordless Access] User ${user.email} registered via link ${link.name}, enrolled in ${enrollments.length} courses`);

  return {
    user,
    enrollments,
    courses: linkInfo.courses,
  };
}

/**
 * Update a passwordless link
 */
async function updatePasswordlessLink(linkId: string, data: UpdatePasswordlessLinkData) {
  const link = await prisma.passwordlessAccessLink.findUnique({
    where: { id: linkId },
  });

  if (!link) {
    throw new Error('Passwordless link not found');
  }

  const updated = await prisma.passwordlessAccessLink.update({
    where: { id: linkId },
    data: {
      name: data.name,
      organization: data.organization,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt,
      isActive: data.isActive,
    },
    include: {
      tenant: {
        select: { id: true, name: true },
      },
    },
  });

  // Fetch creator details separately
  const creator = await prisma.user.findUnique({
    where: { id: updated.createdBy },
    select: { id: true, fullName: true, email: true },
  });

  return {
    ...updated,
    creator,
  };
}

/**
 * Toggle a passwordless link's active status
 */
async function togglePasswordlessLink(linkId: string) {
  const link = await prisma.passwordlessAccessLink.findUnique({
    where: { id: linkId },
  });

  if (!link) {
    throw new Error('Passwordless link not found');
  }

  const updated = await prisma.passwordlessAccessLink.update({
    where: { id: linkId },
    data: { isActive: !link.isActive },
  });

  return updated;
}

/**
 * Delete a passwordless link
 */
async function deletePasswordlessLink(linkId: string) {
  const link = await prisma.passwordlessAccessLink.findUnique({
    where: { id: linkId },
  });

  if (!link) {
    throw new Error('Passwordless link not found');
  }

  // Delete the link (cascade will handle usages)
  await prisma.passwordlessAccessLink.delete({
    where: { id: linkId },
  });

  return { success: true, message: 'Passwordless link deleted' };
}

export default {
  createPasswordlessLink,
  getPasswordlessLinks,
  getPasswordlessLinkById,
  validatePasswordlessToken,
  registerViaPasswordlessLink,
  updatePasswordlessLink,
  togglePasswordlessLink,
  deletePasswordlessLink,
};
