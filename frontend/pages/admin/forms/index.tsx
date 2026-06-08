import React, { useEffect, useState } from 'react'
import AdminLayout from '../../../src/components/AdminLayout'
import { useAuth } from '../../../src/auth/AuthProvider'
import { useRouter } from 'next/router'
import api from '../../../src/lib/api'

interface Form {
  id: string
  name: string
  description: string | null
  jotformEmbedUrl: string
  isActive: boolean
  createdAt: string
}

interface ModalState {
  open: boolean
  form: Partial<Form>
  isEdit: boolean
}

const AdminFormsPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string>('')
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ open: false, form: {}, isEdit: false })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    const resolveTenant = async () => {
      if (!user) return

      if (user.tenantId) {
        setTenantId(user.tenantId)
        return
      }

      const savedTenantId = typeof window !== 'undefined' ? localStorage.getItem('selectedTenantId') || '' : ''
      if (savedTenantId) {
        setTenantId(savedTenantId)
        return
      }

      try {
        const tenants = await api.getTenants()
        const firstTenantId = Array.isArray(tenants) && tenants.length > 0 ? tenants[0].id : ''
        if (firstTenantId) {
          setTenantId(firstTenantId)
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedTenantId', firstTenantId)
          }
        }
      } catch {
        // no-op: loadForms will show a clearer tenant error
      }
    }

    resolveTenant()
  }, [user])

  const loadForms = async () => {
    try {
      setLoading(true)
      if (!tenantId) {
        setForms([])
        setError('Tenant context is required to manage forms.')
        return
      }

      const data = await api.getAdminForms(tenantId)
      setForms(data)
      setError(null)
    } catch (e: any) {
      if (e?.statusCode === 401) {
        router.replace('/login')
        return
      }
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadForms() }, [tenantId])

  const openCreate = () => setModal({ open: true, form: { isActive: true }, isEdit: false })
  const openEdit = (form: Form) => setModal({ open: true, form: { ...form }, isEdit: true })
  const closeModal = () => { setModal({ open: false, form: {}, isEdit: false }); setSaveError(null) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const { id, ...body } = modal.form
      if (!tenantId) throw new Error('Tenant context is required to save forms')

      if (modal.isEdit && id) {
        await api.updateAdminForm(id, {
          tenantId,
          name: body.name,
          description: body.description,
          jotformEmbedUrl: body.jotformEmbedUrl,
          isActive: body.isActive,
        })
      } else {
        await api.createAdminForm({
          tenantId,
          name: body.name || '',
          description: body.description,
          jotformEmbedUrl: body.jotformEmbedUrl || '',
          isActive: body.isActive,
        })
      }

      closeModal()
      await loadForms()
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (form: Form) => {
    try {
      await api.updateAdminForm(form.id, {
        tenantId,
        isActive: !form.isActive,
      })
      await loadForms()
    } catch (e: any) {
      setError(e.message || 'Failed to update form status')
    }
  }

  const handleDelete = async (form: Form) => {
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return
    try {
      await api.deleteAdminForm(form.id, tenantId)
      await loadForms()
    } catch (e: any) {
      setError(e.message || 'Failed to delete form')
    }
  }

  return (
    <AdminLayout title="Forms">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Forms</h2>
        <button
          onClick={openCreate}
          style={{
            background: '#6366f1', color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          + New Form
        </button>
      </div>

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : forms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No forms yet. Create your first form.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={th}>Name</th>
              <th style={th}>Description</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={td}><strong>{form.name}</strong></td>
                <td style={{ ...td, color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {form.description || '—'}
                </td>
                <td style={td}>
                  <button
                    onClick={() => toggleActive(form)}
                    style={{
                      background: form.isActive ? '#dcfce7' : '#fee2e2',
                      color: form.isActive ? '#15803d' : '#dc2626',
                      border: 'none', padding: '4px 12px',
                      borderRadius: '20px', fontSize: '12px',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {form.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td style={td}>
                  <button onClick={() => openEdit(form)} style={actionBtn}>Edit</button>
                  <button onClick={() => handleDelete(form)} style={{ ...actionBtn, color: '#dc2626', borderColor: '#fca5a5' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create/Edit Modal */}
      {modal.open && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '32px', width: '100%', maxWidth: '540px',
            maxHeight: '90vh', overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700 }}>
              {modal.isEdit ? 'Edit Form' : 'New Form'}
            </h3>
            {saveError && <p style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>{saveError}</p>}
            <form onSubmit={handleSave}>
              <Field label="Name *">
                <input
                  required value={modal.form.name || ''}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, name: e.target.value } }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={modal.form.description || ''}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, description: e.target.value } }))}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </Field>
              <Field label="Form Embed (URL, iframe, or full embed HTML) *">
                <textarea
                  required
                  placeholder={'https://form.jotform.com/...\n\nOR paste iframe:\n<iframe src="https://form.jotform.com/..." ...></iframe>\n\nOR paste full embed HTML/source'}
                  value={modal.form.jotformEmbedUrl || ''}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, jotformEmbedUrl: e.target.value } }))}
                  rows={8}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={modal.form.isActive ?? true}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, isActive: e.target.checked } }))}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Active (visible to respondents)</span>
              </label>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ ...actionBtn, padding: '10px 20px' }}>Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: saving ? '#a5b4fc' : '#6366f1',
                    color: '#fff', border: 'none',
                    padding: '10px 24px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const th: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const td: React.CSSProperties = { padding: '14px 16px', fontSize: '14px' }

const actionBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid #e5e7eb',
  padding: '6px 14px',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  marginRight: '8px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
      {label}
    </label>
    {children}
  </div>
)

export default AdminFormsPage
