// Applicant name resolution — shared across admin, CI, and pipeline views.
//
// Application objects are inconsistent: some carry firstName/lastName at the top
// level, some nest them under form_data, and some only have a combined full_name.
// These helpers check all of those so names never render blank.

// Read the first non-empty value for any of `keys`, checking the top level then
// the nested form_data object.
function fromApp(app, ...keys) {
  const fd = (app && app.form_data) || {}
  for (const k of keys) {
    if (app && app[k] != null && app[k] !== '') return app[k]
    if (fd[k] != null && fd[k] !== '') return fd[k]
  }
  return ''
}

// First name only. Returns '' when unavailable.
export function getFirstName(app) {
  if (!app) return ''
  return String(fromApp(app, 'firstName', 'first_name')).trim()
}

// Last name only. Returns '' when unavailable.
export function getLastName(app) {
  if (!app) return ''
  return String(fromApp(app, 'lastName', 'last_name')).trim()
}

// Full display name. Prefers "First Last"; falls back to first name alone, then
// to a stored full_name/name field. Returns '' when nothing is available.
export function getApplicantName(app) {
  if (!app) return ''
  const composed = `${getFirstName(app)} ${getLastName(app)}`.trim()
  if (composed) return composed
  return String(fromApp(app, 'full_name', 'fullName', 'name')).trim()
}

// Up to two initials for an avatar ("Maria Santos" → "MS"). `fallback` when empty.
export function getInitials(name, fallback = '—') {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return fallback
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
