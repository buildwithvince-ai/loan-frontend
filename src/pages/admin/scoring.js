// FinScore normalization: raw 300–999 → 0–100
export function normalizeFinScore(raw) {
  const r = Number(raw)
  if (!r || r <= 0) return 0
  const clamped = Math.min(Math.max(r, 300), 999)
  return Math.round(((clamped - 300) / (999 - 300)) * 1000) / 10 // 1 decimal
}

// Final composite score: 50/50 split
export function computeFinalScore(finscoreNormalized, ciScore) {
  return Math.round((finscoreNormalized * 0.5 + Number(ciScore) * 0.5) * 10) / 10
}

// Tier from final score
export function getTier(finalScore) {
  if (finalScore >= 85) return 'approved'
  if (finalScore >= 70) return 'tier_b'
  return 'declined'
}

// Tier display config
export const TIER_CONFIG = {
  approved: {
    bgClass: 'bg-green/6 border-green/18',
    textClass: 'text-green/60',
    badgeClass: 'bg-green/12 text-green/60',
    label: 'Approved',
    description: 'Within matrix limit',
    recommendation: 'Recommended: Approve — within matrix limit',
  },
  tier_b: {
    bgClass: 'bg-amber-500/7 border-amber-500/21',
    textClass: 'text-amber-400/70',
    badgeClass: 'bg-amber-500/14 text-amber-400/70',
    label: 'Tier B',
    description: 'Approve with adjusted terms',
    recommendation: 'Recommended: Approve with adjusted terms',
  },
  declined: {
    bgClass: 'bg-red-500/7 border-red-500/21',
    textClass: 'text-red-400/70',
    badgeClass: 'bg-red-500/14 text-red-400/70',
    label: 'Declined',
    description: 'Below passing score',
    recommendation: 'Recommended: Decline — below passing score',
  },
}

// Final score from CI total (0-50 raw from form)
// Normalizes CI from 0-50 to 0-100, then applies 50/50 split
export function computeFinalFromCiTotal(finscoreNormalized, ciTotal) {
  const ciNormalized = Math.min(100, Math.max(0, ciTotal * 2))
  return computeFinalScore(finscoreNormalized, ciNormalized)
}

// What's needed to reach next tier
export function getNextTierHint(finalScore) {
  if (finalScore >= 85) return null // already top tier
  if (finalScore < 70) {
    const needed = Math.round((70 - finalScore) * 10) / 10
    return `Need ${needed} more points to reach Tier B`
  }
  // tier_b: 70-84
  const needed = Math.round((85 - finalScore) * 10) / 10
  return `Need ${needed} more points to reach Approved tier`
}
