import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import api from '../src/lib/api'

const ResetPasswordPage: React.FC = () => {
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
      setError('Invalid reset link')
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
      await api.resetPassword(token, password)
      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may be expired or invalid.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          padding: '20px',
        }}
      >
        <div
          style={{
            maxWidth: '450px',
            width: '100%',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
            }}
          >
            ✓
          </div>
          <h1 style={{ marginTop: 0, marginBottom: '16px', fontSize: '24px', color: '#333' }}>
            Password Reset Successfully!
          </h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Your password has been updated. Redirecting you to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '450px',
          width: '100%',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: '8px', fontSize: '24px', color: '#333' }}>
          Reset Password
        </h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div
              style={{
                backgroundColor: '#ffebee',
                border: '1px solid #ef5350',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '24px',
                color: '#c62828',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: '#333',
              }}
            >
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="Enter your new password"
              disabled={loading}
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Must be at least 8 characters
            </small>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: '#333',
              }}
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="Confirm your new password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: '#666' }}>Remember your password? </span>
          <Link href="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
