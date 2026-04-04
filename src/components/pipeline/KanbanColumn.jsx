import { useDroppable } from '@dnd-kit/core'
import { STAGE_LABELS } from '../../constants/pipeline'
import KanbanCard from './KanbanCard'

const LOCKED_STAGES = ['loan_processing_officer', 'declined']

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-muted">
      <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function KanbanColumn({ stage, cards, onCardClick, onVerifierAction, onRequestSOConfirmation, userRoles = [] }) {
  const isLocked = LOCKED_STAGES.includes(stage)
  const isDeclined = stage === 'declined'

  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    disabled: isLocked,
  })

  const label = STAGE_LABELS[stage] || stage

  return (
    <div
      className={`flex flex-col rounded-xl border transition-colors flex-shrink-0 w-64
        ${isDeclined
          ? 'bg-red-950/20 border-red-900/30'
          : isLocked
          ? 'bg-surface/60 border-border/50'
          : isOver
          ? 'bg-green/5 border-green/30'
          : 'bg-surface border-border'
        }`}
    >
      {/* Column header */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between
          ${isDeclined ? 'border-red-900/30' : 'border-border'}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold
              ${isDeclined ? 'text-red-400' : isLocked ? 'text-muted' : 'text-white'}`}
          >
            {label}
          </span>
          {isLocked && <LockIcon />}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold min-w-[1.5rem] text-center
            ${isDeclined
              ? 'bg-red-900/40 text-red-400'
              : isLocked
              ? 'bg-surface-alt text-muted'
              : 'bg-surface-alt text-white'
            }`}
        >
          {cards.length}
        </span>
      </div>

      {/* Drop zone / card list */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 min-h-[120px] max-h-[calc(100vh-220px)]"
      >
        {cards.map((app) => (
          <div key={app.id || app._id || app.reference_id}>
            <KanbanCard
              app={app}
              onCardClick={onCardClick}
              isLocked={isLocked}
            />

            {/* Verifier actions */}
            {stage === 'verifier' && userRoles.some((r) => ['verifier', 'admin', 'super_admin'].includes(r)) && (
              <div className="flex items-center gap-1.5 px-1 pb-2 -mt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onVerifierAction(app, 'approve') }}
                  className="flex-1 text-xs px-2 py-1.5 rounded-md bg-green/10 text-green border border-green/20 hover:bg-green/20 transition-colors font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onVerifierAction(app, 'return') }}
                  className="flex-1 text-xs px-2 py-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors font-medium"
                >
                  Return
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onVerifierAction(app, 'decline') }}
                  className="flex-1 text-xs px-2 py-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium"
                >
                  Decline
                </button>
              </div>
            )}

            {/* Approver actions */}
            {stage === 'approver' && userRoles.some((r) => ['admin', 'super_admin', 'approver'].includes(r)) && (
              <div className="px-1 pb-2 -mt-1">
                {!app.so_decision && !app.so_confirmation_sent_at && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRequestSOConfirmation(app) }}
                    className="w-full text-xs px-2 py-1.5 rounded-md bg-blue/10 text-blue border border-blue/20 hover:bg-blue/20 transition-colors font-medium"
                  >
                    Request SO Confirmation
                  </button>
                )}
                {app.so_confirmation_sent_at && !app.so_decision && (
                  <div className="w-full text-xs px-2 py-1.5 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-center font-medium opacity-70">
                    Awaiting SO Response
                  </div>
                )}
                {app.so_decision && (
                  <div className={`w-full text-xs px-2 py-1.5 rounded-md text-center font-medium ${
                    app.so_decision === 'confirmed'
                      ? 'bg-green/10 text-green border border-green/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {app.so_decision === 'confirmed' ? 'Client Confirmed' : 'Client Declined'}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {cards.length === 0 && (
          <div
            className={`flex items-center justify-center h-16 rounded-lg border-2 border-dashed text-xs
              ${isDeclined
                ? 'border-red-900/30 text-red-900/50'
                : 'border-border/40 text-muted/40'
              }`}
          >
            {isLocked ? 'No cards' : 'Drop here'}
          </div>
        )}
      </div>
    </div>
  )
}
