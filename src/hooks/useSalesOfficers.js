import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

const FALLBACK_OFFICERS = [
  { id: '71dbd005-a56f-4e02-829b-ffec86293b55', full_name: 'Troy Laderas' },
  { id: 'e1a3b182-021c-437b-9eb3-e4fa9a6eed1a', full_name: 'Dennis De Guia' },
]

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
      const list = Array.isArray(data) ? data : data.officers || []
      setOfficers(list.length ? list : FALLBACK_OFFICERS)
    } catch (err) {
      setError(err.message)
      setOfficers(FALLBACK_OFFICERS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOfficers() }, [fetchOfficers])

  return { officers, loading, error, retry: fetchOfficers }
}
