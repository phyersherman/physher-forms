"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../db/client"));
// If DATABASE_URL is not provided or Prisma not set up yet, fall back to in-memory
const _tenants = [
    {
        id: 'tenant_1',
        name: 'Acme Corp',
        defaultLocale: 'en',
        theme: { primaryColor: '#0ea5a4', logoUrl: '' },
        domains: [{ id: 'd1', host: 'acme.local', isPrimary: true }]
    }
];
const list = async () => {
    if (!process.env.DATABASE_URL)
        return _tenants;
    return client_1.default.tenant.findMany({ include: { domains: true } });
};
const getById = async (id) => {
    if (!process.env.DATABASE_URL)
        return _tenants.find(t => t.id === id);
    const tenant = await client_1.default.tenant.findUnique({ where: { id }, include: { domains: true } });
    return tenant || undefined;
};
const getByHost = async (host) => {
    if (!process.env.DATABASE_URL)
        return _tenants.find(t => t.domains.some(d => d.host === host));
    const domain = await client_1.default.domain.findUnique({ where: { host }, include: { tenant: true } });
    if (!domain)
        return undefined;
    const tenant = await client_1.default.tenant.findUnique({ where: { id: domain.tenantId }, include: { domains: true } });
    return tenant;
};
const create = async (data) => {
    if (!process.env.DATABASE_URL) {
        const t = {
            id: `tenant_${Date.now()}`,
            name: data.name,
            defaultLocale: data.defaultLocale || 'en',
            theme: data.theme || { primaryColor: '#0ea5a4', logoUrl: '' },
            domains: (data.domains || []).map((d, i) => ({ id: `d_${Date.now()}_${i}`, host: d.host, isPrimary: !!d.isPrimary }))
        };
        _tenants.push(t);
        return t;
    }
    // create tenant with optional domains
    const domainData = data.domains ? data.domains.map((d) => ({
        host: typeof d === 'string' ? d : d.host,
        isPrimary: typeof d === 'string' ? false : !!d.isPrimary
    })) : [];
    const tenant = await client_1.default.tenant.create({
        data: {
            name: data.name,
            defaultLocale: data.defaultLocale || 'en',
            primaryColor: data.theme?.primaryColor,
            secondaryColor: data.theme?.secondaryColor,
            logoUrl: data.theme?.logoUrl,
            domains: domainData.length > 0 ? { create: domainData } : undefined
        },
        include: { domains: true }
    });
    return tenant;
};
const update = async (id, data) => {
    if (!process.env.DATABASE_URL) {
        const tenant = _tenants.find(t => t.id === id);
        if (!tenant)
            return undefined;
        if (data.name)
            tenant.name = data.name;
        if (data.defaultLocale)
            tenant.defaultLocale = data.defaultLocale;
        if (data.theme)
            tenant.theme = data.theme;
        return tenant;
    }
    const tenant = await client_1.default.tenant.update({
        where: { id },
        data: {
            name: data.name,
            defaultLocale: data.defaultLocale,
            primaryColor: data.theme?.primaryColor,
            secondaryColor: data.theme?.secondaryColor,
            logoUrl: data.theme?.logoUrl,
            certificateSignature: data.certificateSignature
        },
        include: { domains: true }
    });
    return tenant;
};
const deleteTenant = async (id) => {
    if (!process.env.DATABASE_URL) {
        const index = _tenants.findIndex(t => t.id === id);
        if (index === -1)
            return false;
        _tenants.splice(index, 1);
        return true;
    }
    const result = await client_1.default.tenant.delete({ where: { id } });
    return !!result;
};
exports.default = { list, getById, getByHost, create, update, delete: deleteTenant };
