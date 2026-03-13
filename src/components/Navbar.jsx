import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-canvas/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/gr8logo.png" alt="GR8 Lending" className="h-10 w-auto object-contain" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#products" className="text-muted hover:text-white transition-colors text-sm font-medium">Loan Products</a>
          <a href="#calculator" className="text-muted hover:text-white transition-colors text-sm font-medium">Calculator</a>
          <a href="#how-it-works" className="text-muted hover:text-white transition-colors text-sm font-medium">How It Works</a>
          <Link to="/apply" className="px-5 py-2.5 bg-green hover:bg-green-hover text-white font-semibold text-sm rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green/25">
            Apply Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-muted hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-xl border-t border-border animate-fade-in">
          <div className="px-6 py-4 flex flex-col gap-4">
            <a href="#products" onClick={() => setMenuOpen(false)} className="text-muted hover:text-white transition-colors text-sm font-medium py-2">Loan Products</a>
            <a href="#calculator" onClick={() => setMenuOpen(false)} className="text-muted hover:text-white transition-colors text-sm font-medium py-2">Calculator</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-muted hover:text-white transition-colors text-sm font-medium py-2">How It Works</a>
            <Link to="/apply" onClick={() => setMenuOpen(false)} className="px-5 py-3 bg-green hover:bg-green-hover text-white font-semibold text-sm rounded-lg text-center">
              Apply Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
