import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { login as apiLogin, logout as apiLogout, me as apiMe, refreshCsrf as apiRefreshCsrf } from '../lib/api'

type AuthUser = { id: string; email: string; role: string; tenantId: string; fullName?: string }

type AuthContext = {
  user: AuthUser | null | undefined
  token?: string
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContext | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)
  const [token, setToken] = useState<string | undefined>(undefined)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // ensure we have a CSRF token for subsequent requests
        try { await apiRefreshCsrf() } catch (e) { /* ignore */ }
        const res = await apiMe()
        if (!mounted) return
        if (res && res.user) setUser(res.user)
        else setUser(null)
      } catch (e) {
        if (!mounted) return
        setUser(null)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    setUser(res.user)
    // token is stored in an HttpOnly cookie by the server; do not store it in localStorage
    setToken(undefined)
    localStorage.removeItem('token')
    localStorage.setItem('user', JSON.stringify(res.user))
    // refresh CSRF token after login so subsequent mutating requests succeed
    try { await apiRefreshCsrf() } catch (e) { /* ignore */ }
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch (e) {
      // ignore logout errors
    }
    setToken(undefined)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Refresh CSRF token after logout to ensure clean state for next login
    try { await apiRefreshCsrf() } catch (e) { /* ignore */ }
    router.push('/login')
  }

  const refetchUser = async () => {
    try {
      const res = await apiMe()
      if (res && res.user) {
        setUser(res.user)
        localStorage.setItem('user', JSON.stringify(res.user))
      } else {
        setUser(null)
        localStorage.removeItem('user')
      }
    } catch (e) {
      setUser(null)
      localStorage.removeItem('user')
    }
  }

  return <AuthContext.Provider value={{ user, token, login, logout, refetchUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthProvider
