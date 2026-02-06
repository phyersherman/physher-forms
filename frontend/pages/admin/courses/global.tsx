import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminLayout from '../../../src/components/AdminLayout'
import api from '../../../src/lib/api'
import styles from '../../../styles/admin-table.module.css'

interface Course {
  id: string
  title: string
  description: string | null
  created_at: string
}

export default function GlobalCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await api.getGlobalCourses()
        setCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>
  if (error) return <AdminLayout><div style={{ color: 'red' }}>Error: {error}</div></AdminLayout>

  return (
    <AdminLayout>
      <div style={{ padding: '20px' }}>
        <h1>Global Courses</h1>
        <p>These courses are available across all tenants and can be assigned to specific tenants.</p>
        
        <div style={{ marginBottom: '20px' }}>
          <Link href="/admin/courses/new" style={{ 
            padding: '10px 20px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-block'
          }}>
            + Create New Global Course
          </Link>
        </div>

        {courses.length === 0 ? (
          <p>No global courses yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{course.description || '—'}</td>
                  <td>{new Date(course.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/courses/${course.id}/edit`}>Edit</Link>
                    {' | '}
                    <Link href={`/admin/courses/${course.id}/assign`}>Assign to Tenant</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  )
}
