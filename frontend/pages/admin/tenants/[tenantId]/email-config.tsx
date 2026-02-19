import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../../../src/components/AdminLayout'
import { useAuth } from '../../../../src/auth/AuthProvider'
import api from '../../../../src/lib/api'
import styles from '../../../../styles/admin-table.module.css'

interface EmailConfig {
  id: string
  tenantId: string | null
  provider: string
  apiKey: string
  domain: string
  fromEmail: string
  fromName: string
  replyToEmail?: string
  isActive: boolean
}

const EmailConfigPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)

  // Form state
  const [provider, setProvider] = useState('mailgun')
  const [apiKey, setApiKey] = useState('')
  const [domain, setDomain] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (tenantId && typeof tenantId === 'string') {
      loadConfig()
    }
  }, [tenantId])

  const loadConfig = async () => {
    if (!tenantId || typeof tenantId !== 'string') return

    setLoading(true)
    try {
      const data = await api.getEmailConfig(tenantId)
      setConfig(data)
      // Populate form fields
      setProvider(data.provider)
      setApiKey('') // Don't show actual API key
      setDomain(data.domain)
      setFromEmail(data.fromEmail)
      setFromName(data.fromName)
      setReplyToEmail(data.replyToEmail || '')
      setIsActive(data.isActive)
    } catch (err: any) {
      // No config exists yet
      setConfig(null)
      setEditing(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!tenantId || typeof tenantId !== 'string') return

    if (!domain || !fromEmail || !fromName) {
      alert('Domain, from email, and from name are required')
      return
    }

    if (!config && !apiKey) {
      alert('API key is required when creating a new configuration')
      return
    }

    try {
      const data = {
        provider,
        apiKey,
        domain,
        fromEmail,
        fromName,
        replyToEmail: replyToEmail || undefined,
        isActive,
      }

      if (config) {
        // Update existing
        await api.updateEmailConfig(config.id, apiKey ? data : {
          provider,
          domain,
          fromEmail,
          fromName,
          replyToEmail: replyToEmail || undefined,
          isActive,
        })
        alert('Email configuration updated successfully')
      } else {
        // Create new
        await api.createEmailConfig(data, tenantId)
        alert('Email configuration created successfully')
      }

      setEditing(false)
      loadConfig()
    } catch (err: any) {
      alert(err.message || 'Failed to save email configuration')
    }
  }

  const handleTestEmail = async () => {
    if (!config) {
      alert('Please save the configuration first')
      return
    }

    if (!testEmail) {
      alert('Please enter a test email address')
      return
    }

    setTestingEmail(true)
    try {
      await api.testEmailConfig(config.id, testEmail)
      alert('Test email sent successfully! Check your inbox.')
      setTestEmail('')
    } catch (err: any) {
      alert(err.message || 'Failed to send test email')
    } finally {
      setTestingEmail(false)
    }
  }

  const handleDelete = async () => {
    if (!config) return

    if (!confirm('Are you sure you want to delete this email configuration?')) {
      return
    }

    try {
      await api.deleteEmailConfig(config.id)
      alert('Email configuration deleted successfully')
      setConfig(null)
      setEditing(true)
    } catch (err: any) {
      alert(err.message || 'Failed to delete email configuration')
    }
  }

  if (!user) return <div>Loading...</div>
  if (user.role !== 'admin') return <div>Unauthorized</div>

  return (
    <AdminLayout title="Email Configuration">
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>
            Configure email settings for this tenant
          </p>
        </div>
        {config && !editing && (
          <button onClick={() => setEditing(true)} className={styles.primaryButton}>
            Edit Configuration
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div style={{ maxWidth: '800px' }}>
          {/* Configuration Form */}
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Email Provider Settings</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: editing ? 'white' : '#f5f5f5',
                }}
              >
                <option value="mailgun">Mailgun</option>
              </select>
              <small style={{ color: '#666', fontSize: '12px' }}>
                Currently only Mailgun is supported
              </small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                API Key {!config && <span style={{ color: '#d32f2f' }}>*</span>}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={!editing}
                placeholder={config ? '••••••••' : 'Enter your Mailgun API key'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: editing ? 'white' : '#f5f5f5',
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                {config
                  ? 'Leave blank to keep existing API key'
                  : 'Your API key will be encrypted and stored securely'}
              </small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Domain <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={!editing}
                placeholder="mg.yourdomain.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: editing ? 'white' : '#f5f5f5',
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Your Mailgun domain (e.g., mg.example.com)
              </small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                From Email <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                disabled={!editing}
                placeholder="noreply@yourdomain.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: editing ? 'white' : '#f5f5f5',
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Email address that will appear in the "From" field
              </small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                From Name <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                disabled={!editing}
                placeholder="Learning Platform"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: editing ? 'white' : '#f5f5f5',
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Name that will appear in the "From" field
              </small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Reply-To Email (optional)
              </label>
              <input
                type="email"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                disabled={!editing}
                placeholder="support@yourdomain.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: editing ? 'white' : '#f5f5f5',
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Email address for replies (defaults to from email)
              </small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: editing ? 'pointer' : 'default' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={!editing}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontWeight: 500 }}>Active</span>
              </label>
              <small style={{ color: '#666', fontSize: '12px', marginLeft: '24px', display: 'block' }}>
                Enable or disable email sending for this tenant
              </small>
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={handleSave} className={styles.primaryButton}>
                  {config ? 'Update Configuration' : 'Create Configuration'}
                </button>
                {config && (
                  <button
                    onClick={() => {
                      setEditing(false)
                      loadConfig()
                    }}
                    className={styles.secondaryButton}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {config && !editing && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={handleDelete} className={styles.secondaryButton} style={{ color: '#d32f2f' }}>
                  Delete Configuration
                </button>
              </div>
            )}
          </div>

          {/* Test Email Section */}
          {config && !editing && (
            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Test Email Configuration</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                Send a test email to verify your configuration is working correctly.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter test email address"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className={styles.primaryButton}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {testingEmail ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}

export default EmailConfigPage
