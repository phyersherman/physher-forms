import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '../../src/components/AdminLayout'
import styles from '../../styles/admin-dashboard.module.css'

interface TenantDashboardData {
  tenantId: string
  tenantName: string
  totalUsers: number
  totalCourses: number
  completedCourses: number
  usersWithoutCompletion: number
  quizPassRate: number
  totalQuizAttempts: number
}

const Admin: NextPage = () => {
  const [tenants, setTenants] = useState<TenantDashboardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        const res = await fetch(`${baseUrl}/analytics/admin`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to load analytics')
        const data = await res.json()
        setTenants(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return (
    <AdminLayout title="Dashboard">
      {/* Analytics Section */}
      {loading ? (
        <div className={styles.infoSection}>
          <p>Loading analytics...</p>
        </div>
      ) : error ? (
        <div className={styles.infoSection} style={{ color: 'red' }}>
          <p>{error}</p>
        </div>
      ) : tenants.length > 0 ? (
        <div className={styles.infoSection}>
          <h2>📊 Tenant Performance Overview</h2>
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
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
                    Tenant Name
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                    Total Users
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                    Courses
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                    Users Completed
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                    Not Started
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                    Quiz Pass Rate
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr
                    key={tenant.tenantId}
                    style={{
                      borderBottom: '1px solid #e0e0e0',
                      background: tenant.quizPassRate >= 70 ? '#f1f8f4' : '#fff8f1',
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: 500 }}>
                      <Link href={`/admin/tenants/${tenant.tenantId}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
                        {tenant.tenantName}
                      </Link>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      {tenant.totalUsers}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      {tenant.totalCourses}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', fontWeight: 600, color: '#388e3c' }}>
                      {tenant.completedCourses}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', fontWeight: 600, color: '#f57c00' }}>
                      {tenant.usersWithoutCompletion}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '12px',
                        color: tenant.quizPassRate >= 70 ? '#388e3c' : '#f57c00',
                        fontWeight: 600,
                      }}
                    >
                      {tenant.quizPassRate}%
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      <Link
                        href={`/admin/tenants/${tenant.tenantId}`}
                        style={{
                          color: '#1976d2',
                          textDecoration: 'none',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Explore →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default Admin
