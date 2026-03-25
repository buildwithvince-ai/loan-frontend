import { useState, useEffect, useRef } from 'react'
import { adminFetch } from './AdminDashboard'
import { normalizeFinScore, computeFinalFromCiTotal, getTier, TIER_CONFIG } from './scoring'

const LOAN_TYPE_COLORS = {
  personal: 'bg-blue/20 text-blue',
  sme: 'bg-purple-500/20 text-purple-400',
  akap: 'bg-amber-500/20 text-amber-400',
  group: 'bg-teal-500/20 text-teal-400',
  sbl: 'bg-pink-500/20 text-pink-400',
}

const STATUS_COLORS = {
  pending: 'bg-gray-500/20 text-gray-400',
  approved: 'bg-green/20 text-green',
  declined: 'bg-red-500/20 text-red-400',
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ApplicationsList({ onReview }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const intervalRef = useRef(null)

  const fetchApps = async () => {
    try {
      const res = await adminFetch('/applications')
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
    intervalRef.current = setInterval(fetchApps, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const filtered = apps.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false
    if (typeFilter !== 'all' && app.loan_type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = `${app.firstName || app.first_name || ''} ${app.lastName || app.last_name || ''}`.toLowerCase()
      const phone = (app.mobile || app.phone || '').toLowerCase()
      if (!name.includes(q) && !phone.includes(q) && !(app.reference_id || '').toLowerCase().includes(q)) return false
    }
    return true
  })

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
        <button onClick={fetchApps} className="text-green hover:text-green-hover text-sm">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name, phone, or ref ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-green/50"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-green/50"
        >
          <option value="all">All Types</option>
          <option value="personal">Personal</option>
          <option value="sme">SME</option>
          <option value="akap">AKAP</option>
          <option value="group">Group</option>
          <option value="sbl">SBL</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-muted text-sm mb-4">
        {filtered.length} application{filtered.length !== 1 ? 's' : ''}
        {statusFilter !== 'all' || typeFilter !== 'all' || search ? ' (filtered)' : ''}
      </p>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-3 font-medium">Ref ID</th>
                <th className="px-4 py-3 font-medium">Full Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Loan Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">CI Status</th>
                <th className="px-4 py-3 font-medium">Finscore</th>
                <th className="px-4 py-3 font-medium">Final Score</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const hasCi = app.ci_score != null
                const raw = Number(app.finscore_raw || app.finscore || 0)
                const norm = normalizeFinScore(raw)
                const final = hasCi ? (app.final_score ?? computeFinalFromCiTotal(norm, app.ci_score)) : null
                const tier = final != null ? (app.tier || getTier(final)) : null
                const tierCfg = tier ? (TIER_CONFIG[tier] || TIER_CONFIG.declined) : null

                return (
                  <tr
                    key={app.id || app.reference_id}
                    className="border-b border-border/50 hover:bg-surface-alt/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-blue font-mono text-xs">{app.reference_id || '—'}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      {app.firstName || app.first_name} {app.lastName || app.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onReview(app.id || app.reference_id)}
                        className="text-green hover:text-green-hover hover:underline text-sm transition-colors"
                      >
                        {app.mobile || app.phone || '—'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={app.loan_type || '—'}
                        colorClass={LOAN_TYPE_COLORS[app.loan_type] || 'bg-gray-500/20 text-gray-400'}
                      />
                    </td>
                    <td className="px-4 py-3 text-white">{formatCurrency(app.loan_amount || app.amount)}</td>
                    <td className="px-4 py-3 text-muted text-xs">{formatDate(app.submitted_at || app.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={hasCi ? 'CI Done' : 'Awaiting CI'}
                        colorClass={hasCi ? 'bg-blue/20 text-blue' : 'bg-gray-500/20 text-gray-400'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {raw ? (
                        <span className="text-white font-medium">{raw}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {final != null ? (
                        <span className="text-white font-medium">{final}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {tierCfg ? (
                        <Badge label={tierCfg.label} colorClass={tierCfg.badgeClass} />
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={app.status || 'pending'}
                        colorClass={STATUS_COLORS[app.status] || STATUS_COLORS.pending}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onReview(app.id || app.reference_id)}
                        className="px-3 py-1.5 bg-green/10 text-green rounded-lg text-xs font-medium hover:bg-green/20 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-muted">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {filtered.map((app) => {
          const hasCi = app.ci_score != null
          const raw = Number(app.finscore_raw || app.finscore || 0)
          const norm = normalizeFinScore(raw)
          const final = hasCi ? (app.final_score ?? computeFinalFromCiTotal(norm, app.ci_score)) : null
          const tier = final != null ? (app.tier || getTier(final)) : null
          const tierCfg = tier ? (TIER_CONFIG[tier] || TIER_CONFIG.declined) : null

          return (
            <div
              key={app.id || app.reference_id}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-medium">
                    {app.firstName || app.first_name} {app.lastName || app.last_name}
                  </p>
                  <button
                    onClick={() => onReview(app.id || app.reference_id)}
                    className="text-green hover:text-green-hover text-xs hover:underline transition-colors"
                  >
                    {app.mobile || app.phone || '—'}
                  </button>
                  <p className="text-blue text-xs font-mono">{app.reference_id || '—'}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge
                    label={app.status || 'pending'}
                    colorClass={STATUS_COLORS[app.status] || STATUS_COLORS.pending}
                  />
                  <Badge
                    label={hasCi ? 'CI Done' : 'Awaiting CI'}
                    colorClass={hasCi ? 'bg-blue/20 text-blue' : 'bg-gray-500/20 text-gray-400'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-muted text-xs">Type</span>
                  <div className="mt-0.5">
                    <Badge
                      label={app.loan_type || '—'}
                      colorClass={LOAN_TYPE_COLORS[app.loan_type] || 'bg-gray-500/20 text-gray-400'}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-muted text-xs">Amount</span>
                  <p className="text-white">{formatCurrency(app.loan_amount || app.amount)}</p>
                </div>
                <div>
                  <span className="text-muted text-xs">Finscore</span>
                  <p className="text-white font-medium">{raw || '—'}</p>
                </div>
                <div>
                  <span className="text-muted text-xs">Final Score</span>
                  <p className="text-white font-medium">{final != null ? `${final} / 100` : '—'}</p>
                </div>
                <div>
                  <span className="text-muted text-xs">Tier</span>
                  <div className="mt-0.5">
                    {tierCfg ? (
                      <Badge label={tierCfg.label} colorClass={tierCfg.badgeClass} />
                    ) : <span className="text-muted text-sm">—</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted text-xs">{formatDate(app.submitted_at || app.created_at)}</span>
                <button
                  onClick={() => onReview(app.id || app.reference_id)}
                  className="px-3 py-1.5 bg-green/10 text-green rounded-lg text-xs font-medium hover:bg-green/20 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted py-12">No applications found</p>
        )}
      </div>
    </div>
  )
}
