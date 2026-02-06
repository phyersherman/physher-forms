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

export default { 
  login, 
  me, 
  refreshCsrf, 
  refresh,
  getGlobalCourses,
  getTenantCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  assignCourseToTenant,
}
