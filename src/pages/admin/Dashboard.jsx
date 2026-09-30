import { EvilBarChart } from '../../components/evilcharts/charts/recharts-bar-chart'
import ChartCard from '../../components/charts/ChartCard'
import { SERIES, seriesConfig } from '../../components/charts/chartTheme'
import useReport from '../../lib/useReport'
import { formatBucket, formatPeso } from '../../lib/reportFormat'
import { getInitials } from '../../lib/applicantName'
import { STAGE_LABELS, STATUS_CHIP } from '../../constants/pipeline'
import { ROLE_LABEL } from '../../constants/roles'

// "Right now" view. Data: GET /api/reporting/dashboard (admin/super_admin; docs/CONTRACT.md).

const COLLECTIONS_CONFIG = seriesConfig({ amount: ['Scheduled', SERIES.secondary] })

const WEEK_KPIS = [
  { key: 'applied', label: 'Applied this week' },
  { key: 'approved', label: 'Approved this week', tone: 'positive' },
  { key: 'awaiting_ci', label: 'Awaiting CI', tone: 'warn' },
  { key: 'declined', label: 'Declined this week', tone: 'negative' },
]

function SkeletonRow({ i }) {
  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
      style={{ opacity: 1 - i * 0.15 }}
    >
      <div className="w-8 h-8 rounded-full x-skel animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="h-3.5 w-40 max-w-full x-skel rounded animate-pulse" />
        <div className="h-3 w-24 x-skel rounded animate-pulse" />
      </div>
      <div className="hidden sm:block h-3 w-16 x-skel rounded animate-pulse" />
      <div className="h-5 w-16 x-skel rounded-full animate-pulse" />
    </div>
  )
}

function weekLabel(week) {
  if (!week) return ''
  return `${formatBucket(week.start)} – ${formatBucket(week.end)}`
}

