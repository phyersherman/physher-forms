/**
 * Respondent Form View Screen
 *
 * Displays a JotForm embed in a full-width iframe.
 * Listens for JotForm's postMessage submission event to detect completion,
 * then POSTs to the backend to record it and redirects back to /forms.
 */

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface FormData {
  id: string
  name: string
  description: string | null
  jotformEmbedUrl: string
}

const extractIframeSrc = (embed: string): string | null => {
  const trimmed = embed.trim()
  if (!trimmed.startsWith('<')) return trimmed

  const srcMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  return srcMatch?.[1] || null
}

const FormViewPage: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const completionCalledRef = useRef(false)

  useEffect(() => {
    if (!id || typeof id !== 'string') return

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/respondent/forms/${id}`, {
          credentials: 'include',
        })
        if (res.status === 401) {
          router.replace('/')
          return
        }
        if (res.status === 403) {
          // Already completed — redirect to forms list
          router.replace('/forms?success=1')
          return
        }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Form not found')
        setForm(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  // Listen for JotForm submission postMessage
  useEffect(() => {
    if (!id || typeof id !== 'string') return

    const handleMessage = async (event: MessageEvent) => {
      // JotForm sends messages from jotform.com domains
      if (!event.origin.includes('jotform.com') && !event.origin.includes('jotform.io')) {
        return
      }

      let data: any
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }

      // JotForm submission completion events
      const isSubmission =
        data?.action === 'submission-completed' ||
        data?.formID ||
        (typeof data === 'string' && data.includes('setHeight')) === false &&
        data?.type === 'form-submit'

      if (isSubmission && !completionCalledRef.current) {
        completionCalledRef.current = true
        await recordCompletion(id)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [id])

  const recordCompletion = async (formId: string) => {
    try {
      setSubmitted(true)
      await fetch(`${API_BASE}/respondent/forms/${formId}/complete`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (e) {
      console.error('Failed to record completion:', e)
    } finally {
      router.push('/forms?success=1')
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Loading survey…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#dc2626' }}>{error}</p>
        <button onClick={() => router.push('/forms')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Back to Surveys
        </button>
      </main>
    )
  }

  if (!form) return null

  const iframeSrc = extractIframeSrc(form.jotformEmbedUrl)
  const iframeSrcDoc = iframeSrc ? undefined : form.jotformEmbedUrl

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
            {form.name}
          </h1>
          {form.description && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              {form.description}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/forms')}
          style={{
            background: 'none', border: '1px solid #e5e7eb',
            padding: '8px 16px', borderRadius: '6px',
            color: '#6b7280', cursor: 'pointer', fontSize: '14px',
          }}
        >
          Back to Surveys
        </button>
      </header>

      {submitted && (
        <div style={{
          background: '#f0fdf4', padding: '12px 24px',
          borderBottom: '1px solid #86efac',
          color: '#16a34a', fontSize: '14px', textAlign: 'center',
        }}>
          Submission received. Redirecting…
        </div>
      )}

      {/* JotForm iframe — fills remaining height; form scrolls internally.
          NOTE: we intentionally do NOT load JotForm's feedback2.js auto-resizer.
          It shrinks the iframe to the form's content height, leaving dead gray
          space below it that grows with viewport height. Keeping a full-height
          iframe lets the form's own background fill the area instead. */}
      <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
        <iframe
          src={iframeSrc || undefined}
          srcDoc={iframeSrcDoc}
          title={form.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          allow="geolocation; camera; microphone"
        />
      </div>
    </main>
  )
}

export default FormViewPage
