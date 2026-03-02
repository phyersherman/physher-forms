import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../../../src/components/AdminLayout'
import { AdminTable, TableColumn } from '../../../../src/components/AdminTable'
import { useTableData } from '../../../../src/hooks/useTableData'
import { useAuth } from '../../../../src/auth/AuthProvider'
import api from '../../../../src/lib/api'
import styles from '../../../../styles/admin-table.module.css'

interface User {
  id: string
  email: string
  fullName?: string
  role: string
  status: string
  createdAt: string
  lastLoginAt?: string
}

interface Course {
  id: string
  title: string
  description?: string
}

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [assigningCourses, setAssigningCourses] = useState(false)

  const { data: users, loading, deleteItem, refetch } = useTableData<User>({
    fetchFn: async () => {
      if (!tenantId || typeof tenantId !== 'string') return []
      const data = await api.getUsers(tenantId)
      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object') {
        return Array.isArray(data.users) ? data.users : []
      }
      return []
    },
    onDeleteFn: async (userId: string) => {
      if (!tenantId || typeof tenantId !== 'string') return
      await api.deleteUser(tenantId, userId)
    },
    onDeleteSuccess: () => {
      alert('User deleted successfully')
    },
    deps: [currentUser, tenantId],
  })

  const handleDeleteUser = async (user: User) => {
    if (currentUser?.id === user.id) {
      alert('You cannot delete your own account')
      return
    }

    if (!confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteItem(user.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  const handleDisableUser = async (user: User) => {
    if (!tenantId || typeof tenantId !== 'string') return
    
    if (currentUser?.id === user.id) {
      alert('You cannot disable your own account')
      return
    }

    try {
      await api.disableUser(tenantId, user.id)
      refetch()
      alert('User disabled successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to disable user')
    }
  }

  const handleEnableUser = async (user: User) => {
    if (!tenantId || typeof tenantId !== 'string') return

    try {
      await api.enableUser(tenantId, user.id)
      refetch()
      alert('User enabled successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to enable user')
    }
  }

  const handleInviteUser = async (user: User) => {
    if (!tenantId || typeof tenantId !== 'string') return

    if (!confirm(`Send an invitation email to ${user.email}?`)) {
      return
    }

    try {
      await api.inviteUser(tenantId, user.id)
      alert('Invitation sent successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invitation')
    }
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    setShowModal(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
  }

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  const handleSelectAllUsers = () => {
    if (selectedUserIds.size === users.length && users.length > 0) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)))
    }
  }

  const handleAssignCoursesToUsers = async () => {
    if (selectedCourseIds.size === 0) {
      alert('Please select at least one course')
      return
    }

    setAssigningCourses(true)
    try {
      if (!tenantId || typeof tenantId !== 'string') return
      
      await api.bulkAssignCourses({
        userIds: Array.from(selectedUserIds),
        courseIds: Array.from(selectedCourseIds),
        tenantId,
      })
      alert(`Successfully assigned ${selectedCourseIds.size} course(s) to ${selectedUserIds.size} user(s)`)
      setSelectedUserIds(new Set())
      setSelectedCourseIds(new Set())
      setShowAssignModal(false)
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign courses')
    } finally {
      setAssigningCourses(false)
    }
  }

  const handleBulkDelete = async () => {
    setShowDeleteConfirm(false)
    const userIds = Array.from(selectedUserIds)
    let deleted = 0
    let failed = 0

    for (const userId of userIds) {
      if (currentUser?.id === userId) {
        alert('Cannot delete your own account')
        failed++
        continue
      }

      try {
        await deleteItem(userId)
        deleted++
      } catch (err) {
        console.error('Failed to delete user:', err)
        failed++
      }
    }

    setSelectedUserIds(new Set())
    alert(`Deleted ${deleted} user(s). ${failed > 0 ? `Failed to delete ${failed}.` : ''}`)
  }

  const handleOpenAssignModal = async () => {
    setShowAssignModal(true)
    setLoadingCourses(true)
    try {
      if (!tenantId || typeof tenantId !== 'string') return
      const courseList = await api.getTenantCourses(tenantId)
      setCourses(Array.isArray(courseList) ? courseList : [])
    } catch (err) {
      alert('Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleCloseSaveUser = () => {
    handleCloseModal()
  }

  const handleSaveUser = async (data: {
    email: string
    fullName?: string
    role: string
    password?: string
  }) => {
    if (!tenantId || typeof tenantId !== 'string') return

    try {
      if (editingUser) {
        // Update existing user
        await api.updateUser(tenantId, editingUser.id, {
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        })
        alert('User updated successfully')
      } else {
        // Create new user
        await api.createUser(tenantId, data)
        alert('User created successfully')
      }
      refetch()
      handleCloseModal()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save user')
    }
  }

  if (!currentUser) return <div>Loading...</div>
  if (currentUser.role !== 'admin') return <div>Unauthorized</div>

  const getStatusBadge = (status: string) => {
    const colors = {
      active: { bg: '#e8f5e9', text: '#2e7d32' },
      invited: { bg: '#fff3cd', text: '#f57c00' },
      disabled: { bg: '#ffebee', text: '#c62828' },
    }
    const color = colors[status as keyof typeof colors] || colors.active

    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: color.bg,
          color: color.text,
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: { bg: '#e3f2fd', text: '#1976d2' },
      instructor: { bg: '#f3e5f5', text: '#7b1fa2' },
      learner: { bg: '#fce4ec', text: '#c2185b' },
    }
    const color = colors[role as keyof typeof colors] || colors.learner

    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: color.bg,
          color: color.text,
        }}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  const columns: (TableColumn<User> & { header?: React.ReactNode })[] = [
    {
      key: 'checkbox',
      header: (
        <input
          type="checkbox"
          checked={selectedUserIds.size === users.length && users.length > 0}
          onChange={handleSelectAllUsers}
          style={{ cursor: 'pointer' }}
          title="Select all users"
        />
      ) as any,
      render: (_, user) => (
        <input
          type="checkbox"
          checked={selectedUserIds.has(user.id)}
          onChange={() => handleSelectUser(user.id)}
          style={{ cursor: 'pointer' }}
        />
      ),
      width: '40px',
    },
    {
      key: 'email',
      header: 'Email',
      render: (value) => <strong>{value}</strong>,
    },
    {
      key: 'fullName',
      header: 'Full Name',
      render: (value) => value || '—',
    },
    {
      key: 'role',
      header: 'Role',
      render: (value) => getRoleBadge(value),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (value) =>
        value ? new Date(value).toLocaleDateString() : 'Never',
    },
  ]

  return (
    <AdminLayout title="Users">
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>
            Manage users for this tenant
          </p>
        </div>
        <button onClick={handleCreateUser} className={styles.primaryButton}>
          + New User
        </button>
      </div>

      {selectedUserIds.size > 0 && (
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: '#e3f2fd',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 600 }}>
            {selectedUserIds.size} user(s) selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleOpenAssignModal}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🎓 Assign Course
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🗑️ Delete
            </button>
            <button
              onClick={() => setSelectedUserIds(new Set())}
              style={{
                padding: '8px 16px',
                backgroundColor: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <AdminTable
        columns={columns as TableColumn<User>[]}
        data={users}
        loading={loading}
        emptyStateText="No users yet. Create your first user to get started."
        emptyStateAction={
          <button
            onClick={handleCreateUser}
            className={styles.primaryButton}
            style={{ marginTop: 16 }}
          >
            Create First User
          </button>
        }
        actions={(user) => (
          <>
            <button
              onClick={() => handleEditUser(user)}
              style={{
                border: 'none',
                background: 'none',
                padding: '0 8px 0 0',
                cursor: 'pointer',
              }}
            >
              <span className={styles.secondaryButton}>Edit</span>
            </button>
            {user.status === 'invited' && (
              <button
                onClick={() => handleInviteUser(user)}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '0 8px 0 0',
                  cursor: 'pointer',
                }}
              >
                <span className={styles.secondaryButton}>Resend Invite</span>
              </button>
            )}
            {user.status === 'active' && currentUser?.id !== user.id && (
              <button
                onClick={() => handleDisableUser(user)}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '0 8px 0 0',
                  cursor: 'pointer',
                }}
              >
                <span className={styles.secondaryButton}>Disable</span>
              </button>
            )}
            {user.status === 'disabled' && (
              <button
                onClick={() => handleEnableUser(user)}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '0 8px 0 0',
                  cursor: 'pointer',
                }}
              >
                <span className={styles.secondaryButton}>Enable</span>
              </button>
            )}
            {currentUser?.id !== user.id && (
              <button
                onClick={() => handleDeleteUser(user)}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
              >
                <span
                  className={styles.secondaryButton}
                  style={{ color: '#d32f2f' }}
                >
                  Delete
                </span>
              </button>
            )}
          </>
        )}
      />

      {showModal && (
        <UserFormModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}

      {showDeleteConfirm && (
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
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            maxWidth: '500px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}>
            <h2 style={{ marginTop: 0 }}>Delete Users?</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Are you sure you want to delete {selectedUserIds.size} user(s)? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Delete {selectedUserIds.size} User(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
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
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}>
            <h2 style={{ marginTop: 0 }}>Assign Courses to Users</h2>
            <p style={{ color: '#666' }}>
              Assigning {selectedCourseIds.size} course(s) to {selectedUserIds.size} user(s)
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>
                Select Courses:
              </label>
              {loadingCourses ? (
                <div>Loading courses...</div>
              ) : courses.length === 0 ? (
                <div style={{ color: '#999' }}>No courses available</div>
              ) : (
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  padding: '12px',
                }}>
                  {courses.map(course => (
                    <div key={course.id} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id={`course-${course.id}`}
                        checked={selectedCourseIds.has(course.id)}
                        onChange={(e) => {
                          const newCourses = new Set(selectedCourseIds)
                          if (e.target.checked) {
                            newCourses.add(course.id)
                          } else {
                            newCourses.delete(course.id)
                          }
                          setSelectedCourseIds(newCourses)
                        }}
                        style={{ marginRight: '12px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`course-${course.id}`} style={{ cursor: 'pointer', flex: 1 }}>
                        <strong>{course.title}</strong>
                        {course.description && (
                          <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '14px' }}>
                            {course.description}
                          </p>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedCourseIds(new Set())
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCoursesToUsers}
                disabled={selectedCourseIds.size === 0 || assigningCourses}
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedCourseIds.size === 0 || assigningCourses ? '#ccc' : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedCourseIds.size === 0 || assigningCourses ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {assigningCourses ? 'Assigning...' : `Assign ${selectedCourseIds.size} Course(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

interface UserFormModalProps {
  user: User | null
  onClose: () => void
  onSave: (data: {
    email: string
    fullName?: string
    role: string
    password?: string
  }) => void
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave }) => {
  const [email, setEmail] = useState(user?.email || '')
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [role, setRole] = useState(user?.role || 'learner')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      alert('Email is required')
      return
    }

    onSave({
      email,
      fullName: fullName || undefined,
      role,
      password: password || undefined,
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>
          {user ? 'Edit User' : 'Create New User'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="learner">Learner</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {!user && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Password (optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Leave blank to send an invitation email
              </small>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="submit"
              className={styles.primaryButton}
              style={{ flex: 1 }}
            >
              {user ? 'Update User' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.secondaryButton}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UsersPage
