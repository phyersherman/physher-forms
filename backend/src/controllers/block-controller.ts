import { Request, Response } from 'express'
import blockService from '../services/block-service'

const createBlock = async (req: Request, res: Response) => {
  const { module_id, type, content, config, order_index } = req.body
  const tenant_id = (req as any).tenantId

  if (!module_id || !type) {
    return res.status(400).json({ error: 'module_id and type required' })
  }

  if (!tenant_id) {
    return res.status(401).json({ error: 'not authenticated' })
  }

  try {
    const block = await blockService.createBlock({
      module_id,
      type,
      content,
      config,
      order_index: order_index || 0,
      tenant_id,
    })
    res.status(201).json(block)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

const getBlock = async (req: Request, res: Response) => {
  const blockId = typeof req.params.blockId === 'string' ? req.params.blockId : req.params.blockId[0]

  try {
    const block = await blockService.getBlockById(blockId)
    if (!block) return res.status(404).json({ error: 'block not found' })
    res.json(block)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

const listBlocksByModule = async (req: Request, res: Response) => {
  const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : req.params.moduleId[0]

  try {
    const blocks = await blockService.listByModule(moduleId)
    res.json(blocks)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

const updateBlock = async (req: Request, res: Response) => {
  const blockId = typeof req.params.blockId === 'string' ? req.params.blockId : req.params.blockId[0]
  const { type, content, config, order_index } = req.body

  try {
    const block = await blockService.updateBlock(blockId, {
      type,
      content,
      config,
      order_index,
    })
    res.json(block)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

const deleteBlock = async (req: Request, res: Response) => {
  const blockId = typeof req.params.blockId === 'string' ? req.params.blockId : req.params.blockId[0]

  try {
    await blockService.deleteBlock(blockId)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

const reorderBlocks = async (req: Request, res: Response) => {
  const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : req.params.moduleId[0]
  const { blocks } = req.body

  if (!Array.isArray(blocks)) {
    return res.status(400).json({ error: 'blocks must be an array' })
  }

  try {
    const updated = await blockService.reorderBlocks(moduleId, blocks)
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export default {
  createBlock,
  getBlock,
  listBlocksByModule,
  updateBlock,
  deleteBlock,
  reorderBlocks,
}
