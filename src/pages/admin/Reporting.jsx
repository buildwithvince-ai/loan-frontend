import { useMemo, useState } from 'react'
import { EvilAreaChart } from '../../components/evilcharts/charts/recharts-area-chart'
import { EvilBarChart } from '../../components/evilcharts/charts/recharts-bar-chart'
import { EvilLineChart } from '../../components/evilcharts/charts/recharts-line-chart'
import { EvilPieChart } from '../../components/evilcharts/charts/recharts-pie-chart'
import { EvilRadialChart } from '../../components/evilcharts/charts/recharts-radial-chart'
import ChartCard from '../../components/charts/ChartCard'
import { SERIES, seriesConfig } from '../../components/charts/chartTheme'
import useReport from '../../lib/useReport'
import { formatBucket, formatPeso, formatPesoCompact, TIER_NAME } from '../../lib/reportFormat'
import { STAGE_LABELS } from '../../constants/pipeline'

// Data: GET /api/reporting/overview?period= (admin/super_admin; see docs/CONTRACT.md).

const PERIODS = [
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '12m', label: '12 months' },
]

const OUTCOME_CONFIG = seriesConfig({
  approved: ['Approved', SERIES.primary],
  pending: ['Pending', SERIES.warn],
  declined: ['Declined', SERIES.negative],
})
const COUNT_CONFIG = seriesConfig({ count: ['Applications', SERIES.primary] })
const LOAN_TYPE_CONFIG = seriesConfig({
  personal: ['Personal', SERIES.primary],
  sme: ['SME', SERIES.secondary],
  akap: ['AKAP', SERIES.warn],
  group: ['Group', SERIES.neutral],
  sbl: ['SBL', SERIES.negative],
})
const RATE_CONFIG = seriesConfig({ approval: ['Approval rate', SERIES.primary] })
const MONEY_CONFIG = seriesConfig({
  disbursed: ['Disbursed', SERIES.primary],
  projected: ['Projected collections', SERIES.secondary],
})
const TIER_CONFIG_CHART = seriesConfig({ count: ['Applications', SERIES.secondary] })
const SO_CONFIG = seriesConfig({
  approved: ['Approved', SERIES.primary],
  pending: ['Pending', SERIES.warn],
  declined: ['Declined', SERIES.negative],
})
const TURNAROUND_CONFIG = seriesConfig({ days: ['Days to decision', SERIES.secondary] })

const CHART_H = 'aspect-auto h-64'

function Empty({ children = 'No data for this period yet.' }) {
  return (
    <div className="h-64 flex items-center justify-center text-muted text-sm text-center px-6">
      {children}
    </div>
  )
}

