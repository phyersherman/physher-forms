import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '../../../../src/components/AdminLayout'
import { useAuth } from '../../../../src/auth/AuthProvider'
import api from '../../../../src/lib/api'
import styles from '../../../../styles/admin-table.module.css'

interface Certificate {
  id: string
  userId: string
  courseId: string
  enrollmentId: string
  tenantId: string
  issuedAt: string
  certificateData: any
  user?: {
    id: string
    email: string
    fullName: string | null
  }
  course?: {
    id: string
    title: string
  }
}

interface User {
  id: string
  email: string
  fullName: string | null
}

interface Course {
  id: string
  title: string
}

const CertificatesPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')

  // Filters
  const [filterCourse, setFilterCourse] = useState('')
  const [filterUser, setFilterUser] = useState('')

  useEffect(() => {
    if (!tenantId) return
    loadData()
  }, [tenantId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, coursesData, certsData] = await Promise.all([
        api.getUsers(tenantId as string),
        api.getTenantCourses(tenantId as string),
        api.getTenantCertificates(tenantId as string),
      ])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setCertificates(Array.isArray(certsData) ? certsData : [])
    } catch (err) {
      console.error('Failed to load data:', err)
      alert('Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedCourseId) {
      alert('Please select both user and course')
      return
    }
    try {
      await api.generateCertificateByCourse(selectedUserId, selectedCourseId, tenantId as string)
      alert('Certificate generated successfully!')
      loadData()
      setShowGenerateModal(false)
      setSelectedUserId('')
      setSelectedCourseId('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate certificate')
    }
  }

  const handleDownload = async (certId: string) => {
    try {
      // downloadCertificate uses window.location.href to trigger download
      api.downloadCertificate(certId)
    } catch (err) {
      alert('Failed to download certificate')
    }
  }

  const handleDelete = async (certId: string, userName: string, courseName: string) => {
    if (!confirm(`Delete certificate for ${userName} - "${courseName}"?`)) return
    try {
      await api.deleteCertificate(certId)
      loadData()
      alert('Certificate deleted successfully')
    } catch (err) {
      alert('Failed to delete certificate')
    }
  }

  // Filter certificates
  const filteredCertificates = certificates.filter(cert => {
    if (filterCourse && cert.courseId !== filterCourse) return false
    if (filterUser && cert.userId !== filterUser) return false
    return true
  })

  if (!user || user.role !== 'admin') {
    return <AdminLayout title="Certificates"><div>Unauthorized</div></AdminLayout>
  }

  return (
    <AdminLayout title="Certificates">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Back Link */}
        <Link href={`/admin/tenants/${tenantId}`} style={{ color: '#667eea', textDecoration: 'none', fontSize: 14, marginBottom: 16, display: 'inline-block' }}>
          ← Back to Tenant
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Certificates</h1>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
              Manage and issue course completion certificates
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + Generate Certificate
          </button>
        </div>

        {/* Filters */}
        <div style={{ 
          background: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 16,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Filter by Course</label>
            <select
              value={filterCourse}
              onChange={e => setFilterCourse(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 14,
                background: 'white'
              }}
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Filter by User</label>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 14,
                background: 'white'
              }}
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => {
                setFilterCourse('')
                setFilterUser('')
              }}
              style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 16, 
          marginBottom: 24 
        }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{certificates.length}</div>
            <div style={{ fontSize: 14, color: '#666' }}>Total Certificates</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
              {certificates.filter(c => {
                const issuedDate = new Date(c.issuedAt)
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                return issuedDate >= thirtyDaysAgo
              }).length}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>Last 30 Days</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
              {new Set(certificates.map(c => c.courseId)).size}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>Unique Courses</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>
              {new Set(certificates.map(c => c.userId)).size}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>Unique Users</div>
          </div>
        </div>

        {/* Certificates Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
        ) : filteredCertificates.length === 0 ? (
          <div style={{ 
            background: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: 8, 
            padding: '40px 20px', 
            textAlign: 'center' 
          }}>
            <p style={{ fontSize: 16, color: '#666', margin: '0 0 16px 0' }}>
              No certificates found
            </p>
            <p style={{ fontSize: 14, color: '#999', margin: 0 }}>
              Generate certificates for completed courses
            </p>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Course</th>
                  <th>Issued Date</th>
                  <th>Certificate ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map(cert => (
                  <tr key={cert.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cert.user?.fullName || cert.user?.email || 'Unknown'}</div>
                      {cert.user?.fullName && (
                        <div style={{ fontSize: 12, color: '#666' }}>{cert.user?.email}</div>
                      )}
                    </td>
                    <td>{cert.course?.title || 'Unknown Course'}</td>
                    <td>{new Date(cert.issuedAt).toLocaleDateString()}</td>
                    <td>
                      <code style={{ 
                        background: '#f1f5f9', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: 12,
                        fontFamily: 'monospace'
                      }}>
                        {cert.id.slice(0, 8)}...
                      </code>
                    </td>
                    <td style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                      <button
                        onClick={() => handleDownload(cert.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 14,
                          textDecoration: 'underline'
                        }}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(
                          cert.id,
                          cert.user?.fullName || cert.user?.email || 'User',
                          cert.course?.title || 'Course'
                        )}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 14,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Generate Certificate Modal */}
        {showGenerateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'white',
              borderRadius: 8,
              padding: 24,
              maxWidth: 500,
              width: '90%',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Generate Certificate</h2>
                <button onClick={() => setShowGenerateModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleGenerate}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Select User *</label>
                  <select
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">-- Select User --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Select Course *</label>
                  <select
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">-- Select Course --</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ 
                  background: '#fef3c7', 
                  border: '1px solid #fbbf24', 
                  borderRadius: 6, 
                  padding: 12, 
                  marginBottom: 20,
                  fontSize: 13,
                  color: '#92400e'
                }}>
                  ⚠️ Certificate will be generated only if the user has completed this course.
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#e5e7eb',
                      color: '#333',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default CertificatesPage
