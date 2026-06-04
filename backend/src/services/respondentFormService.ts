/**
 * Respondent Form Service
 *
 * Business logic for the respondent-facing form endpoints.
 * Uses email hashes for all completion lookups — never stores plaintext email.
 */

import prisma from '../db/client'
import { hashEmail, maskEmail } from './respondentAuthService'

export interface FormWithStatus {
  id: string
  name: string
  description: string | null
  isActive: boolean
  completed: boolean
}

/**
 * Return all active forms for a tenant, annotated with completion status
 * for the given respondent (identified by email hash).
 */
export async function getFormsWithStatus(
  email: string,
  tenantId: string
): Promise<FormWithStatus[]> {
  const emailHash = hashEmail(email)

  const forms = await prisma.form.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: 'asc' },
    include: {
      completions: {
        where: { emailHash },
        select: { id: true },
      },
    },
  })

  return forms.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    isActive: f.isActive,
    completed: f.completions.length > 0,
  }))
}

/**
 * Return a single form's details (including embed URL) for display.
 * Throws if already completed or not active.
 */
export async function getFormForRespondent(
  formId: string,
  email: string,
  tenantId: string
) {
  const emailHash = hashEmail(email)

  const form = await prisma.form.findFirst({
    where: { id: formId, tenantId, isActive: true },
  })

  if (!form) throw new Error('Form not found')

  const alreadyCompleted = await prisma.formCompletion.findFirst({
    where: { formId, emailHash },
  })

  if (alreadyCompleted) {
    throw new Error('You have already completed this form')
  }

  return form
}

/**
 * Record that a respondent has completed a form.
 * Uses email hash + masked display hint.
 * Idempotent: does nothing if already recorded.
 */
export async function recordCompletion(
  email: string,
  formId: string,
  tenantId: string
): Promise<void> {
  // Verify form belongs to tenant and is active
  const form = await prisma.form.findFirst({
    where: { id: formId, tenantId },
  })
  if (!form) throw new Error('Form not found')

  const emailHash = hashEmail(email)
  const displayHint = maskEmail(email)

  try {
    await prisma.formCompletion.create({
      data: {
        emailHash,
        displayHint,
        formId,
      },
    })
  } catch (e: any) {
    // Unique constraint violation = already completed; treat as success
    if (e.code === 'P2002') return
    throw e
  }
}
