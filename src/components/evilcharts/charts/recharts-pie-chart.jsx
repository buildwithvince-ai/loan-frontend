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
  useState,
} from 'react'
import {
  LabelList as RechartsLabelList,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
  Sector,
} from 'recharts'
import { ChartTooltip, ChartTooltipContent } from '../ui/recharts-tooltip'
import { ChartContainer, getColorsCount, LoadingIndicator } from '../ui/recharts-chart'
import { ChartLegend, ChartLegendContent } from '../ui/recharts-legend'
import { ChartBackground } from '../ui/recharts-background'
import { motion } from 'motion/react'
const LOADING_SECTORS = 5
const LOADING_ANIMATION_DURATION = 2e3
const DEFAULT_INNER_RADIUS = 0
const DEFAULT_OUTER_RADIUS = '80%'
const DEFAULT_CORNER_RADIUS = 0
const DEFAULT_PADDING_ANGLE = 0
const DEFAULT_START_ANGLE = 0
const DEFAULT_END_ANGLE = 360
const EMPTY_GLOWING_SECTORS = []
const PieChartContext = createContext(null)
function usePieChart() {
  const context = use(PieChartContext)
  if (!context) {
    throw new Error(
      'Pie chart parts (<Pie />, <Tooltip />, \u2026) must be used within <EvilPieChart />',
    )
  }
  return context
}
function EvilPieChart({
  config,
  data,
  dataKey,
  nameKey,
  children,
  className,
  chartProps,
  defaultSelectedSector = null,
  onSelectionChange,
  isLoading = false,
}) {
  const [selectedSector, setSelectedSector] = useState(defaultSelectedSector)
  const selectSector = useCallback(
    sectorName => {
      setSelectedSector(sectorName)
      if (sectorName === null) {
        onSelectionChange?.(null)
        return
      }
      const selectedItem = data.find(item => item[nameKey] === sectorName)
      if (selectedItem) {
        onSelectionChange?.({ dataKey: sectorName, value: selectedItem[dataKey] })
      }
    },
    [data, dataKey, nameKey, onSelectionChange],
  )
  const contextValue = useMemo(
    () => ({
      config,
      data,
      dataKey,
      nameKey,
      isLoading,
      selectedSector,
      selectSector,
    }),
    [config, data, dataKey, nameKey, isLoading, selectedSector, selectSector],
  )
  return (
    <PieChartContext value={contextValue}>
      <ChartContainer className={className} config={config}>
        <LoadingIndicator isLoading={isLoading} />
        <RechartsPieChart id="evil-charts-pie-chart" accessibilityLayer {...chartProps}>
          {children}
        </RechartsPieChart>
      </ChartContainer>
    </PieChartContext>
  )
}
function Pie({
  variant = 'gradient',
  innerRadius = DEFAULT_INNER_RADIUS,
  outerRadius = DEFAULT_OUTER_RADIUS,
  cornerRadius = DEFAULT_CORNER_RADIUS,
  paddingAngle = DEFAULT_PADDING_ANGLE,
  startAngle = DEFAULT_START_ANGLE,
  endAngle = DEFAULT_END_ANGLE,
  isClickable = false,
  glowingSectors = EMPTY_GLOWING_SECTORS,
  children,
  pieProps,
}) {
  const { config, data, dataKey, nameKey, isLoading, selectedSector, selectSector } = usePieChart()
  const id = useId().replace(/:/g, '')
  if (isLoading) {
    return (
      <RechartsPie
        data={LOADING_PIE_DATA}
        dataKey="value"
        nameKey="name"
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        cornerRadius={cornerRadius}
        paddingAngle={paddingAngle}
        startAngle={startAngle}
        endAngle={endAngle}
        strokeWidth={0}
        isAnimationActive={false}
        shape={props => <AnimatedLoadingSector {...props} />}
      />
    )
  }
  const label = resolveLabel(children, dataKey)
  const preparedData = data.map(item => ({
    ...item,
    fill: `url(#${id}-colors-${item[nameKey]})`,
  }))
  return (
    <>
      <RechartsPie
        data={preparedData}
        dataKey={dataKey}
        nameKey={nameKey}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        cornerRadius={cornerRadius}
        paddingAngle={paddingAngle}
        startAngle={startAngle}
        endAngle={endAngle}
        strokeWidth={0}
        isAnimationActive
        style={isClickable ? { cursor: 'pointer' } : void 0}
        onClick={(_, index) => {
          if (!isClickable) return
          const clickedName = data[index]?.[nameKey]
          selectSector(selectedSector === clickedName ? null : clickedName)
        }}
        shape={props => {
          const sectorName = data[props.index ?? 0]?.[nameKey]
          const isGlowing = glowingSectors.includes(sectorName)
          const isDimmed = isClickable && selectedSector !== null && selectedSector !== sectorName
          return (
            <Sector
              {...props}
              fill={`url(#${id}-colors-${sectorName})`}
              filter={isGlowing ? `url(#${id}-glow-${sectorName})` : void 0}
              stroke={paddingAngle < 0 ? 'var(--background)' : 'none'}
              strokeWidth={paddingAngle < 0 ? 5 : 0}
              opacity={isDimmed ? 0.15 : 1}
              className="transition-opacity duration-200"
            />
          )
        }}
        {...pieProps}
      >
        {label}
      </RechartsPie>
      <defs>
        <RadialColorGradient id={id} config={config} variant={variant} />
        {glowingSectors.length > 0 && <GlowFilter id={id} glowingSectors={glowingSectors} />}
      </defs>
    </>
  )
}
const Label = () => null
function Tooltip({ variant, roundness, defaultIndex }) {
  const { isLoading, nameKey } = usePieChart()
  if (isLoading) return null
  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      content={
        <ChartTooltipContent nameKey={nameKey} hideLabel roundness={roundness} variant={variant} />
      }
    />
  )
}
function Legend({ variant, align = 'center', verticalAlign = 'bottom', isClickable = false }) {
  const { nameKey, selectedSector, selectSector } = usePieChart()
  return (
    <ChartLegend
      verticalAlign={verticalAlign}
      align={align}
      content={
        <ChartLegendContent
          selected={selectedSector}
          onSelectChange={selectSector}
          isClickable={isClickable}
          nameKey={nameKey}
          variant={variant}
        />
      }
    />
  )
}
function Background({ variant = 'dots' }) {
  return <ChartBackground variant={variant} />
}
const resolveLabel = (children, valueKey) => {
  let label = null
  Children.forEach(children, child => {
    if (!isValidElement(child) || child.type !== Label) return
    const { dataKey, labelListProps } = child.props
    label = (
      <RechartsLabelList
        dataKey={dataKey ?? valueKey}
        stroke="none"
        fontSize={12}
        fontWeight={500}
        fill="currentColor"
        className="fill-background"
        {...labelListProps}
      />
    )
  })
  return label
}
const RadialColorGradient = ({ id, config }) => {
  return (
    <>
      {Object.entries(config).map(([sectorKey, sectorConfig]) => {
        const colorsCount = getColorsCount(sectorConfig)
        return (
          <linearGradient
            key={`${id}-colors-${sectorKey}`}
            id={`${id}-colors-${sectorKey}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            {colorsCount === 1 ? (
              <>
                <stop offset="0%" stopColor={`var(--color-${sectorKey}-0)`} />
                <stop offset="100%" stopColor={`var(--color-${sectorKey}-0)`} />
              </>
            ) : (
              Array.from({ length: colorsCount }, (_, index) => {
                const offset = `${(index / (colorsCount - 1)) * 100}%`
                return (
                  <stop
                    key={offset}
                    offset={offset}
                    stopColor={`var(--color-${sectorKey}-${index}, var(--color-${sectorKey}-0))`}
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
const GlowFilter = ({ id, glowingSectors }) => {
  return (
    <>
      {glowingSectors.map(sectorName => (
        <filter
          key={`${id}-glow-${sectorName}`}
          id={`${id}-glow-${sectorName}`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
    </>
  )
}
const LOADING_PIE_DATA = Array.from({ length: LOADING_SECTORS }, (_, i) => ({
  name: `loading${i}`,
  value: 100 / LOADING_SECTORS,
}))
const AnimatedLoadingSector = props => {
  const { index = 0, ...sectorProps } = props
  const delay = (index / LOADING_SECTORS) * (LOADING_ANIMATION_DURATION / 1e3)
  return (
    <motion.g
      initial={{ opacity: 0.15 }}
      animate={{ opacity: [0.15, 0.5, 0.15] }}
      transition={{
        duration: LOADING_ANIMATION_DURATION / 1e3,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Sector {...sectorProps} fill="currentColor" />
    </motion.g>
  )
}
EvilPieChart.Pie = Pie
EvilPieChart.Label = Label
EvilPieChart.Tooltip = Tooltip
EvilPieChart.Legend = Legend
EvilPieChart.Background = Background
export { EvilPieChart }
