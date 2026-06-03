import { deriveRepaymentCycle } from '../../lib/repaymentCycle'

// Compact 1–31 calendar-style date picker for salary / honorarium payout dates.
// Selection rules are driven by `frequency`:
//   'one_time'  — exactly one date; selecting a new tile replaces the previous.
//   'two_times' — exactly two distinct dates; tiles toggle, third selection is blocked.
// Shared between the CI Portal form and the admin CI scoring form so the interaction
// logic lives in one place.
//
// @param {'one_time'|'two_times'|''} frequency - controls min/max selectable dates
// @param {number[]} value - currently selected day integers
// @param {(dates:number[])=>void} onChange - receives the next selection
// @param {string} [error] - inline validation message
// @param {boolean} [disabled] - renders the grid non-interactive
export default function SalaryPayoutPicker({ frequency, value = [], onChange, error, disabled }) {
  const max = frequency === 'two_times' ? 2 : 1
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const cycle = deriveRepaymentCycle(value)

  const toggleDay = day => {
    if (disabled) return
    const selected = value.includes(day)
    if (frequency === 'two_times') {
      if (selected) {
        onChange(value.filter(d => d !== day))
      } else if (value.length < 2) {
        onChange([...value, day])
      }
      // 3rd selection ignored — already at max
    } else {
      // one_time (or no frequency yet): single select, click selected to clear
      onChange(selected ? [] : [day])
    }
  }

  const helperText =
    frequency === 'two_times'
      ? 'Select exactly 2 payout dates.'
      : frequency === 'one_time'
        ? 'Select 1 payout date.'
        : 'Select a payment frequency first.'

  return (
    <div>
      <div
        className={`grid grid-cols-7 gap-1.5 ${!frequency ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {days.map(day => {
          const isSelected = value.includes(day)
          const order = value.indexOf(day) // 0 = first payout, 1 = second
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              disabled={disabled || !frequency}
              aria-pressed={isSelected}
              aria-label={`Payout day ${day}${isSelected ? ` (selected${frequency === 'two_times' ? `, payout ${order + 1}` : ''})` : ''}`}
              className={`relative aspect-square min-h-[40px] rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                isSelected
                  ? 'bg-green text-white border border-green'
                  : 'bg-surface-alt text-white border border-border/50 hover:border-green/40'
              } disabled:cursor-not-allowed`}
            >
              {day}
              {isSelected && frequency === 'two_times' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue text-[9px] font-bold flex items-center justify-center text-white">
                  {order + 1}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-muted text-xs">{helperText}</span>
        <span className="text-muted text-xs">
          {value.length}/{max} selected
        </span>
      </div>

      {/* Repayment Cycle — read-only, derived live from selected dates */}
      <div className="mt-3">
        <label className="text-muted text-xs block mb-1.5">Repayment Cycle</label>
        <input
          type="text"
          value={cycle}
          readOnly
          placeholder="—"
          className="w-full bg-canvas border border-border rounded-lg px-4 py-2.5 text-white text-sm opacity-70 cursor-default outline-none"
        />
      </div>

      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
