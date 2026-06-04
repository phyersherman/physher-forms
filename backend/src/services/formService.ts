/**
 * Form Service (Admin)
 * CRUD operations for forms, scoped by tenantId.
 */

import prisma from '../db/client'

export interface CreateFormInput {
  tenantId: string
  name: string
  description?: string
  jotformEmbedUrl: string
  isActive?: boolean
}

export interface UpdateFormInput {
  name?: string
  description?: string
  jotformEmbedUrl?: string
  isActive?: boolean
}

export async function createForm(input: CreateFormInput) {
  // Basic URL safety: ensure jotformEmbedUrl is a valid https URL
  validateJotformUrl(input.jotformEmbedUrl)

  return prisma.form.create({
    data: {
      tenantId: input.tenantId,
      name: input.name.trim(),
      description: input.description?.trim(),
      jotformEmbedUrl: input.jotformEmbedUrl.trim(),
      isActive: input.isActive ?? true,
    },
  })
}

export async function listForms(tenantId: string) {
  return prisma.form.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getForm(id: string, tenantId: string) {
  return prisma.form.findFirst({
    where: { id, tenantId },
  })
}

export async function updateForm(id: string, tenantId: string, input: UpdateFormInput) {
  if (input.jotformEmbedUrl) {
    validateJotformUrl(input.jotformEmbedUrl)
  }

  return prisma.form.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.jotformEmbedUrl !== undefined && { jotformEmbedUrl: input.jotformEmbedUrl.trim() }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  })
}

export async function deleteForm(id: string, tenantId: string) {
  // Verify ownership before delete
  const form = await prisma.form.findFirst({ where: { id, tenantId } })
  if (!form) throw new Error('Form not found')

  return prisma.form.delete({ where: { id } })
}

/**
 * Ensure the embed URL is an https URL (basic security guard:
 * prevents javascript: or data: URLs from being stored).
 */
function validateJotformUrl(url: string): void {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      throw new Error('JotForm embed URL must use HTTPS')
    }
  } catch (e: any) {
    if (e.message?.includes('HTTPS')) throw e
    throw new Error('JotForm embed URL is not a valid URL')
  }
}
