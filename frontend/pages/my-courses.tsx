import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../src/auth/AuthProvider'
import api from '../src/lib/api'
import LearnerLayout from '../src/components/LearnerLayout'

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

const MyCoursesPage: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed'>('all')

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
      <LearnerLayout title="My Courses">
        <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
      </LearnerLayout>
    )
  }

  const filteredEnrollments = enrollments.filter(e => {
    if (filterStatus === 'completed') return e.completedAt
    if (filterStatus === 'in-progress') return !e.completedAt
    return true
  })

  return (
    <LearnerLayout title="My Courses">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Filter Buttons */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '10px 20px',
              background: filterStatus === 'all' ? '#667eea' : '#f0f0f0',
              color: filterStatus === 'all' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            All Courses ({enrollments.length})
          </button>
          <button
            onClick={() => setFilterStatus('in-progress')}
            style={{
              padding: '10px 20px',
              background: filterStatus === 'in-progress' ? '#f57c00' : '#f0f0f0',
              color: filterStatus === 'in-progress' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            In Progress ({enrollments.filter(e => !e.completedAt).length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            style={{
              padding: '10px 20px',
              background: filterStatus === 'completed' ? '#388e3c' : '#f0f0f0',
              color: filterStatus === 'completed' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Completed ({enrollments.filter(e => e.completedAt).length})
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading your courses...</div>
        ) : error ? (
          <div style={{ padding: '24px', color: 'red', textAlign: 'center' }}>{error}</div>
        ) : (
          <>
            {filteredEnrollments.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px',
                }}
              >
                {filteredEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '20px',
                      background: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Course Title */}
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                      {enrollment.course.title}
                    </h3>

                    {/* Description */}
                    {enrollment.course.description && (
                      <p style={{ fontSize: '14px', color: '#666', margin: 0, lineHeight: '1.4' }}>
                        {enrollment.course.description.length > 100
                          ? enrollment.course.description.substring(0, 100) + '...'
                          : enrollment.course.description}
                      </p>
                    )}

                    {/* Status Badge */}
                    <div>
                      {enrollment.completedAt ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          ✓ Completed
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: '#fff3e0',
                            color: '#e65100',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          In Progress
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          fontSize: '12px',
                          color: '#666',
                        }}
                      >
                        <span>Progress</span>
                        <span style={{ fontWeight: '600' }}>
                          {enrollment.progress.completedModules} / {enrollment.progress.totalModules} modules
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          background: '#e0e0e0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${enrollment.progress.percentComplete}%`,
                            height: '100%',
                            background: enrollment.completedAt ? '#4caf50' : '#2196f3',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1976d2',
                          marginTop: '4px',
                        }}
                      >
                        {enrollment.progress.percentComplete}%
                      </div>
                    </div>

                    {/* Certificate Badge */}
                    {enrollment.certificateId && (
                      <div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: '#e3f2fd',
                            color: '#1565c0',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          🏆 Certificate Available
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Link
                        href={`/course/${enrollment.courseId}`}
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: '10px',
                          background: '#1976d2',
                          color: '#fff',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '14px',
                        }}
                      >
                        {enrollment.completedAt ? 'Review Course' : 'Continue Learning'}
                      </Link>
                      {enrollment.certificateId && (
                        <button
                          onClick={() => api.downloadCertificate(enrollment.certificateId!)}
                          style={{
                            padding: '10px',
                            background: '#4caf50',
                            color: '#fff',
                            borderRadius: '4px',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                          }}
                        >
                          📄 Download Certificate
                        </button>
                      )}
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
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#333' }}>
                  No Courses
                </h3>
                <p style={{ color: '#666' }}>
                  {filterStatus === 'completed' && "You haven't completed any courses yet."}
                  {filterStatus === 'in-progress' && "You don't have any courses in progress."}
                  {filterStatus === 'all' && "You haven't been enrolled in any courses yet."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </LearnerLayout>
  )
}

export default MyCoursesPage
