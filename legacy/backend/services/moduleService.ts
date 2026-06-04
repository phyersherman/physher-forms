import prisma from '../db/client'

/**
 * Module Service
 * Handles all module-related operations
 */

export const createModule = async (data: {
  chapter_id: string
  title: string
  slug?: string
  summary?: string
  order_index?: number
  required?: boolean
  prerequisite_module_ids?: string[]
  requires_quiz_pass_to_continue?: boolean
  tenant_id?: string
}) => {
  return prisma.module.create({
    data: {
      chapter_id: data.chapter_id,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      order_index: data.order_index || 0,
      required: data.required !== undefined ? data.required : true,
      prerequisite_module_ids: data.prerequisite_module_ids || [],
      requires_quiz_pass_to_continue: data.requires_quiz_pass_to_continue || false,
      tenant_id: data.tenant_id || null,
    },
  })
}

export const getModuleById = async (id: string) => {
  return prisma.module.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order_index: 'asc' } } },
  })
}

export const updateModule = async (
  id: string,
  data: {
    title?: string
    slug?: string
    summary?: string
    order_index?: number
    required?: boolean
    prerequisite_module_ids?: string[]
    requires_quiz_pass_to_continue?: boolean
  }
) => {
  return prisma.module.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      order_index: data.order_index,
      required: data.required,
      prerequisite_module_ids: data.prerequisite_module_ids,
      requires_quiz_pass_to_continue: data.requires_quiz_pass_to_continue,
    },
  })
}

export const deleteModule = async (id: string) => {
  // Delete all blocks associated with this module first
  await prisma.block.deleteMany({ where: { module_id: id } })
  // Then delete the module
  return prisma.module.delete({ where: { id } })
}
