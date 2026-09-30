// Vendored from EvilCharts (MIT, github.com/legions-developer/evilcharts), converted
// from TSX to JSX with esbuild (types stripped only). Colors come from each chart's
// config; see src/components/charts for the GR8-themed wrappers.
'use client'
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  axisValueToPercentFormatter,
  ChartContainer,
  getColorsCount,
  getLoadingData,
  LoadingIndicator,
} from '../ui/recharts-chart'
import {
  Area as RechartsArea,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from 'recharts'
import { ChartTooltip, ChartTooltipContent } from '../ui/recharts-tooltip'
import { Brush, EvilBrush, useEvilBrush } from '../ui/recharts-brush'
import { ChartLegend, ChartLegendContent } from '../ui/recharts-legend'
import { ChartDot } from '../ui/recharts-dot'
import { motion, useReducedMotion } from 'motion/react'
const STROKE_WIDTH = 0.8
const LOADING_AREA_DATA_KEY = 'loading'
const LOADING_ANIMATION_DURATION = 2e3
const STACK_ID = 'evil-stacked'
const REVEAL_DURATION = 1
const REVEAL_EASE = [0, 0.7, 0.5, 1]
const AreaChartContext = createContext(null)
function useAreaChart() {
  const context = use(AreaChartContext)
  if (!context) {
    throw new Error(
      'Area chart parts (<Area />, <XAxis />, \u2026) must be used within <EvilAreaChart />',
    )
  }
  return context
}
function EvilAreaChart({
  config,
  data,
  children,
  className,
  chartProps,
  curveType = 'linear',
  animationType = 'left-to-right',
  stackType = 'default',
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingPoints,
  xDataKey,
}) {
  const chartId = useId().replace(/:/g, '')
  const [selectedDataKey, setSelectedDataKey] = useState(defaultSelectedDataKey)
  const { loadingData, onShimmerExit } = useLoadingData(isLoading, loadingPoints)
  const { visibleData, brushProps } = useEvilBrush({ data })
  const brush = useMemo(() => {
    const parts = Children.toArray(children)
    const brushEl = parts.find(child => isValidElement(child) && child.type === Brush)
    const bp = isValidElement(brushEl) ? brushEl.props : {}
    return {
      slot: {
        present: isValidElement(brushEl),
        height: bp.height,
        formatLabel: bp.formatLabel,
        onChange: bp.onChange,
      },
      chartChildren: parts.filter(child => !(isValidElement(child) && child.type === Brush)),
    }
  }, [children])
  const showBrush = brush.slot.present
  const isExpanded = stackType === 'expanded'
  const isStacked = stackType === 'stacked' || isExpanded
  const displayData = showBrush && !isLoading ? visibleData : data
  const selectDataKey = useCallback(
    newSelectedDataKey => {
      setSelectedDataKey(newSelectedDataKey)
      onSelectionChange?.(newSelectedDataKey)
    },
    [onSelectionChange],
  )
  const contextValue = useMemo(
    () => ({
      config,
      curveType,
      animationType,
      isStacked,
      isExpanded,
      isLoading,
      selectedDataKey,
      selectDataKey,
    }),
    [
      config,
      curveType,
      animationType,
      isStacked,
      isExpanded,
      isLoading,
      selectedDataKey,
      selectDataKey,
    ],
  )
  return (
    <AreaChartContext value={contextValue}>
      <ChartContainer
        className={className}
        config={config}
        footer={
          showBrush &&
          !isLoading && (
            <EvilBrush
              data={data}
              chartConfig={config}
              xDataKey={xDataKey}
              variant="area"
              curveType={curveType}
              height={brush.slot.height}
              formatLabel={brush.slot.formatLabel}
              stacked={isStacked}
              skipStyle
              className="mt-1"
              {...brushProps}
              onChange={range => {
                brushProps.onChange(range)
                brush.slot.onChange?.(range)
              }}
            />
          )
        }
      >
        <LoadingIndicator isLoading={isLoading} />
        <RechartsAreaChart
          id={chartId}
          accessibilityLayer
          stackOffset={isExpanded ? 'expand' : void 0}
          data={isLoading ? loadingData : displayData}
          {...chartProps}
        >
          {brush.chartChildren}
          {isLoading && (
            <LoadingArea chartId={chartId} curveType={curveType} onShimmerExit={onShimmerExit} />
          )}
        </RechartsAreaChart>
      </ChartContainer>
    </AreaChartContext>
  )
}
function Area({
  dataKey,
  variant = 'gradient',
  strokeVariant = 'dashed',
  strokeWidth = STROKE_WIDTH,
  curveType,
  animationType,
  connectNulls = false,
  isClickable = false,
  children,
  areaProps,
}) {
  const {
    config,
    curveType: defaultCurve,
    animationType: defaultAnimation,
    isStacked,
    isExpanded,
    isLoading,
    selectedDataKey,
    selectDataKey,
  } = useAreaChart()
  const id = useId().replace(/:/g, '')
  const shouldReduceMotion = useReducedMotion()
  if (isLoading) return null
  const resolvedCurve = curveType ?? defaultCurve
  const revealType = shouldReduceMotion ? 'none' : (animationType ?? defaultAnimation)
  const maskId = revealType === 'none' ? void 0 : `${id}-reveal-mask`
  const isSelected = selectedDataKey === dataKey
  const hasSelection = selectedDataKey !== null
  const opacity = getOpacity(selectedDataKey, dataKey)
  const showUnselected = hasSelection && !isSelected
  const { dot, activeDot } = resolveDots(children, id, dataKey, opacity.dot, maskId)
  const isAnimatedDashed = strokeVariant === 'animated-dashed'
  const isDashed = strokeVariant === 'dashed' || isAnimatedDashed
  return (
    <>
      <RechartsArea
        type={resolvedCurve}
        dataKey={dataKey}
        connectNulls={connectNulls}
        fillOpacity={opacity.fill}
        strokeOpacity={opacity.stroke}
        fill={getFillPattern(variant, showUnselected, id)}
        stroke={`url(#${id}-colors-${dataKey})`}
        stackId={isStacked ? STACK_ID : void 0}
        dot={dot}
        activeDot={activeDot}
        strokeWidth={strokeWidth}
        strokeDasharray={isDashed ? '3 3' : void 0}
        isAnimationActive={false}
        style={{
          ...(maskId ? { mask: `url(#${maskId})` } : {}),
          ...(isClickable ? { cursor: 'pointer' } : {}),
        }}
        onClick={() => {
          if (!isClickable) return
          selectDataKey(isSelected ? null : dataKey)
        }}
        {...areaProps}
      >
        {isAnimatedDashed && !hasSelection && <AnimatedDashedStroke />}
      </RechartsArea>
      <defs>
        {revealType !== 'none' && <RevealMask id={id} type={revealType} />}
        <ColorGradient id={id} dataKey={dataKey} config={config} isExpanded={isExpanded} />
        {variant === 'gradient' && <GradientPattern id={id} dataKey={dataKey} />}
        {variant === 'gradient-reverse' && <ReverseGradientPattern id={id} dataKey={dataKey} />}
        {variant === 'solid' && <SolidPattern id={id} dataKey={dataKey} />}
        {variant === 'dotted' && <DottedPattern id={id} dataKey={dataKey} />}
        {variant === 'lines' && <LinesPattern id={id} dataKey={dataKey} />}
        {variant === 'hatched' && <HatchedPattern id={id} dataKey={dataKey} />}
        {showUnselected && <UnselectedPattern id={id} dataKey={dataKey} />}
      </defs>
    </>
  )
}
const Dot = () => null
const ActiveDot = () => null
function XAxis({ tickLine = false, axisLine = false, tickMargin = 8, minTickGap = 8, ...props }) {
  const { isLoading } = useAreaChart()
  if (isLoading) return null
  return (
    <RechartsXAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      {...props}
    />
  )
}
function YAxis({
  tickLine = false,
  axisLine = false,
  tickMargin = 8,
  minTickGap = 8,
  width = 'auto',
  tickFormatter,
  ...props
}) {
  const { isLoading, isExpanded } = useAreaChart()
  if (isLoading) return null
  return (
    <RechartsYAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      width={width}
      tickFormatter={isExpanded ? axisValueToPercentFormatter : tickFormatter}
      {...props}
    />
  )
}
function Grid({ vertical = false, strokeDasharray = '3 3', ...props }) {
  return <CartesianGrid vertical={vertical} strokeDasharray={strokeDasharray} {...props} />
}
function Tooltip({ variant, roundness, defaultIndex, cursor = true }) {
  const { isLoading, selectedDataKey } = useAreaChart()
  if (isLoading) return null
  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      cursor={cursor ? { strokeDasharray: '3 3', strokeWidth: STROKE_WIDTH } : false}
      content={
        <ChartTooltipContent selected={selectedDataKey} roundness={roundness} variant={variant} />
      }
    />
  )
}
function Legend({ variant, align = 'right', verticalAlign = 'top', isClickable = false }) {
  const { selectedDataKey, selectDataKey } = useAreaChart()
  return (
    <ChartLegend
      verticalAlign={verticalAlign}
      align={align}
      content={
        <ChartLegendContent
          selected={selectedDataKey}
          onSelectChange={selectDataKey}
          isClickable={isClickable}
          variant={variant}
        />
      }
    />
  )
}
const getOpacity = (selectedDataKey, dataKey) => {
  if (selectedDataKey === null) {
    return { fill: 0.8, stroke: 1, dot: 1 }
  }
  return selectedDataKey === dataKey
    ? { fill: 0.8, stroke: 1, dot: 1 }
    : { fill: 0.1, stroke: 0.3, dot: 0.3 }
}
const getFillPattern = (variant, showUnselected, id) => {
  if (showUnselected) return `url(#${id}-unselected)`
  return `url(#${id}-${variant})`
}
const resolveDots = (children, id, dataKey, dotOpacity, maskId) => {
  let dot = false
  let activeDot = false
  Children.forEach(children, child => {
    if (!isValidElement(child)) return
    if (child.type === Dot) {
      const { variant } = child.props
      dot = (
        <ChartDot
          type={variant}
          dataKey={dataKey}
          chartId={id}
          fillOpacity={dotOpacity}
          maskId={maskId}
        />
      )
    }
    if (child.type === ActiveDot) {
      const { variant } = child.props
      activeDot = (
        <ChartDot type={variant} dataKey={dataKey} chartId={id} fillOpacity={dotOpacity} />
      )
    }
  })
  return { dot, activeDot }
}
const AnimatedDashedStroke = () => {
  return (
    <>
      <animate
        attributeName="stroke-dasharray"
        values="3 3; 0 3; 3 3"
        dur="1s"
        repeatCount="indefinite"
        keyTimes="0;0.5;1"
      />
      <animate
        attributeName="stroke-dashoffset"
        values="0; -6"
        dur="1s"
        repeatCount="indefinite"
        keyTimes="0;1"
      />
    </>
  )
}
const SINGLE_REVEAL_ORIGIN = {
  'left-to-right': 0,
  'right-to-left': 1,
  'center-out': 0.5,
}
const RevealMask = ({ id, type }) => {
  const reveal = {
    initial: { scaleX: 0 },
    animate: { scaleX: 1 },
    transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE },
  }
  return (
    <mask
      id={`${id}-reveal-mask`}
      maskUnits="userSpaceOnUse"
      maskContentUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="100%"
      height="100%"
    >
      {type === 'edges-in' ? (
        <>
          {/* left half wipes inward from the left edge toward the centre */}
          <motion.rect
            {...reveal}
            x="0"
            y="0"
            width="50%"
            height="100%"
            fill="white"
            style={{ originX: 0 }}
          />
          {/* right half wipes inward from the right edge toward the centre */}
          <motion.rect
            {...reveal}
            x="50%"
            y="0"
            width="50%"
            height="100%"
            fill="white"
            style={{ originX: 1 }}
          />
        </>
      ) : (
        <motion.rect
          {...reveal}
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="white"
          style={{ originX: SINGLE_REVEAL_ORIGIN[type] }}
        />
      )}
    </mask>
  )
}
const ColorGradient = ({ id, dataKey, config, isExpanded }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {})
  return (
    <linearGradient
      id={`${id}-colors-${dataKey}`}
      x1="0"
      y1="0"
      x2="1"
      y2="0"
      gradientUnits={isExpanded ? 'userSpaceOnUse' : 'objectBoundingBox'}
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
}
const GradientPattern = ({ id, dataKey }) => {
  return (
    <>
      <linearGradient id={`${id}-vertical-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0.1} />
        <stop offset="100%" stopColor="white" stopOpacity={0} />
      </linearGradient>
      <mask id={`${id}-gradient-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-vertical-fade)`} />
      </mask>
      <pattern id={`${id}-gradient`} patternUnits="userSpaceOnUse" width="100%" height="100%">
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-gradient-mask)`}
        />
      </pattern>
    </>
  )
}
const ReverseGradientPattern = ({ id, dataKey }) => {
  return (
    <>
      <linearGradient id={`${id}-vertical-fade-reverse`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0} />
        <stop offset="100%" stopColor="white" stopOpacity={0.1} />
      </linearGradient>
      <mask id={`${id}-gradient-reverse-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-vertical-fade-reverse)`} />
      </mask>
      <pattern
        id={`${id}-gradient-reverse`}
        patternUnits="userSpaceOnUse"
        width="100%"
        height="100%"
      >
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-gradient-reverse-mask)`}
        />
      </pattern>
    </>
  )
}
const SolidPattern = ({ id, dataKey }) => {
  return (
    <>
      <linearGradient id={`${id}-solid-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0.1} />
        <stop offset="100%" stopColor="white" stopOpacity={0.1} />
      </linearGradient>
      <mask id={`${id}-solid-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-solid-fade)`} />
      </mask>
      <pattern id={`${id}-solid`} patternUnits="userSpaceOnUse" width="100%" height="100%">
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-solid-mask)`}
        />
      </pattern>
    </>
  )
}
const LinesPattern = ({ id, dataKey }) => {
  return (
    <>
      <pattern
        id={`${id}-lines-texture`}
        patternUnits="userSpaceOnUse"
        width="5"
        height="5"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="5" stroke="white" strokeWidth="1" />
      </pattern>
      <mask id={`${id}-lines-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-lines-texture)`} fillOpacity="0.3" />
      </mask>
      <pattern id={`${id}-lines`} patternUnits="userSpaceOnUse" width="100%" height="100%">
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-lines-mask)`}
        />
      </pattern>
    </>
  )
}
const DottedPattern = ({ id, dataKey }) => {
  return (
    <>
      <pattern
        id={`${id}-dotted-texture`}
        x="0"
        y="0"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="4" cy="4" r="0.5" fill="white" />
      </pattern>
      <mask id={`${id}-dotted-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-dotted-texture)`} fillOpacity="0.5" />
      </mask>
      <pattern id={`${id}-dotted`} patternUnits="userSpaceOnUse" width="100%" height="100%">
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-dotted-mask)`}
        />
      </pattern>
    </>
  )
}
const HatchedPattern = ({ id, dataKey }) => {
  return (
    <>
      <linearGradient id={`${id}-hatched-stripe`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="50%" stopColor="white" stopOpacity={0.2} />
        <stop offset="50%" stopColor="white" stopOpacity={1} />
      </linearGradient>
      <pattern
        id={`${id}-hatched-texture`}
        x="0"
        y="0"
        width="20"
        height="10"
        patternUnits="userSpaceOnUse"
        overflow="visible"
        patternTransform="rotate(20)"
      >
        <rect width="20" height="10" fill={`url(#${id}-hatched-stripe)`} />
      </pattern>
      <mask id={`${id}-hatched-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-hatched-texture)`} fillOpacity="0.2" />
      </mask>
      <pattern id={`${id}-hatched`} patternUnits="userSpaceOnUse" width="100%" height="100%">
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-hatched-mask)`}
        />
      </pattern>
    </>
  )
}
const UnselectedPattern = ({ id, dataKey }) => {
  return (
    <>
      <pattern
        id={`${id}-unselected-texture`}
        patternUnits="userSpaceOnUse"
        width="5"
        height="5"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="5" stroke="white" strokeWidth="1" />
      </pattern>
      <mask id={`${id}-unselected-mask`}>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-unselected-texture)`}
          fillOpacity="0.3"
        />
      </mask>
      <pattern id={`${id}-unselected`} patternUnits="userSpaceOnUse" width="100%" height="100%">
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-unselected-mask)`}
        />
      </pattern>
    </>
  )
}
const generateEasedGradientStops = (steps = 17, minOpacity = 0.05, maxOpacity = 0.9) => {
  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1)
    const eased = Math.sin(t * Math.PI) ** 2
    const opacity = minOpacity + eased * (maxOpacity - minOpacity)
    return { offset: `${(t * 100).toFixed(0)}%`, opacity: Number(opacity.toFixed(3)) }
  })
}
function useLoadingData(isLoading, loadingPoints = 14) {
  const [loadingDataKey, setLoadingDataKey] = useState(false)
  const onShimmerExit = useCallback(() => {
    if (isLoading) {
      setLoadingDataKey(prev => !prev)
    }
  }, [isLoading])
  const loadingData = useMemo(
    () => getLoadingData(loadingPoints),
    // loadingDataKey toggle triggers re-computation when the shimmer exits
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingPoints, loadingDataKey],
  )
  return { loadingData, onShimmerExit }
}
const LoadingArea = ({ chartId, curveType, onShimmerExit }) => {
  return (
    <>
      <RechartsArea
        type={curveType}
        dataKey={LOADING_AREA_DATA_KEY}
        fillOpacity={0.05}
        fill="currentColor"
        stroke="currentColor"
        strokeOpacity={0.5}
        isAnimationActive={false}
        legendType="none"
        tooltipType="none"
        activeDot={false}
        dot={false}
        style={{ mask: `url(#${chartId}-loading-mask)` }}
      />
      <defs>
        <LoadingPattern chartId={chartId} onShimmerExit={onShimmerExit} />
      </defs>
    </>
  )
}
const LoadingPattern = ({ chartId, onShimmerExit }) => {
  const gradientStops = generateEasedGradientStops()
  const patternWidth = 3
  const startX = -1
  const endX = 2
  const lastXRef = useRef(startX)
  return (
    <>
      <linearGradient id={`${chartId}-loading-gradient`} x1="0" y1="0" x2="1" y2="0">
        {gradientStops.map(({ offset, opacity }) => (
          <stop key={offset} offset={offset} stopColor="white" stopOpacity={opacity} />
        ))}
      </linearGradient>
      <pattern
        id={`${chartId}-loading-pattern`}
        patternUnits="objectBoundingBox"
        patternContentUnits="objectBoundingBox"
        patternTransform="rotate(25)"
        width={patternWidth}
        height="1"
        x="0"
        y="0"
      >
        <motion.rect
          y="0"
          width="1"
          height="1"
          fill={`url(#${chartId}-loading-gradient)`}
          initial={{ x: startX }}
          animate={{ x: endX }}
          transition={{
            duration: LOADING_ANIMATION_DURATION / 1e3,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
          }}
          onUpdate={latest => {
            const xValue = typeof latest.x === 'number' ? latest.x : startX
            const lastX = lastXRef.current
            if (xValue >= 1 && lastX < 1) {
              onShimmerExit()
            }
            lastXRef.current = xValue
          }}
        />
      </pattern>
      <mask id={`${chartId}-loading-mask`} maskUnits="userSpaceOnUse">
        <rect width="100%" height="100%" fill={`url(#${chartId}-loading-pattern)`} />
      </mask>
    </>
  )
}
EvilAreaChart.Area = Area
EvilAreaChart.Dot = Dot
EvilAreaChart.ActiveDot = ActiveDot
EvilAreaChart.XAxis = XAxis
EvilAreaChart.YAxis = YAxis
EvilAreaChart.Grid = Grid
EvilAreaChart.Tooltip = Tooltip
EvilAreaChart.Legend = Legend
EvilAreaChart.Brush = Brush
export { EvilAreaChart, useLoadingData }
