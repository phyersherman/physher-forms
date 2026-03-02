import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../src/auth/AuthProvider'
import api from '../src/lib/api'
import LearnerLayout from '../src/components/LearnerLayout'

interface Certificate {
  id: string
  certificateNumber: string
  issuedAt: string
  courseId: string
  courseName: string
}

interface EnrollmentWithProgress {
  id: string
  courseId: string
  enrolledAt: string
  completedAt: string | null
  certificateId: string | null
  course: {
    id: string
    title: string
    description: string | null
  }
  progress: {
    totalModules: number
    completedModules: number
    percentComplete: number
    requiredModulesComplete: number
    requiredModulesTotal: number
    canReceiveCertificate: boolean
  }
}

const CertificatesPage: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    const fetchEnrollments = async () => {
      try {
        const data = await api.getMyEnrollments()
        setEnrollments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load enrollments')
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollments()
  }, [user])

  if (!user) {
    return (
      <LearnerLayout title="Certificates">
        <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
      </LearnerLayout>
    )
  }

  const certificatesEarned = enrollments.filter(e => e.certificateId && e.completedAt)

  return (
    <LearnerLayout title="Certificates">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Overview Section */}
        <div
          style={{
            marginBottom: '32px',
            padding: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
          }}
        >
          <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700' }}>
            🏆 Your Achievements
          </h2>
          <p style={{ margin: 0, fontSize: '16px', opacity: 0.95 }}>
            You have earned <strong>{certificatesEarned.length}</strong> certificate{certificatesEarned.length !== 1 ? 's' : ''} for completed courses
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading certificates...</div>
        ) : error ? (
          <div style={{ padding: '24px', color: 'red', textAlign: 'center' }}>{error}</div>
        ) : (
          <>
            {certificatesEarned.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '24px',
                }}
              >
                {certificatesEarned.map((enrollment) => (
                  <div
                    key={enrollment.certificateId}
                    style={{
                      background: '#fff',
                      border: '2px solid #f9c74f',
                      borderRadius: '12px',
                      padding: '24px',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Decorative corner */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '120px',
                        height: '120px',
                        background: 'linear-gradient(135deg, #f9c74f 0%, #f9c74f 100%)',
                        borderRadius: '50%',
                        opacity: 0.1,
                      }}
                    />

                    {/* Certificate Icon */}
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏆</div>

                    {/* Course Title */}
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        margin: '0 0 8px 0',
                        color: '#333',
                      }}
                    >
                      {enrollment.course.title}
                    </h3>

                    {/* Certificate Number */}
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#999',
                        margin: '0 0 16px 0',
                        fontFamily: 'monospace',
                      }}
                    >
                      Certificate #{enrollment.certificateId?.slice(0, 8).toUpperCase()}
                    </p>

                    {/* Issued Date */}
                    <div
                      style={{
                        marginBottom: '16px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                        <strong>Issued on</strong>
                      </p>
                      <p style={{ fontSize: '14px', color: '#333', margin: 0, fontWeight: '600' }}>
                        {new Date(enrollment.completedAt!).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Description */}
                    {enrollment.course.description && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#666',
                          lineHeight: '1.5',
                          marginBottom: '16px',
                        }}
                      >
                        {enrollment.course.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <button
                        onClick={() => api.downloadCertificate(enrollment.certificateId!)}
                        style={{
                          padding: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          borderRadius: '6px',
                          border: 'none',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        📥 Download Certificate
                      </button>
                      <Link
                        href={`/course/${enrollment.courseId}`}
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: '12px',
                          background: '#f0f0f0',
                          color: '#333',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#e0e0e0')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#f0f0f0')}
                      >
                        📖 Review Course
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '60px 24px',
                  textAlign: 'center',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  border: '1px dashed #ccc',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
                <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#333' }}>
                  No Certificates Yet
                </h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Complete your enrolled courses to earn certificates and showcase your achievements!
                </p>
                <Link
                  href="/my-courses"
                  style={{
                    display: 'inline-block',
                    padding: '10px 24px',
                    background: '#667eea',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                  }}
                >
                  View My Courses
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </LearnerLayout>
  )
}

export default CertificatesPage
