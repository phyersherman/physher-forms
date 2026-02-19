import prisma from '../db/client'

/**
 * Block Service
 * Handles all block-related operations (lesson content blocks)
 */

export const createBlock = async (data: {
  module_id: string
  type: string
  content?: string
  config?: string
  order_index?: number
  tenant_id?: string
}) => {
  return prisma.block.create({
    data: {
      module_id: data.module_id,
      type: data.type,
      content: data.content,
      config: data.config,
      order_index: data.order_index || 0,
      tenant_id: data.tenant_id || null,
    },
  })
}

export const updateBlock = async (
  id: string,
  data: { type?: string; content?: string; config?: string; order_index?: number }
) => {
  return prisma.block.update({ where: { id }, data })
}

export const deleteBlock = async (id: string) => {
  return prisma.block.delete({ where: { id } })
}

export const listBlocksByModule = async (module_id: string) => {
  return prisma.block.findMany({
    where: { module_id },
    orderBy: { order_index: 'asc' },
  })
}

export const reorderBlocks = async (
  moduleId: string,
  blocks: Array<{ id: string; order_index: number }>
) => {
  const updates = blocks.map((block) =>
    prisma.block.update({
      where: { id: block.id },
      data: { order_index: block.order_index },
    })
  )
  return Promise.all(updates)
}
