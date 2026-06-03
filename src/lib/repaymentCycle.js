// Derives the read-only Repayment Cycle string from selected salary payout dates.
// one_time  [15]      -> "15"
// two_times [15, 30]  -> "15-30"  (sorted ascending, smaller date first)
// two_times [25, 10]  -> "10-25"
// Returns '' when no dates are selected.
//
// @param {number[]} dates - selected day-of-month integers (1–31)
// @returns {string} formatted cycle string
export function deriveRepaymentCycle(dates) {
  if (!Array.isArray(dates) || dates.length === 0) return ''
  return [...dates]
    .map(Number)
    .filter(n => Number.isInteger(n) && n >= 1 && n <= 31)
    .sort((a, b) => a - b)
    .join('-')
}
