import Hero from '../components/Hero'
import LoanCalculator from '../components/LoanCalculator'
import LoanProducts from '../components/LoanProducts'
import HowItWorks from '../components/HowItWorks'
import TrustSignals from '../components/TrustSignals'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <LoanProducts />
      <LoanCalculator />
      <HowItWorks />
      <TrustSignals />
    </>
  )
}
