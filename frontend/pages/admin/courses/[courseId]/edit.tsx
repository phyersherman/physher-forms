import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../src/auth/AuthProvider'
import AdminLayout from '../../../../src/components/AdminLayout'
import api from '../../../../src/lib/api'
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
    const loadData = async () => {
      try {
        if (courseId && typeof courseId === 'string') {
          const c = await api.getCourse(courseId)
          setCourse(c)
        }
        
        if (tenantId && typeof tenantId === 'string') {
          const t = await api.getTenant(tenantId)
          setTenant(t)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setCourse(null)
        setTenant(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
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
      await api.updateCourse(courseId as string, data.title, data.description)
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
      await api.deleteCourse(courseId as string)
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
      {courseId && (
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
      )}
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
