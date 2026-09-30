// Vendored from EvilCharts (MIT, github.com/legions-developer/evilcharts), converted
// from TSX to JSX with esbuild (types stripped only). Colors come from each chart's
// config; see src/components/charts for the GR8-themed wrappers.
'use client'
import {
  PolarAngleAxis,
  RadialBar as RechartsRadialBar,
  RadialBarChart as RechartsRadialBarChart,
  Sector,
} from 'recharts'
import { createContext, use, useCallback, useEffect, useId, useMemo, useState } from 'react'
import { ChartTooltip, ChartTooltipContent } from '../ui/recharts-tooltip'
import { ChartContainer, getColorsCount, LoadingIndicator } from '../ui/recharts-chart'
import { ChartLegend, ChartLegendContent } from '../ui/recharts-legend'
import { ChartBackground } from '../ui/recharts-background'
const DEFAULT_INNER_RADIUS = '30%'
const DEFAULT_OUTER_RADIUS = '100%'
const DEFAULT_CORNER_RADIUS = 5
const DEFAULT_BAR_SIZE = 14
const LOADING_BARS = 5
const LOADING_ANIMATION_DURATION = 1500
const RadialChartContext = createContext(null)
function useRadialChart() {
  const context = use(RadialChartContext)
  if (!context) {
    throw new Error(
      'Radial chart parts (<RadialBar />, <Tooltip />, \u2026) must be used within <EvilRadialChart />',
    )
  }
  return context
}
function EvilRadialChart({
  config,
  data,
  nameKey,
  children,
  className,
  chartProps,
  variant = 'full',
  max,
  innerRadius = DEFAULT_INNER_RADIUS,
  outerRadius = DEFAULT_OUTER_RADIUS,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  backgroundVariant,
}) {
  const chartId = useId().replace(/:/g, '')
  const [selectedBar, setSelectedBar] = useState(defaultSelectedDataKey)
  const loadingData = useLoadingData(isLoading)
  const variantConfig = getVariantConfig(variant)
  const selectBar = useCallback(
    (barName, value) => {
      setSelectedBar(barName)
      onSelectionChange?.(barName === null ? null : { dataKey: barName, value: value ?? 0 })
    },
    [onSelectionChange],
  )
  const preparedData = useMemo(
    () =>
      data.map(item => ({
        ...item,
        fill: `url(#${chartId}-radial-colors-${item[nameKey]})`,
      })),
    [data, nameKey, chartId],
  )
  const contextValue = useMemo(
    () => ({
      config,
      nameKey,
      chartId,
      isLoading,
      selectedBar,
      selectBar,
    }),
    [config, nameKey, chartId, isLoading, selectedBar, selectBar],
  )
  return (
    <RadialChartContext value={contextValue}>
      <ChartContainer className={className} config={config}>
        <LoadingIndicator isLoading={isLoading} />
        <RechartsRadialBarChart
          id={chartId}
          data={isLoading ? loadingData : preparedData}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={variantConfig.startAngle}
          endAngle={variantConfig.endAngle}
          cx={variantConfig.cx}
          cy={variantConfig.cy}
          {...chartProps}
        >
          {/* Pinning the angle domain is what lets a single value read against a
       fixed total instead of auto-scaling to fill the arc. */}
          {max != null && max > 0 && (
            <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
          )}
          {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
          {children}
          {isLoading && <LoadingRadialBar />}
          <defs>
            <ColorGradientStyle config={config} chartId={chartId} />
          </defs>
        </RechartsRadialBarChart>
      </ChartContainer>
    </RadialChartContext>
  )
}
function RadialBar({
  dataKey,
  cornerRadius = DEFAULT_CORNER_RADIUS,
  barSize = DEFAULT_BAR_SIZE,
  showBackground = true,
  isClickable = false,
  radialBarProps,
}) {
  const { nameKey, isLoading, selectedBar, selectBar } = useRadialChart()
  if (isLoading) return null
  return (
    <RechartsRadialBar
      dataKey={dataKey}
      cornerRadius={cornerRadius}
      barSize={barSize}
      background={showBackground}
      className="drop-shadow-sm"
      style={isClickable ? { cursor: 'pointer' } : void 0}
      onClick={(payload, index) => {
        if (!isClickable) return
        const entry = payload
        const barName = entry?.[nameKey] ?? String(index)
        const value = Number(entry?.[dataKey] ?? 0)
        selectBar(selectedBar === barName ? null : barName, value)
      }}
      shape={props => {
        const barName = props[nameKey]
        const isSelected = selectedBar === null || selectedBar === barName
        return (
          <Sector
            {...props}
            opacity={isClickable && !isSelected ? 0.15 : 1}
            className="transition-opacity duration-200"
          />
        )
      }}
      {...radialBarProps}
    />
  )
}
function Tooltip({ variant, roundness, defaultIndex }) {
  const { nameKey, isLoading } = useRadialChart()
  if (isLoading) return null
  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      cursor={false}
      content={
        <ChartTooltipContent nameKey={nameKey} hideLabel roundness={roundness} variant={variant} />
      }
    />
  )
}
function Legend({ variant, align = 'center', verticalAlign = 'bottom', isClickable = false }) {
  const { nameKey, isLoading, selectedBar, selectBar } = useRadialChart()
  if (isLoading) return null
  return (
    <ChartLegend
      verticalAlign={verticalAlign}
      align={align}
      content={
        <ChartLegendContent
          selected={selectedBar}
          onSelectChange={selectBar}
          isClickable={isClickable}
          nameKey={nameKey}
          variant={variant}
        />
      }
    />
  )
}
function getVariantConfig(variant) {
  switch (variant) {
    case 'semi':
      return { startAngle: 180, endAngle: 0, cx: '50%', cy: '70%' }
    case 'full':
    default:
      return { startAngle: 90, endAngle: -270, cx: '50%', cy: '50%' }
  }
}
const ColorGradientStyle = ({ config, chartId }) => {
  return (
    <>
      {Object.entries(config).map(([dataKey, colorConfig]) => {
        const colorsCount = getColorsCount(colorConfig)
        return (
          <linearGradient
            key={`${chartId}-radial-colors-${dataKey}`}
            id={`${chartId}-radial-colors-${dataKey}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            {colorsCount === 1 ? (
              <>
                <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
              </>
            ) : (
              Array.from({ length: colorsCount }, (_, index) => {
                const offset = `${(index / (colorsCount - 1)) * 100}%`
                return (
                  <stop
                    key={offset}
                    offset={offset}
                    stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                  />
                )
              })
            )}
          </linearGradient>
        )
      })}
    </>
  )
}
function generateLoadingData() {
  return Array.from({ length: LOADING_BARS }, (_, i) => ({
    name: `loading${i}`,
    value: 40 + Math.random() * 60,
  }))
}
function useLoadingData(isLoading) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => {
      setTick(prev => prev + 1)
    }, LOADING_ANIMATION_DURATION)
    return () => clearInterval(interval)
  }, [isLoading])
  const loadingData = useMemo(() => generateLoadingData(), [tick])
  return loadingData
}
const LoadingRadialBar = () => {
  return (
    <RechartsRadialBar
      dataKey="value"
      cornerRadius={DEFAULT_CORNER_RADIUS}
      barSize={DEFAULT_BAR_SIZE}
      background
      isAnimationActive
      animationDuration={LOADING_ANIMATION_DURATION}
      animationEasing="ease-in-out"
      shape={props => <Sector {...props} fill="currentColor" fillOpacity={0.25} />}
    />
  )
}
EvilRadialChart.RadialBar = RadialBar
EvilRadialChart.Tooltip = Tooltip
EvilRadialChart.Legend = Legend
export { EvilRadialChart }
