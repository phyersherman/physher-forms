/**
 * Respondent Form Selection Screen
 *
 * Shows active forms for the tenant. Completed forms show a "Completed" badge.
 * Incomplete forms link to /forms/[id] for display.
 */

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface Form {
  id: string
  name: string
  description: string | null
  isActive: boolean
  completed: boolean
}

const FormsPage: React.FC = () => {
  const router = useRouter()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const success = router.query.success === '1'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/respondent/forms`, {
          credentials: 'include',
        })
        if (res.status === 401) {
          router.replace('/')
          return
        }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load forms')
        setForms(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const handleLogout = async () => {
    await fetch(`${API_BASE}/respondent/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/')
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Loading…</p>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
          My Surveys
        </h1>
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: '1px solid #e5e7eb',
            padding: '8px 16px', borderRadius: '6px',
            color: '#6b7280', cursor: 'pointer', fontSize: '14px',
          }}
        >
          Sign Out
        </button>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        {success && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: '8px', padding: '12px 16px',
            color: '#16a34a', fontSize: '14px', marginBottom: '24px',
          }}>
            Survey submitted successfully. Thank you!
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: '8px', padding: '12px 16px',
            color: '#dc2626', fontSize: '14px', marginBottom: '24px',
          }}>
            {error}
          </div>
        )}

        {forms.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '48px', textAlign: 'center',
            border: '1px solid #e5e7eb',
          }}>
            <p style={{ color: '#6b7280', margin: 0 }}>
              No surveys are currently available. Check back later.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {forms.map((form) => (
              <div
                key={form.id}
                style={{
                  background: form.completed ? '#f9fafb' : '#fff',
                  border: `1px solid ${form.completed ? '#e5e7eb' : '#e0e7ff'}`,
                  borderRadius: '12px',
                  padding: '24px',
                  opacity: form.completed ? 0.75 : 1,
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                      {form.name}
                    </h2>
                    {form.description && (
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                        {form.description}
                      </p>
                    )}
                  </div>
                  {form.completed ? (
                    <span style={{
                      flexShrink: 0,
                      background: '#dcfce7', color: '#15803d',
                      padding: '4px 12px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: 600,
                    }}>
                      Completed
                    </span>
                  ) : (
                    <Link
                      href={`/forms/${form.id}`}
                      style={{
                        flexShrink: 0,
                        display: 'inline-block',
                        background: '#6366f1', color: '#fff',
                        padding: '8px 20px', borderRadius: '8px',
                        fontSize: '14px', fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Start
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default FormsPage
