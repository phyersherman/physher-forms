import Link from 'next/link'
import AdminLayout from '../../../src/components/AdminLayout'
import { AdminTable, TableColumn } from '../../../src/components/AdminTable'
import { useTableData } from '../../../src/hooks/useTableData'
import api from '../../../src/lib/api'
import styles from '../../../styles/admin-table.module.css'

interface Course {
  id: string
  title: string
  description: string | null
  created_at: string
}

export default function GlobalCoursesPage() {
  const { data: courses, loading } = useTableData<Course>({
    fetchFn: api.getGlobalCourses,
  })

  const columns: TableColumn<Course>[] = [
    {
      key: 'title',
      header: 'Title',
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => value || '—',
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ]

  return (
    <AdminLayout>
      <div style={{ padding: '20px' }}>
        <h1>Global Courses</h1>
        <p>These courses are available across all tenants and can be assigned to specific tenants.</p>

        <div style={{ marginBottom: '20px' }}>
          <Link
            href="/admin/courses/new"
            style={{
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            + Create New Global Course
          </Link>
        </div>

        <AdminTable
          columns={columns}
          data={courses}
          loading={loading}
          emptyStateText="No global courses yet."
          actions={(course) => (
            <>
              <Link href={`/admin/courses/${course.id}/edit`}>Edit</Link>
              {' | '}
              <Link href={`/admin/courses/${course.id}/assign`}>Assign to Tenant</Link>
            </>
          )}
        />
      </div>
    </AdminLayout>
  )
}
