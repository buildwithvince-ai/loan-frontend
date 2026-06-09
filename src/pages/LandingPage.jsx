import Hero from '../components/Hero'
import LoanCalculator from '../components/LoanCalculator'
import LoanProducts from '../components/LoanProducts'
import HowItWorks from '../components/HowItWorks'
import TrustSignals from '../components/TrustSignals'

const stats = [
  { value: '₱5K-₱300K', label: 'Loan amounts' },
  { value: '5', label: 'Loan products' },
  { value: '2-3 days', label: 'To a decision' },
  { value: '100%', label: 'Online application' },
]

function StatBand() {
  return (
    <section className="relative -mt-2">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="bg-surface border border-border rounded-2xl card-soft grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
          {stats.map(stat => (
            <div key={stat.label} className="px-6 py-7 text-center">
              <div className="text-green text-2xl md:text-3xl font-bold">{stat.value}</div>
              <div className="text-muted text-xs md:text-sm mt-1.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatBand />
      <LoanProducts />
      <LoanCalculator />
      <HowItWorks />
      <TrustSignals />
    </>
  )
}
