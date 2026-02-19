import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../src/auth/AuthProvider'
import styles from '../styles/admin-dashboard.module.css'

interface CourseAnalytics {
  courseId: string
  courseName: string
  totalAttempts: number
  uniqueUsers: number
  averageScore: number
  passRate: number
  moduleCount: number
}

interface LearnerAnalytics {
  tenantId: string
  totalAttempts: number
  uniqueUsers: number
  courseCount: number
  averageScore: number
  passRate: number
  courses: CourseAnalytics[]
}

const Dashboard: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<LearnerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics/tenant', {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to load analytics')
        const data = await res.json()
        setAnalytics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user])

  if (!user) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div
        style={{
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Welcome back, {user.email}!
        </h1>
        <p style={{ color: '#666' }}>Your learning progress and analytics</p>
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>Loading analytics...</div>
      ) : error ? (
        <div style={{ padding: '24px', color: 'red', textAlign: 'center' }}>{error}</div>
      ) : analytics ? (
        <>
          {/* Overall Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Total Quiz Attempts
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
                {analytics.totalAttempts}
              </div>
            </div>
            <div
              style={{
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Courses Enrolled
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#388e3c' }}>
                {analytics.courseCount}
              </div>
            </div>
            <div
              style={{
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Your Average Score
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f57c00' }}>
                {analytics.averageScore}%
              </div>
            </div>
            <div
              style={{
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Your Pass Rate
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#c2185b' }}>
                {analytics.passRate}%
              </div>
            </div>
          </div>

          {/* Course List */}
          {analytics.courses.length > 0 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                📚 Your Courses
              </h2>
              <div
                style={{
                  overflowX: 'auto',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1976d2' }}>
                      <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>
                        Course Name
                      </th>
                      <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                        Attempts
                      </th>
                      <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                        Avg Score
                      </th>
                      <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                        Pass Rate
                      </th>
                      <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.courses.map((course) => (
                      <tr
                        key={course.courseId}
                        style={{
                          borderBottom: '1px solid #e0e0e0',
                          background: course.passRate >= 70 ? '#f1f8f4' : '#fff8f1',
                        }}
                      >
                        <td style={{ padding: '12px', fontWeight: 500 }}>{course.courseName}</td>
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          {course.totalAttempts}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          {course.averageScore}%
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            padding: '12px',
                            color: course.passRate >= 70 ? '#388e3c' : '#f57c00',
                            fontWeight: 600,
                          }}
                        >
                          {course.passRate}%
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <Link
                            href={`/course/${course.courseId}`}
                            style={{
                              color: '#1976d2',
                              textDecoration: 'none',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {analytics.courses.length === 0 && (
            <div style={{ padding: '24px', color: '#999', textAlign: 'center' }}>
              No courses yet. Explore available courses to get started!
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

export default Dashboard
