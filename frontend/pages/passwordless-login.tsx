import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import api from '../src/lib/api'
import { useAuth } from '../src/auth/AuthProvider'

type Step = 'email' | 'code' | 'success'

const PasswordlessLoginPage: React.FC = () => {
  const router = useRouter()
  const { user, refetchUser } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Countdown timer for resend button
  useEffect(() => {
    if (step === 'code' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (countdown === 0 && step === 'code') {
      setCanResend(true)
    }
  }, [step, countdown])

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!email) {
      setError('Please enter your email address')
      return
    }

    try {
      setLoading(true)
      const response = await api.sendMagicCode(email)
      setExpiresAt(new Date(response.expiresAt))
      setStep('code')
      setMessage('Check your email for the login code')
      setCanResend(false)
      setCountdown(60)
    } catch (err: any) {
      if (err?.message?.includes('wait')) {
        setError('Please wait before requesting another code')
      } else {
        setError(err?.message || 'Failed to send login code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!code) {
      setError('Please enter the code from your email')
      return
    }

    try {
      setLoading(true)
      const response = await api.verifyMagicCode(email, code)
      setMessage('Login successful! Redirecting...')
      
      // Refresh the auth context to get the authenticated user
      await refetchUser()
      
      // Now redirect to dashboard; auth context should have the user
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError(null)
    setMessage(null)

    try {
      setLoading(true)
      const response = await api.resendMagicCode(email)
      setExpiresAt(new Date(response.expiresAt))
      setMessage('Code resent! Check your email.')
      setCanResend(false)
      setCountdown(60)
    } catch (err: any) {
      if (err?.message?.includes('wait')) {
        setError('Please wait before requesting another code')
      } else {
        setError(err?.message || 'Failed to resend code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setCode('')
    setError(null)
    setMessage(null)
  }

  const formatTimeRemaining = (expiresAt: Date | null) => {
    if (!expiresAt) return ''
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()
    if (diff <= 0) return 'Expired'
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div style={{
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
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: '#333',
          }}>
            Magic Code Login
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0,
          }}>
            Sign in with a one-time code sent to your email
          </p>
        </div>

        {/* Step: Request Email */}
        {step === 'email' && (
          <form onSubmit={handleRequestCode} noValidate>
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#333',
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
              />
              <p style={{
                fontSize: '12px',
                color: '#999',
                margin: '4px 0 0 0',
              }}>
                Enter the email associated with your account
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              style={{
                width: '100%',
                padding: '12px',
                background: loading || !email ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading || !email ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => !loading && !email && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? 'Sending...' : 'Send Login Code'}
            </button>
          </form>
        )}

        {/* Step: Verify Code */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} noValidate>
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

            {message && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#efe',
                color: '#3c3',
                borderRadius: '6px',
                fontSize: '14px',
              }}>
                {message}
              </div>
            )}

            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#f5f5f5',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#666',
            }}>
              <p style={{ margin: '0 0 4px 0' }}>📧 Sent to:</p>
              <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{email}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#333',
              }}>
                6-Digit Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '20px',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
              />
              {expiresAt && (
                <p style={{
                  fontSize: '12px',
                  color: new Date() > expiresAt ? '#c33' : '#999',
                  margin: '4px 0 0 0',
                }}>
                  ⏱️ Code expires in: {formatTimeRemaining(expiresAt)}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                background: loading || code.length !== 6 ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => !loading && code.length === 6 && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || loading}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: canResend ? '#f0f0f0' : '#f5f5f5',
                  color: canResend ? '#667eea' : '#999',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: canResend ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => canResend && (e.currentTarget.style.background = '#e8e8e8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = canResend ? '#f0f0f0' : '#f5f5f5')}
              >
                {canResend ? '🔄 Resend Code' : `Resend in ${countdown}s`}
              </button>
            </div>

            <button
              type="button"
              onClick={handleBackToEmail}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                color: '#667eea',
                border: '1px solid #667eea',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              ← Use Different Email
            </button>
          </form>
        )}

        {/* Footer Links */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          textAlign: 'center',
          fontSize: '13px',
        }}>
          <p style={{ margin: '0 0 8px 0', color: '#666' }}>
            Have a password?{' '}
            <Link href="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
              Sign in with password
            </Link>
          </p>
          <p style={{ margin: 0, color: '#666' }}>
            Don't have an account?{' '}
            <Link href="/" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PasswordlessLoginPage
