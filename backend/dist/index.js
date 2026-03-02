"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const tenantResolver_1 = require("./middleware/tenantResolver");
const csurf_1 = __importDefault(require("csurf"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// CORS: allow one or more frontend origins (configurable)
// Set FRONTEND_ORIGINS to a comma-separated list like: http://localhost:3000,http://127.0.0.1:3000
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (e.g., curl, mobile clients)
        if (!origin)
            return callback(null, true);
        if (FRONTEND_ORIGINS.includes(origin))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
console.log('Allowed frontend origins:', FRONTEND_ORIGINS);
app.use((0, cookie_parser_1.default)());
// CSRF protection using double-submit cookie via `csurf`.
// We'll expose a `/api/csrf-token` endpoint that returns a token the client should send
// in the `X-CSRF-Token` header for state-changing requests.
const csrfMiddleware = (0, csurf_1.default)({ cookie: { httpOnly: false, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' } });
// Route to fetch CSRF token (unprotected so client can obtain a token before auth)
app.get('/api/csrf-token', csrfMiddleware, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
// Apply CSRF protection to non-auth POST/PUT/DELETE endpoints. We skip login/register so users
// can obtain a token and login without being blocked on first request.
// Also skip public endpoints which should be accessible without CSRF.
app.use((req, res, next) => {
    const isAuthPath = req.path.startsWith('/api/auth');
    const isPublicPath = req.path.startsWith('/api/public/');
    const isSafeMethod = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
    if (isSafeMethod || isAuthPath || isPublicPath)
        return next();
    return csrfMiddleware(req, res, next);
});
// If running behind a proxy/load-balancer, enable trust proxy for proper host resolution
app.set('trust proxy', 1);
// multi-tenant resolver middleware: sets req.tenantId
app.use(tenantResolver_1.tenantResolver);
app.use('/api', routes_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`LMS backend listening on port ${PORT}`);
});
