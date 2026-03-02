import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '../../src/components/AdminLayout'
import { AdminTable, TableColumn } from '../../src/components/AdminTable'
import { useTableData } from '../../src/hooks/useTableData'
import { useAuth } from '../../src/auth/AuthProvider'
import api from '../../src/lib/api'
import styles from '../../styles/admin-table.module.css'

interface User {
  id: string
  email: string
  fullName?: string
  role: string
  status: string
  createdAt: string
  lastLoginAt?: string
}

const GlobalUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const { data: users, loading, deleteItem, refetch } = useTableData<User>({
    fetchFn: async () => {
      const data = await api.getGlobalUsers()
      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object') {
        return Array.isArray(data.users) ? data.users : []
      }
      return []
    },
    onDeleteFn: api.deleteGlobalUser,
    onDeleteSuccess: () => {
      alert('User deleted successfully')
    },
    deps: [currentUser],
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
    if (currentUser?.id === user.id) {
      alert('You cannot disable your own account')
      return
    }

    try {
      await api.disableGlobalUser(user.id)
      refetch()
      alert('User disabled successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to disable user')
    }
  }

  const handleEnableUser = async (user: User) => {
    try {
      await api.enableGlobalUser(user.id)
      refetch()
      alert('User enabled successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to enable user')
    }
  }

  const handleInviteUser = async (user: User) => {
    if (!confirm(`Send an invitation email to ${user.email}?`)) {
      return
    }

    try {
      await api.inviteGlobalUser(user.id)
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

  const handleSaveUser = async (data: {
    email: string
    fullName?: string
    role: string
    password?: string
  }) => {
    try {
      if (editingUser) {
        await api.updateGlobalUser(editingUser.id, {
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        })
        alert('User updated successfully')
      } else {
        await api.createGlobalUser(data)
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

  const columns: TableColumn<User>[] = [
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
      render: (value) => (value ? new Date(value).toLocaleDateString() : 'Never'),
    },
  ]

  return (
    <AdminLayout title="Global Users">
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>
            Platform-wide administrators not tied to specific tenants
          </p>
        </div>
        <button onClick={handleCreateUser} className={styles.primaryButton}>
          + New User
        </button>
      </div>

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        emptyStateText="No global users yet. Create your first platform administrator."
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
                <span className={styles.secondaryButton}>Re-send Invite</span>
              </button>
            )}
            {user.status === 'disabled' ? (
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
            ) : (
              user.id !== currentUser?.id && (
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
              )
            )}
            {user.id !== currentUser?.id && (
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
  }) => Promise<void>
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave }) => {
  const [email, setEmail] = useState(user?.email || '')
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [role, setRole] = useState(user?.role || 'admin')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!email) {
      setError('Email is required')
      return
    }

    if (!user && password && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await onSave({
        email,
        fullName: fullName || undefined,
        role,
        password: password || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setLoading(false)
    }
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
          borderRadius: '8px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>
          {user ? 'Edit User' : 'Create New User'}
        </h2>

        {error && (
          <div style={{ backgroundColor: '#ffebee', padding: '12px', borderRadius: '4px', marginBottom: '16px', color: '#c62828' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="learner">Learner</option>
            </select>
          </div>

          {!user && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Password {user ? '(leave blank to keep current)' : '(optional - leave blank to send invitation)'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              {password && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: loading ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GlobalUsersPage