export default function Reporting() {
  const [period, setPeriod] = useState('90d')
  const periodIdx = PERIODS.findIndex(p => p.key === period)
  const { data, loading, error, reload } = useReport(`/overview?period=${period}`)
  const k = data?.kpis

  // Chart-ready rows (labels formatted once per response).
  const rows = useMemo(() => {
    if (!data) return null
    return {
      overTime: data.applications_over_time.map(b => ({ ...b, label: formatBucket(b.bucket) })),
      pipeline: data.pipeline_by_stage.map(p => ({
        stage: STAGE_LABELS[p.stage] || p.stage,
        count: p.count,
      })),
      mix: data.loan_type_mix.filter(t => LOAN_TYPE_CONFIG[t.type]),
      rate:
        data.kpis.approval_rate == null
          ? []
          : [{ metric: 'approval', value: data.kpis.approval_rate }],
      money: data.money_by_month.map(m => ({ ...m, label: formatBucket(m.month) })),
      tiers: data.score_distribution.map(t => ({
        tier: TIER_NAME[t.tier] || t.tier,
        count: t.count,
      })),
      so: data.so_performance,
      turnaround: data.turnaround.map(t => ({ ...t, label: formatBucket(t.bucket) })),
    }
  }, [data])

  const kpis = [
    { label: 'Applications', value: k?.applications ?? '—' },
    { label: 'Approval rate', value: k?.approval_rate == null ? '—' : `${k.approval_rate}%` },
    { label: 'Avg. final score', value: k?.avg_final_score ?? '—' },
    { label: 'Disbursed', value: k ? formatPesoCompact(k.disbursed) : '—' },
    {
      label: 'Collections (this month)',
      value: k ? formatPesoCompact(k.projected_collections) : '—',
    },
    {
      label: 'Avg. turnaround',
      value: k?.avg_turnaround_days == null ? '—' : `${k.avg_turnaround_days} days`,
    },
  ]
  const isLoading = loading || !rows
  const hasApps = (k?.applications || 0) > 0
  const noDeclines = k && k.declined === 0 && k.approved > 0
  const estimateNote = data
    ? `Estimated from approved loan terms (${data.notes.loans_projected} loans); payments already made or missed aren't reflected, and Loandisk remains the source of truth.${
        data.notes.loans_missing_terms
          ? ` ${data.notes.loans_missing_terms} older loans have no stored terms and aren't projected.`
          : ''
      }`
    : null

  return (
    <div className="px-4 sm:px-6 py-6 x-rise">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white font-medium text-2xl leading-tight">Reporting</h1>
          <p className="text-muted text-sm mt-0.5">
            Volume, outcomes, money and team performance over time.
          </p>
        </div>
        <div
          className="x-seg"
          role="tablist"
          aria-label="Reporting period"
          style={{ '--n': PERIODS.length, '--idx': periodIdx }}
        >
          <span className="x-seg-thumb" aria-hidden="true" />
          {PERIODS.map(p => (
            <button
              key={p.key}
              role="tab"
              aria-selected={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={`x-seg-btn${period === p.key ? ' is-active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
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

      {/* Headline numbers */}
      <div
        className="x-stats x-stats--static mb-5"
        aria-label="Headline metrics"
        aria-busy={loading}
      >
        {kpis.map((t, i) => (
          <div key={t.label} className="x-stat x-stagger" style={{ '--i': i }}>
            <span className={`x-stat-count${loading ? ' opacity-40' : ''}`}>{t.value}</span>
            <span className="x-stat-label">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Keyed by period so each period's charts mount fresh and play their intro. */}
      <div key={period} className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Applications over time"
          description={`New applications per ${data?.granularity === 'month' ? 'month' : 'week'}, by current outcome.`}
          className="xl:col-span-2"
          connected
          index={0}
        >
          {!isLoading && !hasApps ? (
            <Empty />
          ) : (
            <EvilAreaChart
              data={rows?.overTime || []}
              config={OUTCOME_CONFIG}
              stackType="stacked"
              isLoading={isLoading}
              className={CHART_H}
              xDataKey="label"
            >
              <EvilAreaChart.Grid />
              <EvilAreaChart.XAxis dataKey="label" />
              <EvilAreaChart.YAxis />
              <EvilAreaChart.Legend isClickable />
              <EvilAreaChart.Tooltip />
              <EvilAreaChart.Area dataKey="approved" variant="gradient" isClickable />
              <EvilAreaChart.Area dataKey="pending" variant="gradient" isClickable />
              <EvilAreaChart.Area dataKey="declined" variant="gradient" isClickable />
            </EvilAreaChart>
          )}
        </ChartCard>

        <ChartCard
          title="Pipeline by stage"
          description="Open applications at each stage right now (not tied to the period)."
          connected
          index={1}
        >
          <EvilBarChart
            data={rows?.pipeline || []}
            config={COUNT_CONFIG}
            layout="horizontal"
            isLoading={isLoading}
            className={CHART_H}
            xDataKey="stage"
          >
            <EvilBarChart.Grid />
            {/* Horizontal layout: YAxis carries the categories (EvilCharts docs). */}
            <EvilBarChart.YAxis dataKey="stage" width={104} />
            {/* Numeric value axis; without it Recharts treats values as categories. */}
            <EvilBarChart.XAxis allowDecimals={false} />
            <EvilBarChart.Tooltip />
            <EvilBarChart.Bar dataKey="count" variant="gradient" />
          </EvilBarChart>
        </ChartCard>

        <ChartCard
          title="Loan type mix"
          description="Share of applications by product."
          connected
          index={2}
        >
          {!isLoading && !rows.mix.length ? (
            <Empty />
          ) : (
            <EvilPieChart
              data={rows?.mix || []}
              dataKey="count"
              nameKey="type"
              config={LOAN_TYPE_CONFIG}
              isLoading={isLoading}
              className={CHART_H}
            >
              <EvilPieChart.Legend isClickable />
              <EvilPieChart.Tooltip />
              <EvilPieChart.Pie isClickable innerRadius={60} paddingAngle={3} cornerRadius={6} />
            </EvilPieChart>
          )}
        </ChartCard>

        <ChartCard
          title="Approval rate"
          description="Approved as a share of decisions made in the period."
          connected
          index={3}
          note={
            noDeclines
              ? `${k.approved} approved, 0 declined: no declines are recorded yet, so this reads 100%.`
              : k && k.approved + k.declined > 0
                ? `${k.approved} approved · ${k.declined} declined`
                : null
          }
        >
          {!isLoading && !rows.rate.length ? (
            <Empty>No approvals or declines were decided in this period.</Empty>
          ) : (
            <div className="relative">
              <EvilRadialChart
                data={rows?.rate || []}
                nameKey="metric"
                config={RATE_CONFIG}
                variant="semi"
                max={100}
                isLoading={isLoading}
                className={CHART_H}
              >
                <EvilRadialChart.Tooltip />
                <EvilRadialChart.RadialBar dataKey="value" />
              </EvilRadialChart>
              {!isLoading && (
                <p className="absolute inset-x-0 bottom-14 text-center x-num text-white text-3xl font-medium">
                  {k.approval_rate}%
                </p>
              )}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Disbursed vs projected collections"
          description="Principal released per month vs repayments scheduled that month."
          connected
          index={4}
          note={estimateNote}
        >
          <EvilBarChart
            data={rows?.money || []}
            config={MONEY_CONFIG}
            isLoading={isLoading}
            className={CHART_H}
            xDataKey="label"
          >
            <EvilBarChart.Grid />
            <EvilBarChart.XAxis dataKey="label" />
            <EvilBarChart.Legend isClickable />
            <EvilBarChart.Tooltip />
            <EvilBarChart.Bar dataKey="disbursed" variant="gradient" isClickable />
            <EvilBarChart.Bar dataKey="projected" variant="hatched" isClickable />
          </EvilBarChart>
          {k && (
            <p className="text-muted text-xs mt-2">
              Disbursed in period:{' '}
              <span className="text-white x-num">{formatPeso(k.disbursed)}</span>
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Score distribution"
          description="Scored applications by final-score band. Bands are scores, not outcomes."
          connected
          index={5}
        >
          {!isLoading && !rows.tiers.some(t => t.count) ? (
            <Empty>No applications were scored in this period.</Empty>
          ) : (
            <EvilBarChart
              data={rows?.tiers || []}
              config={TIER_CONFIG_CHART}
              isLoading={isLoading}
              className={CHART_H}
              xDataKey="tier"
            >
              <EvilBarChart.Grid />
              <EvilBarChart.XAxis dataKey="tier" />
              <EvilBarChart.Tooltip />
              <EvilBarChart.Bar dataKey="count" variant="gradient" />
            </EvilBarChart>
          )}
        </ChartCard>

        <ChartCard
          title="Sales officer performance"
          description="Applications per officer in the period, by current outcome."
          connected
          index={6}
        >
          {!isLoading && !rows.so.length ? (
            <Empty />
          ) : (
            <EvilBarChart
              data={rows?.so || []}
              config={SO_CONFIG}
              layout="horizontal"
              stackType="stacked"
              isLoading={isLoading}
              className={CHART_H}
              xDataKey="officer"
            >
              <EvilBarChart.Grid />
              <EvilBarChart.YAxis dataKey="officer" width={120} />
              <EvilBarChart.XAxis allowDecimals={false} />
              <EvilBarChart.Legend isClickable />
              <EvilBarChart.Tooltip />
              <EvilBarChart.Bar dataKey="approved" variant="gradient" isClickable />
              <EvilBarChart.Bar dataKey="pending" variant="gradient" isClickable />
              <EvilBarChart.Bar dataKey="declined" variant="gradient" isClickable />
            </EvilBarChart>
          )}
        </ChartCard>

        <ChartCard
          title="Turnaround time"
          description="Average days from submission to decision."
          connected
          index={7}
        >
          {!isLoading && !rows.turnaround.some(t => t.days != null) ? (
            <Empty>No decisions were made in this period.</Empty>
          ) : (
            <EvilLineChart
              data={rows?.turnaround || []}
              config={TURNAROUND_CONFIG}
              isLoading={isLoading}
              className={CHART_H}
              xDataKey="label"
            >
              <EvilLineChart.Grid />
              <EvilLineChart.XAxis dataKey="label" />
              <EvilLineChart.YAxis />
              <EvilLineChart.Tooltip />
              <EvilLineChart.Line dataKey="days" />
            </EvilLineChart>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
