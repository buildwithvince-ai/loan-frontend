import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4 text-muted">403</div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-muted mb-6">You don't have permission to access this page.</p>
        <Link
          to="/login"
          className="inline-block bg-green hover:bg-green-hover text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}
