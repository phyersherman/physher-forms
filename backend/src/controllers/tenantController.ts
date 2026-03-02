import { Request, Response } from 'express'
import tenantService from '../services/tenantService'

const listTenants = async (_req: Request, res: Response) => {
  const tenants = await tenantService.list()
  res.json(tenants)
}

const getTenant = async (req: Request, res: Response) => {
  const t = await tenantService.getById(req.params.id as string)
  if (!t) return res.status(404).json({ error: 'not found' })
  res.json(t)
}

const createTenant = async (req: Request, res: Response) => {
  const { name, defaultLocale, theme, domains } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const t = await tenantService.create({ name, defaultLocale, theme, domains })
  res.status(201).json(t)
}

const updateTenant = async (req: Request, res: Response) => {
  const { name, defaultLocale, theme, domains, certificateSignature } = req.body
  const t = await tenantService.update(req.params.id as string, { name, defaultLocale, theme, domains, certificateSignature })
  if (!t) return res.status(404).json({ error: 'not found' })
  res.json(t)
}

const deleteTenant = async (req: Request, res: Response) => {
  const deleted = await tenantService.delete(req.params.id as string)
  if (!deleted) return res.status(404).json({ error: 'not found' })
  res.status(200).json({ success: true })
}

export default { listTenants, getTenant, createTenant, updateTenant, deleteTenant }
