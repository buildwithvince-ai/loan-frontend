import { useState, useEffect, useRef } from 'react'
import { adminFetch } from './AdminDashboard'
import { normalizeFinScore, computeFinalFromCiTotal, getTier, TIER_CONFIG } from './scoring'
import { getApplicantName } from '../../lib/applicantName'

// ---------------------------------------------------------------------------
// Lookup maps
// ---------------------------------------------------------------------------

const LOAN_TYPE_COLORS = {
  personal: 'bg-blue/12 text-blue/60',
  sme: 'bg-purple-500/12 text-purple-400/60',
  akap: 'bg-amber-500/14 text-amber-400/70',
  group: 'bg-teal-500/12 text-teal-400/60',
  sbl: 'bg-pink-500/14 text-pink-400/70',
}

const STATUS_COLORS = {
  pending: 'bg-gray-500/20 text-gray-400',
  approved: 'bg-green/12 text-green/60',
  declined: 'bg-red-500/14 text-red-400/70',
  pending_sa_confirmation: 'bg-amber-500/14 text-amber-400/70',
}

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------

function Badge({ label, colorClass }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatCurrency(amount) {
  return '₱' + Number(amount || 0).toLocaleString()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateISO(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().replace('T', ' ').slice(0, 19)
}

function escapeCsvField(val) {
  const str = String(val ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function exportConsentCsv(apps) {
  const headers = [
    'Full Name',
    'Phone Number',
    'Loan Type',
    'Reference ID',
    'Consent Timestamp',
    'Consent Status',
  ]
  const rows = apps.map(app => [
    getApplicantName(app),
    app.mobile || app.phone || '',
    (app.loan_type || '').toUpperCase(),
    app.reference_id || '',
    formatDateISO(app.submitted_at || app.created_at),
    'Agreed — Terms & Conditions and Data Privacy Policy',
  ])
  const csv = [headers, ...rows].map(row => row.map(escapeCsvField).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gr8-consent-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Skeleton loader — matches final layout shape
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Fake filter bar */}
      <div className="p-4 border-b border-border flex gap-3">
        <div className="h-9 flex-1 bg-surface-alt rounded-lg animate-pulse" />
        <div className="h-9 w-36 bg-surface-alt rounded-lg animate-pulse" />
        <div className="h-9 w-32 bg-surface-alt rounded-lg animate-pulse" />
      </div>
      {/* Fake stat tiles */}
      <div className="p-4 flex gap-3 border-b border-border overflow-x-auto">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 w-28 shrink-0 bg-surface-alt rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Fake table rows */}
      <div className="divide-y divide-border/50">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 bg-surface-alt rounded animate-pulse" />
              <div className="h-3 w-24 bg-surface-alt/70 rounded animate-pulse" />
            </div>
            <div className="h-3 w-20 bg-surface-alt rounded animate-pulse" />
            <div className="h-6 w-16 bg-surface-alt rounded-full animate-pulse" />
            <div className="h-3 w-20 bg-surface-alt rounded animate-pulse" />
            <div className="h-3 w-16 bg-surface-alt rounded animate-pulse" />
            <div className="h-6 w-20 bg-surface-alt rounded-full animate-pulse" />
            <div className="h-6 w-14 bg-surface-alt rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MobileCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-surface-alt rounded animate-pulse" />
              <div className="h-3 w-24 bg-surface-alt/70 rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-surface-alt rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="h-3 w-14 bg-surface-alt/60 rounded animate-pulse" />
                <div className="h-4 w-20 bg-surface-alt rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-9 w-full bg-surface-alt rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stats tile row
// ---------------------------------------------------------------------------

function StatTiles({ apps, statusFilter, setStatusFilter }) {
  const saRejected = apps.filter(
    a => a.status === 'pending' && a.stage === 'approver' && a.sa_rejection_note,
  ).length

  const awaitingCi = apps.filter(a => a.ci_score == null && a.status === 'pending').length

  const pendingSa = apps.filter(a => a.status === 'pending_sa_confirmation').length

  const tiles = [
    { label: 'Total', count: apps.length, filter: 'all', accent: 'text-white' },
    {
      label: 'Pending',
      count: apps.filter(a => a.status === 'pending').length,
      filter: 'pending',
      accent: 'text-gray-300',
    },
    { label: 'Awaiting CI', count: awaitingCi, filter: 'pending', accent: 'text-muted', sub: true },
    {
      label: 'Awaiting SA',
      count: pendingSa,
      filter: 'pending_sa_confirmation',
      accent: 'text-amber-400',
    },
    {
      label: 'Approved',
      count: apps.filter(a => a.status === 'approved').length,
      filter: 'approved',
      accent: 'text-green',
    },
    {
      label: 'Declined',
      count: apps.filter(a => a.status === 'declined').length,
      filter: 'declined',
      accent: 'text-red-400',
    },
    { label: 'SA Rejected', count: saRejected, filter: 'sa_rejected', accent: 'text-red-400' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
      {tiles.map(tile => {
        const isActive = statusFilter === tile.filter && !(tile.sub && statusFilter !== 'pending')
        // For "Awaiting CI" tile we don't have a direct status filter — clicking sets pending
        // We consider it "active-ish" only when pending filter is already active
        const active = tile.sub ? false : statusFilter === tile.filter

        return (
          <button
            key={tile.label}
            onClick={() => setStatusFilter(tile.filter)}
            className={`shrink-0 flex flex-col px-4 py-3 rounded-lg border transition-colors text-left min-w-[100px] ${
              active
                ? 'bg-surface border-green/30 ring-1 ring-green/20'
                : 'bg-surface border-border hover:border-border hover:bg-surface-alt/60'
            }`}
          >
            <span className={`font-mono font-bold text-xl leading-none ${tile.accent}`}>
              {tile.count}
            </span>
            <span className="text-muted text-xs mt-1.5 leading-tight">{tile.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scoring cell — finscore / final / tier badge in one column
// ---------------------------------------------------------------------------

function ScoringCell({ app }) {
  const hasCi = app.ci_score != null
  const raw = Number(app.finscore_raw || app.finscore || 0)
  const norm = normalizeFinScore(raw)
  const final = hasCi ? (app.final_score ?? computeFinalFromCiTotal(norm, app.ci_score)) : null
  const tier = final != null ? app.tier || getTier(final) : null
  const tierCfg = tier ? TIER_CONFIG[tier] || TIER_CONFIG.declined : null

  if (!raw && !hasCi) {
    return <span className="text-muted text-xs">—</span>
  }

  return (
    <div className="flex flex-col gap-1">
      {raw > 0 && (
        <span className="font-mono text-xs text-muted">
          FS <span className="text-white font-medium">{raw}</span>
        </span>
      )}
      {final != null && (
        <span className="font-mono text-xs text-muted">
          Final <span className="text-white font-medium">{final}</span>
        </span>
      )}
      {tierCfg && <Badge label={tierCfg.label} colorClass={tierCfg.badgeClass} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ApplicationsList({ onReview, onDataRefreshed }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [soFilter, setSoFilter] = useState('all')
  const [search, setSearch] = useState('')
  const intervalRef = useRef(null)

  const fetchApps = async () => {
    try {
      const res = await adminFetch('/applications')
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.applications || []
      setApps(list)
      setError(null)
      if (onDataRefreshed) onDataRefreshed(Date.now())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
    intervalRef.current = setInterval(fetchApps, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Unique SO names for filter dropdown
  const soNames = [...new Set(apps.map(a => a.assigned_sales_officer_name).filter(Boolean))].sort()

  const filtered = apps.filter(app => {
    if (statusFilter === 'sa_rejected') {
      if (!(app.status === 'pending' && app.stage === 'approver' && app.sa_rejection_note))
        return false
    } else if (statusFilter !== 'all' && app.status !== statusFilter) return false
    if (typeFilter !== 'all' && app.loan_type !== typeFilter) return false
    if (soFilter !== 'all') {
      if (soFilter === 'none' && app.assigned_sales_officer_name) return false
      if (soFilter !== 'none' && app.assigned_sales_officer_name !== soFilter) return false
    }
    if (search) {
      const q = search.toLowerCase()
      const name = getApplicantName(app).toLowerCase()
      const phone = (app.mobile || app.phone || '').toLowerCase()
      const so = (app.assigned_sales_officer_name || '').toLowerCase()
      if (
        !name.includes(q) &&
        !phone.includes(q) &&
        !(app.reference_id || '').toLowerCase().includes(q) &&
        !so.includes(q)
      )
        return false
    }
    return true
  })

  const activeFilterCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    soFilter !== 'all',
    search.length > 0,
  ].filter(Boolean).length

  const clearFilters = () => {
    setStatusFilter('all')
    setTypeFilter('all')
    setSoFilter('all')
    setSearch('')
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div>
        <div className="hidden lg:block">
          <TableSkeleton />
        </div>
        <div className="lg:hidden">
          <MobileCardSkeleton />
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  if (error) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-white font-medium mb-1">Failed to load applications</p>
        <p className="text-muted text-sm mb-5">{error}</p>
        <button
          onClick={fetchApps}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green/8 hover:bg-green/15 text-green rounded-lg text-sm font-medium transition-colors"
        >
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
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Retry
        </button>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Empty state (no apps at all, not just filtered)
  // -------------------------------------------------------------------------
  if (apps.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-16 text-center">
        <div className="w-14 h-14 rounded-xl bg-surface-alt flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
            />
          </svg>
        </div>
        <p className="text-white font-semibold mb-1">No applications yet</p>
        <p className="text-muted text-sm">
          Applications will appear here once borrowers submit through the public portal.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Stat tiles */}
      <StatTiles apps={apps} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Search with leading icon */}
        <div className="relative flex-1">
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
            placeholder="Search name, phone, ref ID, or SO..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-muted focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-green/50 transition-colors min-w-[148px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="pending_sa_confirmation">Pending SA Confirmation</option>
            <option value="sa_rejected">SA Rejected</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-green/50 transition-colors min-w-[120px]"
          >
            <option value="all">All Types</option>
            <option value="personal">Personal</option>
            <option value="sme">SME</option>
            <option value="akap">AKAP</option>
            <option value="group">Group</option>
            <option value="sbl">SBL</option>
          </select>
          <select
            value={soFilter}
            onChange={e => setSoFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-green/50 transition-colors min-w-[148px]"
          >
            <option value="all">All Sales Officers</option>
            <option value="none">No SO Assigned</option>
            {soNames.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Active filter count + clear */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium text-muted hover:text-white border border-border hover:border-border/80 bg-surface transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-muted text-xs mb-3">
        {filtered.length === apps.length
          ? `${apps.length} application${apps.length !== 1 ? 's' : ''}`
          : `${filtered.length} of ${apps.length} application${apps.length !== 1 ? 's' : ''}`}
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Desktop Table                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:block bg-surface border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center mx-auto mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No results</p>
            <p className="text-muted text-sm mb-4">No applications match the current filters.</p>
            <button
              onClick={clearFilters}
              className="text-green hover:text-green-hover text-sm font-medium transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Applicant</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Phone</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Loan Type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Submitted</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">CI</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Scoring</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Sales Officer</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const hasCi = app.ci_score != null

                  return (
                    <tr
                      key={app.id || app.reference_id}
                      onClick={() => onReview(app.id || app.reference_id)}
                      className="border-b border-border/50 hover:bg-surface-alt/50 transition-colors cursor-pointer"
                    >
                      {/* Applicant: name + ref ID two-line cell */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-white font-medium truncate leading-tight">
                          {getApplicantName(app) || '—'}
                        </p>
                        <p className="text-blue/60 font-mono text-xs mt-0.5 leading-tight">
                          {app.reference_id || '—'}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-muted text-sm whitespace-nowrap">
                        {app.mobile || app.phone || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          label={app.loan_type || '—'}
                          colorClass={
                            LOAN_TYPE_COLORS[app.loan_type] || 'bg-gray-500/20 text-gray-400'
                          }
                        />
                      </td>

                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                        {formatCurrency(app.loan_amount || app.amount)}
                      </td>

                      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                        {formatDateShort(app.submitted_at || app.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          label={hasCi ? 'Done' : 'Pending'}
                          colorClass={
                            hasCi ? 'bg-blue/12 text-blue/60' : 'bg-gray-500/20 text-gray-400'
                          }
                        />
                      </td>

                      <td className="px-4 py-3">
                        <ScoringCell app={app} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge
                            label={app.status || 'pending'}
                            colorClass={STATUS_COLORS[app.status] || STATUS_COLORS.pending}
                          />
                          {app.sa_rejection_note && app.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/14 text-red-400/70">
                              SA Rejected
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                        {app.assigned_sales_officer_name || <span className="text-muted">—</span>}
                      </td>

                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onReview(app.id || app.reference_id)}
                          className="px-3 py-1.5 bg-green/6 text-green/60 rounded-lg text-xs font-medium hover:bg-green/12 hover:text-green transition-colors whitespace-nowrap"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile Cards                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:hidden flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center mx-auto mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No results</p>
            <p className="text-muted text-sm mb-4">No applications match the current filters.</p>
            <button
              onClick={clearFilters}
              className="text-green hover:text-green-hover text-sm font-medium transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map(app => {
            const hasCi = app.ci_score != null
            const raw = Number(app.finscore_raw || app.finscore || 0)
            const norm = normalizeFinScore(raw)
            const final = hasCi
              ? (app.final_score ?? computeFinalFromCiTotal(norm, app.ci_score))
              : null
            const tier = final != null ? app.tier || getTier(final) : null
            const tierCfg = tier ? TIER_CONFIG[tier] || TIER_CONFIG.declined : null

            return (
              <div
                key={app.id || app.reference_id}
                className="bg-surface border border-border rounded-xl p-4"
              >
                {/* Top row: name + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight truncate">
                      {getApplicantName(app) || '—'}
                    </p>
                    <p className="text-blue/60 text-xs font-mono mt-0.5 leading-tight">
                      {app.reference_id || '—'}
                    </p>
                    <p className="text-muted text-xs mt-0.5">{app.mobile || app.phone || '—'}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Badge
                      label={app.status || 'pending'}
                      colorClass={STATUS_COLORS[app.status] || STATUS_COLORS.pending}
                    />
                    {app.sa_rejection_note && app.status === 'pending' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/14 text-red-400/70">
                        SA Rejected
                      </span>
                    )}
                    <Badge
                      label={hasCi ? 'CI Done' : 'Awaiting CI'}
                      colorClass={hasCi ? 'bg-blue/20 text-blue' : 'bg-gray-500/20 text-gray-400'}
                    />
                  </div>
                </div>

                {/* Key data grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm mb-3 border-t border-border/50 pt-3">
                  <div>
                    <span className="text-muted text-xs block">Type</span>
                    <div className="mt-0.5">
                      <Badge
                        label={app.loan_type || '—'}
                        colorClass={
                          LOAN_TYPE_COLORS[app.loan_type] || 'bg-gray-500/20 text-gray-400'
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-muted text-xs block">Amount</span>
                    <p className="text-white font-medium mt-0.5">
                      {formatCurrency(app.loan_amount || app.amount)}
                    </p>
                  </div>
                  {raw > 0 && (
                    <div>
                      <span className="text-muted text-xs block">Finscore</span>
                      <p className="text-white font-mono font-medium mt-0.5">{raw}</p>
                    </div>
                  )}
                  {final != null && (
                    <div>
                      <span className="text-muted text-xs block">Final Score</span>
                      <p className="text-white font-mono font-medium mt-0.5">{final}/100</p>
                    </div>
                  )}
                  {tierCfg && (
                    <div>
                      <span className="text-muted text-xs block">Tier</span>
                      <div className="mt-0.5">
                        <Badge label={tierCfg.label} colorClass={tierCfg.badgeClass} />
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted text-xs block">Sales Officer</span>
                    <p className="text-white text-sm mt-0.5">
                      {app.assigned_sales_officer_name || <span className="text-muted">—</span>}
                    </p>
                  </div>
                </div>

                {/* Bottom row: date + CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-muted text-xs">
                    {formatDateShort(app.submitted_at || app.created_at)}
                  </span>
                  <button
                    onClick={() => onReview(app.id || app.reference_id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green/8 hover:bg-green/15 text-green rounded-lg text-sm font-medium transition-colors min-h-[40px]"
                  >
                    Review
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
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Export Consent Agreement                                             */}
      {/* ------------------------------------------------------------------ */}
      {filtered.length > 0 && (
        <div className="mt-10 pt-8 border-t border-border">
          <div className="bg-surface border border-border rounded-xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green/6 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-5 h-5 text-green/60"
                  >
                    <path
                      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Export Consent Agreement</h3>
                  <p className="text-muted text-xs mt-1 leading-relaxed max-w-md">
                    Export applicant names, phone numbers, and consent proof for FinScore compliance
                    reporting. All applicants agreed to the Terms &amp; Conditions and Data Privacy
                    Policy upon submission.
                  </p>
                </div>
              </div>
              <button
                onClick={() => exportConsentCsv(filtered)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green/6 hover:bg-green/12 text-green/60 hover:text-green border border-green/12 rounded-lg text-sm font-medium transition-colors shrink-0"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
                >
                  <path
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export CSV ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
