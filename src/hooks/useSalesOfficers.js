import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

export default function useSalesOfficers() {
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOfficers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/public/sales-officers`)
      if (!res.ok) throw new Error('Failed to load sales officers')
      const data = await res.json()
      setOfficers(Array.isArray(data) ? data : data.officers || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOfficers() }, [fetchOfficers])

  return { officers, loading, error, retry: fetchOfficers }
}
