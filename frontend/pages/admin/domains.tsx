import React, { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../src/components/AdminLayout'
import { useAuth } from '../../src/auth/AuthProvider'
import api from '../../src/lib/api'
import styles from '../../styles/admin-table.module.css'

interface Tenant {
  id: string
  name: string
  allowedDomains?: string[]
}

const normalizeDomain = (value: string) =>
  value.trim().toLowerCase().replace(/^@+/, '')

const parseDomainsInput = (raw: string): string[] => {
  const pieces = raw
    .split(/[\n,;\s]+/)
    .map(normalizeDomain)
    .filter(Boolean)

  return [...new Set(pieces)]
}

const DomainsPage: React.FC = () => {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) || null,
    [tenants, selectedTenantId]
  )

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await api.getTenants()
        const tenantList = Array.isArray(response)
          ? response
          : Array.isArray(response?.tenants)
            ? response.tenants
            : []

        setTenants(tenantList)

        const savedTenant = typeof window !== 'undefined' ? localStorage.getItem('selectedTenantId') : null
        const authTenantId = user?.tenantId
        const defaultTenantId =
          (authTenantId && tenantList.some((t: Tenant) => t.id === authTenantId) ? authTenantId : '') ||
          (savedTenant && tenantList.some((t: Tenant) => t.id === savedTenant) ? savedTenant : '') ||
          tenantList[0]?.id ||
          ''

        setSelectedTenantId(defaultTenantId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tenants')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.tenantId])

  useEffect(() => {
    if (!selectedTenant) {
      setInputValue('')
      return
    }

    setInputValue((selectedTenant.allowedDomains || []).join('\n'))

    if (typeof window !== 'undefined' && selectedTenant.id) {
      localStorage.setItem('selectedTenantId', selectedTenant.id)
    }
  }, [selectedTenant])

  const handleSave = async () => {
    if (!selectedTenant) return

    setError('')
    setMessage('')
    setSaving(true)

    try {
      const approvedDomains = parseDomainsInput(inputValue)

      await api.updateTenant(selectedTenant.id, {
        allowedDomains: approvedDomains,
      })

      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === selectedTenant.id
            ? { ...tenant, allowedDomains: approvedDomains }
            : tenant
        )
      )

      setInputValue(approvedDomains.join('\n'))
      setMessage('Approved domains updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update approved domains')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <AdminLayout title="Domains"><div>Loading...</div></AdminLayout>
  if (user.role !== 'admin') return <AdminLayout title="Domains"><div>Unauthorized</div></AdminLayout>

  return (
    <AdminLayout title="Domains">
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>
            Configure approved email domains used to validate form access code requests.
          </p>
        </div>
      </div>

      {loading ? (
        <div>Loading domains...</div>
      ) : tenants.length === 0 ? (
        <div>No tenants found. Create a tenant first to configure approved domains.</div>
      ) : (
        <div style={{ maxWidth: 760 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Organization
            </label>
            <div
              style={{
                width: '100%',
                maxWidth: 360,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d7dee8',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontSize: 14,
              }}
            >
              {selectedTenant?.name || 'Organization'}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label htmlFor="approvedDomains" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Approved domains
            </label>
            <textarea
              id="approvedDomains"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              rows={8}
              placeholder={'example.com\nsubsidiary.org\nvendor.net'}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d7dee8',
                borderRadius: 8,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            />
            <p style={{ color: '#596579', marginTop: 8, marginBottom: 0, fontSize: 13 }}>
              Enter one domain per line. Comma, space, and semicolon separators are also supported.
            </p>
          </div>

          {error && (
            <p style={{ color: '#b42318', marginTop: 16, marginBottom: 0 }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ color: '#067647', marginTop: 16, marginBottom: 0 }}>
              {message}
            </p>
          )}

          <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={saving || !selectedTenant}
            >
              {saving ? 'Saving...' : 'Save Domains'}
            </button>
            <span style={{ fontSize: 13, color: '#596579' }}>
              Access codes are sent only to emails matching these domains.
            </span>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default DomainsPage
