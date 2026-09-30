// Vendored from EvilCharts (MIT, github.com/legions-developer/evilcharts), converted
// from TSX to JSX with esbuild (types stripped only). Colors come from each chart's
// config; see src/components/charts for the GR8-themed wrappers.
import { getPayloadConfigFromPayload, getColorsCount, useChart } from './recharts-chart'
import * as RechartsPrimitive from 'recharts'
import { cn } from '../../../lib/cn'
function ChartLegendContent({
  className,
  hideIcon = false,
  nameKey,
  payload,
  verticalAlign,
  align = 'right',
  selected,
  onSelectChange,
  isClickable,
  variant = 'rounded-square',
}) {
  const { config } = useChart()
  if (!payload?.length) {
    return null
  }
  return (
    <div
      className={cn(
        'flex items-center gap-4 select-none',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        verticalAlign === 'top' ? 'pb-4' : 'pt-4',
        className,
      )}
    >
      {payload
        .filter(item => item.type !== 'none')
        .map(item => {
          const payloadName = nameKey && item.payload ? item.payload[nameKey] : void 0
          const key = `${payloadName ?? item.value ?? item.dataKey ?? 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const isSelected = selected === null || selected === key
          const colorsCount = itemConfig ? getColorsCount(itemConfig) : 1
          return (
            <div
              key={key}
              className={cn(
                '[&>svg]:text-muted-foreground flex items-center gap-1.5 transition-opacity [&>svg]:h-3 [&>svg]:w-3',
                !isSelected && 'opacity-30',
                isClickable && 'cursor-pointer',
              )}
              onClick={() => {
                if (!isClickable) return
                onSelectChange?.(selected === key ? null : key)
              }}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <LegendIndicator variant={variant} dataKey={key} colorsCount={colorsCount} />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}
function LegendIndicator({ variant, dataKey, colorsCount }) {
  const fillStyle = getLegendFillStyle(dataKey, colorsCount)
  const outlineStyle = getLegendOutlineStyle(dataKey, colorsCount)
  switch (variant) {
    case 'square':
      return <div className="h-2 w-2 shrink-0" style={fillStyle} />
    case 'circle':
      return <div className="h-2 w-2 shrink-0 rounded-full" style={fillStyle} />
    case 'circle-outline':
      return <div className="h-2.5 w-2.5 shrink-0 rounded-full p-[1.5px]" style={outlineStyle} />
    case 'vertical-bar':
      return <div className="h-3 w-1 shrink-0 rounded-[2px]" style={fillStyle} />
    case 'horizontal-bar':
      return <div className="h-1 w-3 shrink-0 rounded-[2px]" style={fillStyle} />
    case 'rounded-square-outline':
      return <div className="h-2.5 w-2.5 shrink-0 rounded-[3px] p-[1.5px]" style={outlineStyle} />
    case 'rounded-square':
    default:
      return <div className="h-2 w-2 shrink-0 rounded-[2px]" style={fillStyle} />
  }
}
function getLegendFillStyle(dataKey, colorsCount) {
  if (colorsCount <= 1) {
    return { backgroundColor: `var(--color-${dataKey}-0)` }
  }
  const stops = Array.from({ length: colorsCount }, (_, i) => {
    const offset = (i / (colorsCount - 1)) * 100
    return `var(--color-${dataKey}-${i}) ${offset}%`
  }).join(', ')
  return { background: `linear-gradient(to right, ${stops})` }
}
function getLegendOutlineStyle(dataKey, colorsCount) {
  const maskStyle = {
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
  }
  if (colorsCount <= 1) {
    return {
      backgroundColor: `var(--color-${dataKey}-0)`,
      ...maskStyle,
    }
  }
  const stops = Array.from({ length: colorsCount }, (_, i) => {
    const offset = (i / (colorsCount - 1)) * 100
    return `var(--color-${dataKey}-${i}) ${offset}%`
  }).join(', ')
  return {
    background: `linear-gradient(to right, ${stops})`,
    ...maskStyle,
  }
}
const ChartLegend = RechartsPrimitive.Legend
export { ChartLegend, ChartLegendContent }
