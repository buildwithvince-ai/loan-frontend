import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { getTier, TIER_CONFIG } from '../../pages/admin/scoring'

const LOAN_TYPE_COLORS = {
  personal: 'bg-blue/20 text-blue',
  sme: 'bg-purple-500/20 text-purple-400',
  akap: 'bg-amber-500/20 text-amber-400',
  group: 'bg-teal-500/20 text-teal-400',
  sbl: 'bg-pink-500/20 text-pink-400',
}

function formatPeso(amount) {
  return '₱' + Number(amount || 0).toLocaleString()
}

export default function KanbanCard({ app, onCardClick, isLocked }) {
  const id = String(app.id || app._id || app.reference_id)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isLocked,
    data: { app },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const fullName = [
    app.firstName || app.first_name || '',
    app.lastName || app.last_name || '',
  ]
    .filter(Boolean)
    .join(' ') || app.full_name || '—'

  const loanType = app.loan_type || ''
  const loanTypeColor = LOAN_TYPE_COLORS[loanType] || 'bg-gray-500/20 text-gray-400'

  // Tier resolution
  const finalScore = app.final_score != null ? Number(app.final_score) : null
  const tier = finalScore != null ? (app.tier || getTier(finalScore)) : null
  const tierCfg = tier ? (TIER_CONFIG[tier] || null) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-alt border border-border rounded-lg p-3 mb-2 cursor-pointer select-none
        hover:border-green/40 hover:shadow-md hover:shadow-black/30 transition-all group
        ${isDragging ? 'shadow-xl shadow-black/50 rotate-1' : ''}`}
    >
      {/* Drag handle + ref row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs text-blue leading-tight">
          {app.reference_id || '—'}
        </span>
        <div className="flex items-center gap-1">
          {app.prior_decline_flag && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
              Prior Decline
            </span>
          )}
          {!isLocked && (
            <button
              {...attributes}
              {...listeners}
              className="p-1 rounded text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              aria-label="Drag card"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M8.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm-7 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm-7 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Clickable body */}
      <div onClick={() => onCardClick(app)}>
        {/* Full name */}
        <p className="text-white text-sm font-medium leading-snug mb-2 line-clamp-1">
          {fullName}
        </p>

        {/* Loan type + amount row */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${loanTypeColor}`}>
            {loanType || '—'}
          </span>
          <span className="text-muted text-xs">
            {formatPeso(app.loan_amount || app.amount)}
          </span>
        </div>

        {/* Tier badge */}
        {tierCfg && (
          <div className="mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierCfg.badgeClass}`}>
              {tierCfg.label}
            </span>
          </div>
        )}

        {/* Assigned sales officer */}
        {app.assigned_sales_officer_name && (
          <p className="text-muted text-xs truncate">
            SO: {app.assigned_sales_officer_name}
          </p>
        )}
      </div>
    </div>
  )
}
