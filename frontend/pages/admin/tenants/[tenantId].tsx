import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AdminLayout from '../../../src/components/AdminLayout'
import { useAuth } from '../../../src/auth/AuthProvider'
import { refreshCsrf } from '../../../src/lib/api'
import styles from '../../../styles/admin-table.module.css'

interface Tenant {
  id: string
  name: string
  domains: any[]
  defaultLocale: string
}

interface Course {
  id: string
  title: string
  description: string | null
  tenant_id: string
  created_at: string
}

const TenantDetailPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query
  
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [tenantName, setTenantName] = useState('')
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [allTenants, setAllTenants] = useState<Tenant[]>([])
  const [selectedCourseForCopy, setSelectedCourseForCopy] = useState<Course | null>(null)
  const [selectedCopyTenantId, setSelectedCopyTenantId] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    
    Promise.all([
      fetch(`http://localhost:4000/api/tenants/${tenantId}`, { credentials: 'include' }).then(r => r.json()),
      fetch(`http://localhost:4000/api/tenants/${tenantId}/courses`, { credentials: 'include' }).then(r => r.json()),
      fetch('http://localhost:4000/api/tenants', { credentials: 'include' }).then(r => r.json())
    ]).then(([tenantData, coursesData, tenantsData]) => {
      setTenant(tenantData)
      setTenantName(tenantData.name)
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setAllTenants(Array.isArray(tenantsData) ? tenantsData : [])
      setLoading(false)
    }).catch(err => {
      setError(err.message)
      setLoading(false)
    })
  }, [tenantId])

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = await refreshCsrf()
      const res = await fetch(`http://localhost:4000/api/tenants/${tenantId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token || '' },
        body: JSON.stringify({ name: tenantName })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setTenant({ ...tenant!, name: tenantName })
      setEditMode(false)
      alert('Tenant updated successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update tenant')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return
    try {
      const token = await refreshCsrf()
      const res = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRF-Token': token || '' }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setCourses(courses.filter(c => c.id !== courseId))
      alert('Course deleted successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete course')
    }
  }

  const handleCopyCourse = async () => {
    if (!selectedCourseForCopy || !selectedCopyTenantId) return
    try {
      const token = await refreshCsrf()
      const res = await fetch(`http://localhost:4000/api/courses/${selectedCourseForCopy.id}/copy`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token || '' },
        body: JSON.stringify({ targetTenantId: selectedCopyTenantId })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setShowCopyModal(false)
      setSelectedCourseForCopy(null)
      setSelectedCopyTenantId('')
      alert('Course copied successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to copy course')
    }
  }

  const openCopyDialog = (course: Course) => {
    setSelectedCourseForCopy(course)
    setSelectedCopyTenantId('')
    setShowCopyModal(true)
  }

  if (!user) return <AdminLayout title="Tenant"><div>Loading...</div></AdminLayout>
  if (user.role !== 'admin') return <AdminLayout title="Tenant"><div>Unauthorized</div></AdminLayout>
  if (loading) return <AdminLayout title="Tenant"><div>Loading tenant...</div></AdminLayout>
  if (!tenant) return <AdminLayout title="Tenant"><div>Tenant not found</div></AdminLayout>

  return (
    <AdminLayout title={tenant.name}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/admin/tenants" style={{ color: '#667eea', textDecoration: 'none', fontSize: 14, marginBottom: '16px', display: 'inline-block' }}>
            ← Back to Tenants
          </Link>
        </div>

        {/* Tenant Info Card */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: 28, color: '#333' }}>{tenant.name}</h1>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Tenant ID: {tenant.id}</p>
              {tenant.domains && tenant.domains.length > 0 && (
                <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 14 }}>
                  Domain: {tenant.domains[0]?.host || 'Not set'}
                </p>
              )}
            </div>
            <button 
              onClick={() => setEditMode(!editMode)}
              style={{ padding: '8px 16px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
            >
              {editMode ? 'Cancel' : '✏️ Edit Tenant'}
            </button>
          </div>

          {editMode && (
            <form onSubmit={handleUpdateTenant} style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Tenant Name</label>
                <input
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" style={{ padding: '8px 16px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                Save Changes
              </button>
            </form>
          )}
        </div>

        {error && (
          <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {/* Courses Section */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: '#333' }}>Courses ({courses.length})</h2>
            <Link href={`/admin/courses/new?tenantId=${tenantId}`} style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                + New Course
              </button>
            </Link>
          </div>

          {courses.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
              <p style={{ fontSize: 16, margin: 0 }}>No courses yet.</p>
              <p style={{ fontSize: 14, margin: '8px 0 0 0' }}>
                Create a new course to get started.
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td style={{ fontWeight: 600 }}>{course.title}</td>
                      <td>{new Date(course.created_at).toLocaleDateString()}</td>
                      <td style={{ display: 'flex', gap: '8px', fontSize: 14 }}>
                        <Link href={`/admin/courses/${course.id}/edit?tenantId=${tenantId}`} style={{ color: '#0070f3', textDecoration: 'none' }}>
                          Edit
                        </Link>
                        {' | '}
                        <button
                          onClick={() => openCopyDialog(course)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#667eea',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 14,
                            textDecoration: 'underline'
                          }}
                        >
                          Copy
                        </button>
                        {' | '}
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 14
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
        </div>

        {/* Copy Course Modal */}
        {showCopyModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 20, color: '#333' }}>
                  Copy "{selectedCourseForCopy?.title}" to Tenant
                </h3>
                <button
                  onClick={() => {
                    setShowCopyModal(false)
                    setSelectedCourseForCopy(null)
                    setSelectedCopyTenantId('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#333' }}>
                  Select Tenant *
                </label>
                <select
                  value={selectedCopyTenantId}
                  onChange={e => setSelectedCopyTenantId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    fontSize: 14,
                    background: 'white'
                  }}
                >
                  <option value="">-- Select Tenant --</option>
                  {allTenants
                    .filter(t => t.id !== tenantId) // Don't allow copying to same tenant
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleCopyCourse}
                  disabled={!selectedCopyTenantId}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: selectedCopyTenantId ? '#667eea' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: selectedCopyTenantId ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  Copy Course
                </button>
                <button
                  onClick={() => {
                    setShowCopyModal(false)
                    setSelectedCourseForCopy(null)
                    setSelectedCopyTenantId('')
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#e5e7eb',
                    color: '#333',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default TenantDetailPage
