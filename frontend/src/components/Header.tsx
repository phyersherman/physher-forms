import React from 'react'
import Link from 'next/link'
import { useAuth } from '../auth/AuthProvider'

const Header: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <header style={{ borderBottom: '1px solid #e6eef2', padding: '0.5rem 1rem', background: 'white' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--color-primary)' }} />
          <strong>Acme LMS</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user === undefined ? (
            <span style={{ color: '#64748b' }}>Loading...</span>
          ) : user === null ? (
            <>
              <Link href="/login" className="btn-primary">
                Login
              </Link>
            </>
          ) : (
            <>
              {user.role === 'admin' && (
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Link href="/admin/domains">Domains</Link>
                  <Link href="/admin/course-templates">Templates</Link>
                </nav>
              )}
              <span style={{ color: '#0f172a' }}>{user.email}</span>
              <button onClick={logout} className="btn-primary">Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
