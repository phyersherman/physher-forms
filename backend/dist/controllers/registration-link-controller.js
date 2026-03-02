"use strict";
/**
 * Registration Link Controller
 * Handles HTTP requests for registration link operations
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
exports.createRegistrationLink = createRegistrationLink;
exports.getRegistrationLinks = getRegistrationLinks;
exports.getRegistrationLink = getRegistrationLink;
exports.updateRegistrationLink = updateRegistrationLink;
exports.deleteRegistrationLink = deleteRegistrationLink;
exports.toggleRegistrationLink = toggleRegistrationLink;
exports.validateRegistrationToken = validateRegistrationToken;
exports.registerViaLink = registerViaLink;
const registrationLinkService = __importStar(require("../services/registration-link-service"));
const authService_1 = __importDefault(require("../services/authService"));
const enrollmentService = __importStar(require("../services/enrollmentService"));
const client_1 = __importDefault(require("../db/client"));
/**
 * POST /api/tenants/:tenantId/registration-links
 * Create a new registration link
 * Requires: admin role
 */
async function createRegistrationLink(req, res) {
    try {
        const tenantId = Array.isArray(req.params.tenantId)
            ? req.params.tenantId[0]
            : req.params.tenantId;
        const { courseIds, name, maxUses, expiresAt } = req.body;
        if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({
                error: 'At least one course ID is required'
            });
        }
        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                error: 'Link name is required'
            });
        }
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        if (!req.user?.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const link = await registrationLinkService.createRegistrationLink({
            tenantId,
            courseIds,
            name,
            maxUses: maxUses ? parseInt(maxUses) : null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: req.user.id
        });
        res.json(link);
    }
    catch (error) {
        console.error('Error creating registration link:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create registration link'
        });
    }
}
/**
 * GET /api/tenants/:tenantId/registration-links
 * List all registration links for a tenant
 * Requires: admin role
 */
async function getRegistrationLinks(req, res) {
    try {
        const tenantId = Array.isArray(req.params.tenantId)
            ? req.params.tenantId[0]
            : req.params.tenantId;
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const links = await registrationLinkService.getRegistrationLinks(tenantId);
        res.json(links);
    }
    catch (error) {
        console.error('Error fetching registration links:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch registration links'
        });
    }
}
/**
 * GET /api/registration-links/:id
 * Get registration link details with usage stats
 * Requires: admin role
 */
async function getRegistrationLink(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const link = await registrationLinkService.getRegistrationLink(id);
        if (!link) {
            return res.status(404).json({ error: 'Registration link not found' });
        }
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === link.tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        res.json(link);
    }
    catch (error) {
        console.error('Error fetching registration link:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch registration link'
        });
    }
}
/**
 * PUT /api/registration-links/:id
 * Update a registration link
 * Requires: admin role
 */
async function updateRegistrationLink(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const existingLink = await registrationLinkService.getRegistrationLink(id);
        if (!existingLink) {
            return res.status(404).json({ error: 'Registration link not found' });
        }
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === existingLink.tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const { name, courseIds, maxUses, expiresAt, isActive } = req.body;
        const updatedLink = await registrationLinkService.updateRegistrationLink(id, {
            name,
            courseIds,
            maxUses: maxUses !== undefined ? (maxUses ? parseInt(maxUses) : null) : undefined,
            expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
            isActive
        });
        res.json(updatedLink);
    }
    catch (error) {
        console.error('Error updating registration link:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update registration link'
        });
    }
}
/**
 * DELETE /api/registration-links/:id
 * Delete a registration link
 * Requires: admin role
 */
async function deleteRegistrationLink(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const link = await registrationLinkService.getRegistrationLink(id);
        if (!link) {
            return res.status(404).json({ error: 'Registration link not found' });
        }
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === link.tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        await registrationLinkService.deleteRegistrationLink(id);
        res.json({ message: 'Registration link deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting registration link:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete registration link'
        });
    }
}
/**
 * POST /api/registration-links/:id/toggle
 * Toggle registration link active status
 * Requires: admin role
 */
async function toggleRegistrationLink(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const link = await registrationLinkService.getRegistrationLink(id);
        if (!link) {
            return res.status(404).json({ error: 'Registration link not found' });
        }
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === link.tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const updatedLink = await registrationLinkService.toggleRegistrationLink(id);
        res.json(updatedLink);
    }
    catch (error) {
        console.error('Error toggling registration link:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to toggle registration link'
        });
    }
}
/**
 * GET /api/public/registration-links/validate
 * Validate a registration token (public endpoint)
 * No authentication required
 */
async function validateRegistrationToken(req, res) {
    try {
        const token = req.query.token;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        const result = await registrationLinkService.validateToken(token);
        res.json(result);
    }
    catch (error) {
        console.error('Error validating registration token:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to validate token'
        });
    }
}
/**
 * POST /api/public/registration-links/register
 * Register a new user via registration link (public endpoint)
 * No authentication required
 */
async function registerViaLink(req, res) {
    try {
        const { token, email, fullName, password } = req.body;
        if (!token || !email || !fullName || !password) {
            return res.status(400).json({
                error: 'Token, email, full name, and password are required'
            });
        }
        // Validate token
        const validation = await registrationLinkService.validateToken(token);
        if (!validation.valid || !validation.registrationLink || !validation.tenantInfo) {
            return res.status(400).json({
                error: validation.error || 'Invalid registration link'
            });
        }
        const { registrationLink, tenantInfo } = validation;
        // Check if email already exists in this tenant
        const existingUser = await client_1.default.user.findFirst({
            where: {
                email,
                tenantId: registrationLink.tenantId
            }
        });
        if (existingUser) {
            return res.status(400).json({
                error: 'An account with this email already exists'
            });
        }
        // Create user account
        const user = await authService_1.default.register(email, password, registrationLink.tenantId, fullName, 'learner');
        // Enroll user in all courses from the registration link
        for (const courseId of registrationLink.courseIds) {
            await enrollmentService.enrollUser(user.id, courseId, registrationLink.tenantId);
        }
        // Record usage
        const ipAddress = req.ip || req.connection.remoteAddress;
        await registrationLinkService.useRegistrationLink(token, user.id, ipAddress);
        // Generate auth tokens for immediate login
        const accessToken = authService_1.default.createAccessToken(user);
        const refreshTokenData = await authService_1.default.createRefreshToken(user.id);
        // Set tokens as cookies
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });
        res.cookie('refreshToken', refreshTokenData.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                tenantId: user.tenantId
            },
            accessToken,
            message: 'Account created successfully'
        });
    }
    catch (error) {
        console.error('Error registering via link:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to register'
        });
    }
}
exports.default = {
    createRegistrationLink,
    getRegistrationLinks,
    getRegistrationLink,
    updateRegistrationLink,
    deleteRegistrationLink,
    toggleRegistrationLink,
    validateRegistrationToken,
    registerViaLink
};
