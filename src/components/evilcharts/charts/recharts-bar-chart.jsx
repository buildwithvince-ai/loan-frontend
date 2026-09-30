// Vendored from EvilCharts (MIT, github.com/legions-developer/evilcharts), converted
// from TSX to JSX with esbuild (types stripped only). Colors come from each chart's
// config; see src/components/charts for the GR8-themed wrappers.
'use client'
import {
  Bar as RechartsBar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Rectangle,
  ReferenceLine,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from 'recharts'
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
  ChartContainer,
  getColorsCount,
  getLoadingData,
  LoadingIndicator,
} from '../ui/recharts-chart'
import { ChartTooltip, ChartTooltipContent } from '../ui/recharts-tooltip'
import { ChartLegend, ChartLegendContent } from '../ui/recharts-legend'
import { Brush, EvilBrush, useEvilBrush } from '../ui/recharts-brush'
import { ChartBackground } from '../ui/recharts-background'
import { motion, useReducedMotion } from 'motion/react'
const DEFAULT_BAR_RADIUS = 2
const LOADING_BAR_DATA_KEY = 'loading'
const LOADING_ANIMATION_DURATION = 2e3
const STACK_ID = 'evil-stacked'
const BAR_GROW_DURATION = 0.5
const BAR_STAGGER = 0.05
const REVEAL_EASE = [0, 0.7, 0.5, 1]
const BarChartContext = createContext(null)
function useBarChart() {
  const context = use(BarChartContext)
  if (!context) {
    throw new Error(
      'Bar chart parts (<Bar />, <XAxis />, \u2026) must be used within <EvilBarChart />',
    )
  }
  return context
}
function EvilBarChart({
  config,
  data,
  children,
  className,
  chartProps,
  stackType = 'default',
  layout = 'vertical',
  barRadius = DEFAULT_BAR_RADIUS,
  animationType = 'left-to-right',
  barGap,
  barCategoryGap,
  backgroundVariant,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingBars,
  xDataKey,
}) {
  const chartId = useId().replace(/:/g, '')
  const [introStartedAt] = useState(() => Date.now())
  const [selectedDataKey, setSelectedDataKey] = useState(defaultSelectedDataKey)
  const [isMouseInChart, setIsMouseInChart] = useState(false)
  const { loadingData, onShimmerExit } = useLoadingData(isLoading, loadingBars)
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
  const isStacked = stackType === 'stacked' || stackType === 'percent'
  const isHorizontal = layout === 'horizontal'
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
      isStacked,
      isHorizontal,
      isLoading,
      barRadius,
      animationType,
      introStartedAt,
      dataLength: displayData.length,
      selectedDataKey,
      selectDataKey,
      isMouseInChart,
    }),
    [
      config,
      isStacked,
      isHorizontal,
      isLoading,
      barRadius,
      animationType,
      introStartedAt,
      displayData.length,
      selectedDataKey,
      selectDataKey,
      isMouseInChart,
    ],
  )
  return (
    <BarChartContext value={contextValue}>
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
              variant="bar"
              barRadius={barRadius}
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
        <RechartsBarChart
          id={chartId}
          accessibilityLayer
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          data={isLoading ? loadingData : displayData}
          barGap={barGap}
          barCategoryGap={barCategoryGap}
          stackOffset={stackType === 'percent' ? 'expand' : void 0}
          onMouseEnter={() => setIsMouseInChart(true)}
          onMouseLeave={() => setIsMouseInChart(false)}
          {...chartProps}
        >
          {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
          <ReferenceLine color="white" />
          {brush.chartChildren}
          {isLoading && <LoadingBar chartId={chartId} onShimmerExit={onShimmerExit} />}
        </RechartsBarChart>
      </ChartContainer>
    </BarChartContext>
  )
}
function Bar({
  dataKey,
  variant = 'default',
  radius,
  animationType,
  isClickable = false,
  enableHoverHighlight = false,
  glowing = false,
  bufferBar = false,
  barProps,
}) {
  const {
    config,
    isStacked,
    isHorizontal,
    isLoading,
    barRadius: defaultRadius,
    animationType: defaultAnimation,
    introStartedAt,
    dataLength,
    selectedDataKey,
    selectDataKey,
    isMouseInChart,
  } = useBarChart()
  const id = useId().replace(/:/g, '')
  const shouldReduceMotion = useReducedMotion()
  if (isLoading) return null
  const resolvedRadius = radius ?? defaultRadius
  const isSelected = selectedDataKey === dataKey
  const revealType = shouldReduceMotion ? 'none' : (animationType ?? defaultAnimation)
  const customBarProps = {
    id,
    dataKey,
    variant,
    barRadius: resolvedRadius,
    glowing,
    bufferBar,
    isClickable,
    enableHoverHighlight,
    isMouseInChart,
    isHorizontal,
    introStartedAt,
    selectedDataKey,
    dataLength,
    onClick: () => {
      if (!isClickable) return
      selectDataKey(isSelected ? null : dataKey)
    },
  }
  return (
    <>
      <RechartsBar
        dataKey={dataKey}
        stackId={isStacked ? STACK_ID : void 0}
        fill={`url(#${id}-colors-${dataKey})`}
        radius={resolvedRadius}
        isAnimationActive={false}
        style={isClickable || enableHoverHighlight ? { cursor: 'pointer' } : void 0}
        shape={props => <CustomBar {...props} {...customBarProps} animationType={revealType} />}
        activeBar={props => (
          // The active (hovered) bar must never re-run the grow-in animation
          <CustomBar {...props} {...customBarProps} animationType="none" />
        )}
        {...barProps}
      />
      <defs>
        <ColorGradient id={id} dataKey={dataKey} config={config} />
        {variant === 'hatched' && <HatchedPattern id={id} dataKey={dataKey} />}
        {variant === 'duotone' && <DuotonePattern id={id} dataKey={dataKey} config={config} />}
        {variant === 'duotone-reverse' && (
          <DuotoneReversePattern id={id} dataKey={dataKey} config={config} />
        )}
        {variant === 'gradient' && <GradientPattern id={id} dataKey={dataKey} />}
        {variant === 'stripped' && <StrippedPattern id={id} dataKey={dataKey} />}
        {bufferBar && <BufferHatchedPattern id={id} dataKey={dataKey} />}
        {glowing && <GlowFilter id={id} dataKey={dataKey} />}
      </defs>
    </>
  )
}
function XAxis({
  tickLine = false,
  axisLine = false,
  tickMargin = 8,
  minTickGap = 8,
  type,
  ...props
}) {
  const { isLoading, isHorizontal } = useBarChart()
  if (isLoading) return null
  return (
    <RechartsXAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      type={type ?? (isHorizontal ? 'number' : 'category')}
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
  type,
  ...props
}) {
  const { isLoading, isHorizontal } = useBarChart()
  if (isLoading) return null
  return (
    <RechartsYAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      width={width}
      type={type ?? (isHorizontal ? 'category' : 'number')}
      {...props}
    />
  )
}
function Grid({ strokeDasharray = '3 3', vertical, horizontal, ...props }) {
  const { isHorizontal } = useBarChart()
  return (
    <CartesianGrid
      strokeDasharray={strokeDasharray}
      vertical={vertical ?? isHorizontal}
      horizontal={horizontal ?? !isHorizontal}
      {...props}
    />
  )
}
function Tooltip({ variant, roundness, defaultIndex }) {
  const { isLoading, selectedDataKey } = useBarChart()
  if (isLoading) return null
  return (
    <ChartTooltip
      cursor={false}
      defaultIndex={defaultIndex}
      content={
        <ChartTooltipContent selected={selectedDataKey} roundness={roundness} variant={variant} />
      }
    />
  )
}
function Legend({ variant, align = 'right', verticalAlign = 'top', isClickable = false }) {
  const { selectedDataKey, selectDataKey } = useBarChart()
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
const CustomBar = props => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    id,
    dataKey,
    variant,
    barRadius,
    glowing,
    bufferBar,
    isClickable,
    enableHoverHighlight,
    isMouseInChart,
    isHorizontal = false,
    animationType = 'none',
    introStartedAt = 0,
    selectedDataKey,
    isActive,
    dataLength = 0,
    onClick,
  } = props
  const index = typeof props.index === 'number' ? props.index : -1
  const isLastBar = bufferBar && dataLength > 0 && index === dataLength - 1
  const isStripped = variant === 'stripped'
  const grow = getBarGrowAnimation(animationType, index, dataLength, isHorizontal, introStartedAt)
  const fill = isLastBar
    ? `url(#${id}-buffer-hatched-${dataKey})`
    : getVariantFill(variant, id, dataKey)
  const filter = glowing ? `url(#${id}-bar-glow-${dataKey})` : void 0
  const fillOpacity = getBarOpacity({
    isClickable,
    selectedDataKey,
    dataKey,
    enableHoverHighlight,
    isMouseInChart,
    isActive,
  })
  const cursorStyle = isClickable || enableHoverHighlight ? { cursor: 'pointer' } : void 0
  const radius = isStripped ? [barRadius, barRadius, 0, 0] : barRadius
  const visibleBar = (
    <>
      <Rectangle
        x={x}
        y={y}
        width={width}
        opacity={fillOpacity}
        height={Math.max(0, height - 3)}
        radius={radius}
        fill={fill}
        filter={filter}
        stroke={isLastBar ? `url(#${id}-colors-${dataKey})` : void 0}
        strokeWidth={isLastBar ? 1 : void 0}
      />
      {isStripped && (
        <Rectangle
          x={x}
          y={y - 4}
          width={width}
          height={2}
          radius={1}
          fill={`url(#${id}-colors-${dataKey})`}
        />
      )}
    </>
  )
  return (
    <g style={cursorStyle} onClick={onClick}>
      {/* Full-height invisible rect keeps the whole column hoverable/clickable */}
      <Rectangle {...props} fill="transparent" />
      {/* The painted bar grows in from its baseline; the hit rect above stays put */}
      {grow ? (
        <motion.g
          initial={grow.initial}
          animate={grow.animate}
          transition={grow.transition}
          style={grow.style}
        >
          {visibleBar}
        </motion.g>
      ) : (
        visibleBar
      )}
    </g>
  )
}
const getBarGrowAnimation = (animationType, index, dataLength, isHorizontal, introStartedAt) => {
  if (animationType === 'none' || index < 0 || dataLength <= 0) return null
  const lastIndex = dataLength - 1
  const center = lastIndex / 2
  let step
  switch (animationType) {
    case 'right-to-left':
      step = lastIndex - index
      break
    case 'center-out':
      step = Math.abs(index - center)
      break
    case 'edges-in':
      step = center - Math.abs(index - center)
      break
    default:
      step = index
  }
  const startMs = step * BAR_STAGGER * 1e3
  const durationMs = BAR_GROW_DURATION * 1e3
  const endMs = startMs + durationMs
  const elapsed = Date.now() - introStartedAt
  if (elapsed >= endMs) return null
  const from = elapsed <= startMs ? 0 : (elapsed - startMs) / durationMs
  const transition = {
    duration: (endMs - Math.max(elapsed, startMs)) / 1e3,
    ease: REVEAL_EASE,
    delay: Math.max(0, startMs - elapsed) / 1e3,
  }
  return isHorizontal
    ? { initial: { scaleX: from }, animate: { scaleX: 1 }, transition, style: { originX: 0 } }
    : { initial: { scaleY: from }, animate: { scaleY: 1 }, transition, style: { originY: 1 } }
}
const getVariantFill = (variant, id, dataKey) => {
  switch (variant) {
    case 'hatched':
      return `url(#${id}-hatched-${dataKey})`
    case 'duotone':
      return `url(#${id}-duotone-${dataKey})`
    case 'duotone-reverse':
      return `url(#${id}-duotone-reverse-${dataKey})`
    case 'gradient':
      return `url(#${id}-gradient-${dataKey})`
    case 'stripped':
      return `url(#${id}-stripped-${dataKey})`
    default:
      return `url(#${id}-colors-${dataKey})`
  }
}
const getBarOpacity = ({
  isClickable,
  selectedDataKey,
  dataKey,
  enableHoverHighlight,
  isMouseInChart,
  isActive,
}) => {
  const isSelectedDataKey = selectedDataKey === null || selectedDataKey === dataKey
  const clickOpacity = isClickable && selectedDataKey !== null ? (isSelectedDataKey ? 1 : 0.15) : 1
  if (enableHoverHighlight && isMouseInChart) {
    return isActive ? clickOpacity : clickOpacity * 0.3
  }
  return clickOpacity
}
const ColorGradient = ({ id, dataKey, config }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {})
  return (
    <linearGradient id={`${id}-colors-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
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
const HatchedPattern = ({ id, dataKey }) => {
  return (
    <>
      <pattern
        id={`${id}-hatched-mask-pattern`}
        x="0"
        y="0"
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <rect width="5" height="5" fill="white" fillOpacity={0.3} />
        <rect width="1.5" height="5" fill="white" fillOpacity={1} />
      </pattern>
      <mask id={`${id}-hatched-mask-${dataKey}`}>
        <rect width="100%" height="100%" fill={`url(#${id}-hatched-mask-pattern)`} />
      </mask>
      <pattern
        id={`${id}-hatched-${dataKey}`}
        patternUnits="userSpaceOnUse"
        width="100%"
        height="100%"
      >
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-hatched-mask-${dataKey})`}
        />
      </pattern>
    </>
  )
}
const BufferHatchedPattern = ({ id, dataKey }) => {
  return (
    <>
      <pattern
        id={`${id}-buffer-hatched-mask-pattern`}
        x="0"
        y="0"
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <rect width="5" height="5" fill="black" fillOpacity={0} />
        <rect width="1" height="5" fill="white" fillOpacity={1} />
      </pattern>
      <mask id={`${id}-buffer-hatched-mask-${dataKey}`}>
        <rect width="100%" height="100%" fill={`url(#${id}-buffer-hatched-mask-pattern)`} />
      </mask>
      <pattern
        id={`${id}-buffer-hatched-${dataKey}`}
        patternUnits="userSpaceOnUse"
        width="100%"
        height="100%"
      >
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-buffer-hatched-mask-${dataKey})`}
        />
      </pattern>
    </>
  )
}
const DuotonePattern = ({ id, dataKey, config }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {})
  return (
    <>
      <linearGradient
        id={`${id}-duotone-mask-gradient-${dataKey}`}
        gradientUnits="objectBoundingBox"
        x1="0"
        y1="0"
        x2="1"
        y2="0"
      >
        <stop offset="50%" stopColor="white" stopOpacity={0.4} />
        <stop offset="50%" stopColor="white" stopOpacity={1} />
      </linearGradient>
      <linearGradient
        id={`${id}-duotone-colors-${dataKey}`}
        gradientUnits="objectBoundingBox"
        x1="0"
        y1="0"
        x2="0"
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
      <mask id={`${id}-duotone-mask-${dataKey}`} maskContentUnits="objectBoundingBox">
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill={`url(#${id}-duotone-mask-gradient-${dataKey})`}
        />
      </mask>
      <pattern
        id={`${id}-duotone-${dataKey}`}
        patternUnits="objectBoundingBox"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill={`url(#${id}-duotone-colors-${dataKey})`}
          mask={`url(#${id}-duotone-mask-${dataKey})`}
        />
      </pattern>
    </>
  )
}
const DuotoneReversePattern = ({ id, dataKey, config }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {})
  return (
    <>
      <linearGradient
        id={`${id}-duotone-reverse-mask-gradient-${dataKey}`}
        gradientUnits="objectBoundingBox"
        x1="0"
        y1="0"
        x2="1"
        y2="0"
      >
        <stop offset="50%" stopColor="white" stopOpacity={1} />
        <stop offset="50%" stopColor="white" stopOpacity={0.4} />
      </linearGradient>
      <linearGradient
        id={`${id}-duotone-reverse-colors-${dataKey}`}
        gradientUnits="objectBoundingBox"
        x1="0"
        y1="0"
        x2="0"
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
      <mask id={`${id}-duotone-reverse-mask-${dataKey}`} maskContentUnits="objectBoundingBox">
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill={`url(#${id}-duotone-reverse-mask-gradient-${dataKey})`}
        />
      </mask>
      <pattern
        id={`${id}-duotone-reverse-${dataKey}`}
        patternUnits="objectBoundingBox"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill={`url(#${id}-duotone-reverse-colors-${dataKey})`}
          mask={`url(#${id}-duotone-reverse-mask-${dataKey})`}
        />
      </pattern>
    </>
  )
}
const GradientPattern = ({ id, dataKey }) => {
  return (
    <>
      <linearGradient id={`${id}-gradient-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="20%" stopColor="white" stopOpacity={1} />
        <stop offset="90%" stopColor="white" stopOpacity={0} />
      </linearGradient>
      <mask id={`${id}-gradient-mask-${dataKey}`}>
        <rect width="100%" height="100%" fill={`url(#${id}-gradient-mask-gradient)`} />
      </mask>
      <pattern
        id={`${id}-gradient-${dataKey}`}
        patternUnits="userSpaceOnUse"
        width="100%"
        height="100%"
      >
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-gradient-mask-${dataKey})`}
        />
      </pattern>
    </>
  )
}
const StrippedPattern = ({ id, dataKey }) => {
  return (
    <>
      <linearGradient id={`${id}-stripped-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0.2} />
        <stop offset="100%" stopColor="white" stopOpacity={0.2} />
      </linearGradient>
      <mask id={`${id}-stripped-mask-${dataKey}`}>
        <rect width="100%" height="100%" fill={`url(#${id}-stripped-mask-gradient)`} />
      </mask>
      <pattern
        id={`${id}-stripped-${dataKey}`}
        patternUnits="userSpaceOnUse"
        width="100%"
        height="100%"
      >
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-stripped-mask-${dataKey})`}
        />
      </pattern>
    </>
  )
}
const GlowFilter = ({ id, dataKey }) => {
  return (
    <filter id={`${id}-bar-glow-${dataKey}`} x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
      <feColorMatrix
        in="blur"
        type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.5 0"
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
function useLoadingData(isLoading, loadingBars = 12) {
  const [loadingDataKey, setLoadingDataKey] = useState(false)
  const onShimmerExit = useCallback(() => {
    if (isLoading) {
      setLoadingDataKey(prev => !prev)
    }
  }, [isLoading])
  const loadingData = useMemo(
    () => getLoadingData(loadingBars, 20, 80),
    // loadingDataKey toggle triggers re-computation when the shimmer exits
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingBars, loadingDataKey],
  )
  return { loadingData, onShimmerExit }
}
const LoadingBar = ({ chartId, onShimmerExit }) => {
  return (
    <>
      <RechartsBar
        dataKey={LOADING_BAR_DATA_KEY}
        fill="currentColor"
        fillOpacity={0.15}
        radius={DEFAULT_BAR_RADIUS}
        isAnimationActive={false}
        legendType="none"
        style={{ mask: `url(#${chartId}-loading-mask)` }}
      />
      <defs>
        <LoadingBarPattern chartId={chartId} onShimmerExit={onShimmerExit} />
      </defs>
    </>
  )
}
const LoadingBarPattern = ({ chartId, onShimmerExit }) => {
  const gradientStops = generateEasedGradientStops()
  const patternWidth = 3
  const startX = -1
  const endX = 2
  const lastXRef = useRef(startX)
  return (
    <>
      <linearGradient id={`${chartId}-loading-mask-gradient`} x1="0" y1="0" x2="1" y2="0">
        {gradientStops.map(({ offset, opacity }) => (
          <stop key={offset} offset={offset} stopColor="white" stopOpacity={opacity} />
        ))}
      </linearGradient>
      <pattern
        id={`${chartId}-loading-mask-pattern`}
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
          fill={`url(#${chartId}-loading-mask-gradient)`}
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
        <rect width="100%" height="100%" fill={`url(#${chartId}-loading-mask-pattern)`} />
      </mask>
    </>
  )
}
EvilBarChart.Bar = Bar
EvilBarChart.XAxis = XAxis
EvilBarChart.YAxis = YAxis
EvilBarChart.Grid = Grid
EvilBarChart.Tooltip = Tooltip
EvilBarChart.Legend = Legend
EvilBarChart.Brush = Brush
export { EvilBarChart, useLoadingData }
