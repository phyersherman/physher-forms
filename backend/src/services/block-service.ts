import prisma from '../db/client'

const createBlock = async (data: {
  module_id: string
  type: string
  content?: string
  config?: string
  order_index?: number
  tenant_id: string
}) => {
  return prisma.block.create({
    data: {
      module_id: data.module_id,
      type: data.type,
      content: data.content || null,
      config: data.config || null,
      order_index: data.order_index || 0,
      tenant_id: data.tenant_id,
    },
  })
}

const getBlockById = async (id: string) => {
  return prisma.block.findUnique({ where: { id } })
}

const listByModule = async (module_id: string) => {
  return prisma.block.findMany({
    where: { module_id },
    orderBy: { order_index: 'asc' },
  })
}

const updateBlock = async (id: string, data: {
  type?: string
  content?: string
  config?: string
  order_index?: number
}) => {
  return prisma.block.update({
    where: { id },
    data: {
      type: data.type,
      content: data.content,
      config: data.config,
      order_index: data.order_index,
    },
  })
}

const deleteBlock = async (id: string) => {
  return prisma.block.delete({ where: { id } })
}

const reorderBlocks = async (moduleId: string, blocks: Array<{ id: string; order_index: number }>) => {
  const updates = blocks.map(block =>
    prisma.block.update({
      where: { id: block.id },
      data: { order_index: block.order_index },
    })
  )
  return Promise.all(updates)
}

export default {
  createBlock,
  getBlockById,
  listByModule,
  updateBlock,
  deleteBlock,
  reorderBlocks,
}
