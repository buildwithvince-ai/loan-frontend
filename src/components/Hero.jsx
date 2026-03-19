import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden noise-overlay">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-green/6 rounded-full blur-[128px]" style={{ animation: 'float 8s ease-in-out infinite' }} />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue/10 rounded-full blur-[100px]" style={{ animation: 'float 10s ease-in-out infinite 2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green/3 rounded-full blur-[200px]" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(91,192,222,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(91,192,222,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-blue/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-blue animate-pulse" />
          <span className="text-blue text-xs font-medium tracking-wide uppercase">Your Trusted Partner in Financial Solutions</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-green leading-[1.1] mb-6 font-bold">
          Get Your Loan Approved{' '}
          <span className="text-shimmer">Faster</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up delay-200 text-white text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          No long lines. No paperwork. Get a decision without leaving home.
          <br className="hidden md:block" />
          <span className="text-white font-medium">GR8 Lending Corporation</span> — your local lending partner in Bulacan.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/apply"
            className="group relative px-8 py-4 bg-green hover:bg-green-hover text-white font-bold text-base rounded-xl hover:shadow-2xl hover:shadow-green/30 transition-all hover:-translate-y-1 w-full sm:w-auto"
          >
            Start Your Application
          </Link>
          <a
            href="#calculator"
            className="px-8 py-4 border border-blue text-blue font-medium text-base rounded-xl hover:bg-blue/10 transition-all w-full sm:w-auto"
          >
            Estimate Your Payment
          </a>
        </div>

        {/* Stats */}
        <div className="animate-fade-in-up delay-500 mt-20 grid grid-cols-3 gap-8 max-w-md mx-auto">
          {[
            { value: '₱30K', label: 'Personal Loans' },
            { value: '₱100K', label: 'SME Loans' },
            { value: '₱40K', label: 'AKAP Loans' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-green text-2xl md:text-3xl font-bold">{stat.value}</div>
              <div className="text-muted text-xs mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-canvas to-transparent" />
    </section>
  )
}
