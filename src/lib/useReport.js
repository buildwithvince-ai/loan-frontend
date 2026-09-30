import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

/**
 * Loads one /api/reporting resource for the signed-in admin.
 * Reads the JWT from AuthContext directly (these pages are their own routes, so
 * AdminDashboard's module-level token may not be wired yet). A 401 ends the session
 * the same way the admin API helper does.
 * @param {string} path e.g. '/overview?period=90d'
 * @returns {{ data: object|null, loading: boolean, error: string|null, reload: () => void }}
 */
export default function useReport(path) {
  const { getToken, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce(n => n + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/api/reporting${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      signal: controller.signal,
    })
      .then(async res => {
        if (res.status === 401) {
          await logout()
          navigate('/login', { replace: true, state: { reason: 'session_expired' } })
          return
        }
        if (res.status === 403) throw new Error('Your role does not have access to reporting.')
        if (!res.ok) throw new Error('Could not load the report. Try again in a moment.')
        setData(await res.json())
        setLoading(false)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        console.error('[useReport] failed', { path, error: err.message })
        setError(
          err.message.startsWith('Could not') || err.message.startsWith('Your role')
            ? err.message
            : 'Could not load the report. Check your connection and try again.',
        )
        setLoading(false)
      })
    return () => controller.abort()
  }, [path, nonce, getToken, logout, navigate])

  return { data, loading, error, reload }
}
