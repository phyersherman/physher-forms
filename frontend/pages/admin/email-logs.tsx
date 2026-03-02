import React, { useEffect, useState } from 'react'
import AdminLayout from '../../src/components/AdminLayout'
import { AdminTable, TableColumn } from '../../src/components/AdminTable'
import { useTableData } from '../../src/hooks/useTableData'
import { useAuth } from '../../src/auth/AuthProvider'
import api from '../../src/lib/api'
import styles from '../../styles/admin-table.module.css'

interface EmailLog {
  id: string
  tenantId?: string
  recipientEmail: string
  subject: string
  templateName: string
  status: string
  providerMsgId?: string
  errorMessage?: string
  sentAt: string
}

const EmailLogsPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [limit, setLimit] = useState(50)
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([])

  const { data: logs, loading, refetch } = useTableData<EmailLog>({
    fetchFn: async () => {
      const data = await api.getEmailLogs(selectedTenant || undefined, limit)
      if (Array.isArray(data)) {
        return data
      }
      return []
    },
    deps: [currentUser, limit, selectedTenant],
  })

  useEffect(() => {
    // Fetch tenants for filter dropdown
    const fetchTenants = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/tenants', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setTenants(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Failed to fetch tenants:', err)
      }
    }
    
    if (currentUser?.role === 'admin') {
      fetchTenants()
    }
  }, [currentUser])

  if (!currentUser) return <div>Loading...</div>
  if (currentUser.role !== 'admin') return <div>Unauthorized</div>

  const getStatusBadge = (status: string) => {
    const colors = {
      sent: { bg: '#e8f5e9', text: '#2e7d32' },
      failed: { bg: '#ffebee', text: '#c62828' },
      bounced: { bg: '#fff3cd', text: '#f57c00' },
    }
    const color = colors[status as keyof typeof colors] || colors.sent

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

  const getTemplateBadge = (template: string) => {
    const colors = {
      invite: { bg: '#e3f2fd', text: '#1976d2' },
      welcome: { bg: '#f3e5f5', text: '#7b1fa2' },
      reset: { bg: '#fce4ec', text: '#c2185b' },
    }
    const color = colors[template as keyof typeof colors] || { bg: '#f5f5f5', text: '#666' }

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
        {template.charAt(0).toUpperCase() + template.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTenantName = (tenantId?: string) => {
    if (!tenantId) return <em style={{ color: '#999' }}>Global</em>
    const tenant = tenants.find(t => t.id === tenantId)
    return tenant ? tenant.name : tenantId.slice(0, 8) + '...'
  }

  const columns: TableColumn<EmailLog>[] = [
    {
      key: 'sentAt',
      header: 'Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'recipientEmail',
      header: 'Recipient',
      render: (value) => <strong>{value}</strong>,
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (value, item) => (
        <div>
          <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value}
          </div>
          {item.errorMessage && (
            <div style={{ fontSize: '12px', color: '#c62828', marginTop: '4px', fontFamily: 'monospace' }}>
              Error: {item.errorMessage}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'templateName',
      header: 'Template',
      render: (value) => getTemplateBadge(value),
    },
    {
      key: 'tenantId',
      header: 'Tenant',
      render: (value) => getTenantName(value),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => getStatusBadge(value),
    },
  ]

  return (
    <AdminLayout title="Email Logs">
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>View all sent emails and their delivery status</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value={50}>50 logs</option>
            <option value={100}>100 logs</option>
            <option value={200}>200 logs</option>
            <option value={500}>500 logs</option>
          </select>
          <button
            onClick={refetch}
            className={styles.secondaryButton}
            style={{ padding: '8px 16px' }}
          >
            Refresh
          </button>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyStateText="No email logs found."
      />
    </AdminLayout>
  )
}

export default EmailLogsPage
