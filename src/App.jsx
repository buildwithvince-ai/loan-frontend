import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import PersonalLoanForm from './pages/PersonalLoanForm'
import SmeLoanForm from './pages/SmeLoanForm'
import AkapLoanForm from './pages/AkapLoanForm'
import GroupLoanForm from './pages/GroupLoanForm'
import SblLoanForm from './pages/SblLoanForm'
import SelectProduct from './pages/SelectProduct'
import TermsAndConditions from './pages/TermsAndConditions'
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import CiPortal from './pages/ci/CiPortal'

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-canvas text-white">
      {/* Fixed watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0, opacity: 0.04 }}>
        <img src="/gr8logo.png" alt="" className="w-[600px] h-auto select-none" draggable={false} />
      </div>
      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  )
}

function App() {
  const location = useLocation()
  const isPublic = !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/ci') &&
    location.pathname !== '/login' &&
    location.pathname !== '/unauthorized'

  return (
    <Routes>
      {/* Auth pages — no navbar/footer */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin routes — protected, no navbar/footer */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'sales_officer', 'verifier', 'loan_processing_officer']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      {/* CI route — protected, no navbar/footer */}
      <Route
        path="/ci"
        element={
          <ProtectedRoute allowedRoles={['ci_officer', 'admin', 'super_admin']}>
            <CiPortal />
          </ProtectedRoute>
        }
      />

      {/* Public routes — with navbar/footer/watermark */}
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/apply" element={<PublicLayout><SelectProduct /></PublicLayout>} />
      <Route path="/apply/personal" element={<PublicLayout><PersonalLoanForm /></PublicLayout>} />
      <Route path="/apply/sme" element={<PublicLayout><SmeLoanForm /></PublicLayout>} />
      <Route path="/apply/akap" element={<PublicLayout><AkapLoanForm /></PublicLayout>} />
      <Route path="/apply/group" element={<PublicLayout><GroupLoanForm /></PublicLayout>} />
      <Route path="/apply/sbl" element={<PublicLayout><SblLoanForm /></PublicLayout>} />
      <Route path="/termsandconditions" element={<PublicLayout><TermsAndConditions /></PublicLayout>} />
    </Routes>
  )
}

export default App
