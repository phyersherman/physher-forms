import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '../../../../src/components/AdminLayout'
import { useAuth } from '../../../../src/auth/AuthProvider'
import api from '../../../../src/lib/api'
import styles from '../../../../styles/admin-table.module.css'

interface BulkImportJob {
  id: string
  tenantId: string
  createdBy: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalRecords: number
  successCount: number
  failureCount: number
  errorLog: any
  createdAt: string
  updatedAt: string
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

const BulkOperationsPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query

  const [activeTab, setActiveTab] = useState<'import' | 'assign'>('import')
  const [jobs, setJobs] = useState<BulkImportJob[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Bulk assign state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [assignAction, setAssignAction] = useState<'assign' | 'unassign'>('assign')

  useEffect(() => {
    if (!tenantId) return
    loadData()
  }, [tenantId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [jobsData, usersData, coursesData] = await Promise.all([
        api.getBulkImportJobs(tenantId as string),
        api.getUsers(tenantId as string),
        api.getTenantCourses(tenantId as string),
      ])
      setJobs(Array.isArray(jobsData) ? jobsData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
    } catch (err) {
      console.error('Failed to load data:', err)
      alert('Failed to load bulk operations data')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    try {
      setUploadingFile(true)
      
      // Read CSV file as text
      const csvContent = await file.text()
      
      await api.importUsersFromCSV(tenantId as string, {
        csvContent,
        sendInvites: false,
        fileName: file.name,
      })
      alert('CSV uploaded successfully! Processing in background...')
      loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload CSV')
    } finally {
      setUploadingFile(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const downloadTemplate = () => {
    const template = 'email,fullName,role\nexample@example.com,John Doe,learner\nuser2@example.com,Jane Smith,learner'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'user-import-template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleBulkAssign = async () => {
    if (selectedUserIds.length === 0 || selectedCourseIds.length === 0) {
      alert('Please select at least one user and one course')
      return
    }

    const confirmMsg = assignAction === 'assign'
      ? `Assign ${selectedCourseIds.length} course(s) to ${selectedUserIds.length} user(s)?`
      : `Unassign ${selectedCourseIds.length} course(s) from ${selectedUserIds.length} user(s)?`

    if (!confirm(confirmMsg)) return

    try {
      setLoading(true)
      if (assignAction === 'assign') {
        await api.bulkAssignCourses({
          tenantId: tenantId as string,
          userIds: selectedUserIds,
          courseIds: selectedCourseIds,
        })
        alert('Courses assigned successfully!')
      } else {
        await api.bulkUnassignCourses({
          tenantId: tenantId as string,
          userIds: selectedUserIds,
          courseIds: selectedCourseIds,
        })
        alert('Courses unassigned successfully!')
      }
      setSelectedUserIds([])
      setSelectedCourseIds([])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk operation failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    )
  }

  const selectAllUsers = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(users.map(u => u.id))
    }
  }

  const selectAllCourses = () => {
    if (selectedCourseIds.length === courses.length) {
      setSelectedCourseIds([])
    } else {
      setSelectedCourseIds(courses.map(c => c.id))
    }
  }

  if (!user || user.role !== 'admin') {
    return <AdminLayout title="Bulk Operations"><div>Unauthorized</div></AdminLayout>
  }

  return (
    <AdminLayout title="Bulk Operations">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Back Link */}
        <Link href={`/admin/tenants/${tenantId}`} style={{ color: '#667eea', textDecoration: 'none', fontSize: 14, marginBottom: 16, display: 'inline-block' }}>
          ← Back to Tenant
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Bulk Operations</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            Import users via CSV and manage course assignments in bulk
          </p>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 24, 
          borderBottom: '2px solid #e2e8f0' 
        }}>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'import' ? '#ec4899' : 'transparent',
              color: activeTab === 'import' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'import' ? '3px solid #ec4899' : 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: '6px 6px 0 0',
            }}
          >
            CSV Import
          </button>
          <button
            onClick={() => setActiveTab('assign')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'assign' ? '#ec4899' : 'transparent',
              color: activeTab === 'assign' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'assign' ? '3px solid #ec4899' : 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: '6px 6px 0 0',
            }}
          >
            Bulk Assign
          </button>
        </div>

        {/* CSV Import Tab */}
        {activeTab === 'import' && (
          <>
            {/* Upload Section */}
            <div style={{ 
              background: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: 8, 
              padding: 24, 
              marginBottom: 24 
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Import Users from CSV</h2>
              <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: 14 }}>
                Upload a CSV file to create multiple users at once. Download the template below for the correct format.
              </p>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button
                  onClick={downloadTemplate}
                  style={{
                    padding: '10px 20px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  📥 Download Template
                </button>
              </div>

              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 8,
                padding: '40px 20px',
                textAlign: 'center',
                background: '#f8fafc',
                position: 'relative',
              }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
                <div style={{ pointerEvents: 'none' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📤</div>
                  <p style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>
                    {uploadingFile ? 'Uploading...' : 'Drop CSV file here or click to browse'}
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
                    Supports .csv files only
                  </p>
                </div>
              </div>
            </div>

            {/* Import Jobs History */}
            <div style={{ 
              background: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: 8, 
              padding: 24 
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Import History</h2>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading...</div>
              ) : jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No import jobs yet
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Success</th>
                      <th>Failed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id}>
                        <td>{new Date(job.createdAt).toLocaleString()}</td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background: 
                              job.status === 'completed' ? '#d1fae5' :
                              job.status === 'failed' ? '#fee2e2' :
                              job.status === 'processing' ? '#fef3c7' : '#e5e7eb',
                            color: 
                              job.status === 'completed' ? '#065f46' :
                              job.status === 'failed' ? '#991b1b' :
                              job.status === 'processing' ? '#92400e' : '#374151',
                          }}>
                            {job.status.toUpperCase()}
                          </span>
                        </td>
                        <td>{job.totalRecords}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{job.successCount}</td>
                        <td style={{ color: '#dc2626', fontWeight: 600 }}>{job.failureCount}</td>
                        <td>
                          {job.errorLog && job.failureCount > 0 && (
                            <button
                              onClick={() => {
                                alert(`Errors:\n${JSON.stringify(job.errorLog, null, 2)}`)
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: 14,
                                textDecoration: 'underline',
                              }}
                            >
                              View Errors
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Bulk Assign Tab */}
        {activeTab === 'assign' && (
          <>
            <div style={{ 
              background: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: 8, 
              padding: 24, 
              marginBottom: 24 
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Bulk Course Assignment</h2>
              <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: 14 }}>
                Select users and courses to assign or unassign courses in bulk.
              </p>

              {/* Action Selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Action</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setAssignAction('assign')}
                    style={{
                      padding: '8px 16px',
                      background: assignAction === 'assign' ? '#10b981' : '#fff',
                      color: assignAction === 'assign' ? '#fff' : '#666',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Assign Courses
                  </button>
                  <button
                    onClick={() => setAssignAction('unassign')}
                    style={{
                      padding: '8px 16px',
                      background: assignAction === 'unassign' ? '#dc2626' : '#fff',
                      color: assignAction === 'unassign' ? '#fff' : '#666',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Unassign Courses
                  </button>
                </div>
              </div>

              {/* Selection Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Users Selection */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={{ fontWeight: 600, fontSize: 14 }}>
                      Select Users ({selectedUserIds.length} selected)
                    </label>
                    <button
                      onClick={selectAllUsers}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: 13,
                        textDecoration: 'underline',
                      }}
                    >
                      {selectedUserIds.length === users.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    maxHeight: 300,
                    overflow: 'auto',
                    background: '#fafafa',
                  }}>
                    {users.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>No users available</div>
                    ) : (
                      users.map(u => (
                        <label
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            background: selectedUserIds.includes(u.id) ? '#eff6ff' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => toggleUserSelection(u.id)}
                            style={{ marginRight: 10 }}
                          />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{u.fullName || u.email}</div>
                            {u.fullName && (
                              <div style={{ fontSize: 12, color: '#666' }}>{u.email}</div>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Courses Selection */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={{ fontWeight: 600, fontSize: 14 }}>
                      Select Courses ({selectedCourseIds.length} selected)
                    </label>
                    <button
                      onClick={selectAllCourses}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: 13,
                        textDecoration: 'underline',
                      }}
                    >
                      {selectedCourseIds.length === courses.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    maxHeight: 300,
                    overflow: 'auto',
                    background: '#fafafa',
                  }}>
                    {courses.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>No courses available</div>
                    ) : (
                      courses.map(c => (
                        <label
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            background: selectedCourseIds.includes(c.id) ? '#eff6ff' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCourseIds.includes(c.id)}
                            onChange={() => toggleCourseSelection(c.id)}
                            style={{ marginRight: 10 }}
                          />
                          <span style={{ fontSize: 14 }}>{c.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Execute Button */}
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <button
                  onClick={handleBulkAssign}
                  disabled={loading || selectedUserIds.length === 0 || selectedCourseIds.length === 0}
                  style={{
                    padding: '12px 32px',
                    background: loading ? '#cbd5e1' : (assignAction === 'assign' ? '#10b981' : '#dc2626'),
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Processing...' : assignAction === 'assign' ? 'Assign Courses' : 'Unassign Courses'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default BulkOperationsPage
