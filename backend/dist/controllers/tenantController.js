"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tenantService_1 = __importDefault(require("../services/tenantService"));
const listTenants = async (_req, res) => {
    const tenants = await tenantService_1.default.list();
    res.json(tenants);
};
const getTenant = async (req, res) => {
    const t = await tenantService_1.default.getById(req.params.id);
    if (!t)
        return res.status(404).json({ error: 'not found' });
    res.json(t);
};
const createTenant = async (req, res) => {
    const { name, defaultLocale, theme, domains } = req.body;
    if (!name)
        return res.status(400).json({ error: 'name required' });
    const t = await tenantService_1.default.create({ name, defaultLocale, theme, domains });
    res.status(201).json(t);
};
const updateTenant = async (req, res) => {
    const { name, defaultLocale, theme, domains } = req.body;
    const t = await tenantService_1.default.update(req.params.id, { name, defaultLocale, theme, domains });
    if (!t)
        return res.status(404).json({ error: 'not found' });
    res.json(t);
};
const deleteTenant = async (req, res) => {
    const deleted = await tenantService_1.default.delete(req.params.id);
    if (!deleted)
        return res.status(404).json({ error: 'not found' });
    res.status(200).json({ success: true });
};
exports.default = { listTenants, getTenant, createTenant, updateTenant, deleteTenant };
