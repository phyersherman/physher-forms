import React, { useState, useEffect } from 'react'
import { useAuth } from '../src/auth/AuthProvider'
import { useRouter } from 'next/router'
import Link from 'next/link'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@acme.local')
  const [password, setPassword] = useState('adminpass')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()
  const router = useRouter()
  const { user } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await auth.login(email, password)
      // redirect to returnTo if present
      const returnTo = (router.query.returnTo as string) || '/'
      router.push(returnTo)
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 8px 0',
          color: '#333',
          textAlign: 'center',
        }}>
          Sign In
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: '0 0 24px 0',
          textAlign: 'center',
        }}>
          Welcome back to your learning platform
        </p>

        {error && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: '#fee',
            color: '#c33',
            borderRadius: '6px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ marginBottom: '20px' }} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '6px',
              color: '#333',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '6px',
              color: '#333',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '24px 0',
          gap: '12px',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
          <span style={{ fontSize: '12px', color: '#999' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
        </div>

        {/* Magic Code Alternative */}
        <Link href="/passwordless-login" style={{
          display: 'block',
          textAlign: 'center',
          padding: '12px',
          background: '#f0f4ff',
          color: '#667eea',
          border: '1px solid #667eea',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '16px',
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e8ecff'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f0f4ff'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          🔐 Sign in with Magic Code
        </Link>

        {/* Footer Links */}
        <div style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#666',
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <Link href="/forgot-password" style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '600',
            }}>
              Forgot Password?
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default LoginPage
