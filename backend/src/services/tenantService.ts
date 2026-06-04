import { Tenant } from '../models/entities'
import prisma from '../db/client'

// If DATABASE_URL is not provided or Prisma not set up yet, fall back to in-memory
const _tenants: Tenant[] = [
  {
    id: 'tenant_1',
    name: 'Acme Corp',
    defaultLocale: 'en',
    theme: { primaryColor: '#0ea5a4', logoUrl: '' },
    domains: [{ id: 'd1', host: 'acme.local', isPrimary: true }]
  }
]

const list = async (): Promise<Tenant[]> => {
  if (!process.env.DATABASE_URL) return _tenants
  return prisma.tenant.findMany({ include: { domains: true } }) as unknown as Tenant[]
}

const getById = async (id: string): Promise<Tenant | undefined> => {
  if (!process.env.DATABASE_URL) return _tenants.find(t => t.id === id)
  const tenant = await prisma.tenant.findUnique({ where: { id }, include: { domains: true } })
  return tenant || undefined
}

const getByHost = async (host: string): Promise<Tenant | undefined> => {
  if (!process.env.DATABASE_URL) return _tenants.find(t => t.domains.some(d => d.host === host))
  const domain = await prisma.domain.findUnique({ where: { host }, include: { tenant: true } })
  if (!domain) return undefined
  const tenant = await prisma.tenant.findUnique({ where: { id: domain.tenantId }, include: { domains: true } })
  return tenant as unknown as Tenant | undefined
}

const create = async (data: { name: string; defaultLocale?: string; theme?: any; domains?: { host: string; isPrimary?: boolean }[] }) => {
  if (!process.env.DATABASE_URL) {
    const t: Tenant = {
      id: `tenant_${Date.now()}`,
      name: data.name,
      defaultLocale: data.defaultLocale || 'en',
      theme: data.theme || { primaryColor: '#0ea5a4', logoUrl: '' },
      domains: (data.domains || []).map((d, i) => ({ id: `d_${Date.now()}_${i}`, host: d.host, isPrimary: !!d.isPrimary }))
    }
    _tenants.push(t)
    return t
  }

  // create tenant with optional domains
  const domainData = data.domains ? data.domains.map((d: any) => ({
    host: typeof d === 'string' ? d : d.host,
    isPrimary: typeof d === 'string' ? false : !!d.isPrimary
  })) : []
  
  const tenant = await prisma.tenant.create({
    data: {
      name: data.name,
      defaultLocale: data.defaultLocale || 'en',
      primaryColor: data.theme?.primaryColor,
      secondaryColor: data.theme?.secondaryColor,
      logoUrl: data.theme?.logoUrl,
      domains: domainData.length > 0 ? { create: domainData } : undefined
    },
    include: { domains: true }
  })
  return tenant as unknown as Tenant
}

const update = async (id: string, data: { name?: string; defaultLocale?: string; theme?: any; domains?: { host: string; isPrimary?: boolean }[]; allowedDomains?: string[] }) => {
  if (!process.env.DATABASE_URL) {
    const tenant = _tenants.find(t => t.id === id)
    if (!tenant) return undefined
    if (data.name) tenant.name = data.name
    if (data.defaultLocale) tenant.defaultLocale = data.defaultLocale
    if (data.theme) tenant.theme = data.theme
    return tenant
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      name: data.name,
      defaultLocale: data.defaultLocale,
      primaryColor: data.theme?.primaryColor,
      secondaryColor: data.theme?.secondaryColor,
      logoUrl: data.theme?.logoUrl,
      ...(data.allowedDomains !== undefined && { allowedDomains: data.allowedDomains }),
    },
    include: { domains: true }
  })
  return tenant as unknown as Tenant
}

const deleteTenant = async (id: string) => {
  if (!process.env.DATABASE_URL) {
    const index = _tenants.findIndex(t => t.id === id)
    if (index === -1) return false
    _tenants.splice(index, 1)
    return true
  }

  const result = await prisma.tenant.delete({ where: { id } })
  return !!result
}

export default { list, getById, getByHost, create, update, delete: deleteTenant }
