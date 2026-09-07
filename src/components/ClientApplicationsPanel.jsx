import { useState, useEffect } from 'react'
import {
  getClientId,
  getParentName,
  fetchClientApplications,
  getFinscoreReuse,
  describeFinscoreReuse,
} from '../lib/clientLinkage'
import { getApplicantName } from '../lib/applicantName'

const LOAN_TYPE_COLORS = {
  personal: 'bg-blue/20 text-blue',
  sme: 'bg-purple-500/20 text-purple-400',
  akap: 'bg-amber-500/20 text-amber-400',
  group: 'bg-teal-500/20 text-teal-400',
  sbl: 'bg-pink-500/20 text-pink-400',
}

function formatCurrency(amount) {
  return '₱' + Number(amount || 0).toLocaleString()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function appKey(a) {
  return String(a?.id ?? a?._id ?? a?.reference_id ?? '')
}

function optionLabel(a, isCurrent) {
  const parts = [
    a.reference_id || appKey(a) || '—',
    (a.loan_type || '').toUpperCase(),
    formatCurrency(a.loan_amount || a.amount),
    formatDate(a.submitted_at || a.created_at),
  ].filter(Boolean)
  return `${parts.join(' · ')}${isCurrent ? ' — this application' : ''}`
}

/**
 * Warns that an application's score was attributed from the borrower's last
 * approved application rather than freshly pulled, so staff don't read a
 * carried-over number as a new credit check. Renders nothing for a fresh score.
 */
export function FinscoreReuseNotice({ app, className = '' }) {
  const reuse = getFinscoreReuse(app)
  if (!reuse) return null
  return (
    <div
      className={`bg-amber-500/7 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2 ${className}`}
    >
      <span className="text-amber-400/70 text-lg leading-none shrink-0">⚠</span>
      <div>
        <p className="text-amber-400/90 text-sm font-medium">
          FinScore not freshly pulled for this application
        </p>
        <p className="text-amber-400/70 text-xs mt-0.5">
          {describeFinscoreReuse(reuse)}. This is a renewal — treat the score as carried over, not
          as a new credit check.
        </p>
      </div>
    </div>
  )
}

/**
 * Shows the Loandisk borrower this application is grouped under, every
 * application tied to that borrower, and whether the score was carried over.
 * Renders nothing when the application has no borrower id, so ungrouped and
 * pre-approval applications are unaffected.
 *
 * `fetcher` must be adminFetch — the grouping route exists only under
 * /api/admin. Omit it (as the CI portal does) to render the borrower identity
 * and the attribution notice without the sibling list, rather than firing a
 * request that is known to 404.
 */
export default function ClientApplicationsPanel({ app, fetcher, className = '' }) {
  const clientId = getClientId(app)
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(!!(clientId && fetcher))
  const [selectedKey, setSelectedKey] = useState(appKey(app))

  useEffect(() => {
    if (!clientId || !fetcher) return
    let cancelled = false
    setLoading(true)
    fetchClientApplications(fetcher, clientId).then(result => {
      if (cancelled) return
      setGroup(result)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [clientId, fetcher])

  // Keyed on the id, not the object — a refetch replaces `app` with a new object
  // for the same application and must not reset the staff member's selection.
  useEffect(() => {
    setSelectedKey(appKey(app))
  }, [appKey(app)])

  if (!clientId) return null

  const parentName = getParentName(app, group)
  const currentKey = appKey(app)
  // `group` is null when the group could not be loaded — no fetcher (CI), or the
  // request failed. Show the identity and the notice, but never a one-entry
  // dropdown, which would falsely read as "this borrower has one application".
  const hasGroup = Array.isArray(group) && group.length > 0
  const selected = (hasGroup && group.find(a => appKey(a) === selectedKey)) || app
  const isSelectedCurrent = appKey(selected) === currentKey

  return (
    <div className={`bg-surface border border-border rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-white font-semibold text-sm">Borrower Record</h3>
        {hasGroup && !loading && (
          <span className="text-muted text-xs">
            {group.length} application{group.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="text-muted text-xs block">Borrower Name</span>
          <span className="text-white text-sm">{parentName || getApplicantName(app) || '—'}</span>
        </div>
        <div>
          <span className="text-muted text-xs block">Loandisk Borrower ID</span>
          <span className="text-white text-sm break-all">{clientId}</span>
        </div>
      </div>

      {loading && <div className="h-11 bg-surface-alt rounded-lg animate-pulse mt-4" />}

      {!loading && hasGroup && (
        <>
          <label htmlFor="client-applications" className="text-muted text-xs block mb-1.5 mt-4">
            Applications under this borrower
          </label>
          <select
            id="client-applications"
            value={selectedKey}
            onChange={e => setSelectedKey(e.target.value)}
            className="w-full bg-surface-alt border border-border rounded-lg px-3 py-3 text-sm text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
          >
            {group.map(a => (
              <option key={appKey(a)} value={appKey(a)}>
                {optionLabel(a, appKey(a) === currentKey)}
              </option>
            ))}
          </select>

          <div className="mt-3 bg-surface-alt rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-white text-sm font-medium">
                {getApplicantName(selected) || '—'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  LOAN_TYPE_COLORS[selected.loan_type] || 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {selected.loan_type || '—'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-muted block">Reference</span>
                <span className="text-white break-all">{selected.reference_id || '—'}</span>
              </div>
              <div>
                <span className="text-muted block">Amount</span>
                <span className="text-white">
                  {formatCurrency(selected.loan_amount || selected.amount)}
                </span>
              </div>
              <div>
                <span className="text-muted block">Status</span>
                <span className="text-white capitalize">
                  {(selected.status || '—').replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-muted block">Submitted</span>
                <span className="text-white">
                  {formatDate(selected.submitted_at || selected.created_at)}
                </span>
              </div>
            </div>
            {isSelectedCurrent && (
              <p className="text-muted/70 text-xs mt-2">You are viewing this application.</p>
            )}
          </div>
        </>
      )}

      <FinscoreReuseNotice app={selected} className="mt-3" />
    </div>
  )
}
