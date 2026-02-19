import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AdminLayout from '../../../../src/components/AdminLayout'

interface CourseAnalytics {
  courseId: string
  courseName: string
  totalAttempts: number
  uniqueUsers: number
  averageScore: number
  passRate: number
  moduleCount: number
}

interface TenantAnalytics {
  tenantId: string
  totalAttempts: number
  uniqueUsers: number
  courseCount: number
  averageScore: number
  passRate: number
  courses: CourseAnalytics[]
}

export default function TenantAnalytics() {
  const router = useRouter()
  const { tenantId } = router.query
  const [loading, setLoading] = useState(true)
  const [tenantName, setTenantName] = useState('')
  const [analyticsData, setAnalyticsData] = useState<TenantAnalytics | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tenantId) return

    const fetchData = async () => {
      try {
        // Fetch tenant name
        const tenantRes = await fetch(
          `http://localhost:4000/api/tenants/${tenantId}`,
          { credentials: 'include' }
        )
        if (tenantRes.ok) {
          const tenant = await tenantRes.json()
          setTenantName(tenant.name)
        }

        // For now, use the same analytics endpoint
        // In a real scenario, we'd filter by tenant on the backend
        const analyticsRes = await fetch(`/api/analytics/tenant`, {
          credentials: 'include',
        })
        if (!analyticsRes.ok) {
          throw new Error('Failed to fetch analytics')
        }
        const data = await analyticsRes.json()
        setAnalyticsData(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load analytics'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenantId])

  if (loading) {
    return (
      <AdminLayout title="Tenant Analytics">
        <div style={{ padding: '24px', textAlign: 'center' }}>Loading analytics...</div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Tenant Analytics">
        <div style={{ padding: '24px', color: 'red' }}>Error: {error}</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={`${tenantName} - Analytics`}>
      <div style={{ marginBottom: '32px' }}>
        <Link href={`/admin/tenants/${tenantId}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
          ← Back to Tenant
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', marginTop: '16px' }}>
          📊 {tenantName} - Quiz Analytics
        </h1>
      </div>

      {analyticsData ? (
        <>
          {/* Summary Stats */}
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
                Total Attempts
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
                {analyticsData.totalAttempts}
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
                Unique Learners
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#388e3c' }}>
                {analyticsData.uniqueUsers}
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
                Average Score
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f57c00' }}>
                {analyticsData.averageScore}%
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
                Pass Rate
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#c2185b' }}>
                {analyticsData.passRate}%
              </div>
            </div>
          </div>

          {/* Course Breakdown */}
          {analyticsData.courses.length > 0 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                📈 Course Performance
              </h2>
              <div style={{ overflowX: 'auto' }}>
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
                        Learners
                      </th>
                      <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                        Avg Score
                      </th>
                      <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                        Pass Rate
                      </th>
                      <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                        Modules
                      </th>
                      <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.courses.map((course) => (
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
                          {course.uniqueUsers}
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
                          {course.moduleCount}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <Link
                            href={`/admin/courses/${course.courseId}/analytics`}
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

          {analyticsData.courses.length === 0 && (
            <div style={{ padding: '24px', color: '#999', textAlign: 'center' }}>
              No courses or quiz data available yet.
            </div>
          )}
        </>
      ) : null}
    </AdminLayout>
  )
}
