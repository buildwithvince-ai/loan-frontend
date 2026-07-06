import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="max-w-lg w-full text-center">
        <p className="text-green text-sm font-semibold tracking-[0.18em] uppercase mb-3">404</p>
        <h1 className="text-white text-3xl sm:text-4xl font-bold mb-4">Page not found</h1>
        <p className="text-muted mb-8">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="px-8 py-3 bg-green hover:bg-green-hover text-white font-semibold rounded-xl transition-all"
          >
            Back to Home
          </Link>
          <Link
            to="/apply"
            className="px-8 py-3 border border-border text-white hover:border-green/50 font-semibold rounded-xl transition-all"
          >
            Start an Application
          </Link>
        </div>
      </div>
    </div>
  )
}
