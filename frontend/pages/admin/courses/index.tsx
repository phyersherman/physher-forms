import React, { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../src/auth/AuthProvider'
import AdminLayout from '../../../src/components/AdminLayout'
import { AdminTable, TableColumn } from '../../../src/components/AdminTable'
import { useTableData } from '../../../src/hooks/useTableData'
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

  const { data: courses, loading } = useTableData<Course>({
    fetchFn: api.getGlobalCourses,
    deps: [user],
  })

  if (!user) return <AdminLayout title="Courses"><div>Loading...</div></AdminLayout>
  if (user.role !== 'admin') return <AdminLayout title="Courses"><div>Unauthorized</div></AdminLayout>

  const columns: TableColumn<Course>[] = [
    {
      key: 'title',
      header: 'Title',
    },
    {
      key: 'tenantName',
      header: 'Tenant',
      render: (value) => value || 'Global',
    },
  ]

  return (
    <AdminLayout title="Courses">
      <div style={{ maxWidth: 1200, marginBottom: 32 }}>
        <div className={styles.header}>
          <h1 style={{ margin: 0, fontSize: 28, color: '#333' }}>Courses</h1>
          <Link href="/admin/courses/new" className={styles.primaryButton}>
            + New Course
          </Link>
        </div>

        <AdminTable
          columns={columns}
          data={courses}
          loading={loading}
          emptyStateText="No courses yet. Create one to get started."
          actions={(course) => (
            <Link
              href={`/admin/courses/${course.id}/edit`}
              style={{
                color: '#667eea',
                textDecoration: 'none',
              }}
            >
              Edit
            </Link>
          )}
        />
      </div>
    </AdminLayout>
  )
}

export default CoursesPage
