"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantResolver = void 0;
const tenantService_1 = __importDefault(require("../services/tenantService"));
const tenantResolver = async (req, _res, next) => {
    try {
        const host = (req.headers.host || '').split(':')[0];
        if (!host)
            return next();
        const tenant = await tenantService_1.default.getByHost(host);
        if (tenant) {
            req.tenantId = tenant.id;
            req.tenant = tenant;
        }
        return next();
    }
    catch (err) {
        return next(err);
    }
};
exports.tenantResolver = tenantResolver;
exports.default = exports.tenantResolver;
