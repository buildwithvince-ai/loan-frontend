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
  CartesianGrid,
  Curve,
  Line as RechartsLine,
  LineChart as RechartsLineChart,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from 'recharts'
import {
  ChartContainer,
  getColorsCount,
  getLoadingData,
  LoadingIndicator,
} from '../ui/recharts-chart'
import { ChartTooltip, ChartTooltipContent } from '../ui/recharts-tooltip'
import { Brush, EvilBrush, useEvilBrush } from '../ui/recharts-brush'
import { ChartLegend, ChartLegendContent } from '../ui/recharts-legend'
import { ChartDot } from '../ui/recharts-dot'
import { motion, useReducedMotion } from 'motion/react'
const STROKE_WIDTH = 0.8
const LOADING_LINE_DATA_KEY = 'loading'
const LOADING_ANIMATION_DURATION = 2e3
const REVEAL_DURATION = 1
const REVEAL_EASE = [0, 0.7, 0.5, 1]
const LineChartContext = createContext(null)
function useLineChart() {
  const context = use(LineChartContext)
  if (!context) {
    throw new Error(
      'Line chart parts (<Line />, <XAxis />, \u2026) must be used within <EvilLineChart />',
    )
  }
  return context
}
function EvilLineChart({
  config,
  data,
  children,
  className,
  chartProps,
  curveType = 'linear',
  animationType = 'left-to-right',
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
      isLoading,
      selectedDataKey,
      selectDataKey,
    }),
    [config, curveType, animationType, isLoading, selectedDataKey, selectDataKey],
  )
  return (
    <LineChartContext value={contextValue}>
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
              variant="line"
              curveType={curveType}
              height={brush.slot.height}
              formatLabel={brush.slot.formatLabel}
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
        <RechartsLineChart
          id={chartId}
          accessibilityLayer
          data={isLoading ? loadingData : displayData}
          {...chartProps}
        >
          {brush.chartChildren}
          {isLoading && (
            <LoadingLine chartId={chartId} curveType={curveType} onShimmerExit={onShimmerExit} />
          )}
        </RechartsLineChart>
      </ChartContainer>
    </LineChartContext>
  )
}
function Line({
  dataKey,
  strokeVariant = 'solid',
  strokeWidth = STROKE_WIDTH,
  curveType,
  animationType,
  connectNulls = false,
  isClickable = false,
  glowing = false,
  enableBufferLine = false,
  children,
  lineProps,
}) {
  const {
    config,
    curveType: defaultCurve,
    animationType: defaultAnimation,
    isLoading,
    selectedDataKey,
    selectDataKey,
  } = useLineChart()
  const id = useId().replace(/:/g, '')
  const shouldReduceMotion = useReducedMotion()
  if (isLoading) return null
  const resolvedCurve = curveType ?? defaultCurve
  const revealType = shouldReduceMotion ? 'none' : (animationType ?? defaultAnimation)
  const maskId = revealType === 'none' ? void 0 : `${id}-reveal-mask`
  const isSelected = selectedDataKey === dataKey
  const hasSelection = selectedDataKey !== null
  const opacity = getOpacity(selectedDataKey, dataKey)
  const { dot, activeDot } = resolveDots(children, id, dataKey, opacity.dot, maskId)
  const isAnimatedDashed = strokeVariant === 'animated-dashed'
  const isDashed = strokeVariant === 'dashed' || isAnimatedDashed
  return (
    <>
      <g key={dataKey}>
        {isClickable && (
          <RechartsLine
            type={resolvedCurve}
            dataKey={dataKey}
            connectNulls={connectNulls}
            stroke="transparent"
            strokeWidth={15}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
            tooltipType="none"
            style={{ cursor: 'pointer' }}
            onClick={() => selectDataKey(isSelected ? null : dataKey)}
          />
        )}
        <RechartsLine
          type={resolvedCurve}
          dataKey={dataKey}
          connectNulls={connectNulls}
          strokeOpacity={opacity.stroke}
          stroke={`url(#${id}-colors-${dataKey})`}
          filter={glowing ? `url(#${id}-glow-${dataKey})` : void 0}
          dot={dot}
          activeDot={activeDot}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeDasharray(enableBufferLine, isDashed)}
          shape={enableBufferLine ? bufferLineShape : void 0}
          isAnimationActive={false}
          style={{
            ...(maskId ? { mask: `url(#${maskId})` } : {}),
            ...(isClickable ? { cursor: 'pointer' } : {}),
          }}
          onClick={() => {
            if (!isClickable) return
            selectDataKey(isSelected ? null : dataKey)
          }}
          {...lineProps}
        >
          {isAnimatedDashed && !hasSelection && <AnimatedDashedStroke />}
        </RechartsLine>
      </g>
      <defs>
        {revealType !== 'none' && <RevealMask id={id} type={revealType} />}
        <ColorGradient id={id} dataKey={dataKey} config={config} />
        {glowing && <GlowFilter id={id} dataKey={dataKey} />}
      </defs>
    </>
  )
}
const Dot = () => null
const ActiveDot = () => null
function XAxis({ tickLine = false, axisLine = false, tickMargin = 8, minTickGap = 8, ...props }) {
  const { isLoading } = useLineChart()
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
  ...props
}) {
  const { isLoading } = useLineChart()
  if (isLoading) return null
  return (
    <RechartsYAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      width={width}
      {...props}
    />
  )
}
function Grid({ vertical = false, strokeDasharray = '3 3', ...props }) {
  return <CartesianGrid vertical={vertical} strokeDasharray={strokeDasharray} {...props} />
}
function Tooltip({ variant, roundness, defaultIndex, cursor = true }) {
  const { isLoading, selectedDataKey } = useLineChart()
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
  const { selectedDataKey, selectDataKey } = useLineChart()
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
    return { stroke: 1, dot: 1 }
  }
  return selectedDataKey === dataKey ? { stroke: 1, dot: 1 } : { stroke: 0.3, dot: 0.3 }
}
const getStrokeDasharray = (enableBufferLine, isDashed) => {
  if (enableBufferLine) return void 0
  return isDashed ? '5 5' : void 0
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
const isDrawableCurvePoint = point => {
  return typeof point.x === 'number' && typeof point.y === 'number'
}
const BUFFER_DASH_SIZE = 4
const BUFFER_GAP_SIZE = 3
const findLengthAtX = (path, totalLength, targetX) => {
  let lo = 0
  let hi = totalLength
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2
    const pt = path.getPointAtLength(mid)
    if (pt.x < targetX) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
const bufferLineShape = props => {
  const { points, ...rest } = props
  if (!points || points.length < 2) {
    return <Curve {...props} />
  }
  const drawablePoints = points.filter(isDrawableCurvePoint)
  if (drawablePoints.length < 2) {
    return <Curve {...props} />
  }
  const splitX = drawablePoints[drawablePoints.length - 2].x
  const gRef = g => {
    if (!g) return
    const path = g.querySelector('path')
    if (!path) return
    const totalLength = path.getTotalLength()
    const solidLength = findLengthAtX(path, totalLength, splitX)
    const lastSegmentLength = totalLength - solidLength
    const reps = Math.ceil(lastSegmentLength / (BUFFER_DASH_SIZE + BUFFER_GAP_SIZE)) + 1
    const dashedPart = Array.from(
      { length: reps },
      () => `${BUFFER_DASH_SIZE} ${BUFFER_GAP_SIZE}`,
    ).join(' ')
    path.setAttribute('stroke-dasharray', `${solidLength} 0 ${dashedPart}`)
  }
  return (
    <g ref={gRef}>
      <Curve {...rest} points={drawablePoints} />
    </g>
  )
}
const AnimatedDashedStroke = () => {
  return (
    <>
      <animate
        attributeName="stroke-dasharray"
        values="5 5; 0 5; 5 5"
        dur="1s"
        repeatCount="indefinite"
        keyTimes="0;0.5;1"
      />
      <animate
        attributeName="stroke-dashoffset"
        values="0; -10"
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
const ColorGradient = ({ id, dataKey, config }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {})
  return (
    <linearGradient id={`${id}-colors-${dataKey}`} x1="0" y1="0" x2="1" y2="0">
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
const GlowFilter = ({ id, dataKey }) => {
  return (
    <filter id={`${id}-glow-${dataKey}`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
      <feColorMatrix
        in="blur"
        type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 2 0"
        result="glow"
      />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
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
const LoadingLine = ({ chartId, curveType, onShimmerExit }) => {
  return (
    <>
      <RechartsLine
        type={curveType}
        dataKey={LOADING_LINE_DATA_KEY}
        min={0}
        max={100}
        stroke="currentColor"
        strokeOpacity={0.5}
        isAnimationActive={false}
        legendType="none"
        tooltipType="none"
        activeDot={false}
        dot={false}
        strokeWidth={STROKE_WIDTH}
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
EvilLineChart.Line = Line
EvilLineChart.Dot = Dot
EvilLineChart.ActiveDot = ActiveDot
EvilLineChart.XAxis = XAxis
EvilLineChart.YAxis = YAxis
EvilLineChart.Grid = Grid
EvilLineChart.Tooltip = Tooltip
EvilLineChart.Legend = Legend
EvilLineChart.Brush = Brush
export { EvilLineChart, useLoadingData }
