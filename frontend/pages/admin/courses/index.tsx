import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../src/auth/AuthProvider'
import AdminLayout from '../../../src/components/AdminLayout'
import api from '../../../src/lib/api'
import styles from '../../../styles/admin-table.module.css'

interface Course {
  id: string
  title: string
  description?: string
  tenantId: string | null
  tenantName?: string
}

const CoursesPage: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await api.getGlobalCourses()
        setCourses(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to load courses:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  if (!user) return <AdminLayout title="Courses"><div>Loading...</div></AdminLayout>
  if (user.role !== 'admin') return <AdminLayout title="Courses"><div>Unauthorized</div></AdminLayout>

  return (
    <AdminLayout title="Courses">
      <div style={{ maxWidth: 1200, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, color: '#333' }}>Courses</h1>
          <Link href="/admin/courses/new" style={{ 
            padding: '10px 16px', 
            background: '#667eea', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500
          }}>
            + New Course
          </Link>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            <p>No courses yet. Create one to get started.</p>
          </div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Tenant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.tenantName || 'Global'}</td>
                    <td>
                      <Link href={`/admin/courses/${course.id}/edit`} style={{ 
                        color: '#667eea', 
                        textDecoration: 'none',
                        marginRight: 12
                      }}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default CoursesPage
