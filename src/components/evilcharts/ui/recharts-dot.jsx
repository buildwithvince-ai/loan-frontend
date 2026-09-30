// Vendored from EvilCharts (MIT, github.com/legions-developer/evilcharts), converted
// from TSX to JSX with esbuild (types stripped only). Colors come from each chart's
// config; see src/components/charts for the GR8-themed wrappers.
import { cn } from '../../../lib/cn'
import * as React from 'react'
const ChartDot = React.memo(function ChartDot2({
  cx,
  cy,
  dataKey,
  chartId,
  className,
  fillOpacity = 1,
  type = 'default',
  maskId,
}) {
  const dotId = React.useId().replace(/:/g, '')
  const gradientUrl = `url(#${chartId}-colors-${String(dataKey)})`
  if (cx === void 0 || cy === void 0) return null
  switch (type) {
    case 'border':
      return (
        <PrimaryBorderDot
          cx={cx}
          cy={cy}
          dotId={dotId}
          fillOpacity={fillOpacity}
          gradientUrl={gradientUrl}
          className={className}
          maskId={maskId}
        />
      )
    case 'colored-border':
      return (
        <ColoredBorderDot
          cx={cx}
          cy={cy}
          dotId={dotId}
          fillOpacity={fillOpacity}
          gradientUrl={gradientUrl}
          className={className}
          maskId={maskId}
        />
      )
    default:
      return (
        <DefaultDot
          cx={cx}
          cy={cy}
          dotId={dotId}
          fillOpacity={fillOpacity}
          gradientUrl={gradientUrl}
          className={className}
          maskId={maskId}
        />
      )
  }
})
const DefaultDot = React.memo(({ cx, cy, dotId, fillOpacity, gradientUrl, className, maskId }) => {
  const r = 3
  return (
    <g className={className} mask={maskId ? `url(#${maskId})` : void 0}>
      <defs>
        <clipPath id={`dot-clip-${dotId}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      {/* Full-width gradient rectangle clipped to dot shape */}
      <rect
        x="0"
        y={cy - r}
        width="100%"
        height={r * 2}
        fill={gradientUrl}
        fillOpacity={fillOpacity}
        clipPath={`url(#dot-clip-${dotId})`}
      />
    </g>
  )
})
DefaultDot.displayName = 'DefaultDot'
const PrimaryBorderDot = React.memo(
  ({ cx, cy, dotId, fillOpacity, gradientUrl, className, maskId }) => {
    const r = 6
    const strokeWidth = 5
    return (
      <g className={cn(className, 'text-background')} mask={maskId ? `url(#${maskId})` : void 0}>
        <defs>
          <clipPath id={`dot-clip-${dotId}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        {/* Background stroke (border) */}
        <circle cx={cx} cy={cy} r={r} fill="currentColor" />
        {/* Inner gradient circle clipped */}
        <rect
          x="0"
          y={cy - (r - strokeWidth / 2)}
          width="100%"
          height={(r - strokeWidth / 2) * 2}
          fill={gradientUrl}
          fillOpacity={fillOpacity}
          clipPath={`url(#dot-clip-inner-${dotId})`}
        />
        <defs>
          <clipPath id={`dot-clip-inner-${dotId}`}>
            <circle cx={cx} cy={cy} r={r - strokeWidth / 2} />
          </clipPath>
        </defs>
      </g>
    )
  },
)
PrimaryBorderDot.displayName = 'PrimaryBorderDot'
const ColoredBorderDot = React.memo(
  ({ cx, cy, dotId, fillOpacity, gradientUrl, className, maskId }) => {
    const r = 3
    const strokeWidth = 1
    return (
      <g className={cn(className, 'text-background')} mask={maskId ? `url(#${maskId})` : void 0}>
        <defs>
          <clipPath id={`dot-clip-${dotId}`}>
            <circle cx={cx} cy={cy} r={r + strokeWidth / 2} />
          </clipPath>
        </defs>
        {/* Gradient stroke (border) via clipped rect */}
        <rect
          x="0"
          y={cy - r - strokeWidth / 2}
          width="100%"
          height={(r + strokeWidth / 2) * 2}
          fill={gradientUrl}
          fillOpacity={fillOpacity}
          clipPath={`url(#dot-clip-${dotId})`}
        />
        {/* Inner solid fill */}
        <circle cx={cx} cy={cy} r={r - strokeWidth / 2} fill="currentColor" />
      </g>
    )
  },
)
ColoredBorderDot.displayName = 'ColoredBorderDot'
export { ChartDot }
