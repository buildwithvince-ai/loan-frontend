const signals = [
  {
    title: 'Local Lender',
    description: 'Based in Malolos, Bulacan — we know our community and serve our kababayans with pride.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Fast Processing',
    description: 'Apply online, get reviewed in 2-3 business days. No unnecessary delays or back-and-forth.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Secure & Confidential',
    description: 'Your personal and financial information is protected. We handle your data with the highest care.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function TrustSignals() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-blue text-xs font-semibold tracking-[0.2em] uppercase">Why GR8 Lending</span>
          <h2 className="text-3xl md:text-5xl text-green mt-3 font-bold">Built on Trust</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {signals.map((signal) => (
            <div
              key={signal.title}
              className="relative text-center px-8 py-10 rounded-2xl border border-border bg-surface/30 hover:border-green/20 transition-all duration-500 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border flex items-center justify-center text-blue mx-auto mb-6 group-hover:bg-blue/10 group-hover:border-blue/30 transition-all">
                {signal.icon}
              </div>
              <h3 className="text-xl text-green mb-3 font-bold">{signal.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{signal.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
