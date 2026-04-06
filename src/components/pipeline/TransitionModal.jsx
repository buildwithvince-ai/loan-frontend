import { useState } from 'react'
import { STAGE_LABELS } from '../../constants/pipeline'
import { pipelineFetch } from '../../pages/admin/AdminDashboard'

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-muted">
      <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StageTag({ stage, highlight }) {
  return (
    <span
      className={`px-3 py-1 rounded-lg text-sm font-semibold
        ${highlight
          ? 'bg-green/10 text-green border border-green/30'
          : 'bg-surface-alt text-white border border-border'
        }`}
    >
      {STAGE_LABELS[stage] || stage}
    </span>
  )
}

export default function TransitionModal({ fromStage, toStage, application, onConfirm, onCancel }) {
  const [declineReason, setDeclineReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fullName = [
    application?.firstName || application?.first_name || '',
    application?.lastName || application?.last_name || '',
  ].filter(Boolean).join(' ') || application?.full_name || 'this applicant'

  const appId = application?.id || application?._id

  const isSalesToVerifier = fromStage === 'sales_officer' && toStage === 'verifier'
  const isCiToApprover = fromStage === 'ci_officer' && toStage === 'approver'
  const isApproverToProcessing = fromStage === 'approver' && toStage === 'loan_processing_officer'
  const isApproverToDeclined = fromStage === 'approver' && toStage === 'declined'
  const isAnyToDeclined = toStage === 'declined' && !isApproverToDeclined

  const salesOfficerMissing = isSalesToVerifier && !application?.assigned_sales_officer

  const canConfirm = (() => {
    if (salesOfficerMissing) return false
    if (isApproverToDeclined && !declineReason.trim()) return false
    if (isAnyToDeclined && !declineReason.trim()) return false
    return true
  })()

  const confirmLabel = (() => {
    if (isApproverToProcessing) return 'Approve & Process'
    if (isApproverToDeclined || isAnyToDeclined) return 'Confirm Decline'
    return 'Confirm'
  })()

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const meta = {}
      if (declineReason.trim()) meta.decline_reason = declineReason.trim()

      const res = await pipelineFetch(`/${appId}/transition`, {
        method: 'PATCH',
        body: JSON.stringify({ to_stage: toStage, meta }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || `Request failed (${res.status})`)
      }

      onConfirm()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-white font-bold text-lg mb-1">Move Application</h2>
          <p className="text-muted text-sm truncate">{fullName}</p>
        </div>

        {/* Stage arrow */}
        <div className="px-6 py-4 flex items-center gap-3">
          <StageTag stage={fromStage} />
          <ArrowIcon />
          <StageTag stage={toStage} highlight />
        </div>

        {/* Condition-specific content */}
        <div className="px-6 pb-4 space-y-4">

          {/* 1. Sales → Verifier: missing sales officer warning */}
          {isSalesToVerifier && salesOfficerMissing && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-amber-400 shrink-0 mt-0.5">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-amber-400 text-sm">
                Sales officer must be assigned before advancing this application to Verifier.
              </p>
            </div>
          )}

          {/* 1. Sales → Verifier: sales officer set, simple confirm */}
          {isSalesToVerifier && !salesOfficerMissing && (
            <p className="text-muted text-sm">
              Move <span className="text-white">{fullName}</span> to the Verifier stage?
              {application?.assigned_sales_officer_name && (
                <span className="block mt-1 text-xs">
                  Assigned SO: <span className="text-white">{application.assigned_sales_officer_name}</span>
                </span>
              )}
            </p>
          )}

          {/* 2. CI → Approver */}
          {isCiToApprover && (
            <div className="space-y-2">
              <p className="text-muted text-sm">
                Advance <span className="text-white">{fullName}</span> to the Approver stage.
              </p>
              {application?.ci_total != null && (
                <div className="flex items-center gap-2 p-2 bg-surface-alt rounded-lg">
                  <span className="text-muted text-xs">CI Score:</span>
                  <span className="text-white font-semibold text-sm">{application.ci_total} / 50</span>
                </div>
              )}
            </div>
          )}

          {/* 3. Approver → Loan Processing */}
          {isApproverToProcessing && (
            <div className="space-y-3">
              {(application?.final_score != null || application?.tier) && (
                <div className="grid grid-cols-2 gap-2">
                  {application.final_score != null && (
                    <div className="p-2 bg-surface-alt rounded-lg">
                      <p className="text-muted text-xs mb-0.5">Final Score</p>
                      <p className="text-white font-semibold">{application.final_score}</p>
                    </div>
                  )}
                  {application.tier && (
                    <div className="p-2 bg-surface-alt rounded-lg">
                      <p className="text-muted text-xs mb-0.5">Tier</p>
                      <p className="text-white font-semibold capitalize">{application.tier.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-start gap-2 p-3 bg-blue/10 border border-blue/30 rounded-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-blue shrink-0 mt-0.5">
                  <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-blue text-xs leading-relaxed">
                  This will push the application to Loandisk for processing.
                </p>
              </div>
            </div>
          )}

          {/* 4. Approver → Declined (or any → Declined) */}
          {(isApproverToDeclined || isAnyToDeclined) && (
            <div className="space-y-3">
              <p className="text-muted text-sm">
                Decline <span className="text-white">{fullName}</span>'s application.
              </p>
              <div>
                <label className="block text-xs text-muted mb-1.5">
                  Decline reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                  placeholder="Provide reason for declining..."
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted/50 focus:border-red-400/50 focus:ring-1 focus:ring-red-400/20 outline-none resize-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* 5. All other transitions */}
          {!isSalesToVerifier && !isCiToApprover && !isApproverToProcessing && !isApproverToDeclined && !isAnyToDeclined && (
            <p className="text-muted text-sm">
              Move <span className="text-white">{fullName}</span> from{' '}
              <span className="text-white">{STAGE_LABELS[fromStage] || fromStage}</span> to{' '}
              <span className="text-white">{STAGE_LABELS[toStage] || toStage}</span>?
            </p>
          )}

          {/* API error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-muted hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed
              ${toStage === 'declined'
                ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                : 'bg-green/10 text-green border border-green/30 hover:bg-green/20'
              }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
