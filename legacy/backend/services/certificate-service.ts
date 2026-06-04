/**
 * Certificate Service
 * Handles certificate generation, PDF creation, and retrieval
 */

import { PrismaClient, Certificate, Enrollment, Course, User } from '@prisma/client'
import prisma from '../db/client'
import path from 'path'
import fs from 'fs/promises'
import PDFDocument from 'pdfkit'
import { createWriteStream } from 'fs'

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
 * Generate a PDF certificate with professional styling
 * Returns the file path relative to certificates directory
 */
async function generateCertificatePDF(
  certificateNumber: string,
  userName: string,
  courseName: string,
  issuedAt: Date,
  tenantId: string,
  signatureName?: string | null
): Promise<string> {
  await ensureCertificatesDirectory()
  
  const fileName = `${certificateNumber}.pdf`
  const filePath = path.join(getCertificatesDirectory(), fileName)
  
  // Path to cursive font for signatures
  const cursiveFontPath = path.join(__dirname, '../../fonts/GreatVibes-Regular.ttf')
  
  return new Promise((resolve, reject) => {
    try {
      // Create PDF with landscape letter size
      const doc = new PDFDocument({
        size: 'LETTER',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })
      
      // Register the cursive font for signatures
      doc.registerFont('Cursive', cursiveFontPath)

      const stream = createWriteStream(filePath)
      doc.pipe(stream)

      const pageWidth = 792 // Letter landscape width
      const pageHeight = 612 // Letter landscape height
      const centerX = pageWidth / 2

      // Background - light cream color
      doc.rect(0, 0, pageWidth, pageHeight).fill('#FFFEF7')

      // Outer decorative border
      doc.strokeColor('#1a365d')
         .lineWidth(3)
         .rect(30, 30, pageWidth - 60, pageHeight - 60)
         .stroke()

      // Inner decorative border
      doc.strokeColor('#667eea')
         .lineWidth(1)
         .rect(40, 40, pageWidth - 80, pageHeight - 80)
         .stroke()

      // Corner decorations (simple L-shapes)
      const cornerSize = 20
      doc.strokeColor('#667eea').lineWidth(2)
      // Top-left
      doc.moveTo(50, 70).lineTo(50, 50).lineTo(70, 50).stroke()
      // Top-right
      doc.moveTo(pageWidth - 70, 50).lineTo(pageWidth - 50, 50).lineTo(pageWidth - 50, 70).stroke()
      // Bottom-left
      doc.moveTo(50, pageHeight - 70).lineTo(50, pageHeight - 50).lineTo(70, pageHeight - 50).stroke()
      // Bottom-right
      doc.moveTo(pageWidth - 70, pageHeight - 50).lineTo(pageWidth - 50, pageHeight - 50).lineTo(pageWidth - 50, pageHeight - 70).stroke()

      // Certificate title
      doc.fillColor('#1a365d')
         .font('Helvetica-Bold')
         .fontSize(42)
         .text('CERTIFICATE', 0, 80, { align: 'center', width: pageWidth })

      doc.fillColor('#667eea')
         .font('Helvetica')
         .fontSize(18)
         .text('OF COMPLETION', 0, 130, { align: 'center', width: pageWidth })

      // Decorative line under title
      doc.strokeColor('#667eea')
         .lineWidth(1)
         .moveTo(centerX - 150, 165)
         .lineTo(centerX + 150, 165)
         .stroke()

      // "This is to certify that" text
      doc.fillColor('#4a5568')
         .font('Helvetica')
         .fontSize(14)
         .text('This is to certify that', 0, 190, { align: 'center', width: pageWidth })

      // Recipient name
      doc.fillColor('#1a365d')
         .font('Helvetica-Bold')
         .fontSize(32)
         .text(userName, 0, 220, { align: 'center', width: pageWidth })

      // Decorative line under name
      doc.strokeColor('#667eea')
         .lineWidth(0.5)
         .moveTo(centerX - 200, 265)
         .lineTo(centerX + 200, 265)
         .stroke()

      // "has successfully completed" text
      doc.fillColor('#4a5568')
         .font('Helvetica')
         .fontSize(14)
         .text('has successfully completed', 0, 285, { align: 'center', width: pageWidth })

      // Course name
      doc.fillColor('#667eea')
         .font('Helvetica-Bold')
         .fontSize(24)
         .text(courseName, 0, 315, { align: 'center', width: pageWidth })

      // Date issued
      const formattedDate = issuedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      doc.fillColor('#4a5568')
         .font('Helvetica')
         .fontSize(12)
         .text(`Issued on ${formattedDate}`, 0, 380, { align: 'center', width: pageWidth })

      // Certificate number at bottom
      doc.fillColor('#718096')
         .font('Helvetica')
         .fontSize(10)
         .text(`Certificate ID: ${certificateNumber}`, 0, pageHeight - 80, { align: 'center', width: pageWidth })

      // Signature line (left side)
      doc.strokeColor('#4a5568')
         .lineWidth(0.5)
         .moveTo(100, 480)
         .lineTo(320, 480)
         .stroke()
      
      // Display signature name if provided (in cursive font)
      // Position higher and use wider area to prevent overflow below line
      if (signatureName) {
        doc.fillColor('#1a365d')
           .font('Cursive')
           .fontSize(16)
           .text(signatureName, 100, 430, { width: 220, align: 'center', height: 48, lineGap: -2 })
      }
      
      doc.fillColor('#4a5568')
         .font('Helvetica')
         .fontSize(10)
         .text('Authorized Signature', 100, 490, { width: 220, align: 'center' })

      // Date line (right side) - show actual issue date
      doc.strokeColor('#4a5568')
         .moveTo(pageWidth - 300, 480)
         .lineTo(pageWidth - 120, 480)
         .stroke()

      // Display the formatted date above the line
      doc.fillColor('#1a365d')
         .font('Helvetica-Bold')
         .fontSize(12)
         .text(formattedDate, pageWidth - 300, 462, { width: 180, align: 'center' })

      doc.fillColor('#4a5568')
         .font('Helvetica')
         .fontSize(10)
         .text('Date', pageWidth - 300, 490, { width: 180, align: 'center' })

      // Finalize PDF
      doc.end()

      stream.on('finish', () => {
        resolve(fileName)
      })

      stream.on('error', (err) => {
        reject(err)
      })
    } catch (err) {
      reject(err)
    }
  })
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

  // Fetch tenant to get certificate signature
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { certificateSignature: true }
  })

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
    tenantId,
    tenant?.certificateSignature
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

/**
 * Get all certificates for a tenant (admin only)
 */
export async function getCertificatesForTenant(
  tenantId: string
): Promise<CertificateWithDetails[]> {
  const certificates = await prisma.certificate.findMany({
    where: { tenantId },
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

export default {
  generateCertificate,
  getCertificateById,
  getCertificatesForUser,
  getCertificatesForTenant,
  getCertificatePDFPath,
  certificatePDFExists,
  deleteCertificate
}