function dateLabel(iso) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const { data, loading, error, reload } = useReport('/dashboard')
  const month = data
    ? new Date(`${data.projected_collections.month}-01T00:00:00`).toLocaleDateString('en-PH', {
        month: 'long',
      })
    : new Date().toLocaleDateString('en-PH', { month: 'long' })
  const pc = data?.projected_collections

  return (
    <div className="px-4 sm:px-6 py-6 x-rise">
      <div className="mb-6">
        <h1 className="text-white font-medium text-2xl leading-tight">Dashboard</h1>
        <p className="text-muted text-sm mt-0.5">
          This week{data ? ` · ${weekLabel(data.week)}` : ''}
        </p>
      </div>

      {error && (
        <div
          className="x-panel p-5 mb-5 flex flex-wrap items-center justify-between gap-3"
          role="alert"
        >
          <p className="text-white text-sm">{error}</p>
          <button onClick={reload} className="x-pill x-pill--sm">
            Retry
          </button>
        </div>
      )}

      <div className="x-stats x-stats--static mb-5" aria-label="This week" aria-busy={loading}>
        {WEEK_KPIS.map((t, i) => (
          <div
            key={t.key}
            className={`x-stat x-stagger${t.tone ? ` x-stat--${t.tone}` : ''}`}
            style={{ '--i': i }}
          >
            <span className={`x-stat-count${loading ? ' opacity-40' : ''}`}>
              {data ? data.kpis[t.key] : '—'}
            </span>
            <span className="x-stat-label">{t.label}</span>
          </div>
        ))}
      </div>

      <div className="x-detail-grid !mt-0">
        <div className="x-detail-main">
          <ChartCard
            title="Who applied this week"
            description="Every application submitted since Monday, newest first."
            connected
            index={0}
          >
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <span className="x-caption flex-1">Applicant</span>
              <span className="x-caption hidden sm:block w-24 text-right">Amount</span>
              <span className="x-caption w-24 text-right">Status</span>
            </div>
            {loading && [0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} i={i} />)}
            {!loading && data && data.applicants.length === 0 && (
              <p className="py-10 text-center text-muted text-sm">No applications yet this week.</p>
            )}
            {!loading &&
              data?.applicants.map(a => {
                const status = STATUS_CHIP[a.status] || { label: a.status, tone: 'x-chip--neutral' }
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
                  >
                    <span className="x-avatar-sm">{getInitials(a.name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate leading-tight">
                        {a.name || '—'}
                      </p>
                      <p className="text-muted text-xs truncate mt-0.5">
                        <span className="uppercase">{a.loan_type}</span> ·{' '}
                        {STAGE_LABELS[a.stage] || a.stage} · {dateLabel(a.submitted_at)}
                      </p>
                    </div>
                    <span className="hidden sm:block w-24 text-right x-num text-white text-sm">
                      {formatPeso(a.loan_amount)}
                    </span>
                    <span className="w-24 flex justify-end">
                      <span className={`x-chip ${status.tone}`}>{status.label}</span>
                    </span>
                  </div>
                )
              })}
          </ChartCard>
        </div>

        <aside className="x-detail-aside">
          <ChartCard
            title={`Projected collections · ${month}`}
            description="Repayments scheduled this month, by week."
            connected
            index={1}
            note={
              pc
                ? `Estimate from ${pc.loans_projected} approved loans' terms; excludes payments already made or missed.${
                    pc.loans_missing_terms
                      ? ` ${pc.loans_missing_terms} older loans have no stored terms.`
                      : ''
                  }`
                : null
            }
          >
            <p
              className={`x-num text-white text-3xl font-medium leading-none${loading ? ' opacity-40' : ''}`}
            >
              {pc ? formatPeso(pc.total) : '—'}
            </p>
            <EvilBarChart
              data={(pc?.by_week || []).map(w => ({ ...w, week: formatBucket(w.week_start) }))}
              config={COLLECTIONS_CONFIG}
              isLoading={loading}
              loadingBars={5}
              className="aspect-auto h-36 mt-4"
              xDataKey="week"
            >
              <EvilBarChart.XAxis dataKey="week" />
              <EvilBarChart.Tooltip />
              <EvilBarChart.Bar dataKey="amount" variant="gradient" />
            </EvilBarChart>
          </ChartCard>

          <ChartCard
            title="Staff changes"
            description="New accounts in the last 90 days, and inactive accounts."
            connected
            index={2}
            note="Role changes and deactivation dates aren't recorded yet, so they can't be listed."
          >
            {loading ? (
              <ol>
                {[0, 1, 2].map(i => (
                  <li key={i} className="x-log-item">
                    <span className="x-log-dot x-skel" aria-hidden="true" />
                    <div className="h-3.5 w-44 max-w-full x-skel rounded animate-pulse" />
                    <div className="h-3 w-20 mt-1.5 x-skel rounded animate-pulse" />
                  </li>
                ))}
              </ol>
            ) : (
              <ol>
                {data?.staff_changes.map(s => (
                  <li key={`c-${s.name}-${s.at}`} className="x-log-item">
                    <span className="x-log-dot bg-green/70" aria-hidden="true" />
                    <p className="text-white text-sm leading-snug">
                      {s.name} joined as {s.roles.map(r => ROLE_LABEL[r] || r).join(', ')}
                    </p>
                    <p className="text-muted text-xs mt-0.5">{dateLabel(s.at)}</p>
                  </li>
                ))}
                {data?.inactive_staff.map(s => (
                  <li key={`i-${s.name}`} className="x-log-item">
                    <span className="x-log-dot bg-red-400/70" aria-hidden="true" />
                    <p className="text-white text-sm leading-snug">
                      {s.name} is inactive ({s.roles.map(r => ROLE_LABEL[r] || r).join(', ')})
                    </p>
                    <p className="text-muted text-xs mt-0.5">Date not recorded</p>
                  </li>
                ))}
                {data && !data.staff_changes.length && !data.inactive_staff.length && (
                  <p className="text-muted text-sm">No staff changes in the last 90 days.</p>
                )}
              </ol>
            )}
          </ChartCard>
        </aside>
      </div>
    </div>
  )
}
