import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      {/* Soft brand wash */}
      <div className="absolute -top-32 -right-40 w-[640px] h-[640px] rounded-full bg-green/12 blur-[140px]" />
      <div className="absolute top-1/3 -left-40 w-[520px] h-[520px] rounded-full bg-sky/14 blur-[150px]" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 pt-24 pb-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Copy */}
          <div className="lg:col-span-6">
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-green text-xs font-semibold tracking-wide mb-7 card-soft">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-3.5 h-3.5 text-green"
              >
                <path
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              A trusted lending partner in Bulacan
            </div>

            <h1 className="animate-fade-in-up delay-100 text-white text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              The funds you need, <span className="text-green">approved faster.</span>
            </h1>

            <p className="animate-fade-in-up delay-200 text-muted text-lg mt-6 max-w-xl leading-relaxed">
              Apply online in minutes. No long lines, no stacks of paperwork, just a clear decision
              from a local lender that knows your community.
            </p>

            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-3 mt-9">
              <Link
                to="/apply"
                className="px-7 py-3.5 bg-green hover:bg-green-hover text-white font-semibold rounded-full text-center transition-all hover:-translate-y-0.5 active:translate-y-0 card-soft"
              >
                Apply now
              </Link>
              <a
                href="#calculator"
                className="px-7 py-3.5 bg-surface border border-border text-white font-semibold rounded-full text-center transition-all hover:border-green/50 hover:-translate-y-0.5"
              >
                Estimate your payment
              </a>
            </div>

            <div className="animate-fade-in-up delay-400 flex items-center gap-6 mt-9 text-muted text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                2-3 day decisions
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                100% online
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                No hidden fees
              </span>
            </div>
          </div>

          {/* Visual stack, phone + peso cash motifs + GR8 logo */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="animate-scale-in delay-200 relative w-[330px] sm:w-[400px] py-8">
              {/* Phone mockup — iPhone-sized, tall aspect */}
              <div className="relative mx-auto w-[330px] rounded-[3.5rem] bg-[#0F1B20] p-3 card-soft">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 rounded-b-2xl bg-[#0F1B20] z-10" />
                <div className="h-[600px] rounded-[3rem] bg-surface overflow-hidden flex flex-col">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-7 pt-5 pb-1 text-white text-xs font-semibold">
                    <span>9:41</span>
                    <span className="flex items-center gap-1.5 text-muted">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M2 22h20V2L2 22Z" />
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <rect x="2" y="7" width="18" height="10" rx="2" />
                        <rect x="21" y="10" width="1.5" height="4" rx="0.75" />
                      </svg>
                    </span>
                  </div>

                  {/* Screen header with GR8 logo */}
                  <div className="flex items-center gap-2.5 px-7 pt-4 pb-5 border-b border-border">
                    <img
                      src="/gr8logo.png"
                      alt="GR8 Lending"
                      className="h-7 w-auto object-contain"
                    />
                    <span className="text-white font-bold text-base">GR8 Lending</span>
                  </div>

                  {/* Screen body */}
                  <div className="flex-1 px-7 py-6 flex flex-col">
                    <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-br from-green to-green-hover flex items-center justify-center text-white text-5xl font-bold card-soft">
                      ₱
                    </div>

                    <div className="mt-6 inline-flex w-fit items-center gap-2 px-3.5 py-2 rounded-full bg-green/12 text-green text-sm font-semibold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="w-4 h-4"
                      >
                        <path
                          d="M4.5 12.75l6 6 9-13.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Loan approved
                    </div>

                    <div className="text-white text-4xl font-bold mt-5 tracking-tight">
                      ₱50,000.00
                    </div>
                    <div className="text-muted text-sm mt-2">GR8 Loan · 12 months</div>

                    <div className="mt-7 space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <span className="text-muted text-base">Monthly payment</span>
                        <span className="text-white font-bold text-lg">₱5,641.00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted text-base">Interest rate</span>
                        <span className="text-white font-bold text-lg">5% / mo</span>
                      </div>
                    </div>

                    {/* Bottom action pinned to base of screen */}
                    <div className="mt-auto pt-6">
                      <div className="w-full py-4 rounded-full bg-green text-white font-semibold text-center text-base card-soft">
                        View loan details
                      </div>
                      <div className="mx-auto mt-5 w-32 h-1.5 rounded-full bg-surface-alt" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating peso coin, cash indicator */}
              <div className="absolute top-2 -left-2 sm:-left-7 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-green to-green-hover flex items-center justify-center text-white text-3xl font-bold card-soft ring-4 ring-surface animate-fade-in-up delay-500">
                ₱
              </div>

              {/* Floating coin, small */}
              <div className="absolute top-32 -right-1 sm:-right-4 w-12 h-12 rounded-full bg-sky flex items-center justify-center text-white text-xl font-bold card-soft ring-4 ring-surface animate-fade-in-up delay-600">
                ₱
              </div>

              {/* Floating cash card */}
              <div className="absolute -bottom-5 -right-1 sm:-right-8 bg-surface rounded-2xl p-4 card-soft border border-border w-[200px] animate-fade-in-up delay-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green/12 flex items-center justify-center text-green text-xl font-bold shrink-0">
                    ₱
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-bold text-sm leading-tight">Cash released</div>
                    <div className="text-muted text-xs">Straight to your account</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
