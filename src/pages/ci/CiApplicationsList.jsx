import { useState, useEffect, useRef } from 'react'
import { ciFetch } from './CiPortal'
import { getApplicantName, getInitials } from '../../lib/applicantName'

function formatCurrency(amount) {
  return '₱' + Number(amount || 0).toLocaleString()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CiApplicationsList({ onStartAssessment }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('pending') // 'pending' | 'done'
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
  const ciRelevant = apps.filter(app => app.stage === 'ci_officer' || app.ci_score != null)

  const filtered = ciRelevant.filter(app => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = getApplicantName(app).toLowerCase()
    const phone = (app.phone || app.mobile || '').toLowerCase()
    return name.includes(q) || phone.includes(q)
  })

  const notAssessed = filtered.filter(a => a.ci_score == null)
  const assessed = filtered.filter(a => a.ci_score != null)

  if (loading) {
    return (
      <div>
        <div className="h-8 w-48 mb-6 rounded x-skel animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="x-panel p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full x-skel animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-36 x-skel rounded animate-pulse" />
                  <div className="h-3 w-24 x-skel rounded animate-pulse" />
                </div>
              </div>
              <div className="h-9 w-full x-skel rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="x-panel p-12 text-center">
        <p className="text-white font-medium mb-1">Failed to load applications</p>
        <p className="text-muted text-sm mb-5">{error}</p>
        <button onClick={fetchApps} className="x-pill">
          Retry
        </button>
      </div>
    )
  }

  const tiles = [
    { key: 'pending', label: 'Not yet assessed', count: notAssessed.length, tone: 'warn' },
    { key: 'done', label: 'Assessed', count: assessed.length, tone: 'positive' },
  ]
  const shown = tab === 'pending' ? notAssessed : assessed

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-white font-medium text-2xl leading-tight">CI Assessments</h1>
        <p className="text-muted text-sm mt-0.5">
          Applications at the CI stage, and the ones you have already scored.
        </p>
      </div>

      {/* Queue switch — each tile is a tab */}
      <div className="x-stats mb-5 max-w-md" role="tablist" aria-label="Assessment queue">
        {tiles.map((t, i) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            style={{ '--i': i }}
            className={`x-stat x-stagger x-stat--${t.tone}${tab === t.key ? ' is-active' : ''}`}
          >
            <span className="x-stat-count">{t.count}</span>
            <span className="x-stat-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search by name or phone number…"
          aria-label="Search applications"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="x-control w-full pl-9"
        />
      </div>

      {shown.length === 0 ? (
        <div className="x-panel py-14 text-center">
          <p className="text-white font-medium mb-1">
            {tab === 'pending' ? 'No pending assessments' : 'No completed assessments'}
          </p>
          <p className="text-muted text-sm">
            {search
              ? 'Nothing matches your search.'
              : tab === 'pending'
                ? 'New applications appear here when they reach the CI stage.'
                : 'Assessments you submit will be listed here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shown.map((app, i) => {
            const name = getApplicantName(app)
            const done = app.ci_score != null
            return (
              <div
                key={app.id || app.reference_id}
                style={{ '--i': Math.min(i, 8) }}
                className="x-panel x-stagger p-4 flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="x-avatar-sm">{getInitials(name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate leading-tight">{name || '—'}</p>
                    <p className="text-muted text-xs truncate mt-0.5">
                      {app.phone || app.mobile || '—'}
                    </p>
                  </div>
                  {done ? (
                    <span className="x-chip x-chip--positive">
                      <span className="x-dot" aria-hidden="true" />
                      CI done
                    </span>
                  ) : (
                    <span className="x-chip x-chip--warn">
                      <span className="x-dot" aria-hidden="true" />
                      To assess
                    </span>
                  )}
                </div>

                <dl className="x-list-card-metrics">
                  <div>
                    <dt className="x-caption">Amount</dt>
                    <dd className="x-num text-white font-medium">
                      {formatCurrency(app.loan_amount || app.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="x-caption">Type</dt>
                    <dd className="text-white uppercase text-xs">{app.loan_type || '—'}</dd>
                  </div>
                  <div>
                    <dt className="x-caption">{done ? 'Interviewer' : 'Submitted'}</dt>
                    <dd className="text-white">
                      {done
                        ? app.reviewed_by || app.interviewer || '—'
                        : formatDate(app.submitted_at || app.created_at)}
                    </dd>
                  </div>
                </dl>

                {!done && (
                  <button
                    onClick={() => onStartAssessment(app)}
                    className="x-btn x-btn--primary w-full"
                  >
                    Start CI Assessment
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
