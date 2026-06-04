/**
 * Admin Completion Controller
 *
 * Admin-only endpoints for viewing and managing form completion records.
 *
 *   GET    /api/admin/completions          – paginated completion log
 *   GET    /api/admin/completions/export   – CSV download
 *   DELETE /api/admin/completions/:id      – reset (remove) a single completion
 */

import { Request, Response } from 'express'
import prisma from '../db/client'

export async function listCompletions(req: Request, res: Response) {
  try {
    const tenantId = req.user?.tenantId
    if (!tenantId) return res.status(400).json({ error: 'Tenant required' })

    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50)
    const skip = (page - 1) * limit

    const [completions, total] = await Promise.all([
      prisma.formCompletion.findMany({
        where: { form: { tenantId } },
        include: { form: { select: { id: true, name: true } } },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.formCompletion.count({
        where: { form: { tenantId } },
      }),
    ])

    return res.json({
      data: completions.map((c) => ({
        id: c.id,
        displayHint: c.displayHint,
        formId: c.formId,
        formName: c.form.name,
        completedAt: c.completedAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (e: any) {
    console.error('[AdminCompletionController] listCompletions:', e.message)
    return res.status(500).json({ error: 'Failed to load completions' })
  }
}

export async function exportCompletionsCSV(req: Request, res: Response) {
  try {
    const tenantId = req.user?.tenantId
    if (!tenantId) return res.status(400).json({ error: 'Tenant required' })

    const completions = await prisma.formCompletion.findMany({
      where: { form: { tenantId } },
      include: { form: { select: { name: true } } },
      orderBy: { completedAt: 'desc' },
    })

    const header = 'email,form_name,completed_at\n'
    const rows = completions
      .map(
        (c) =>
          `"${c.displayHint}","${c.form.name.replace(/"/g, '""')}","${c.completedAt.toISOString()}"`
      )
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="completions-${new Date().toISOString().split('T')[0]}.csv"`
    )
    return res.send(header + rows)
  } catch (e: any) {
    console.error('[AdminCompletionController] exportCSV:', e.message)
    return res.status(500).json({ error: 'Failed to export completions' })
  }
}

export async function resetCompletion(req: Request, res: Response) {
  try {
    const tenantId = req.user?.tenantId
    if (!tenantId) return res.status(400).json({ error: 'Tenant required' })

    // Verify completion belongs to this tenant before deleting
    const completion = await prisma.formCompletion.findFirst({
      where: {
        id: req.params.id as string,
        form: { tenantId },
      },
    })

    if (!completion) {
      return res.status(404).json({ error: 'Completion record not found' })
    }

    await prisma.formCompletion.delete({ where: { id: req.params.id as string } })
    return res.status(204).send()
  } catch (e: any) {
    console.error('[AdminCompletionController] resetCompletion:', e.message)
    return res.status(500).json({ error: 'Failed to reset completion' })
  }
}
