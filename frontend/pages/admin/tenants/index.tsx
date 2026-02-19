import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AdminLayout from '../../../src/components/AdminLayout'
import { useAuth } from '../../../src/auth/AuthProvider'
import api from '../../../src/lib/api'
import styles from '../../../styles/admin-table.module.css'

const TenantsPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  useEffect(() => {
    const saved = localStorage.getItem('selectedTenantId')
    if (saved) setSelectedTenantId(saved)
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    const loadTenants = async () => {
      try {
        const data = await api.getTenants()
        if (Array.isArray(data)) {
          setTenants(data)
        } else if (data && typeof data === 'object') {
          setTenants(Array.isArray(data.tenants) ? data.tenants : [])
        } else {
          setTenants([])
        }
      } catch (err) {
        setTenants([])
      } finally {
        setLoading(false)
      }
    }
    loadTenants()
  }, [user])

  const handleViewTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    localStorage.setItem('selectedTenantId', tenantId)
    router.push(`/admin/tenants/${tenantId}`)
  }

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return
    }
    
    try {
      await api.deleteTenant(tenantId)
      setTenants(tenants.filter(t => t.id !== tenantId))
      alert('Tenant deleted successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete tenant')
    }
  }

  if (!user) return <div>Loading...</div>
  if (user.role !== 'admin') return <div>Unauthorized</div>

  return (
    <AdminLayout title="Tenants">
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>Manage course portals and white-label instances</p>
        </div>
        <Link href="/admin/tenants/new" className={styles.primaryButton}>
          + New Tenant
        </Link>
      </div>

      {loading ? (
        <p>Loading tenants...</p>
      ) : !Array.isArray(tenants) || tenants.length === 0 ? (
        <div className={styles.empty}>
          <p>No tenants yet. Create your first tenant to get started.</p>
          <Link href="/admin/tenants/new" className={styles.primaryButton}>
            Create First Tenant
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => (
                <tr key={tenant.id}>
                  <td className={styles.nameCell}>
                    <strong>{tenant.name}</strong>
                  </td>
                  <td>{tenant.domain || '—'}</td>
                  <td className={styles.actions}>
                    <button onClick={() => handleViewTenant(tenant.id)} style={{ border: 'none', background: 'none', padding: '0 8px 0 0', cursor: 'pointer' }}>
                      <span className={styles.secondaryButton}>View Tenant</span>
                    </button>
                    <button onClick={() => handleDeleteTenant(tenant.id)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
                      <span className={styles.secondaryButton} style={{ color: '#d32f2f' }}>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}

export default TenantsPage
