import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import PersonalLoanForm from './pages/PersonalLoanForm'
import SmeLoanForm from './pages/SmeLoanForm'
import AkapLoanForm from './pages/AkapLoanForm'
import SelectProduct from './pages/SelectProduct'

function App() {
  return (
    <div className="min-h-screen bg-canvas text-white">
      {/* Fixed watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0, opacity: 0.04 }}>
        <img src="/gr8logo.png" alt="" className="w-[600px] h-auto select-none" draggable={false} />
      </div>
      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/apply" element={<SelectProduct />} />
            <Route path="/apply/personal" element={<PersonalLoanForm />} />
            <Route path="/apply/sme" element={<SmeLoanForm />} />
            <Route path="/apply/akap" element={<AkapLoanForm />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default App
