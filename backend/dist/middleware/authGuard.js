"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const authService_1 = __importDefault(require("../services/authService"));
// Factory to create an auth middleware that optionally enforces roles
const requireAuth = (roles) => {
    return (req, res, next) => {
        // Accept token from Authorization header or HttpOnly cookie named 'token'
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer '))
            token = authHeader.split(' ')[1];
        if (!token && req.cookies && req.cookies.token)
            token = req.cookies.token;
        if (!token)
            return res.status(401).json({ error: 'missing token' });
        const payload = authService_1.default.verifyToken(token);
        if (!payload)
            return res.status(401).json({ error: 'invalid token' });
        // attach user info
        req.user = { id: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tenantId };
        // if tenant resolved from host, enforce token tenant matches request tenant
        if (req.tenantId && req.tenantId !== payload.tenantId) {
            return res.status(403).json({ error: 'token tenant mismatch' });
        }
        // enforce roles if provided
        if (roles && roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'insufficient role' });
        }
        return next();
    };
};
exports.requireAuth = requireAuth;
// default export for backward compatibility
exports.default = (0, exports.requireAuth)();
