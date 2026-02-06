// Core domain interfaces for LMS (minimal first-pass)

export interface ThemeConfig {
  primaryColor: string
  secondaryColor?: string
  logoUrl?: string
}

export interface Domain {
  id: string
  host: string
  isPrimary?: boolean
}

export interface Tenant {
  id: string
  name: string
  defaultLocale: string
  theme?: ThemeConfig
  domains: Domain[]
}

export type Role = 'admin' | 'instructor' | 'learner'

export interface User {
  id: string
  tenantId: string
  email: string
  fullName?: string
  role: Role
}

export interface Course {
  id: string
  tenantId: string
  title: string
  description?: string
}

export interface Module {
  id: string
  courseId: string
  title: string
  content?: string
}

export interface Enrollment {
  id: string
  tenantId: string
  courseId: string
  userId: string
  enrolledAt: string
}
