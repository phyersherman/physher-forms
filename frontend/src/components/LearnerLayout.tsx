import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../auth/AuthProvider'
import styles from './LearnerLayout.module.css'

interface LearnerLayoutProps {
  children: React.ReactNode
  title?: string
}

const LearnerLayout: React.FC<LearnerLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(path + '/')

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className={styles.container}>
      {/* Mobile Notice */}
      <div className={styles.mobileNotice}>
        <div className={styles.mobileNoticeIcon}>💻</div>
        <h2 className={styles.mobileNoticeTitle}>Desktop Required</h2>
        <p className={styles.mobileNoticeText}>
          For the best learning experience, please access this site from a desktop or laptop computer.
        </p>
      </div>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>LMS</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={styles.toggleButton}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`}>
            <span className={styles.icon}>📊</span>
            <span className={styles.label}>Dashboard</span>
          </Link>

          <Link href="/my-courses" className={`${styles.navItem} ${isActive('/my-courses') ? styles.active : ''}`}>
            <span className={styles.icon}>📚</span>
            <span className={styles.label}>My Courses</span>
          </Link>

          <Link href="/certificates" className={`${styles.navItem} ${isActive('/certificates') ? styles.active : ''}`}>
            <span className={styles.icon}>🏆</span>
            <span className={styles.label}>Certificates</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{user?.fullName || user?.email || 'Learner'}</p>
              <p className={styles.userRole}>Learner</p>
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
            <h1 className={styles.pageTitle}>{title || 'Learning'}</h1>
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

export default LearnerLayout
