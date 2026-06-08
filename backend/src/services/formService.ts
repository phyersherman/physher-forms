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
  const normalizedEmbed = normalizeEmbedInput(input.jotformEmbedUrl)

  return prisma.form.create({
    data: {
      tenantId: input.tenantId,
      name: input.name.trim(),
      description: input.description?.trim(),
      jotformEmbedUrl: normalizedEmbed,
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
  let normalizedEmbed: string | undefined
  if (input.jotformEmbedUrl !== undefined) {
    normalizedEmbed = normalizeEmbedInput(input.jotformEmbedUrl)
  }

  return prisma.form.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(normalizedEmbed !== undefined && { jotformEmbedUrl: normalizedEmbed }),
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
 * Accept either a direct https URL, an iframe snippet, or raw form/embed HTML.
 * Blocks dangerous protocols like javascript: and data: when URLs are present.
 */
function normalizeEmbedInput(value: string): string {
  const raw = value.trim()
  if (!raw) throw new Error('Embed input is required')

  // Raw HTML/snippet mode
  if (raw.startsWith('<')) {
    const srcMatch = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
    if (srcMatch?.[1]) {
      validateHttpsUrl(srcMatch[1])
    } else if (/javascript:|data:/i.test(raw)) {
      throw new Error('Embed HTML contains unsupported URL protocols')
    }
    return raw
  }

  // URL mode
  validateHttpsUrl(raw)
  return raw
}

function validateHttpsUrl(url: string): void {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      throw new Error('Embed URL must use HTTPS')
    }
  } catch (e: any) {
    if (e.message?.includes('HTTPS')) throw e
    throw new Error('Embed URL is not a valid URL')
  }
}
