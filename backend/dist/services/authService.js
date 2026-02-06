"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../db/client"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const register = async (email, password, tenantId, fullName, role = 'learner') => {
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await client_1.default.user.create({ data: { email, password: hashed, tenantId, fullName, role } });
    return user;
};
// create JWT access token (short-lived)
const createAccessToken = (user) => {
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    // short expiry for access token
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};
// create and persist refresh token (long-lived)
const createRefreshToken = async (userId, days = 30) => {
    const token = crypto_1.default.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await client_1.default.refreshToken.create({ data: { token, userId, expiresAt } });
    return { token, expiresAt };
};
const authenticate = async (email, password) => {
    const user = await client_1.default.user.findUnique({ where: { email } });
    if (!user || !user.password)
        return null;
    const ok = await bcryptjs_1.default.compare(password, user.password);
    if (!ok)
        return null;
    const accessToken = createAccessToken(user);
    const refresh = await createRefreshToken(user.id);
    return { accessToken, refresh, user };
};
const verifyToken = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return { sub: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tenantId };
    }
    catch (err) {
        return null;
    }
};
const verifyRefreshToken = async (token) => {
    const rec = await client_1.default.refreshToken.findUnique({ where: { token } });
    if (!rec)
        return null;
    if (rec.revoked)
        return null;
    if (rec.expiresAt < new Date())
        return null;
    const user = await client_1.default.user.findUnique({ where: { id: rec.userId } });
    return user;
};
const revokeRefreshToken = async (token) => {
    await client_1.default.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
};
exports.default = { register, authenticate, verifyToken, verifyRefreshToken, revokeRefreshToken, createRefreshToken, createAccessToken };
