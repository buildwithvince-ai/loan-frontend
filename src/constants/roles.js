// Roles allowed into management views (Reporting, Dashboard). The frontend gate is
// cosmetic: the backend must enforce the same list on every reporting endpoint.
export const INSIGHT_ROLES = ['super_admin', 'admin']

export const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales_officer: 'Sales Officer',
  verifier: 'Verifier',
  ci_officer: 'CI Officer',
  approver: 'Approver',
  loan_processing_officer: 'Loan Processing Officer',
}
