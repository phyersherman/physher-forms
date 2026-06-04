/**
 * Admin Form Controller
 *
 * Admin-only CRUD endpoints for managing forms.
 * All endpoints require admin authentication (enforced in router).
 *
 *   GET    /api/admin/forms
 *   POST   /api/admin/forms
 *   GET    /api/admin/forms/:id
 *   PUT    /api/admin/forms/:id
 *   DELETE /api/admin/forms/:id
 */

import { Request, Response } from 'express'
import * as formService from '../services/formService'

export async function listForms(req: Request, res: Response) {
  try {
    const tenantId = req.user?.tenantId || (req.params.tenantId as string)
    if (!tenantId) return res.status(400).json({ error: 'Tenant required' })

    const forms = await formService.listForms(tenantId)
    return res.json(forms)
  } catch (e: any) {
    console.error('[FormController] listForms:', e.message)
    return res.status(500).json({ error: 'Failed to list forms' })
  }
}

export async function createForm(req: Request, res: Response) {
  try {
    const tenantId = req.user?.tenantId || (req.body.tenantId as string)
    if (!tenantId) return res.status(400).json({ error: 'Tenant required' })

    const { name, description, jotformEmbedUrl, isActive } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })
    if (!jotformEmbedUrl) return res.status(400).json({ error: 'jotformEmbedUrl is required' })

    const form = await formService.createForm({
      tenantId,
      name,
      description,
      jotformEmbedUrl,
      isActive,
    })
    return res.status(201).json(form)
  } catch (e: any) {
    console.error('[FormController] createForm:', e.message)
    return res.status(400).json({ error: e.message || 'Failed to create form' })
  }
}

export async function getForm(req: Request, res: Response) {
  try {
    const tenantId = req.user?.tenantId as string
    if (!tenantId) return res.status(400).json({ error: 'Tenant required' })

    const form = await formService.getForm(req.params.id as string, tenantId)
    if (!form) return res.status(404).json({ error: 'Form not found' })
    return res.json(form)
  } catch (e: any) {
    console.error('[FormController] getForm:', e.message)
    return res.status(500).json({ error: 'Failed to get form' })
  }
}

export async function updateForm(req: Request, res: Response) {
  try {
    const tenantId = req.user?.tenantId as string
    if (!tenantId) return res.status(400).json({ error: 'Tenant required' })

    const { name, description, jotformEmbedUrl, isActive } = req.body
    const form = await formService.updateForm(req.params.id as string, tenantId, {
      name,
      description,
      jotformEmbedUrl,
      isActive,
    })
    return res.json(form)
  } catch (e: any) {
    console.error('[FormController] updateForm:', e.message)
    return res.status(400).json({ error: e.message || 'Failed to update form' })
  }
}

export async function deleteForm(req: Request, res: Response) {
  try {
    const tenantId = req.user?.tenantId as string
    if (!tenantId) return res.status(400).json({ error: 'Tenant required' })

    await formService.deleteForm(req.params.id as string, tenantId)
    return res.status(204).send()
  } catch (e: any) {
    console.error('[FormController] deleteForm:', e.message)
    return res.status(400).json({ error: e.message || 'Failed to delete form' })
  }
}
