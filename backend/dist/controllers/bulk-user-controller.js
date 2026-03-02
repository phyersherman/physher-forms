"use strict";
/**
 * Bulk User Controller
 * Handles HTTP requests for bulk user operations
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
exports.importUsersFromCSV = importUsersFromCSV;
exports.bulkCreateUsers = bulkCreateUsers;
exports.getBulkImportJobs = getBulkImportJobs;
exports.getBulkImportJob = getBulkImportJob;
const bulkUserService = __importStar(require("../services/bulk-user-service"));
/**
 * POST /api/tenants/:tenantId/users/import-csv
 * Import users from CSV file
 * Requires: admin role
 */
async function importUsersFromCSV(req, res) {
    try {
        const tenantId = Array.isArray(req.params.tenantId)
            ? req.params.tenantId[0]
            : req.params.tenantId;
        const { csvContent, sendInvites, fileName } = req.body;
        if (!csvContent || typeof csvContent !== 'string') {
            return res.status(400).json({
                error: 'CSV content is required'
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
        const result = await bulkUserService.importUsersFromCSV(tenantId, csvContent, sendInvites === true, req.user.id, fileName);
        res.json(result);
    }
    catch (error) {
        console.error('Error importing users from CSV:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to import users'
        });
    }
}
/**
 * POST /api/tenants/:tenantId/users/bulk-create
 * Create multiple users from array of user data
 * Requires: admin role
 */
async function bulkCreateUsers(req, res) {
    try {
        const tenantId = Array.isArray(req.params.tenantId)
            ? req.params.tenantId[0]
            : req.params.tenantId;
        const { users, sendInvites } = req.body;
        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                error: 'Users array is required'
            });
        }
        if (users.length > 500) {
            return res.status(400).json({
                error: 'Maximum 500 users per request'
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
        const result = await bulkUserService.createUsersInBulk(tenantId, users, sendInvites === true, req.user.id);
        res.json(result);
    }
    catch (error) {
        console.error('Error creating users in bulk:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create users'
        });
    }
}
/**
 * GET /api/tenants/:tenantId/bulk-imports
 * List all bulk import jobs for a tenant
 * Requires: admin role
 */
async function getBulkImportJobs(req, res) {
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
        const jobs = await bulkUserService.getBulkImportJobs(tenantId);
        res.json(jobs);
    }
    catch (error) {
        console.error('Error fetching bulk import jobs:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch import jobs'
        });
    }
}
/**
 * GET /api/bulk-imports/:jobId
 * Get details of a specific bulk import job
 * Requires: admin role
 */
async function getBulkImportJob(req, res) {
    try {
        const jobId = Array.isArray(req.params.jobId)
            ? req.params.jobId[0]
            : req.params.jobId;
        const job = await bulkUserService.getBulkImportJob(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Import job not found' });
        }
        // Authorization: global admin or tenant admin
        const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin';
        const isTenantAdmin = req.user?.tenantId === job.tenantId && req.user?.role === 'admin';
        if (!isGlobalAdmin && !isTenantAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        res.json(job);
    }
    catch (error) {
        console.error('Error fetching bulk import job:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch import job'
        });
    }
}
exports.default = {
    importUsersFromCSV,
    bulkCreateUsers,
    getBulkImportJobs,
    getBulkImportJob
};
