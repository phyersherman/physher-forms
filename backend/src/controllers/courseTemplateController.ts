import { Request, Response } from 'express'
import courseTemplateService from '../services/courseTemplateService'

const createTemplate = async (req: Request, res: Response) => {
  const { title, description } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  try {
    const t = await courseTemplateService.createTemplate({ title, description })
    res.status(201).json(t)
  } catch (err) {
    console.error('[createTemplate] Error:', err)
    res.status(500).json({ error: 'Failed to create template', details: err instanceof Error ? err.message : String(err) })
  }
}

const listTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await courseTemplateService.listTemplates()
    res.json(templates)
  } catch (err) {
    res.status(500).json({ error: 'Failed to list templates' })
  }
}

const getTemplate = async (req: Request, res: Response) => {
  try {
    const t = await courseTemplateService.getTemplateById(req.params.id as string)
    if (!t) return res.status(404).json({ error: 'not found' })
    res.json(t)
  } catch (err) {
    res.status(500).json({ error: 'Failed to get template' })
  }
}

const updateTemplate = async (req: Request, res: Response) => {
  const { title, description } = req.body
  try {
    const updated = await courseTemplateService.updateTemplate(req.params.id as string, { title, description })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update template' })
  }
}

const deleteTemplate = async (req: Request, res: Response) => {
  try {
    await courseTemplateService.deleteTemplate(req.params.id as string)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete template' })
  }
}

// Template module management
const addTemplateModule = async (req: Request, res: Response) => {
  const { title, slug, summary, order } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  try {
    const module = await courseTemplateService.createTemplateModule({
      template_id: req.params.templateId as string,
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      summary: summary || null,
      order: order || 0,
    })
    res.status(201).json(module)
  } catch (err) {
    console.error('[addTemplateModule] Error:', err)
    res.status(500).json({ error: 'Failed to create template module', details: err instanceof Error ? err.message : String(err) })
  }
}

const getTemplateModule = async (req: Request, res: Response) => {
  try {
    const module = await courseTemplateService.getTemplateModuleById(req.params.moduleId as string)
    if (!module) return res.status(404).json({ error: 'module not found' })
    res.json(module)
  } catch (err) {
    res.status(500).json({ error: 'Failed to get template module' })
  }
}

const updateTemplateModule = async (req: Request, res: Response) => {
  const { title, slug, summary, order } = req.body
  try {
    const module = await courseTemplateService.updateTemplateModule(req.params.moduleId as string, {
      title,
      slug,
      summary,
      order,
    })
    res.json(module)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update template module' })
  }
}

const deleteTemplateModule = async (req: Request, res: Response) => {
  try {
    await courseTemplateService.deleteTemplateModule(req.params.moduleId as string)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete template module' })
  }
}

// Template module blocks
const addTemplateModuleBlock = async (req: Request, res: Response) => {
  const { type, content, config, order } = req.body
  if (!type) return res.status(400).json({ error: 'type required' })
  try {
    const block = await courseTemplateService.createTemplateModuleBlock({
      template_module_id: req.params.moduleId as string,
      type,
      content,
      config,
      order_index: order || 0,
    })
    res.status(201).json(block)
  } catch (err) {
    console.error('[addTemplateModuleBlock] Error:', err)
    res.status(500).json({ error: 'Failed to create block', details: err instanceof Error ? err.message : String(err) })
  }
}

const getTemplateModuleBlocks = async (req: Request, res: Response) => {
  try {
    const blocks = await courseTemplateService.listTemplateModuleBlocks(req.params.moduleId as string)
    res.json(blocks)
  } catch (err) {
    res.status(500).json({ error: 'Failed to list blocks' })
  }
}

const deleteTemplateModuleBlock = async (req: Request, res: Response) => {
  try {
    await courseTemplateService.deleteTemplateModuleBlock(req.params.blockId as string)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete block' })
  }
}

export default { 
  createTemplate, 
  listTemplates, 
  getTemplate, 
  updateTemplate, 
  deleteTemplate,
  addTemplateModule,
  getTemplateModule,
  updateTemplateModule,
  deleteTemplateModule,
  addTemplateModuleBlock,
  getTemplateModuleBlocks,
  deleteTemplateModuleBlock,
}