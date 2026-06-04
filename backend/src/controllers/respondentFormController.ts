/**
 * Respondent Form Controller
 *
 * Endpoints for respondents to list and complete forms.
 * All endpoints require respondentAuthGuard (enforced in router).
 *
 *   GET  /api/respondent/forms          – list active forms with completion status
 *   GET  /api/respondent/forms/:id      – get single form (embed URL)
 *   POST /api/respondent/forms/:id/complete – record completion
 *   GET  /api/respondent/form-complete  – JotForm Thank You redirect callback
 */

import { Request, Response } from 'express'
import {
  getFormsWithStatus,
  getFormForRespondent,
  recordCompletion,
} from '../services/respondentFormService'

export async function listForms(req: Request, res: Response) {
  try {
    const email = req.respondentEmail!
    const tenantId = req.respondentTenantId!

    const forms = await getFormsWithStatus(email, tenantId)
    return res.json(forms)
  } catch (e: any) {
    console.error('[RespondentFormController] listForms:', e.message)
    return res.status(500).json({ error: 'Failed to load forms' })
  }
}

export async function getForm(req: Request, res: Response) {
  try {
    const email = req.respondentEmail!
    const tenantId = req.respondentTenantId!

    const form = await getFormForRespondent(req.params.id as string, email, tenantId)
    return res.json(form)
  } catch (e: any) {
    console.error('[RespondentFormController] getForm:', e.message)
    if (e.message?.includes('already completed')) {
      return res.status(403).json({ error: e.message })
    }
    return res.status(404).json({ error: e.message || 'Form not found' })
  }
}

export async function completeForm(req: Request, res: Response) {
  try {
    const email = req.respondentEmail!
    const tenantId = req.respondentTenantId!

    await recordCompletion(email, req.params.id as string, tenantId)
    return res.json({ message: 'Form completion recorded' })
  } catch (e: any) {
    console.error('[RespondentFormController] completeForm:', e.message)
    return res.status(400).json({ error: e.message || 'Failed to record completion' })
  }
}

/**
 * GET /api/respondent/form-complete?form_id=xxx
 *
 * Alternative completion path: JotForm Thank You page redirects here.
 * Records completion then redirects the user back to the forms list.
 * No auth cookie required (the form_id is sufficient + this is a GET redirect).
 * We do check the respondent cookie here too.
 */
export async function formCompleteCallback(req: Request, res: Response) {
  try {
    const { form_id } = req.query
    const email = req.respondentEmail!
    const tenantId = req.respondentTenantId!

    if (typeof form_id !== 'string') {
      return res.redirect('/forms?error=missing_form_id')
    }

    await recordCompletion(email, form_id, tenantId)
    return res.redirect('/forms?success=1')
  } catch (e: any) {
    console.error('[RespondentFormController] formCompleteCallback:', e.message)
    return res.redirect('/forms?error=completion_failed')
  }
}
