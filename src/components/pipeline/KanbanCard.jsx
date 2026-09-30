import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { getTier, TIER_CONFIG } from '../../pages/admin/scoring'
import { getApplicantName } from '../../lib/applicantName'
import { getSoStageReason } from '../../constants/pipeline'

function formatPeso(amount) {
  return '₱' + Number(amount || 0).toLocaleString()
}

// Stage actions rendered inside the card. The drag overlay passes no handlers, so the
// floating ghost card shows none.
function CardActions({
  app,
  stage,
  userRoles,
  onVerifierAction,
  onRequestSOConfirmation,
  onSODecision,
  onSendToVerifier,
  soDecisionLoading,
}) {
  const can = allowed => userRoles.some(r => allowed.includes(r))
  const act = fn => e => {
    e.stopPropagation()
    fn()
  }

  if (stage === 'verifier' && onVerifierAction && can(['verifier', 'admin', 'super_admin'])) {
    return (
      <div className="x-card-actions">
        <button
          onClick={act(() => onVerifierAction(app, 'approve'))}
          className="x-card-action x-card-action--positive x-card-action--wide"
        >
          Approve
        </button>
        <button
          onClick={act(() => onVerifierAction(app, 'return'))}
          className="x-card-action x-card-action--warn"
        >
          Return
        </button>
        <button
          onClick={act(() => onVerifierAction(app, 'decline'))}
          className="x-card-action x-card-action--negative"
        >
          Decline
        </button>
      </div>
    )
  }

  // Sales Officer — show exactly ONE set based on why the app is at this stage.
  // 'confirmation' → Confirm/Decline (→ approver); 'rework' → Re-endorse (→ verifier);
  // 'new' → Endorse (→ verifier). Re-endorse and Confirm/Decline can never coexist, so
  // client-confirm can't skip the verifier.
  if (stage === 'sales_officer' && onSODecision && can(['sales_officer', 'admin', 'super_admin'])) {
    const reason = getSoStageReason(app)
    if (reason === 'confirmation') {
      const busy = soDecisionLoading === String(app.id || app._id)
      return (
        <div className="x-card-actions">
          <button
            onClick={act(() => onSODecision(app, 'confirm'))}
            disabled={busy}
            className="x-card-action x-card-action--positive"
          >
            {busy ? '…' : 'Confirm'}
          </button>
          <button
            onClick={act(() => onSODecision(app, 'decline'))}
            disabled={busy}
            className="x-card-action x-card-action--negative"
          >
            Decline
          </button>
        </div>
      )
    }
    return (
      <div className="x-card-actions">
        <button
          onClick={act(() => onSendToVerifier(app))}
          className="x-card-action x-card-action--positive"
        >
          {reason === 'rework' ? 'Re-endorse to Verifier' : 'Endorse to Verifier'}
        </button>
      </div>
    )
  }

  if (
    stage === 'approver' &&
    onRequestSOConfirmation &&
    can(['admin', 'super_admin', 'approver'])
  ) {
    return (
      <div className="x-card-actions">
        {!app.so_decision && !app.so_confirmation_sent_at && (
          <button
            onClick={act(() => onRequestSOConfirmation(app))}
            className="x-card-action x-card-action--info"
          >
            Request SO Confirmation
          </button>
        )}
        {app.so_confirmation_sent_at && !app.so_decision && (
          <div className="x-card-action x-card-action--pending x-card-action--status">
            Awaiting SO Response
          </div>
        )}
        {app.so_decision && (
          <div
            className={`x-card-action x-card-action--status ${
              app.so_decision === 'confirm' ? 'x-card-action--positive' : 'x-card-action--negative'
            }`}
          >
            {app.so_decision === 'confirm' ? 'Client Confirmed' : 'Client Declined'}
          </div>
        )}
      </div>
    )
  }

  return null
}

export default function KanbanCard({
  app,
  onCardClick,
  isLocked,
  stage,
  userRoles = [],
  onVerifierAction,
  onRequestSOConfirmation,
  onSODecision,
  onSendToVerifier,
  soDecisionLoading,
}) {
  const id = String(app.id || app._id || app.reference_id)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isLocked,
    data: { app },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
  }

  const fd = app.form_data || {}
  const fullName = getApplicantName(app) || '—'

  const groupLabel = app.group_name || app.groupName || fd.groupName || null

  const loanType = app.loan_type || ''
  const subtitle = [
    groupLabel,
    app.assigned_sales_officer_name && `SO: ${app.assigned_sales_officer_name}`,
  ]
    .filter(Boolean)
    .join(' · ')

  // Tier resolution
  const finalScore = app.final_score != null ? Number(app.final_score) : null
  const tier = finalScore != null ? app.tier || getTier(finalScore) : null
  const tierCfg = tier ? TIER_CONFIG[tier] || null : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`x-glass group${isDragging ? ' x-glass--dragging' : ''}`}
    >
      {/* Top row: reference + flags + drag handle */}
      <div className="x-card-top">
        <span className="truncate">{app.reference_id || '—'}</span>
        <div className="flex items-center gap-1 shrink-0">
          {app.prior_decline_flag && <span className="x-chip x-chip--warn">Prior Decline</span>}
          {!isLocked && (
            <button
              {...attributes}
              {...listeners}
              className="p-1 -m-1 rounded opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              onClick={e => e.stopPropagation()}
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
        <p className="x-card-title">{fullName}</p>
        {subtitle && <p className="x-card-sub">{subtitle}</p>}

        {/* Status badges */}
        {(tierCfg ||
          app.returned_count > 0 ||
          app.so_decision ||
          (app.so_confirmation_sent_at && !app.so_decision)) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tierCfg && <span className={`x-chip ${tierCfg.chipClass}`}>{tierCfg.label}</span>}
            {app.returned_count > 0 && (
              <span className="x-chip x-chip--warn">Returned ({app.returned_count}x)</span>
            )}
            {app.so_decision === 'confirm' && (
              <span className="x-chip x-chip--positive">SO Confirmed</span>
            )}
            {app.so_decision === 'decline' && (
              <span className="x-chip x-chip--negative">SO Declined</span>
            )}
            {/* Awaiting SO confirmation — yellow pulse */}
            {app.so_confirmation_sent_at && !app.so_decision && (
              <span className="x-chip x-chip--pending animate-pulse">Awaiting SO</span>
            )}
          </div>
        )}

        {/* Rework reason — shown to the SO so they know what to fix before re-endorsing */}
        {app.stage === 'sales_officer' &&
          getSoStageReason(app) === 'rework' &&
          app.last_return_reason && (
            <div className="x-note">
              <p className="x-note-label">Return reason</p>
              <p>{app.last_return_reason}</p>
            </div>
          )}

        {/* Footer: product + amount */}
        <div className="x-card-foot">
          <span className="x-card-foot-label">{loanType || '—'}</span>
          <span className="x-card-foot-value">{formatPeso(app.loan_amount || app.amount)}</span>
        </div>
      </div>

      <CardActions
        app={app}
        stage={stage}
        userRoles={userRoles}
        onVerifierAction={onVerifierAction}
        onRequestSOConfirmation={onRequestSOConfirmation}
        onSODecision={onSODecision}
        onSendToVerifier={onSendToVerifier}
        soDecisionLoading={soDecisionLoading}
      />
    </div>
  )
}
