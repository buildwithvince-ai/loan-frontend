// Loandisk payment scheme IDs. 3 = built-in Monthly, 4 = built-in Weekly,
// 3413 = custom "15th & 30th" semi-monthly scheme created for this client.
export const PAYMENT_SCHEMES = [
  { id: 3, label: 'Monthly', value: 'monthly' },
  { id: 3413, label: '15th & 30th', value: 'semi_monthly' },
  { id: 4, label: 'Weekly', value: 'weekly' },
]

export const PAYMENT_SCHEME_LABELS = {
  3: 'Monthly',
  3413: '15th & 30th',
  4: 'Weekly',
}

export const SCHEME_SUFFIX = {
  3: '/ month',
  3413: '/ semi-monthly',
  4: '/ week',
}

export function defaultSchemeId(loanType) {
  return loanType === 'akap' ? 4 : 3
}

// Interest rate (% per month) that each product defaults to. Approver may lower
// down to 3% but a discount_reason becomes required below the product default.
export const DEFAULT_RATE_BY_TYPE = {
  personal: 3.5,
  sme: 3.0,
  akap: 4.0,
  group: 5.0,
  sbl: 5.0,
}

export function defaultRate(loanType) {
  return DEFAULT_RATE_BY_TYPE[(loanType || '').toLowerCase()] ?? 5
}

export function calcNumRepayments(durationMonths, schemeId, loanType) {
  const d = Number(durationMonths) || 0
  if (schemeId === 4) {
    const raw = d * 4
    return loanType === 'akap' ? Math.min(raw, 24) : raw
  }
  if (schemeId === 3413) return d * 2
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
  const isAkapCapped = loanType === 'akap' && schemeId === 4 && d * 4 > 24
  return {
    serviceFee,
    insuranceFee,
    netDisbursement,
    totalInterest,
    totalRepayment,
    numRepayments,
    repaymentAmount,
    isAkapCapped,
  }
}

export function fmtCurrency(n) {
  return (
    '₱' +
    Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )
}
