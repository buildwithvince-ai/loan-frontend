import { useState, useEffect, useMemo } from 'react'
import { adminFetch, useToast } from './AdminDashboard'
import { normalizeFinScore, computeFinalScore, computeFinalFromCiTotal, getTier, getNextTierHint, TIER_CONFIG } from './scoring'
import CiScoringForm, { CiFormReadOnly } from './CiScoringForm'

function Section({ title, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => collapsible && setOpen(!open)}
        className={`w-full px-5 py-4 flex items-center justify-between ${
          collapsible ? 'cursor-pointer hover:bg-surface-alt/50' : 'cursor-default'
        }`}
      >
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {collapsible && (
          <span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
        )}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border/50">{children}</div>}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <span className="text-muted text-xs block mb-0.5">{label}</span>
      <span className="text-white text-sm">{value || '—'}</span>
    </div>
  )
}

function Badge({ label, colorClass }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {label}
    </span>
  )
}

function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-surface border border-border rounded-xl p-6 max-w-md w-full">
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-muted hover:text-white border border-border rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Reusable score breakdown visual
// ciIsRaw50: if true, ciScoreValue is 0-50 (raw CI total from form); if false, it's 0-100
function ScoreBreakdown({ finscoreRaw, finscoreNorm, ciScoreValue, ciIsRaw50 = false, finalScore, tier, showNextTierHint = false }) {
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.declined
  const finscoreUnavailable = !finscoreRaw || Number(finscoreRaw) <= 0
  const hint = showNextTierHint ? getNextTierHint(finalScore) : null

  // Contribution to final 100-point score
  const finContrib = Math.round(finscoreNorm * 0.5 * 10) / 10
  const ciContrib = ciIsRaw50
    ? Math.round(ciScoreValue * 2 * 0.5 * 10) / 10  // 0-50 → normalize to 0-100 → 50%
    : Math.round(ciScoreValue * 0.5 * 10) / 10       // already 0-100 → 50%
  const ciDisplay = ciIsRaw50 ? `${ciScoreValue} / 50` : `${ciScoreValue} / 100`
  const ciBarPct = ciIsRaw50 ? (ciScoreValue / 50) * 100 : ciScoreValue

  return (
    <div className="bg-surface-alt rounded-lg p-4 space-y-4">
      {/* FinScore bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted">FinScore (50%)</span>
          {finscoreUnavailable ? (
            <span className="text-amber-400">Unavailable</span>
          ) : (
            <span className="text-blue">Raw: {finscoreRaw} &rarr; Normalized: {finscoreNorm} / 100</span>
          )}
        </div>
        <div className="h-2.5 bg-canvas rounded-full overflow-hidden">
          <div
            className="h-full bg-blue rounded-full transition-all duration-300"
            style={{ width: `${finscoreNorm}%` }}
          />
        </div>
        <div className="text-right text-xs text-blue mt-0.5">Contributes {finContrib} / 50</div>
        {finscoreUnavailable && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-block w-4 h-4 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold leading-none text-center">!</span>
            <span className="text-amber-400 text-xs">FinScore unavailable — CI carries full 50 points max</span>
          </div>
        )}
      </div>

      {/* CI Score bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted">CI Score (50%)</span>
          <span className="text-green">{ciDisplay}</span>
        </div>
        <div className="h-2.5 bg-canvas rounded-full overflow-hidden">
          <div
            className="h-full bg-green rounded-full transition-all duration-300"
            style={{ width: `${ciBarPct}%` }}
          />
        </div>
        <div className="text-right text-xs text-green mt-0.5">Contributes {ciContrib} / 50</div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Final score + tier */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted text-xs mb-1">Final Score</p>
          <p className="text-3xl font-bold text-white">{finalScore} <span className="text-base text-muted font-normal">/ 100</span></p>
        </div>
        <div className="text-right">
          <p className="text-muted text-xs mb-1">Tier</p>
          <Badge
            label={`${tierConfig.label} — ${tierConfig.description}`}
            colorClass={tierConfig.badgeClass}
          />
        </div>
      </div>

      {/* Next tier hint */}
      {hint && (
        <p className="text-xs text-amber-400">{hint}</p>
      )}
    </div>
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

export default function ApplicationDetail({ id, onBack }) {
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [adjustedAmount, setAdjustedAmount] = useState('')
  const [adjustedTerm, setAdjustedTerm] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [reviewerName, setReviewerName] = useState('')
  const addToast = useToast()

  const fetchApp = async () => {
    try {
      setLoading(true)
      const res = await adminFetch(`/applications/${id}`)
      if (!res.ok) throw new Error('Failed to fetch application')
      const data = await res.json()
      setApp(data.application || data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApp()
  }, [id])

  // Computed scoring values from app data
  const finscoreRaw = app ? Number(app.finscore_raw || app.finscore || 0) : 0
  const finscoreNorm = useMemo(() => normalizeFinScore(finscoreRaw), [finscoreRaw])

  // Stored scoring (after CI submitted) — ci_score is 0-50 from CI form
  const storedFinal = app?.ci_score != null ? computeFinalFromCiTotal(finscoreNorm, app.ci_score) : null
  const storedTier = storedFinal != null ? getTier(storedFinal) : null

  // Use backend tier/score if available, else computed
  const effectiveTier = app?.tier || storedTier
  const effectiveFinal = app?.final_score != null ? app.final_score : storedFinal
  const tierConfig = TIER_CONFIG[effectiveTier] || TIER_CONFIG.declined

  const handleApprove = () => {
    setConfirmModal({
      title: 'Approve Application',
      message: `Approve loan application ${app.reference_id}? This action cannot be undone.`,
      confirmLabel: 'Approve',
      confirmClass: 'bg-green hover:bg-green-hover text-white',
      action: async () => {
        setActionLoading(true)
        try {
          const res = await adminFetch(`/applications/${id}/approve`, {
            method: 'PATCH',
            body: JSON.stringify({ reviewed_by: reviewerName || undefined }),
          })
          if (!res.ok) throw new Error('Failed to approve')
          addToast('Application approved')
          await fetchApp()
        } catch (err) {
          addToast(err.message, 'error')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleApproveWithAdjustments = () => {
    if (!adjustedAmount && !adjustedTerm) {
      addToast('Enter adjusted amount or term', 'error')
      return
    }
    setConfirmModal({
      title: 'Approve with Adjustments',
      message: `Approve with adjusted terms? ${adjustedAmount ? 'Amount: ₱' + Number(adjustedAmount).toLocaleString() : ''} ${adjustedTerm ? 'Term: ' + adjustedTerm + ' months' : ''}`,
      confirmLabel: 'Approve with Adjustments',
      confirmClass: 'bg-amber-500 hover:bg-amber-600 text-white',
      action: async () => {
        setActionLoading(true)
        try {
          const res = await adminFetch(`/applications/${id}/approve`, {
            method: 'PATCH',
            body: JSON.stringify({
              adjusted_amount: adjustedAmount ? Number(adjustedAmount) : undefined,
              adjusted_term: adjustedTerm ? Number(adjustedTerm) : undefined,
              reviewed_by: reviewerName || undefined,
            }),
          })
          if (!res.ok) throw new Error('Failed to approve')
          addToast('Application approved with adjustments')
          await fetchApp()
        } catch (err) {
          addToast(err.message, 'error')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleDecline = () => {
    setConfirmModal({
      title: 'Decline Application',
      message: `Decline loan application ${app.reference_id}? This action cannot be undone.`,
      confirmLabel: 'Decline',
      confirmClass: 'bg-red-500 hover:bg-red-600 text-white',
      action: async () => {
        setActionLoading(true)
        try {
          const res = await adminFetch(`/applications/${id}/decline`, {
            method: 'PATCH',
            body: JSON.stringify({ reviewed_by: reviewerName || undefined }),
          })
          if (!res.ok) throw new Error('Failed to decline')
          addToast('Application declined')
          await fetchApp()
        } catch (err) {
          addToast(err.message, 'error')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleOverrideApprove = () => {
    setConfirmModal({
      title: 'Override: Approve Application',
      message: 'This application is below passing score. Override approval requires supervisor approval. Proceed?',
      confirmLabel: 'Override Approve',
      confirmClass: 'bg-gray-500 hover:bg-gray-600 text-white',
      action: async () => {
        setActionLoading(true)
        try {
          const res = await adminFetch(`/applications/${id}/approve`, {
            method: 'PATCH',
            body: JSON.stringify({
              override: true,
              reviewed_by: reviewerName || undefined,
            }),
          })
          if (!res.ok) throw new Error('Failed to override approve')
          addToast('Application approved (override)')
          await fetchApp()
        } catch (err) {
          addToast(err.message, 'error')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const executeConfirm = async () => {
    if (confirmModal?.action) await confirmModal.action()
    setConfirmModal(null)
  }

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
        <button onClick={fetchApp} className="text-green hover:text-green-hover text-sm">
          Retry
        </button>
      </div>
    )
  }

  if (!app) return null

  const isPending = app.status === 'pending'
  const hasCiScore = app.ci_score != null
  const showCiInput = isPending && !hasCiScore
  const showDecision = hasCiScore && isPending

  // Build form data key-value pairs, excluding internal/scoring fields
  const excludeKeys = new Set([
    'id', 'reference_id', 'first_name', 'last_name', 'mobile', 'phone',
    'email', 'loan_type', 'loan_amount', 'amount', 'term', 'loan_term',
    'status', 'tier', 'finscore_raw', 'finscore', 'finscore_normalized',
    'ci_score', 'final_score', 'submitted_at', 'created_at', 'updated_at',
    'reviewed_at', 'reviewed_by', 'notes', 'ci_notes',
  ])
  const formFields = app.form_data
    ? Object.entries(app.form_data)
    : Object.entries(app).filter(([k]) => !excludeKeys.has(k) && !k.startsWith('_'))

  // Group loan members
  const members = app.members || app.group_members || []

  return (
    <div>
      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmClass={confirmModal.confirmClass}
          onConfirm={executeConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted hover:text-white text-sm mb-6 transition-colors"
      >
        ← Back to Applications
      </button>

      <div className="flex flex-col gap-5">
        {/* Section 1: Borrower Summary */}
        <Section title="Borrower Summary">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
            <Field label="Reference ID" value={app.reference_id} />
            <Field label="Full Name" value={`${app.first_name || ''} ${app.last_name || ''}`} />
            <Field label="Phone" value={app.mobile || app.phone} />
            <Field label="Email" value={app.email} />
            <Field label="Loan Type" value={
              <Badge
                label={app.loan_type || '—'}
                colorClass="bg-blue/20 text-blue"
              />
            } />
            <Field label="Amount" value={formatCurrency(app.loan_amount || app.amount)} />
            <Field label="Term" value={app.term || app.loan_term ? `${app.term || app.loan_term} months` : '—'} />
            <Field label="Submitted" value={formatDate(app.submitted_at || app.created_at)} />
          </div>
        </Section>

        {/* Section 2: Scoring (read-only — after CI score exists) */}
        <Section title="Scoring">
          <div className="pt-4">
            {hasCiScore ? (
              <ScoreBreakdown
                finscoreRaw={finscoreRaw}
                finscoreNorm={finscoreNorm}
                ciScoreValue={app.ci_score}
                ciIsRaw50
                finalScore={effectiveFinal ?? computeFinalFromCiTotal(finscoreNorm, app.ci_score)}
                tier={effectiveTier ?? getTier(computeFinalFromCiTotal(finscoreNorm, app.ci_score))}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="FinScore Raw" value={finscoreRaw || 'N/A'} />
                <Field label="FinScore Normalized" value={finscoreRaw ? `${finscoreNorm} / 100` : 'N/A'} />
                <Field label="CI Score" value="Not yet scored" />
                <Field label="Final Score" value="Pending CI review" />
                <Field label="Tier" value={
                  <Badge label="pending" colorClass="bg-gray-500/20 text-gray-400" />
                } />
              </div>
            )}
          </div>
        </Section>

        {/* Section 3: CI Investigation Form */}
        {showCiInput && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4">
              <h3 className="text-white font-semibold text-sm">Credit Investigation Form</h3>
            </div>
            <div className="px-5 pb-5 border-t border-border/50 pt-4">
              <CiScoringForm
                app={app}
                appId={id}
                finscoreRaw={finscoreRaw}
                finscoreNorm={finscoreNorm}
                onSubmitSuccess={fetchApp}
              />
            </div>
          </div>
        )}

        {/* Section 3b: CI Form Read-Only (after submission) */}
        {hasCiScore && (app.ci_form_data || app.ci_form) && (
          <Section title="CI Investigation Details" collapsible defaultOpen={false}>
            <div className="pt-4">
              <CiFormReadOnly ciFormData={app.ci_form_data || app.ci_form} />
            </div>
          </Section>
        )}

        {/* Section 4: Decision */}
        {showDecision && (
          <Section title="Decision">
            <div className="pt-4">
              {/* Recommendation banner */}
              <div className={`border rounded-lg p-4 mb-5 ${tierConfig.bgClass}`}>
                <p className={`text-sm font-medium ${tierConfig.textClass}`}>
                  {tierConfig.recommendation}
                </p>
              </div>

              {/* Tier-specific actions */}
              {effectiveTier === 'approved' && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-green hover:bg-green-hover text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={actionLoading}
                    className="border border-red-500 text-red-400 hover:bg-red-500/10 font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}

              {effectiveTier === 'tier_b' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-muted text-xs block mb-1.5">Adjusted Amount (₱)</label>
                      <input
                        type="number"
                        value={adjustedAmount}
                        onChange={(e) => setAdjustedAmount(e.target.value)}
                        className="w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
                        placeholder="e.g. 20000"
                      />
                    </div>
                    <div>
                      <label className="text-muted text-xs block mb-1.5">Adjusted Term (months)</label>
                      <input
                        type="number"
                        value={adjustedTerm}
                        onChange={(e) => setAdjustedTerm(e.target.value)}
                        className="w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
                        placeholder="e.g. 6"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleApproveWithAdjustments}
                      disabled={actionLoading}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Approve with Adjustments
                    </button>
                    <button
                      onClick={handleDecline}
                      disabled={actionLoading}
                      className="border border-red-500 text-red-400 hover:bg-red-500/10 font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {effectiveTier === 'declined' && (
                <div className="flex flex-wrap gap-3 items-start">
                  <button
                    onClick={handleDecline}
                    disabled={actionLoading}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <div className="flex flex-col items-start gap-1">
                    <button
                      onClick={handleOverrideApprove}
                      disabled={actionLoading}
                      className="border border-gray-500 text-gray-400 hover:bg-gray-500/10 font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Override Approve
                    </button>
                    <span className="text-xs text-amber-400">Override requires supervisor approval</span>
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Section 5: Form Data */}
        <Section title="Form Data" collapsible defaultOpen={false}>
          <div className="pt-4">
            {formFields.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {formFields.map(([key, value]) => (
                  <div key={key} className="bg-surface-alt rounded-lg px-3 py-2">
                    <span className="text-muted text-xs block">{key.replace(/_/g, ' ')}</span>
                    <span className="text-white text-sm break-all">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value || '—')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">No form data available</p>
            )}

            {/* Group loan members */}
            {members.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-muted text-xs font-medium uppercase tracking-wide">Group Members</p>
                {members.map((member, idx) => (
                  <Section key={idx} title={`Member ${idx + 1}: ${member.first_name || ''} ${member.last_name || ''}`} collapsible defaultOpen={false}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                      {Object.entries(member).map(([k, v]) => (
                        <div key={k} className="bg-surface-alt rounded-lg px-3 py-2">
                          <span className="text-muted text-xs block">{k.replace(/_/g, ' ')}</span>
                          <span className="text-white text-sm break-all">{String(v || '—')}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Section 6: Activity Log */}
        <Section title="Activity Log">
          <div className="pt-4">
            <div className="space-y-3">
              {app.submitted_at || app.created_at ? (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue mt-1.5 shrink-0" />
                  <div>
                    <p className="text-white text-sm">Application submitted</p>
                    <p className="text-muted text-xs">{formatDate(app.submitted_at || app.created_at)}</p>
                  </div>
                </div>
              ) : null}
              {finscoreRaw > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue mt-1.5 shrink-0" />
                  <div>
                    <p className="text-white text-sm">FinScore calculated: {finscoreRaw} (normalized: {finscoreNorm})</p>
                  </div>
                </div>
              )}
              {app.ci_score != null && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green mt-1.5 shrink-0" />
                  <div>
                    <p className="text-white text-sm">
                      CI Score submitted: {app.ci_score}
                      {app.reviewed_by ? ` by ${app.reviewed_by}` : ''}
                    </p>
                    {app.reviewed_at && (
                      <p className="text-muted text-xs">{formatDate(app.reviewed_at)}</p>
                    )}
                    {(app.notes || app.ci_notes) && (
                      <p className="text-muted text-xs mt-1">Notes: {app.notes || app.ci_notes}</p>
                    )}
                  </div>
                </div>
              )}
              {app.ci_score != null && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    (effectiveTier === 'approved') ? 'bg-green' :
                    (effectiveTier === 'tier_b') ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-white text-sm">
                      Final Score: {effectiveFinal} → Tier: {TIER_CONFIG[effectiveTier]?.label || effectiveTier}
                    </p>
                  </div>
                </div>
              )}
              {app.status !== 'pending' && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    app.status === 'approved' ? 'bg-green' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-white text-sm">
                      Application {app.status}
                      {app.reviewed_by ? ` by ${app.reviewed_by}` : ''}
                    </p>
                    {app.reviewed_at && (
                      <p className="text-muted text-xs">{formatDate(app.reviewed_at)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
