export const PIPELINE_STAGES = [
  'sales_officer',
  'verifier',
  'ci_officer',
  'approver',
  'loan_processing_officer',
  'declined',
]

export const STAGE_LABELS = {
  sales_officer: 'Sales Officer',
  verifier: 'Verifier',
  ci_officer: 'CI Officer',
  approver: 'Approver',
  loan_processing_officer: 'Loan Processing',
  declined: 'Declined',
}

// Why is an application currently sitting at the sales_officer stage?
//   'confirmation' — approver requested client confirmation (awaiting Confirm/Decline → approver)
//   'rework'       — verifier returned it for rework (awaiting Re-endorse → verifier)
//   'new'          — fresh lead (awaiting Endorse → verifier)
// Decided by event RECENCY (last_returned_at vs so_confirmation_sent_at), never by
// returned_count — that counter is cumulative and never resets, so it would wrongly
// flag any once-returned app as "in rework" forever.
export function getSoStageReason(app) {
  if (!app) return 'new'
  const pendingConfirmation = !!app.so_confirmation_sent_at && !app.so_decision
  const returnedAt = app.last_returned_at
  if (pendingConfirmation && returnedAt) {
    return new Date(app.so_confirmation_sent_at) >= new Date(returnedAt) ? 'confirmation' : 'rework'
  }
  if (pendingConfirmation) return 'confirmation'
  if (returnedAt) return 'rework'
  return 'new'
}
