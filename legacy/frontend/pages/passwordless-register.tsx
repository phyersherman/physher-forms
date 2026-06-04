import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import api from '../src/lib/api'

interface TenantBranding {
  id: string
  name: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
}

interface Course {
  id: string
  title: string
  description?: string
}

const PasswordlessRegisterPage: React.FC = () => {
  const router = useRouter()
  const { token } = router.query

  const [step, setStep] = useState<'loading' | 'register' | 'verify' | 'success'>('loading')
  const [linkData, setLinkData] = useState<any>(null)
  const [tenant, setTenant] = useState<TenantBranding | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [magicCode, setMagicCode] = useState('')
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    validateToken()
  }, [token])

  // Countdown timer for resend button
  useEffect(() => {
    if (step === 'verify' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (countdown === 0) {
      setCanResend(true)
    }
  }, [step, countdown])

  const validateToken = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.validatePasswordlessToken(token as string)
      setLinkData(data)
      setTenant(data.tenant)
      setCourses(data.courses || [])
      // Pre-fill organization if provided
      if (data.organization) {
        setOrganization(data.organization)
      }
      setStep('register')
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired link')
      setStep('register')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email) {
      setError('Please provide your full name and email')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Register the user
      const result = await api.registerViaPasswordlessLink({
        token: token as string,
        fullName,
        email,
        organization: organization || undefined,
      })

      // Store user ID and enrolled courses
      setUserId(result.user.id)
      if (result.enrolledCourses) {
        setCourses(result.enrolledCourses)
      }

      // Move to verification step
      setStep('verify')
      setCountdown(60)
      setCanResend(false)
      setMessage('Check your email for the verification code')
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your information and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!magicCode || magicCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Verify the magic code
      const result = await api.verifyMagicCode(email, magicCode)

      // Backend returns { message, user } on success
      if (result && result.user) {
        setStep('success')
        // Redirect to first enrolled course or dashboard after brief delay
        setTimeout(() => {
          if (courses.length > 0) {
            router.push(`/course/${courses[0].id}`)
          } else {
            router.push('/dashboard')
          }
        }, 2000)
      } else {
        setError('Invalid or expired code. Please try again.')
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.resendMagicCode(email)
      setExpiresAt(new Date(response.expiresAt))
      setCountdown(60)
      setCanResend(false)
      setMagicCode('')
      setMessage('A new verification code has been sent to your email')
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
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

  const primaryColor = tenant?.primaryColor || '#667eea'
  const secondaryColor = tenant?.secondaryColor || '#764ba2'

  if (step === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        padding: '16px',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite',
          }} />
          <p>Validating link...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (step === 'register') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
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
            {tenant?.logoUrl && (
              <img 
                src={tenant.logoUrl} 
                alt={tenant.name} 
                style={{ height: '48px', marginBottom: '16px', objectFit: 'contain' }}
              />
            )}
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              color: '#333',
            }}>
              {tenant?.name ? `Welcome to ${tenant.name}` : 'Welcome!'}
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
            }}>
              Create your account to get started
            </p>
            {linkData?.linkName && (
              <div style={{
                marginTop: '12px',
                display: 'inline-block',
                padding: '6px 12px',
                background: `${primaryColor}15`,
                borderRadius: '20px',
              }}>
                <p style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: primaryColor,
                  margin: 0,
                }}>
                  {linkData.linkName}
                </p>
              </div>
            )}
          </div>

          {/* Show enrolled courses */}
          {courses.length > 0 && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}>
              <p style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#333',
                margin: '0 0 8px 0',
              }}>
                📚 You'll be enrolled in {courses.length === 1 ? 'this course' : 'these courses'}:
              </p>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {courses.map(course => (
                  <li key={course.id} style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: course !== courses[courses.length - 1] ? '6px' : 0,
                  }}>
                    {course.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          <form onSubmit={handleRegister} noValidate>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#333',
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
                onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
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
                onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
                onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
              />
            </div>

            {!linkData?.organization && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#333',
                }}>
                  Organization (Optional)
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Acme Corp"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !fullName || !email}
              style={{
                width: '100%',
                padding: '12px',
                background: loading || !fullName || !email ? '#ccc' : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading || !fullName || !email ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => !loading && fullName && email && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? 'Creating Account...' : 'Continue →'}
            </button>
          </form>

          <p style={{
            fontSize: '12px',
            color: '#999',
            margin: '16px 0 0 0',
            textAlign: 'center',
          }}>
            You'll receive a 6-digit verification code via email
          </p>
        </div>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
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
            {tenant?.logoUrl && (
              <img 
                src={tenant.logoUrl} 
                alt={tenant.name} 
                style={{ height: '40px', marginBottom: '16px', objectFit: 'contain' }}
              />
            )}
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${primaryColor}15`,
              borderRadius: '50%',
              fontSize: '32px',
            }}>
              📧
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              color: '#333',
            }}>
              Verify Your Email
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: '0 0 4px 0',
            }}>
              We sent a code to
            </p>
            <p style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              margin: 0,
            }}>
              {email}
            </p>
          </div>

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

          <form onSubmit={handleVerifyCode} noValidate>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#333',
                textAlign: 'center',
              }}>
                6-Digit Code
              </label>
              <input
                type="text"
                value={magicCode}
                onChange={(e) => setMagicCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
                onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
              />
              {expiresAt && (
                <p style={{
                  fontSize: '12px',
                  color: new Date() > expiresAt ? '#c33' : '#999',
                  margin: '4px 0 0 0',
                  textAlign: 'center',
                }}>
                  ⏱️ Code expires in: {formatTimeRemaining(expiresAt)}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || magicCode.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                background: loading || magicCode.length !== 6 ? '#ccc' : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading || magicCode.length !== 6 ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => !loading && magicCode.length === 6 && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend || loading}
              style={{
                width: '100%',
                padding: '10px',
                background: canResend ? '#f0f0f0' : '#f5f5f5',
                color: canResend ? primaryColor : '#999',
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
          </form>

          <p style={{
            fontSize: '12px',
            color: '#999',
            margin: '16px 0 0 0',
            textAlign: 'center',
          }}>
            💡 Check your spam folder if you don't see the code
          </p>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        padding: '16px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
        }}>
          {tenant?.logoUrl && (
            <img 
              src={tenant.logoUrl} 
              alt={tenant.name} 
              style={{ height: '40px', marginBottom: '16px', objectFit: 'contain' }}
            />
          )}
          <div style={{
            width: '64px',
            height: '64px',
            background: '#e8f5e9',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
          }}>
            ✓
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: '#333',
          }}>
            All Set!
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '0 0 16px 0',
          }}>
            Your account is ready to go.
          </p>
          {courses.length > 0 && (
            <p style={{
              fontSize: '13px',
              color: primaryColor,
              fontWeight: '600',
              margin: '0 0 24px 0',
            }}>
              Redirecting to your courses...
            </p>
          )}
          <div style={{
            width: '40px',
            height: '4px',
            background: primaryColor,
            borderRadius: '2px',
            margin: '0 auto',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
        </div>
      </div>
    )
  }

  return null
}

export default PasswordlessRegisterPage
