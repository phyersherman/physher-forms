import React, { useState } from 'react'
import { useAuth } from '../src/auth/AuthProvider'
import { useRouter } from 'next/router'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@acme.local')
  const [password, setPassword] = useState('adminpass')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await auth.login(email, password)
      // redirect to returnTo if present
      const returnTo = (router.query.returnTo as string) || '/'
      router.push(returnTo)
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4">Login</h1>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <label className="block mb-2">
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
        </label>
        <label className="block mb-4">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
        </label>
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  )
}

export default LoginPage
