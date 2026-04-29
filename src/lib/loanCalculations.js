export const PAYMENT_SCHEMES = [
  { id: 3, label: 'Monthly', value: 'monthly' },
  { id: 4, label: '15th & 30th', value: 'semi_monthly' },
  { id: 3413, label: 'Weekly', value: 'weekly' },
]

export const PAYMENT_SCHEME_LABELS = {
  3: 'Monthly',
  4: '15th & 30th',
  3413: 'Weekly',
}

export const SCHEME_SUFFIX = {
  3: '/ month',
  4: '/ semi-monthly',
  3413: '/ week',
}

export function defaultSchemeId(loanType) {
  return loanType === 'akap' ? 3413 : 3
}

export function calcNumRepayments(durationMonths, schemeId, loanType) {
  const d = Number(durationMonths) || 0
  if (schemeId === 3413) {
    const raw = d * 4
    return loanType === 'akap' ? Math.min(raw, 24) : raw
  }
  if (schemeId === 4) return d * 2
  return d
}

export function calcLoanSummary(principal, durationMonths, ratePercent, schemeId, loanType) {
  const p = Number(principal) || 0
  const d = Number(durationMonths) || 0
  const r = Number(ratePercent) || 0
  const serviceFee = p * 0.05
  const insuranceFee = p * 0.01
  const netDisbursement = p - serviceFee - insuranceFee
  const totalInterest = p * (r / 100) * d
  const totalRepayment = p + totalInterest
  const numRepayments = calcNumRepayments(d, schemeId, loanType)
  const repaymentAmount = numRepayments > 0 ? totalRepayment / numRepayments : 0
  const isAkapCapped = loanType === 'akap' && schemeId === 3413 && d * 4 > 24
  return { serviceFee, insuranceFee, netDisbursement, totalInterest, totalRepayment, numRepayments, repaymentAmount, isAkapCapped }
}

export function fmtCurrency(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
