import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '../../../../src/components/AdminLayout'
import { useAuth } from '../../../../src/auth/AuthProvider'
import api from '../../../../src/lib/api'
import styles from '../../../../styles/admin-table.module.css'

interface PasswordlessLink {
  id: string
  tenantId: string
  name: string
  token: string
  courses: string[]
  organization: string | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface Course {
  id: string
  title: string
}

const PasswordlessLinksPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query

  const [links, setLinks] = useState<PasswordlessLink[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    courseIds: [] as string[],
    organization: '',
    maxUses: '',
    expiresAt: '',
  })
  const [editingLink, setEditingLink] = useState<PasswordlessLink | null>(null)

  useEffect(() => {
    if (!tenantId) return
    loadData()
  }, [tenantId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [linksData, coursesData] = await Promise.all([
        api.getPasswordlessLinks(tenantId as string),
        api.getTenantCourses(tenantId as string),
      ])
      setLinks(Array.isArray(linksData) ? linksData : [])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
    } catch (err) {
      console.error('Failed to load data:', err)
      alert('Failed to load passwordless links')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || formData.courseIds.length === 0) {
      alert('Please provide name and select at least one course')
      return
    }
    try {
      await api.createPasswordlessLink(tenantId as string, {
        name: formData.name,
        courseIds: formData.courseIds,
        organization: formData.organization || undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        expiresAt: formData.expiresAt || undefined,
      })
      setShowCreateModal(false)
      setFormData({ name: '', courseIds: [], organization: '', maxUses: '', expiresAt: '' })
      loadData()
      alert('Passwordless link created successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create link')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLink) return
    try {
      await api.updatePasswordlessLink(editingLink.id, {
        name: formData.name,
        organization: formData.organization || undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        expiresAt: formData.expiresAt || undefined,
      })
      setShowEditModal(false)
      setEditingLink(null)
      setFormData({ name: '', courseIds: [], organization: '', maxUses: '', expiresAt: '' })
      loadData()
      alert('Link updated successfully!')
    } catch (err) {
      alert('Failed to update link')
    }
  }

  const handleToggle = async (linkId: string) => {
    try {
      await api.togglePasswordlessLink(linkId)
      loadData()
    } catch (err) {
      alert('Failed to toggle link')
    }
  }

  const handleDelete = async (linkId: string, linkName: string) => {
    if (!confirm(`Delete passwordless link "${linkName}"?`)) return
    try {
      await api.deletePasswordlessLink(linkId)
      loadData()
      alert('Link deleted successfully')
    } catch (err) {
      alert('Failed to delete link')
    }
  }

  const handleCopyUrl = (token: string, linkId: string) => {
    const url = `${window.location.origin}/passwordless-register?token=${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(linkId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const openEditModal = (link: PasswordlessLink) => {
    setEditingLink(link)
    setFormData({
      name: link.name,
      courseIds: link.courses || [],
      organization: link.organization || '',
      maxUses: link.maxUses ? link.maxUses.toString() : '',
      expiresAt: link.expiresAt ? link.expiresAt.split('T')[0] : '',
    })
    setShowEditModal(true)
  }

  const toggleCourseSelection = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId]
    }))
  }

  if (!user || user.role !== 'admin') {
    return <AdminLayout title="Passwordless Links"><div>Unauthorized</div></AdminLayout>
  }

  return (
    <AdminLayout title="Passwordless Links">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Back Link */}
        <Link href={`/admin/tenants/${tenantId}`} style={{ color: '#667eea', textDecoration: 'none', fontSize: 14, marginBottom: 16, display: 'inline-block' }}>
          ← Back to Tenant
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Passwordless Access Links</h1>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
              Create secure magic-link authentication for learner access
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + New Passwordless Link
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
              No passwordless links yet
            </p>
            <p style={{ fontSize: 14, color: '#999', margin: 0 }}>
              Create secure links for magic-link authentication
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
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {link.courses && link.courses.length > 0
                          ? link.courses.map(courseId => {
                              const course = courses.find(c => c.id === courseId)
                              return course ? course.title : courseId
                            }).join(', ')
                          : 'None'}
                      </div>
                    </td>
                    <td>{link.organization || '—'}</td>
                    <td>
                      {link.usedCount} / {link.maxUses ? link.maxUses : '∞'}
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
                        onClick={() => handleCopyUrl(link.token, link.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 14,
                        }}
                      >
                        {copiedId === link.id ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <button
                        onClick={() => openEditModal(link)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#8b5cf6',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 14,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(link.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: link.isActive ? '#f59e0b' : '#10b981',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 14,
                        }}
                      >
                        {link.isActive ? 'Disable' : 'Enable'}
                      </button>
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
              maxWidth: 500,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Create Passwordless Link</h2>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Link Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Partner Portal Access"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Courses *</label>
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: 8,
                    maxHeight: 200,
                    overflow: 'auto',
                    background: '#fafafa'
                  }}>
                    {courses.length === 0 ? (
                      <div style={{ padding: 8, color: '#666', fontSize: 14 }}>No courses available</div>
                    ) : (
                      courses.map(course => (
                        <label key={course.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.courseIds.includes(course.id)}
                            onChange={() => toggleCourseSelection(course.id)}
                            style={{ marginRight: 8 }}
                          />
                          <span style={{ fontSize: 14 }}>{course.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Organization</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Optional"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Max Uses</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Unlimited"
                    min="1"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#8b5cf6',
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
        {showEditModal && editingLink && (
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
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Edit Passwordless Link</h2>
                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Link Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Courses (Read-only)</label>
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: 12,
                    background: '#f9fafb',
                    fontSize: 14,
                    color: '#666'
                  }}>
                    {editingLink.courses && editingLink.courses.length > 0
                      ? editingLink.courses.map(courseId => {
                          const course = courses.find(c => c.id === courseId)
                          return course ? course.title : courseId
                        }).join(', ')
                      : 'None'}
                  </div>
                  <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0 0' }}>
                    Course selection cannot be changed after creation
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Organization</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Max Uses</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Unlimited"
                    min="1"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Update Link
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

export default PasswordlessLinksPage
