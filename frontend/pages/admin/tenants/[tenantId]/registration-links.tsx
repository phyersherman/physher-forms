import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '../../../../src/components/AdminLayout'
import { useAuth } from '../../../../src/auth/AuthProvider'
import api from '../../../../src/lib/api'
import styles from '../../../../styles/admin-table.module.css'

interface RegistrationLink {
  id: string
  name: string
  token: string
  url: string
  courseIds: string[]
  organization: string | null
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  tenant: { id: string; name: string }
  _count?: { usages: number }
}

interface Course {
  id: string
  title: string
}

const RegistrationLinksPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query

  const [links, setLinks] = useState<RegistrationLink[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedLink, setSelectedLink] = useState<RegistrationLink | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    courseIds: [] as string[],
    organization: '',
    maxUses: '',
    expiresAt: '',
  })

  useEffect(() => {
    if (!tenantId) return
    loadData()
  }, [tenantId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [linksData, coursesData] = await Promise.all([
        api.getRegistrationLinks(tenantId as string),
        api.getTenantCourses(tenantId as string),
      ])
      setLinks(Array.isArray(linksData) ? linksData : [])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
    } catch (err) {
      console.error('Failed to load data:', err)
      alert('Failed to load registration links')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.courseIds.length === 0) {
      alert('Please select at least one course')
      return
    }
    try {
      await api.createRegistrationLink(tenantId as string, {
        name: formData.name,
        courseIds: formData.courseIds,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        expiresAt: formData.expiresAt || undefined,
      })
      resetForm()
      setShowCreateModal(false)
      loadData()
      alert('Registration link created successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create link')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLink) return
    try {
      await api.updateRegistrationLink(selectedLink.id, {
        name: formData.name,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        expiresAt: formData.expiresAt || undefined,
      })
      resetForm()
      setShowEditModal(false)
      setSelectedLink(null)
      loadData()
      alert('Link updated successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update link')
    }
  }

  const handleToggle = async (linkId: string) => {
    try {
      await api.toggleRegistrationLink(linkId)
      loadData()
    } catch (err) {
      alert('Failed to toggle link status')
    }
  }

  const handleDelete = async (linkId: string, linkName: string) => {
    if (!confirm(`Delete registration link "${linkName}"?`)) return
    try {
      await api.deleteRegistrationLink(linkId)
      loadData()
      alert('Link deleted successfully')
    } catch (err) {
      alert('Failed to delete link')
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (link: RegistrationLink) => {
    setSelectedLink(link)
    setFormData({
      name: link.name,
      courseIds: link.courseIds,
      organization: link.organization || '',
      maxUses: link.maxUses?.toString() || '',
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '',
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      courseIds: [],
      organization: '',
      maxUses: '',
      expiresAt: '',
    })
  }

  const handleCourseToggle = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId]
    }))
  }

  if (!user || user.role !== 'admin') {
    return <AdminLayout title="Registration Links"><div>Unauthorized</div></AdminLayout>
  }

  return (
    <AdminLayout title="Registration Links">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Back Link */}
        <Link href={`/admin/tenants/${tenantId}`} style={{ color: '#667eea', textDecoration: 'none', fontSize: 14, marginBottom: 16, display: 'inline-block' }}>
          ← Back to Tenant
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Registration Links</h1>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
              Create shareable links for automatic course signup and enrollment
            </p>
          </div>
          <button
            onClick={openCreateModal}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + Create Link
          </button>
        </div>

        {/* Links Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
        ) : links.length === 0 ? (
          <div style={{ 
            background: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: 8, 
            padding: '40px 20px', 
            textAlign: 'center' 
          }}>
            <p style={{ fontSize: 16, color: '#666', margin: '0 0 16px 0' }}>
              No registration links yet
            </p>
            <p style={{ fontSize: 14, color: '#999', margin: 0 }}>
              Create a link to allow automatic course signup
            </p>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Courses</th>
                  <th>Organization</th>
                  <th>Uses</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id}>
                    <td style={{ fontWeight: 600 }}>{link.name}</td>
                    <td>{link.courseIds.length} course{link.courseIds.length !== 1 ? 's' : ''}</td>
                    <td>{link.organization || '—'}</td>
                    <td>
                      {link.usedCount} / {link.maxUses || '∞'}
                    </td>
                    <td>
                      {link.expiresAt 
                        ? new Date(link.expiresAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: link.isActive ? '#d1fae5' : '#fee2e2',
                        color: link.isActive ? '#065f46' : '#991b1b',
                      }}>
                        {link.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 8, fontSize: 14 }}>
                      <button
                        onClick={() => handleCopyUrl(link.url)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0070f3',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                        title="Copy URL"
                      >
                        {copiedUrl === link.url ? '✓ Copied' : '📋 Copy'}
                      </button>
                      {' | '}
                      <button
                        onClick={() => openEditModal(link)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#667eea',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 14,
                        }}
                      >
                        Edit
                      </button>
                      {' | '}
                      <button
                        onClick={() => handleToggle(link.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f59e0b',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 14,
                        }}
                      >
                        {link.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {' | '}
                      <button
                        onClick={() => handleDelete(link.id, link.name)}
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

        {/* Create Modal */}
        {showCreateModal && (
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
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Create Registration Link</h2>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Link Name *</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Q1 2026 Training"
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Courses *</label>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, maxHeight: 200, overflow: 'auto' }}>
                    {courses.length === 0 ? (
                      <p style={{ margin: 0, color: '#999', fontSize: 14 }}>No courses available</p>
                    ) : (
                      courses.map(course => (
                        <label key={course.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.courseIds.includes(course.id)}
                            onChange={() => handleCourseToggle(course.id)}
                            style={{ marginRight: 8 }}
                          />
                          <span style={{ fontSize: 14 }}>{course.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Organization (optional)</label>
                  <input
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Acme Corp"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>Will pre-fill organization field on registration form</p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Max Uses (optional)</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Unlimited"
                    min="1"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Create Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
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

        {/* Edit Modal */}
        {showEditModal && selectedLink && (
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
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Edit Registration Link</h2>
                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Link Name *</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Organization (optional)</label>
                  <input
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Max Uses (optional)</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                    min="1"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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

export default RegistrationLinksPage
