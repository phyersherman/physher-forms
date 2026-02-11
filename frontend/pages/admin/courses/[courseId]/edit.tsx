import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../src/auth/AuthProvider'
import AdminLayout from '../../../../src/components/AdminLayout'
import { CourseEditor, CourseData, Chapter } from '../../../../src/components/CourseEditor'
import { IBlock } from '../../../../src/components/BlockEditor/types'

const EditCoursePage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { courseId, tenantId } = router.query
  const [course, setCourse] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (courseId) {
      fetch(`http://localhost:4000/api/courses/${courseId}`, { credentials: 'include' })
        .then(r => {
          if (!r.ok) throw new Error('Failed to load course')
          return r.json()
        })
        .then(c => {
          setCourse(c)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to load course:', err)
          setCourse(null)
          setLoading(false)
        })
    }
    
    if (tenantId && typeof tenantId === 'string') {
      fetch(`http://localhost:4000/api/tenants/${tenantId}`, { credentials: 'include' })
        .then(r => r.json())
        .then(t => setTenant(t))
        .catch(() => setTenant(null))
    }
  }, [courseId, tenantId])

  if (!user) return <AdminLayout title="Edit Course"><div>Loading...</div></AdminLayout>
  if (user.role !== 'admin') return <AdminLayout title="Edit Course"><div>Unauthorized</div></AdminLayout>
  if (loading) return <AdminLayout title="Edit Course"><div>Loading course...</div></AdminLayout>
  if (!course) return <AdminLayout title="Edit Course"><div>Course not found</div></AdminLayout>

  // Transform API data to CourseData format
  const initialData: CourseData = {
    id: course.id,
    title: course.title,
    description: course.description || '',
    tenantId: course.tenantId || tenantId as string || null,
    chapters: (course.chapters || []).map((ch: any): Chapter => ({
      id: ch.id,
      title: ch.title,
      modules: (ch.modules || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        slug: m.slug || m.title.toLowerCase().replace(/\s+/g, '-'),
        summary: m.summary || '',
        blocks: (m.blocks || []).map((b: any): IBlock => ({
          id: b.id,
          type: b.type,
          content: b.content,
          config: b.config,
          order_index: b.order_index,
        })),
        order_index: m.order_index,
      })),
      assessmentTitle: ch.assessmentTitle,
      assessmentRequired: ch.assessmentRequired,
      prerequisiteChapterIds: ch.prerequisiteChapterIds || [],
      order_index: ch.order_index,
    })),
  }

  // Determine back URL based on context
  const backUrl = tenantId 
    ? `/admin/tenants/${tenantId}` 
    : course.tenantId 
      ? `/admin/tenants/${course.tenantId}`
      : '/admin/courses'

  const handleSave = async (data: CourseData) => {
    setSaving(true)
    try {
      // Get CSRF token
      const csrfRes = await fetch('http://localhost:4000/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
      })
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken

      // Update course
      const updateRes = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          chapters: data.chapters,
        })
      })

      if (!updateRes.ok) {
        throw new Error('Failed to update course')
      }

      alert('Course saved successfully')
    } catch (err) {
      console.error('Save error:', err)
      alert(`Save failed: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const csrfRes = await fetch('http://localhost:4000/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
      })
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken

      const res = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken }
      })

      if (!res.ok) {
        throw new Error('Failed to delete course')
      }

      alert('Course deleted')
      router.push(backUrl)
    } catch (err) {
      console.error('Delete error:', err)
      alert(`Delete failed: ${err}`)
    }
  }

  const pageTitle = tenant ? `Edit Course - ${tenant.name}` : 'Edit Course'

  return (
    <AdminLayout title={pageTitle}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => router.push(`/admin/courses/${courseId}/analytics`)}
          style={{
            padding: '8px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          📊 View Analytics
        </button>
      </div>
      <CourseEditor
        mode="edit"
        entityType="course"
        initialData={initialData}
        onSave={handleSave}
        onDelete={handleDelete}
        saving={saving}
        backUrl={backUrl}
        backLabel={tenant ? `Back to ${tenant.name}` : 'Back to Courses'}
      />
    </AdminLayout>
  )
}

export default EditCoursePage
