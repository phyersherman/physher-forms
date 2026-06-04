import React, { useState } from 'react'
import { useRouter } from 'next/router'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

type Stage = 'email' | 'code'

const RespondentLoginPage: React.FC = () => {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/respondent/send-code`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send code')
      setStage('code')
      setInfo('A 6-digit code was sent to your email. It expires in 10 minutes.')
    } catch (err: any) {
      setError(err.message || 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/respondent/send-code`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resend code')
      setInfo('A new code was sent to your email.')
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/respondent/verify-code`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      router.push('/forms')
    } catch (err: any) {
      setError(err.message || 'Verification failed')
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
        background: '#fff',
        borderRadius: '12px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 700, color: '#1a1a2e' }}>
          Survey Access
        </h1>
        <p style={{ margin: '0 0 32px', color: '#666', fontSize: '14px' }}>
          Enter your work email to access your assigned surveys.
        </p>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: '8px', padding: '12px 16px',
            color: '#dc2626', fontSize: '14px', marginBottom: '20px',
          }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: '8px', padding: '12px 16px',
            color: '#16a34a', fontSize: '14px', marginBottom: '20px',
          }}>
            {info}
          </div>
        )}

        {stage === 'email' ? (
          <form onSubmit={sendCode}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@yourorganization.com"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '16px', marginBottom: '20px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#a5b4fc' : '#6366f1',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending\u2026' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
              Code sent to <strong>{email}</strong>
            </p>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              6-Digit Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
              placeholder="123456"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '24px', letterSpacing: '0.3em',
                textAlign: 'center', marginBottom: '20px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                width: '100%', padding: '13px',
                background: loading || code.length !== 6 ? '#a5b4fc' : '#6366f1',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '16px', fontWeight: 600,
                cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verifying\u2026' : 'Verify'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={resendCode}
                disabled={loading}
                style={{
                  background: 'none', border: 'none',
                  color: '#6366f1', cursor: 'pointer',
                  fontSize: '14px', textDecoration: 'underline',
                }}
              >
                Resend Code
              </button>
              <span style={{ margin: '0 12px', color: '#ccc' }}>|</span>
              <button
                type="button"
                onClick={() => { setStage('email'); setCode(''); setError(null); setInfo(null) }}
                style={{
                  background: 'none', border: 'none',
                  color: '#6b7280', cursor: 'pointer',
                  fontSize: '14px', textDecoration: 'underline',
                }}
              >
                Change Email
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

export default RespondentLoginPage
