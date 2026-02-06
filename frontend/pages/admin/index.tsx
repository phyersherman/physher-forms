import type { NextPage } from 'next'
import Link from 'next/link'
import AdminLayout from '../../src/components/AdminLayout'
import styles from '../../styles/admin-dashboard.module.css'

const Admin: NextPage = () => {
  return (
    <AdminLayout title="Dashboard">
      <div className={styles.dashboardGrid}>
        <Link href="/admin/tenants" className={styles.card}>
            <div className={styles.cardIcon}>🏢</div>
            <h3>Tenants</h3>
            <p>Manage course portals and white-label instances</p>
            <span className={styles.arrowButton}>View Tenants →</span>
          </Link>

        <Link href="/admin/courses" className={styles.card}>
            <div className={styles.cardIcon}>📚</div>
            <h3>Courses</h3>
            <p>Create and manage courses with modules and lessons</p>
            <span className={styles.arrowButton}>View Courses →</span>
          </Link>
      </div>

      <div className={styles.infoSection}>
        <h2>Getting Started</h2>
        <p>Welcome to the LMS Admin Dashboard. Use the navigation above to manage your multi-tenant learning management system.</p>
        <ul>
          <li><strong>Tenants:</strong> Create and configure course portals for different organizations or brands</li>
          <li><strong>Courses:</strong> Build courses with chapters, modules, and interactive lessons</li>
        </ul>
      </div>
    </AdminLayout>
  )
}

export default Admin
