// Display formatters for reporting data (PH locale, peso).

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})
const pesoCompact = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** ₱1,360,000 */
export const formatPeso = n => (n == null ? '—' : peso.format(n))

/** ₱1.4M: for tiles where space is tight. */
export const formatPesoCompact = n => (n == null ? '—' : pesoCompact.format(n))

/** 'YYYY-MM-DD' week start → 'Sep 28'; 'YYYY-MM' → 'Sep 2026' */
export function formatBucket(bucket) {
  if (!bucket) return ''
  if (bucket.length === 7) {
    return new Date(`${bucket}-01T00:00:00`).toLocaleDateString('en-PH', {
      month: 'short',
      year: 'numeric',
    })
  }
  return new Date(`${bucket}T00:00:00`).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  })
}

// Score tiers are score bands, not application outcomes.
export const TIER_NAME = {
  approved: 'Approve band (85+)',
  tier_b: 'Tier B (70–84)',
  declined: 'Decline band (<70)',
}
