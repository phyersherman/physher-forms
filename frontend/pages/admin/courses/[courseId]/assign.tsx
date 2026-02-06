import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../../../src/components/AdminLayout'
import api from '../../../../src/lib/api'

interface Course {
  id: string
  title: string
  description: string | null
}

interface Tenant {
  id: string
  name: string
}

export default function AssignCoursePage() {
  const router = useRouter()
  const { courseId } = router.query
  const [course, setCourse] = useState<Course | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (!courseId) return

    const load = async () => {
      try {
        const [courseData, tenantsData] = await Promise.all([
          api.getCourse(courseId as string),
          fetch('/api/tenants', {
            method: 'GET',
            credentials: 'include',
          }).then(r => r.json()),
        ])
        setCourse(courseData)
        setTenants(tenantsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseId])

  const handleAssign = async () => {
    if (!selectedTenantId || !courseId) return

    setAssigning(true)
    try {
      await api.assignCourseToTenant(courseId as string, selectedTenantId, course?.title)
      setSuccess(`Course "${course?.title}" assigned to tenant successfully!`)
      setTimeout(() => {
        router.push('/admin/courses/global')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign course')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>
  if (error && !course) return <AdminLayout><div style={{ color: 'red' }}>Error: {error}</div></AdminLayout>
  if (!course) return <AdminLayout><div>Course not found</div></AdminLayout>

  return (
    <AdminLayout>
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <h1>Assign Course to Tenant</h1>
        
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <h3>Course: {course.title}</h3>
          <p>{course.description || 'No description'}</p>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</div>}
        {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

        <label style={{ display: 'block', marginBottom: '10px' }}>
          Select Tenant:
          <select
            value={selectedTenantId}
            onChange={e => setSelectedTenantId(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="">-- Choose a tenant --</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleAssign}
            disabled={!selectedTenantId || assigning}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedTenantId && !assigning ? '#0070f3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedTenantId && !assigning ? 'pointer' : 'not-allowed',
            }}
          >
            {assigning ? 'Assigning...' : 'Assign Course'}
          </button>
          <button
            onClick={() => router.push('/admin/courses/global')}
            disabled={assigning}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
