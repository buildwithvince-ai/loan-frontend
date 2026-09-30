import { useDroppable } from '@dnd-kit/core'
import { STAGE_LABELS } from '../../constants/pipeline'
import KanbanCard from './KanbanCard'

const LOCKED_STAGES = ['loan_processing_officer', 'declined']

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-3.5 h-3.5"
    >
      <path
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function KanbanColumn({
  index = 0,
  stage,
  cards,
  onCardClick,
  onVerifierAction,
  onRequestSOConfirmation,
  onSODecision,
  onSendToVerifier,
  soDecisionLoading,
  userRoles = [],
}) {
  const isLocked = LOCKED_STAGES.includes(stage)
  const isDeclined = stage === 'declined'

  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    disabled: isLocked,
  })

  const label = STAGE_LABELS[stage] || stage

  return (
    <div
      ref={setNodeRef}
      className={`x-lane x-stagger${isOver ? ' is-over' : ''}`}
      style={{ '--i': index }}
    >
      {/* Lane header */}
      <div className={`x-lane-head${isLocked && !isDeclined ? ' x-lane-head--muted' : ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`truncate ${isDeclined ? 'text-red-400' : ''}`}>{label}</span>
          {isLocked && <LockIcon />}
        </div>
        <span className="x-count">{cards.length}</span>
      </div>

      {/* Card stack */}
      <div className="x-stack">
        {cards.map(app => (
          <KanbanCard
            key={app.id || app._id || app.reference_id}
            app={app}
            onCardClick={onCardClick}
            isLocked={isLocked}
            stage={stage}
            userRoles={userRoles}
            onVerifierAction={onVerifierAction}
            onRequestSOConfirmation={onRequestSOConfirmation}
            onSODecision={onSODecision}
            onSendToVerifier={onSendToVerifier}
            soDecisionLoading={soDecisionLoading}
          />
        ))}
        {cards.length === 0 && (
          <div className="x-lane-empty">{isLocked ? 'No cards' : 'Drop here'}</div>
        )}
      </div>
    </div>
  )
}
