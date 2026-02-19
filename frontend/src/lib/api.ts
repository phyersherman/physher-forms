const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

let csrfToken: string | null = null

async function fetchJson(path: string, opts: any = {}, retryCount = 0) {
  const url = `${API_BASE}${path}`
  const init: any = {
    credentials: 'include',
    headers: { ...(opts.headers || {}) },
    ...opts,
  }

  // Attach CSRF token for non-GET requests when available
  if (init.method && init.method.toUpperCase() !== 'GET' && csrfToken) {
    init.headers['X-CSRF-Token'] = csrfToken
  }

  const res = await fetch(url, init)
  const payload = await res.json()
  if (!res.ok) {
    // Handle 401: attempt refresh and retry once
    if (res.status === 401 && retryCount === 0) {
      try {
        await refresh()
        await refreshCsrf() // Refresh CSRF token after token rotation
        return fetchJson(path, opts, retryCount + 1)
      } catch (refreshError) {
        // If refresh fails, throw the original error
        throw new Error(payload.error || 'Request failed')
      }
    }
    throw new Error(payload.error || 'Request failed')
  }
  return payload
}

export async function refreshCsrf() {
  const res = await fetch(`${API_BASE}/csrf-token`, { method: 'GET', credentials: 'include' })
  const payload = await res.json()
  if (!res.ok) throw new Error(payload.error || 'Failed to fetch CSRF token')
  csrfToken = payload.csrfToken
  return csrfToken
}

export async function refresh() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': csrfToken || '' },
  })
  const payload = await res.json()
  if (!res.ok) throw new Error(payload.error || 'Refresh failed')
  return payload
}

export async function login(email: string, password: string) {
  return fetchJson('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function me() {
  return fetchJson('/me', { method: 'GET' })
}

export async function getGlobalCourses() {
  return fetchJson('/courses/global', { method: 'GET' })
}

export async function getTenantCourses(tenantId: string) {
  return fetchJson(`/tenants/${tenantId}/courses`, { method: 'GET' })
}

export async function createCourse(title: string, description?: string, tenantId?: string) {
  return fetchJson(tenantId ? `/tenants/${tenantId}/courses` : '/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, tenant_id: tenantId }),
  })
}

export async function getCourse(courseId: string) {
  return fetchJson(`/courses/${courseId}`, { method: 'GET' })
}

export async function updateCourse(courseId: string, title?: string, description?: string) {
  return fetchJson(`/courses/${courseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  })
}

export async function deleteCourse(courseId: string) {
  return fetchJson(`/courses/${courseId}`, { method: 'DELETE' })
}

export async function assignCourseToTenant(globalCourseId: string, tenantId: string, title?: string) {
  await refreshCsrf()
  return fetchJson('/courses/assign-to-tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ globalCourseId, tenantId, title }),
  })
}

export async function copyCourse(courseId: string, tenantId: string, newTitle?: string) {
  return fetchJson(`/courses/${courseId}/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: tenantId, title: newTitle }),
  })
}

export async function logout() {
  return fetchJson('/auth/logout', { method: 'POST' })
}

// Tenant management
export async function getTenants() {
  return fetchJson('/tenants', { method: 'GET' })
}

export async function getTenant(tenantId: string) {
  return fetchJson(`/tenants/${tenantId}`, { method: 'GET' })
}

export async function createTenant(data: { name: string; domain?: string; theme_config?: any }) {
  return fetchJson('/tenants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateTenant(tenantId: string, data: { name?: string; domain?: string; theme_config?: any }) {
  return fetchJson(`/tenants/${tenantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteTenant(tenantId: string) {
  return fetchJson(`/tenants/${tenantId}`, { method: 'DELETE' })
}

// Learner APIs
export async function getModuleAccess(moduleId: string, courseId: string) {
  return fetchJson(`/modules/${moduleId}/courses/${courseId}/access`, { method: 'GET' })
}

export async function getModule(moduleId: string) {
  return fetchJson(`/modules/${moduleId}`, { method: 'GET' })
}

export async function completeModule(moduleId: string, courseId: string) {
  return fetchJson('/modules/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module_id: moduleId, course_id: courseId }),
  })
}

export async function submitQuiz(blockId: string, answers: Record<string, any>) {
  return fetchJson('/quiz/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ block_id: blockId, answers }),
  })
}

export async function getQuizAttempts(blockId: string) {
  return fetchJson(`/quiz/attempts/${blockId}`, { method: 'GET' })
}

export async function getLatestQuizAttempt(blockId: string) {
  return fetchJson(`/quiz/latest/${blockId}`, { method: 'GET' })
}

// Analytics APIs
export async function getAnalyticsAdmin() {
  return fetchJson('/analytics/admin', { method: 'GET' })
}

export async function getAnalyticsTenantCourses(tenantId?: string) {
  const url = tenantId ? `/analytics/tenant/courses?tenantId=${tenantId}` : '/analytics/tenant/courses'
  return fetchJson(url, { method: 'GET' })
}

export default { 
  login, 
  logout,
  me, 
  refreshCsrf, 
  refresh,
  // Course management
  getGlobalCourses,
  getTenantCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  assignCourseToTenant,
  copyCourse,
  // Tenant management
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  // Learner APIs
  getModuleAccess,
  getModule,
  completeModule,
  submitQuiz,
  getQuizAttempts,
  getLatestQuizAttempt,
  // Analytics
  getAnalyticsAdmin,
  getAnalyticsTenantCourses,
}
