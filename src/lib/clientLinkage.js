// Client linkage — reads the backend's borrower-grouping and renewal
// FinScore-attribution data off an application object, and fetches every
// application tied to the same borrower.
//
// Key names below are CONFIRMED against the backend (2026-08-04 contract
// review), not guessed. Two caveats that shape the code:
//
//   1. There is no `clients` table and no client/parent object anywhere in the
//      API. Client identity IS the Loandisk borrower id, and the only name
//      available is `full_name` on each application row — so the parent name is
//      derived from the group, not read from a field.
//   2. Grouping is exposed under /api/admin only. /api/ci has no equivalent
//      route, so CI callers omit `fetcher` and get the identity + attribution
//      notice without the sibling list. See ClientApplicationsPanel.

/**
 * Returns the Loandisk borrower id this application is grouped under, or null.
 *
 * Two backend fields, different meanings:
 *   loandisk_borrower_id — the borrower identity. Null until an approval
 *                          pushes the applicant to Loandisk.
 *   linked_borrower_id   — a pointer, set at submit on a detected renewal.
 *
 * Prefer the identity, fall back to the pointer. CI list rows only carry the
 * pointer (loandisk_borrower_id is not in CI_FIELDS and would be null at CI
 * stage regardless), so the fallback is what makes the CI surface work at all.
 */
export function getClientId(app) {
  if (!app) return null
  const id = app.loandisk_borrower_id ?? app.linked_borrower_id ?? null
  return id === '' || id == null ? null : String(id)
}

function submittedTime(a) {
  const t = Date.parse(a?.submitted_at || a?.created_at || '')
  return Number.isNaN(t) ? 0 : t
}

/**
 * Derives the borrower's display name from the group. There is no parent_name /
 * client_name / client object in the API — the name lives on each application
 * row. Prefers the row that owns the borrower id (the approved one that created
 * the Loandisk record), then the most recent row, then the current application.
 */
export function getParentName(app, applications) {
  const clientId = getClientId(app)
  const rows = applications?.length ? applications : app ? [app] : []
  const owner = rows.find(
    r => r.loandisk_borrower_id && String(r.loandisk_borrower_id) === clientId && r.full_name,
  )
  if (owner) return owner.full_name
  const newest = rows
    .filter(r => r?.full_name)
    .sort((a, b) => submittedTime(b) - submittedTime(a))[0]
  return newest?.full_name || app?.full_name || null
}

/**
 * Fetches every application tied to `borrowerId` — both the rows the borrower
 * owns and the renewals pointing at them.
 *
 * `fetcher` must be adminFetch; the route exists only under /api/admin. Returns
 * an array, or null when unavailable (no fetcher, network failure, non-2xx) so
 * callers can tell "no group" apart from "couldn't load the group".
 */
export async function fetchClientApplications(fetcher, borrowerId) {
  if (!fetcher || !borrowerId) return null
  let res
  try {
    res = await fetcher(`/applications/borrower/${encodeURIComponent(borrowerId)}`)
  } catch {
    return null
  }
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  const applications = Array.isArray(data) ? data : data?.applications
  return Array.isArray(applications) ? applications : null
}

/**
 * Describes whether this application's score was attributed from the borrower's
 * last approved application instead of freshly pulled. Returns null for a
 * normal fresh credit check.
 *
 * Shape: { attributedScore: number|null, sourceDate: string|null,
 *          sourceReference: string|null }
 *
 * `finscore_attributed` is the gate. Provenance (`renewal_source_submitted_at`,
 * `renewal_source_reference_id`) is null whenever it is false, and also null on a
 * renewal that re-ran FinScore — that row measured its own score, so it gets no
 * provenance label. Both columns are pending a schema change, so treat them as
 * absent-until-shipped: the notice degrades to the un-dated wording rather than
 * rendering "measured null".
 */
export function getFinscoreReuse(app) {
  if (!app || app.finscore_attributed !== true) return null
  const score = Number(app.attributed_final_score)
  return {
    attributedScore: Number.isFinite(score) ? score : null,
    sourceDate: app.renewal_source_submitted_at || null,
    sourceReference: app.renewal_source_reference_id || null,
  }
}

function formatSourceDate(value) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Compact provenance suffix rendered beside the score itself, so a carried-over
 * number is never read as freshly measured even if the notice is scrolled past.
 * "carried over, measured 12 Jun 2026" — or just "carried over" pre-schema.
 */
export function formatScoreProvenance(reuse) {
  if (!reuse) return null
  const date = formatSourceDate(reuse.sourceDate)
  return date ? `carried over, measured ${date}` : 'carried over'
}

/** "Score reused from 12 Jun 2026 (GR8-1780422)" — degrades as fields are absent. */
export function describeFinscoreReuse(reuse) {
  if (!reuse) return null
  const date = formatSourceDate(reuse.sourceDate)
  const ref = reuse.sourceReference
  if (date && ref) return `Score reused from ${date} (${ref})`
  if (date) return `Score reused from ${date}`
  if (ref) return `Score reused from application ${ref}`
  const base = "Score carried over from this borrower's last approved application"
  return reuse.attributedScore == null
    ? base
    : `${base} (prior final score: ${reuse.attributedScore})`
}
