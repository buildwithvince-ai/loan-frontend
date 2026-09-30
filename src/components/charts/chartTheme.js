// Chart series colors for the admin shell. Only existing brand/status tokens: no new
// colors. Each series uses the same CSS var for EvilCharts' `light` and `dark` slots
// because this app themes with `.light-mode`, not `.dark`; the vars flip on their own.
export const SERIES = {
  primary: 'var(--color-green)', // brand green: volume, approvals, collections
  secondary: 'var(--color-blue)', // brand cyan: comparison series, projections
  warn: 'var(--color-amber-400)', // pending, tier B, awaiting
  negative: 'var(--color-red-400)', // declined only
  neutral: 'var(--x-ink-muted)', // other / unassigned
}

/**
 * Builds an EvilCharts ChartConfig from { key: [label, seriesColor] }.
 * @param {Record<string, [string, string]>} entries
 * @returns {Record<string, { label: string, colors: { light: string[], dark: string[] } }>}
 */
export function seriesConfig(entries) {
  return Object.fromEntries(
    Object.entries(entries).map(([key, [label, color]]) => [
      key,
      { label, colors: { light: [color], dark: [color] } },
    ]),
  )
}
