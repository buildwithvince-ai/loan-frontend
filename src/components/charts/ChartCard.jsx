// Panel frame for a chart or metric block: title, one-line description, a status
// chip, and an optional footnote for data caveats. `connected={false}` marks blocks whose data isn't wired yet, so a skeleton is
// never mistaken for real numbers.
export default function ChartCard({
  title,
  description,
  connected = false,
  className = '',
  index = 0,
  note,
  children,
}) {
  return (
    <section
      className={`x-panel x-stagger flex flex-col min-w-0 ${className}`}
      style={{ '--i': index }}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <h3 className="x-section-title">{title}</h3>
          {description && <p className="text-muted text-xs mt-1 leading-relaxed">{description}</p>}
        </div>
        {!connected && (
          <span className="x-chip x-chip--neutral shrink-0">
            <span className="x-dot" aria-hidden="true" />
            Not connected
          </span>
        )}
      </header>
      <div className={`flex-1 min-w-0 px-5 pb-5 pt-4${connected ? '' : ' x-chart-pending'}`}>
        {children}
        {note && <p className="text-muted text-xs mt-3 leading-relaxed">{note}</p>}
      </div>
    </section>
  )
}
