import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '../src/lib/api'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Ensure CSRF token is loaded
    api.refreshCsrf()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      return
    }

    setLoading(true)

    try {
      await api.forgotPassword(email)
      setSuccess(true)
    } catch (err: any) {
      // Always show success message for security (don't reveal if email exists)
      setSuccess(true)
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
              backgroundColor: '#2196f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
            }}
          >
            ✉
          </div>
          <h1 style={{ marginTop: 0, marginBottom: '16px', fontSize: '24px', color: '#333' }}>
            Check Your Email
          </h1>
          <p style={{ color: '#666', marginBottom: '8px' }}>
            If an account exists with <strong>{email}</strong>, a password reset link has been sent.
          </p>
          <p style={{ color: '#666', marginBottom: '32px', fontSize: '14px' }}>
            Please check your inbox and follow the instructions to reset your password.
            The link will expire in 1 hour.
          </p>
          <Link href="/login">
            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              Return to Login
            </button>
          </Link>
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
          Forgot Password
        </h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Enter your email address and we'll send you a link to reset your password
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: '#333',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="your.email@example.com"
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
            {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage
