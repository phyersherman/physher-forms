/**
 * Certificate Controller
 * Handles HTTP requests for certificate operations
 */

import { Request, Response } from 'express'
import * as certificateService from '../services/certificate-service'
import prisma from '../db/client'

/**
 * POST /api/certificates/generate
 * Generate a certificate for a completed enrollment
 * Requires: admin role
 */
export async function generateCertificate(req: Request, res: Response) {
  try {
    const { enrollmentId, userId, courseId, tenantId } = req.body

    if (!enrollmentId || !userId || !courseId || !tenantId) {
      return res.status(400).json({
        error: 'Missing required fields: enrollmentId, userId, courseId, tenantId'
      })
    }

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin = req.user?.tenantId === tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const certificate = await certificateService.generateCertificate({
      enrollmentId,
      userId,
      courseId,
      tenantId
    })

    res.json(certificate)
  } catch (error) {
    console.error('Error generating certificate:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate certificate'
    })
  }
}

/**
 * GET /api/certificates/:certificateId
 * Get certificate details by ID
 * Requires: authentication (user can view their own certificates, admins can view all)
 */
export async function getCertificate(req: Request, res: Response) {
  try {
    const certificateId = Array.isArray(req.params.certificateId)
      ? req.params.certificateId[0]
      : req.params.certificateId

    if (!certificateId) {
      return res.status(400).json({ error: 'Certificate ID required' })
    }

    const certificate = await certificateService.getCertificateById(certificateId)

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' })
    }

    // Authorization: user can view their own certificate, or admin
    const isOwner = req.user?.id === certificate.userId
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin =
      req.user?.tenantId === certificate.tenantId && req.user?.role === 'admin'

    if (!isOwner && !isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Access denied' })
    }

    res.json(certificate)
  } catch (error) {
    console.error('Error fetching certificate:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch certificate'
    })
  }
}

/**
 * GET /api/certificates/me
 * Get all certificates for the authenticated user
 * Requires: authentication
 */
export async function getMyCertificates(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const tenantId = req.user.tenantId || undefined

    const certificates = await certificateService.getCertificatesForUser(
      req.user.id,
      tenantId
    )

    res.json(certificates)
  } catch (error) {
    console.error('Error fetching user certificates:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch certificates'
    })
  }
}

/**
 * GET /api/certificates/:certificateId/download
 * Download certificate PDF
 * Requires: authentication (user can download their own certificates, admins can download all)
 */
export async function downloadCertificate(req: Request, res: Response) {
  try {
    const certificateId = Array.isArray(req.params.certificateId)
      ? req.params.certificateId[0]
      : req.params.certificateId

    if (!certificateId) {
      return res.status(400).json({ error: 'Certificate ID required' })
    }

    const certificate = await certificateService.getCertificateById(certificateId)

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' })
    }

    // Authorization: user can download their own certificate, or admin
    const isOwner = req.user?.id === certificate.userId
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin =
      req.user?.tenantId === certificate.tenantId && req.user?.role === 'admin'

    if (!isOwner && !isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Access denied' })
    }

    if (!certificate.pdfPath) {
      return res.status(404).json({ error: 'Certificate PDF not found' })
    }

    // Check if file exists
    const fileExists = await certificateService.certificatePDFExists(certificate.pdfPath)
    if (!fileExists) {
      return res.status(404).json({ error: 'Certificate PDF file not found on server' })
    }

    // Send the file
    const filePath = certificateService.getCertificatePDFPath(certificate.pdfPath)
    const fileName = `Certificate-${certificate.certificateNumber}.pdf`

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading certificate:', err)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download certificate' })
        }
      }
    })
  } catch (error) {
    console.error('Error downloading certificate:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to download certificate'
    })
  }
}

/**
 * DELETE /api/certificates/:certificateId
 * Delete a certificate
 * Requires: admin role
 */
export async function deleteCertificate(req: Request, res: Response) {
  try {
    const certificateId = Array.isArray(req.params.certificateId)
      ? req.params.certificateId[0]
      : req.params.certificateId

    if (!certificateId) {
      return res.status(400).json({ error: 'Certificate ID required' })
    }

    const certificate = await certificateService.getCertificateById(certificateId)

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' })
    }

    // Authorization: global admin or tenant admin
    const isGlobalAdmin = req.user?.tenantId === null && req.user?.role === 'admin'
    const isTenantAdmin =
      req.user?.tenantId === certificate.tenantId && req.user?.role === 'admin'

    if (!isGlobalAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    await certificateService.deleteCertificate(certificateId)

    res.json({ message: 'Certificate deleted successfully' })
  } catch (error) {
    console.error('Error deleting certificate:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete certificate'
    })
  }
}

export default {
  generateCertificate,
  getCertificate,
  getMyCertificates,
  downloadCertificate,
  deleteCertificate
}
