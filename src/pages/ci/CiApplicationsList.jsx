import { useState, useEffect, useRef } from 'react'
import { ciFetch } from './CiPortal'

const LOAN_TYPE_COLORS = {
  personal: 'bg-blue/20 text-blue',
  sme: 'bg-purple-500/20 text-purple-400',
  akap: 'bg-amber-500/20 text-amber-400',
  group: 'bg-teal-500/20 text-teal-400',
  sbl: 'bg-pink-500/20 text-pink-400',
}

function Badge({ label, colorClass }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {label}
    </span>
  )
}

function formatCurrency(amount) {
  return '₱' + Number(amount || 0).toLocaleString()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function CiApplicationsList({ onStartAssessment }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const intervalRef = useRef(null)

  const fetchApps = async () => {
    try {
      const res = await ciFetch('/applications')
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      setApps(Array.isArray(data) ? data : data.applications || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
    intervalRef.current = setInterval(fetchApps, 60000)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Only show apps at ci_officer stage (ready for assessment) or already assessed by CI
  const ciRelevant = apps.filter((app) => app.stage === 'ci_officer' || app.ci_score != null)

  const filtered = ciRelevant.filter((app) => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = (app.full_name || `${app.firstName || app.first_name || ''} ${app.lastName || app.last_name || ''}`).toLowerCase()
    const phone = (app.phone || app.mobile || '').toLowerCase()
    return name.includes(q) || phone.includes(q)
  })

  const notAssessed = filtered.filter((a) => a.ci_score == null)
  const assessed = filtered.filter((a) => a.ci_score != null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchApps} className="text-green hover:text-green-hover text-sm">Retry</button>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
        />
      </div>

      {/* Not Yet Assessed */}
      <div className="mb-8">
        <h2 className="text-white font-semibold text-sm mb-3">
          Not Yet Assessed
          <span className="text-muted font-normal ml-2">({notAssessed.length})</span>
        </h2>
        {notAssessed.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-muted text-sm">No pending assessments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notAssessed.map((app) => (
              <div key={app.id || app.reference_id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{app.full_name || `${app.firstName || app.first_name || ''} ${app.lastName || app.last_name || ''}`.trim()}</p>
                    <p className="text-muted text-xs">{app.phone || app.mobile || '—'}</p>
                  </div>
                  <Badge
                    label={app.loan_type || '—'}
                    colorClass={LOAN_TYPE_COLORS[app.loan_type] || 'bg-gray-500/20 text-gray-400'}
                  />
                </div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-muted">{formatCurrency(app.loan_amount || app.amount)}</span>
                  <span className="text-muted">{formatDate(app.submitted_at || app.created_at)}</span>
                </div>
                <button
                  onClick={() => onStartAssessment(app)}
                  className="w-full bg-green hover:bg-green-hover text-white font-medium text-sm py-2 rounded-lg transition-colors"
                >
                  Start CI Assessment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Already Assessed */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3">
          Already Assessed
          <span className="text-muted font-normal ml-2">({assessed.length})</span>
        </h2>
        {assessed.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-muted text-sm">No completed assessments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assessed.map((app) => (
              <div key={app.id || app.reference_id} className="bg-surface border border-border rounded-xl p-4 opacity-80">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{app.full_name || `${app.firstName || app.first_name || ''} ${app.lastName || app.last_name || ''}`.trim()}</p>
                    <p className="text-muted text-xs">{app.phone || app.mobile || '—'}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge
                      label={app.loan_type || '—'}
                      colorClass={LOAN_TYPE_COLORS[app.loan_type] || 'bg-gray-500/20 text-gray-400'}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">{app.reviewed_by || app.interviewer || '—'}</span>
                  <Badge label="CI Done" colorClass="bg-green/20 text-green" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
