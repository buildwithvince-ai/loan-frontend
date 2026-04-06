import { useState } from 'react'
import { STAGE_LABELS } from '../../constants/pipeline'
import { pipelineFetch } from '../../pages/admin/AdminDashboard'

export default function ReturnModal({ application, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fullName = [
    application?.firstName || application?.first_name || '',
    application?.lastName || application?.last_name || '',
  ].filter(Boolean).join(' ') || application?.full_name || 'this applicant'

  const appId = application?.id || application?._id

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await pipelineFetch(`/${appId}/transition`, {
        method: 'PATCH',
        body: JSON.stringify({
          to_stage: 'sales_officer',
          meta: { return_reason: reason.trim() },
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || data.error || `Request failed (${res.status})`)
      }
      onConfirm(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl shadow-black/60">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-white font-bold text-lg mb-1">Return Application</h2>
          <p className="text-muted text-sm truncate">{fullName}</p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Stage indicator */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-surface-alt text-white border border-border">
              {STAGE_LABELS['verifier']}
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-muted">
              <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {STAGE_LABELS['sales_officer']}
            </span>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">
              Return Reason / Missing Requirements <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Specify what needs to be corrected or submitted..."
              className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted/50 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none resize-none transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

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
            disabled={!reason.trim() || loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                Returning...
              </span>
            ) : 'Return to Sales Officer'}
          </button>
        </div>
      </div>
    </div>
  )
}
