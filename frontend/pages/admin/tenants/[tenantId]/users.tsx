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

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

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

      <AdminTable
        columns={columns}
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
