import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../auth/AuthProvider'
import styles from './AdminLayout.module.css'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isActive = (path: string) => router.pathname.startsWith(path)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>LMS Admin</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={styles.toggleButton}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>

        <nav className={styles.nav}>
          <Link href="/admin" className={`${styles.navItem} ${isActive('/admin') && !router.pathname.includes('/courses') && !router.pathname.includes('/tenants') && !router.pathname.includes('/users') && !router.pathname.includes('/email') ? styles.active : ''}`}>
            <span className={styles.icon}>📊</span>
            <span className={styles.label}>Dashboard</span>
          </Link>

          <Link href="/admin/tenants" className={`${styles.navItem} ${isActive('/admin/tenants') ? styles.active : ''}`}>
            <span className={styles.icon}>🏢</span>
            <span className={styles.label}>Tenants</span>
          </Link>

          <Link href="/admin/users" className={`${styles.navItem} ${router.pathname === '/admin/users' ? styles.active : ''}`}>
            <span className={styles.icon}>👥</span>
            <span className={styles.label}>Global Users</span>
          </Link>

          <Link href="/admin/email-config" className={`${styles.navItem} ${router.pathname === '/admin/email-config' ? styles.active : ''}`}>
            <span className={styles.icon}>📧</span>
            <span className={styles.label}>Email Config</span>
          </Link>

          <Link href="/admin/email-logs" className={`${styles.navItem} ${router.pathname === '/admin/email-logs' ? styles.active : ''}`}>
            <span className={styles.icon}>📬</span>
            <span className={styles.label}>Email Logs</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{user?.email || 'Admin'}</p>
              <p className={styles.userRole}>{user?.role || 'User'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarContent}>
            <h1 className={styles.pageTitle}>{title || 'Admin'}</h1>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
