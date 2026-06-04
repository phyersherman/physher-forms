import React, { useEffect, useState } from 'react'
import AdminLayout from '../../../src/components/AdminLayout'
import { useAuth } from '../../../src/auth/AuthProvider'
import { useRouter } from 'next/router'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface Completion {
  id: string
  displayHint: string
  formId: string
  formName: string
  completedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const AdminCompletionsPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [completions, setCompletions] = useState<Completion[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  const loadCompletions = async (p: number) => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/admin/completions?page=${p}&limit=50`, {
        credentials: 'include',
      })
      if (res.status === 401) { router.replace('/login'); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load completions')
      setCompletions(data.data)
      setPagination(data.pagination)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCompletions(page) }, [page])

  const handleReset = async (completion: Completion) => {
    if (!confirm(`Reset completion for ${completion.displayHint} on "${completion.formName}"?`)) return
    try {
      const res = await fetch(`${API_BASE}/admin/completions/${completion.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Reset failed')
      await loadCompletions(page)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleExport = () => {
    window.location.href = `${API_BASE}/admin/completions/export`
  }

  return (
    <AdminLayout title="Completions">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Completion Log</h2>
          {pagination && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              {pagination.total} total completions
            </p>
          )}
        </div>
        <button
          onClick={handleExport}
          style={{
            background: '#fff', color: '#374151',
            border: '1px solid #d1d5db',
            padding: '10px 20px', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Export CSV
        </button>
      </div>

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : completions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No completions recorded yet.</p>
        </div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={th}>Email</th>
                <th style={th}>Form</th>
                <th style={th}>Completed At</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {completions.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={td}><code style={{ fontSize: '13px' }}>{c.displayHint}</code></td>
                  <td style={td}>{c.formName}</td>
                  <td style={{ ...td, color: '#6b7280' }}>
                    {new Date(c.completedAt).toLocaleString()}
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => handleReset(c)}
                      style={{
                        background: 'none',
                        border: '1px solid #fca5a5',
                        color: '#dc2626',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: page === pagination.pages ? 'not-allowed' : 'pointer', opacity: page === pagination.pages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}

const th: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const td: React.CSSProperties = { padding: '14px 16px', fontSize: '14px' }

export default AdminCompletionsPage
