import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import api from '../src/lib/api'

const AcceptInvitePage: React.FC = () => {
  const router = useRouter()
  const { token } = router.query
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Ensure CSRF token is loaded
    api.refreshCsrf()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!token || typeof token !== 'string') {
      setError('Invalid invitation link')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await api.acceptInvite(token, password)
      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation. The link may be expired or invalid.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .pulse-animation {
            animation: pulse 2s infinite;
          }
        `}</style>
        <div
          style={{
            maxWidth: '450px',
            width: '100%',
            backgroundColor: 'white',
            padding: '48px 32px',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
        >
          <div
            className="pulse-animation"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 28px',
              fontSize: '36px',
              color: 'white',
            }}
          >
            ✓
          </div>
          <h1 style={{ marginTop: 0, marginBottom: '12px', fontSize: '28px', color: '#333', fontWeight: 700 }}>
            All Set!
          </h1>
          <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6', fontSize: '16px' }}>
            Your password has been set successfully. Redirecting you to login...
          </p>
          <div style={{ fontSize: '12px', color: '#999' }}>
            If you're not redirected, <Link href="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>click here</Link>.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          maxWidth: '450px',
          width: '100%',
          backgroundColor: 'white',
          padding: '48px 32px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: '8px', fontSize: '28px', color: '#333', fontWeight: 700 }}>
          Welcome!
        </h1>
        <p style={{ color: '#666', marginBottom: '32px', fontSize: '15px', lineHeight: '1.5' }}>
          Set your password to activate your account
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div
              style={{
                backgroundColor: '#fee',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px',
                color: '#c33',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#667eea')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
              }}
              placeholder="Password (min 8 characters)"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#667eea')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
              }}
              placeholder="Confirm password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={(e) => !loading && ((e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)')}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
            }}
          >
            {loading ? 'Setting Password...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: '#666' }}>Already have an account? </span>
          <Link href="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AcceptInvitePage
