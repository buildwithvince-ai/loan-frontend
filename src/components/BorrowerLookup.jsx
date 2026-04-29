import { useState, useEffect, useRef } from 'react'

const BACKEND_URL = 'https://loan-backend-production-cd45.up.railway.app'
const MIN_QUERY = 2
const DEBOUNCE_MS = 400

export default function BorrowerLookup({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (query.length < MIN_QUERY) {
      setResults([])
      setOpen(false)
      setError(null)
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/borrowers/search?q=${encodeURIComponent(query)}`
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Search failed')
        const list = Array.isArray(data) ? data : data.borrowers || []
        setResults(list)
        setOpen(true)
      } catch (err) {
        setError(err.message)
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timerRef.current)
  }, [query])

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(borrower) {
    onChange(borrower)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  if (value) {
    return (
      <div className="bg-surface-alt border border-green/30 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-white text-sm font-medium">{value.full_name}</p>
          {value.phone && <p className="text-muted text-xs mt-0.5">{value.phone}</p>}
          {value.loandisk_borrower_id && (
            <p className="text-muted text-xs">Borrower ID: {value.loandisk_borrower_id}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted hover:text-white text-xs shrink-0 transition-colors"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone (min 2 characters)..."
          className="w-full px-4 py-3 rounded-xl bg-surface-alt border border-border text-white text-sm placeholder:text-muted/50 focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/30 transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && (
        <div className="absolute z-20 top-full mt-1 w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-muted text-sm">No borrowers found.</p>
          ) : (
            <ul>
              {results.map((b, i) => (
                <li key={b.id || b.loandisk_borrower_id || i}>
                  <button
                    type="button"
                    onClick={() => select(b)}
                    className="w-full text-left px-4 py-3 hover:bg-surface-alt transition-colors border-b border-border/50 last:border-0"
                  >
                    <p className="text-white text-sm">{b.full_name}</p>
                    {b.phone && <p className="text-muted text-xs">{b.phone}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
