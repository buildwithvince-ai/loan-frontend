import { Link } from 'react-router-dom'

const signals = [
  {
    title: 'Local lender',
    description:
      'Based in Malolos, Bulacan, we know our community and serve our kababayans with pride.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-6 h-6"
      >
        <path
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Fast processing',
    description:
      'Apply online and get reviewed in 2-3 business days. No unnecessary delays or back-and-forth.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-6 h-6"
      >
        <path
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Secure & confidential',
    description:
      'Your personal and financial information is protected. We handle your data with the highest care.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-6 h-6"
      >
        <path
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export default function TrustSignals() {
  return (
    <section className="relative py-24 md:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left, message */}
          <div className="lg:col-span-5">
            <h2 className="text-white text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              Lending you can trust
            </h2>
            <p className="text-muted mt-5 text-lg leading-relaxed">
              GR8 Lending Corporation is a registered local lender serving borrowers across Bulacan.
              We keep the process honest, fast, and built around your needs.
            </p>
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 bg-green hover:bg-green-hover text-white font-semibold rounded-full transition-all hover:-translate-y-0.5 card-soft"
            >
              Apply now
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>

          {/* Right, stacked trust rows */}
          <div className="lg:col-span-7 space-y-4">
            {signals.map(signal => (
              <div
                key={signal.title}
                className="flex items-start gap-5 bg-surface border border-border rounded-2xl p-6 card-soft card-soft-hover transition-all hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-green/12 to-sky/10 text-green flex items-center justify-center">
                  {signal.icon}
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold mb-1">{signal.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{signal.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
