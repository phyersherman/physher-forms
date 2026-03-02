"use strict";
/**
 * Registration Link Service
 * Handles registration link creation, validation, and usage tracking
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistrationLink = createRegistrationLink;
exports.getRegistrationLinks = getRegistrationLinks;
exports.getRegistrationLink = getRegistrationLink;
exports.validateToken = validateToken;
exports.useRegistrationLink = useRegistrationLink;
exports.updateRegistrationLink = updateRegistrationLink;
exports.toggleRegistrationLink = toggleRegistrationLink;
exports.deleteRegistrationLink = deleteRegistrationLink;
const client_1 = __importDefault(require("../db/client"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a cryptographically random URL-safe token
 */
function generateToken() {
    return crypto_1.default.randomBytes(32).toString('base64url');
}
/**
 * Create a new registration link
 */
async function createRegistrationLink(data) {
    // Generate unique token
    let token = generateToken();
    let attempts = 0;
    const maxAttempts = 10;
    // Ensure uniqueness
    while (attempts < maxAttempts) {
        const existing = await client_1.default.registrationLink.findUnique({
            where: { token }
        });
        if (!existing)
            break;
        token = generateToken();
        attempts++;
    }
    if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique registration token');
    }
    // Create registration link
    const registrationLink = await client_1.default.registrationLink.create({
        data: {
            tenantId: data.tenantId,
            courseIds: data.courseIds,
            token,
            name: data.name,
            maxUses: data.maxUses,
            expiresAt: data.expiresAt,
            createdBy: data.createdBy,
            isActive: true,
            usedCount: 0
        }
    });
    return registrationLink;
}
/**
 * Get all registration links for a tenant
 */
async function getRegistrationLinks(tenantId) {
    const links = await client_1.default.registrationLink.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }
    });
    return links;
}
/**
 * Get a single registration link with usage details
 */
async function getRegistrationLink(id) {
    const link = await client_1.default.registrationLink.findUnique({
        where: { id },
        include: {
            usages: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true
                        }
                    }
                },
                orderBy: { usedAt: 'desc' }
            }
        }
    });
    return link;
}
/**
 * Validate a registration token
 * Returns validation result with course and tenant info if valid
 */
async function validateToken(token) {
    const registrationLink = await client_1.default.registrationLink.findUnique({
        where: { token }
    });
    if (!registrationLink) {
        return {
            valid: false,
            error: 'Invalid registration link'
        };
    }
    if (!registrationLink.isActive) {
        return {
            valid: false,
            error: 'This registration link has been deactivated'
        };
    }
    if (registrationLink.expiresAt && registrationLink.expiresAt < new Date()) {
        return {
            valid: false,
            error: 'This registration link has expired'
        };
    }
    if (registrationLink.maxUses !== null &&
        registrationLink.usedCount >= registrationLink.maxUses) {
        return {
            valid: false,
            error: 'This registration link has reached its maximum usage limit'
        };
    }
    // Fetch course details
    const courses = await client_1.default.course.findMany({
        where: {
            id: { in: registrationLink.courseIds }
        },
        select: {
            id: true,
            title: true,
            description: true
        }
    });
    // Fetch tenant info
    const tenant = await client_1.default.tenant.findUnique({
        where: { id: registrationLink.tenantId },
        select: {
            id: true,
            name: true
        }
    });
    if (!tenant) {
        return {
            valid: false,
            error: 'Tenant not found'
        };
    }
    return {
        valid: true,
        registrationLink,
        courseDetails: courses,
        tenantInfo: tenant
    };
}
/**
 * Record usage of a registration link
 */
async function useRegistrationLink(token, userId, ipAddress) {
    const registrationLink = await client_1.default.registrationLink.findUnique({
        where: { token }
    });
    if (!registrationLink) {
        throw new Error('Registration link not found');
    }
    // Check if user has already used this link
    const existingUsage = await client_1.default.registrationLinkUsage.findUnique({
        where: {
            registrationLinkId_userId: {
                registrationLinkId: registrationLink.id,
                userId
            }
        }
    });
    if (existingUsage) {
        // Already recorded, don't increment count again
        return;
    }
    // Record usage and increment counter
    await client_1.default.$transaction([
        client_1.default.registrationLinkUsage.create({
            data: {
                registrationLinkId: registrationLink.id,
                userId,
                ipAddress
            }
        }),
        client_1.default.registrationLink.update({
            where: { id: registrationLink.id },
            data: {
                usedCount: {
                    increment: 1
                }
            }
        })
    ]);
}
/**
 * Update a registration link
 */
async function updateRegistrationLink(id, data) {
    const link = await client_1.default.registrationLink.update({
        where: { id },
        data: {
            name: data.name,
            courseIds: data.courseIds,
            maxUses: data.maxUses,
            expiresAt: data.expiresAt,
            isActive: data.isActive
        }
    });
    return link;
}
/**
 * Toggle registration link active status
 */
async function toggleRegistrationLink(id) {
    const link = await client_1.default.registrationLink.findUnique({
        where: { id }
    });
    if (!link) {
        throw new Error('Registration link not found');
    }
    const updated = await client_1.default.registrationLink.update({
        where: { id },
        data: {
            isActive: !link.isActive
        }
    });
    return updated;
}
/**
 * Delete a registration link
 */
async function deleteRegistrationLink(id) {
    await client_1.default.registrationLink.delete({
        where: { id }
    });
}
exports.default = {
    createRegistrationLink,
    getRegistrationLinks,
    getRegistrationLink,
    validateToken,
    useRegistrationLink,
    updateRegistrationLink,
    toggleRegistrationLink,
    deleteRegistrationLink
};
