/**
 * Certificate Service
 * Handles certificate generation, PDF creation, and retrieval
 */

import { PrismaClient, Certificate, Enrollment, Course, User } from '@prisma/client'
import prisma from '../db/client'
import path from 'path'
import fs from 'fs/promises'

interface CertificateWithDetails extends Certificate {
  user: Pick<User, 'id' | 'email' | 'fullName'>
  course?: Pick<Course, 'id' | 'title' | 'description'>
}

interface GenerateCertificateInput {
  enrollmentId: string
  userId: string
  courseId: string
  tenantId: string
}

/**
 * Generate a unique certificate number
 * Format: CERT-YYYY-XXXXXXXX (e.g., CERT-2026-A1B2C3D4)
 */
function generateCertificateNumber(): string {
  const year = new Date().getFullYear()
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `CERT-${year}-${randomPart}`
}

/**
 * Get the certificates directory path
 */
function getCertificatesDirectory(): string {
  // Store certificates in backend/certificates/ directory
  return path.join(__dirname, '../../certificates')
}

/**
 * Ensure the certificates directory exists
 */
async function ensureCertificatesDirectory(): Promise<void> {
  const dir = getCertificatesDirectory()
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

/**
 * Generate a PDF certificate (placeholder - to be implemented with pdfkit)
 * Returns the file path relative to certificates directory
 */
async function generateCertificatePDF(
  certificateNumber: string,
  userName: string,
  courseName: string,
  issuedAt: Date,
  tenantId: string
): Promise<string> {
  await ensureCertificatesDirectory()
  
  const fileName = `${certificateNumber}.pdf`
  const filePath = path.join(getCertificatesDirectory(), fileName)
  
  // TODO: Implement actual PDF generation with pdfkit
  // For now, create a placeholder text file
  const certificateText = `
CERTIFICATE OF COMPLETION

This certifies that

${userName}

has successfully completed

${courseName}

Certificate Number: ${certificateNumber}
Date Issued: ${issuedAt.toLocaleDateString()}
Tenant: ${tenantId}
  `.trim()
  
  await fs.writeFile(filePath, certificateText, 'utf-8')
  
  // Return relative path for storage in database
  return fileName
}

/**
 * Generate a certificate for a completed enrollment
 */
export async function generateCertificate(
  input: GenerateCertificateInput
): Promise<Certificate> {
  const { enrollmentId, userId, courseId, tenantId } = input

  // 1. Verify enrollment exists and is completed
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: {
        select: { id: true, email: true, fullName: true }
      }
    }
  })

  if (!enrollment) {
    throw new Error('Enrollment not found')
  }

  if (!enrollment.completedAt) {
    throw new Error('Cannot generate certificate: Course not completed')
  }

  if (enrollment.certificateId) {
    // Certificate already exists, return it
    const existing = await prisma.certificate.findUnique({
      where: { id: enrollment.certificateId }
    })
    if (existing) {
      return existing
    }
  }

  // Fetch course details separately
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true }
  })

  if (!course) {
    throw new Error('Course not found')
  }

  // 2. Generate unique certificate number
  let certificateNumber = generateCertificateNumber()
  let attempts = 0
  const maxAttempts = 10

  // Ensure uniqueness
  while (attempts < maxAttempts) {
    const existing = await prisma.certificate.findUnique({
      where: { certificateNumber }
    })
    if (!existing) break
    certificateNumber = generateCertificateNumber()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique certificate number')
  }

  // 3. Generate PDF certificate
  const issuedAt = new Date()
  const userName = enrollment.user.fullName || enrollment.user.email
  const courseName = course.title
  
  const pdfPath = await generateCertificatePDF(
    certificateNumber,
    userName,
    courseName,
    issuedAt,
    tenantId
  )

  // 4. Create certificate record
  const certificate = await prisma.certificate.create({
    data: {
      tenantId,
      userId,
      courseId,
      certificateNumber,
      issuedAt,
      pdfPath
    }
  })

  // 5. Link certificate to enrollment
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { certificateId: certificate.id }
  })

  return certificate
}

/**
 * Get a certificate by ID with user and course details
 */
export async function getCertificateById(
  certificateId: string
): Promise<CertificateWithDetails | null> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: {
      user: {
        select: { id: true, email: true, fullName: true }
      }
    }
  })

  if (!certificate) return null

  // Fetch course details separately (no direct relation)
  const course = await prisma.course.findUnique({
    where: { id: certificate.courseId },
    select: { id: true, title: true, description: true }
  })

  return {
    ...certificate,
    course: course || undefined
  }
}

/**
 * Get all certificates for a user in a tenant
 */
export async function getCertificatesForUser(
  userId: string,
  tenantId?: string
): Promise<CertificateWithDetails[]> {
  const where: any = { userId }
  if (tenantId) {
    where.tenantId = tenantId
  }

  const certificates = await prisma.certificate.findMany({
    where,
    include: {
      user: {
        select: { id: true, email: true, fullName: true }
      }
    },
    orderBy: { issuedAt: 'desc' }
  })

  // Fetch course details for each certificate
  const certificatesWithCourses = await Promise.all(
    certificates.map(async (cert) => {
      const course = await prisma.course.findUnique({
        where: { id: cert.courseId },
        select: { id: true, title: true, description: true }
      })
      return {
        ...cert,
        course: course || undefined
      }
    })
  )

  return certificatesWithCourses
}

/**
 * Get the full file path for a certificate PDF
 */
export function getCertificatePDFPath(pdfPath: string): string {
  return path.join(getCertificatesDirectory(), pdfPath)
}

/**
 * Check if a certificate PDF file exists
 */
export async function certificatePDFExists(pdfPath: string): Promise<boolean> {
  try {
    const fullPath = getCertificatePDFPath(pdfPath)
    await fs.access(fullPath)
    return true
  } catch {
    return false
  }
}

/**
 * Delete a certificate and its PDF file
 */
export async function deleteCertificate(certificateId: string): Promise<void> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId }
  })

  if (!certificate) {
    throw new Error('Certificate not found')
  }

  // Delete PDF file if it exists
  if (certificate.pdfPath) {
    try {
      const fullPath = getCertificatePDFPath(certificate.pdfPath)
      await fs.unlink(fullPath)
    } catch (err) {
      console.error('Failed to delete certificate PDF:', err)
      // Continue with database deletion even if file deletion fails
    }
  }

  // Unlink from enrollments
  await prisma.enrollment.updateMany({
    where: { certificateId: certificate.id },
    data: { certificateId: null }
  })

  // Delete certificate record
  await prisma.certificate.delete({
    where: { id: certificateId }
  })
}

export default {
  generateCertificate,
  getCertificateById,
  getCertificatesForUser,
  getCertificatePDFPath,
  certificatePDFExists,
  deleteCertificate
}
