import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '../../../../src/components/AdminLayout'
import { useAuth } from '../../../../src/auth/AuthProvider'
import api from '../../../../src/lib/api'
import styles from '../../../../styles/admin-table.module.css'

interface Enrollment {
  id: string
  userId: string
  courseId: string
  tenantId: string
  createdAt: string
  completedAt: string | null
  certificateId: string | null
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

const EnrollmentsPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query

  const [enrollments, setEnrollments] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnrollModal, setShowEnrollModal] = useState(false)

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')

  // Filters
  const [filterCourse, setFilterCourse] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (!tenantId) return
    loadData()
  }, [tenantId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, coursesData] = await Promise.all([
        api.getUsers(tenantId as string),
        api.getTenantCourses(tenantId as string),
      ])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      
      // Load enrollments for each course
      const allEnrollments: any[] = []
      for (const course of coursesData) {
        try {
          const courseEnrollments = await api.getCourseEnrollments(tenantId as string, course.id)
          if (Array.isArray(courseEnrollments)) {
            allEnrollments.push(...courseEnrollments.map((e: any) => ({
              ...e,
              course: { id: course.id, title: course.title }
            })))
          }
        } catch (err) {
          console.error(`Failed to load enrollments for course ${course.id}`)
        }
      }
      setEnrollments(allEnrollments)
    } catch (err) {
      console.error('Failed to load data:', err)
      alert('Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedCourseId) {
      alert('Please select both user and course')
      return
    }
    try {
      await api.enrollUser(selectedUserId, selectedCourseId, tenantId as string)
      setShowEnrollModal(false)
      setSelectedUserId('')
      setSelectedCourseId('')
      loadData()
      alert('User enrolled successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to enroll user')
    }
  }

  const handleUnenroll = async (enrollmentId: string, userName: string, courseName: string) => {
    if (!confirm(`Unenroll ${userName} from "${courseName}"?`)) return
    try {
      await api.unenrollUser(enrollmentId)
      loadData()
      alert('User unenrolled successfully')
    } catch (err) {
      alert('Failed to unenroll user')
    }
  }

  // Filter enrollments
  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filterCourse && enrollment.courseId !== filterCourse) return false
    if (filterStatus === 'completed' && !enrollment.completedAt) return false
    if (filterStatus === 'in-progress' && enrollment.completedAt) return false
    return true
  })

  if (!user || user.role !== 'admin') {
    return <AdminLayout title="Enrollments"><div>Unauthorized</div></AdminLayout>
  }

  return (
    <AdminLayout title="Enrollments">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Back Link */}
        <Link href={`/admin/tenants/${tenantId}`} style={{ color: '#667eea', textDecoration: 'none', fontSize: 14, marginBottom: 16, display: 'inline-block' }}>
          ← Back to Tenant
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Course Enrollments</h1>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
              Manage learner course enrollments and track progress
            </p>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + Enroll User
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
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Filter by Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 14,
                background: 'white'
              }}
            >
              <option value="all">All</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => {
                setFilterCourse('')
                setFilterStatus('all')
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
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{enrollments.length}</div>
            <div style={{ fontSize: 14, color: '#666' }}>Total Enrollments</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
              {enrollments.filter(e => !e.completedAt).length}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>In Progress</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
              {enrollments.filter(e => e.completedAt).length}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>Completed</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>
              {enrollments.filter(e => e.certificateId).length}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>With Certificates</div>
          </div>
        </div>

        {/* Enrollments Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
        ) : filteredEnrollments.length === 0 ? (
          <div style={{ 
            background: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: 8, 
            padding: '40px 20px', 
            textAlign: 'center' 
          }}>
            <p style={{ fontSize: 16, color: '#666', margin: '0 0 16px 0' }}>
              No enrollments found
            </p>
            <p style={{ fontSize: 14, color: '#999', margin: 0 }}>
              Enroll users in courses to get started
            </p>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Course</th>
                  <th>Enrolled Date</th>
                  <th>Status</th>
                  <th>Certificate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map(enrollment => (
                  <tr key={enrollment.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{enrollment.user?.fullName || enrollment.user?.email || 'Unknown'}</div>
                      {enrollment.user?.fullName && (
                        <div style={{ fontSize: 12, color: '#666' }}>{enrollment.user?.email}</div>
                      )}
                    </td>
                    <td>{enrollment.course?.title || 'Unknown Course'}</td>
                    <td>{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                    <td>
                      {enrollment.completedAt ? (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#dbeafe',
                          color: '#1e40af',
                        }}>
                          Completed {new Date(enrollment.completedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#fef3c7',
                          color: '#92400e',
                        }}>
                          In Progress
                        </span>
                      )}
                    </td>
                    <td>
                      {enrollment.certificateId ? (
                        <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Issued</span>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: 8, fontSize: 14 }}>
                      <button
                        onClick={() => handleUnenroll(
                          enrollment.id,
                          enrollment.user?.fullName || enrollment.user?.email || 'User',
                          enrollment.course?.title || 'Course'
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
                        Unenroll
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Enroll Modal */}
        {showEnrollModal && (
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
                <h2 style={{ margin: 0, fontSize: 20 }}>Enroll User in Course</h2>
                <button onClick={() => setShowEnrollModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleEnroll}>
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
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName || user.email}
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

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Enroll User
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
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

export default EnrollmentsPage
