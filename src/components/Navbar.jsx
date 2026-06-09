import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#products', label: 'Loan Products' },
    { href: '#calculator', label: 'Calculator' },
    { href: '#how-it-works', label: 'How It Works' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface/90 backdrop-blur-xl nav-shadow border-b border-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/gr8logo.png" alt="GR8 Lending" className="h-9 w-auto object-contain" />
          <span className="text-white font-bold text-base tracking-tight hidden sm:block">
            GR8 Lending
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted hover:text-white transition-colors text-sm font-medium"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/apply"
            className="px-5 py-2.5 bg-green hover:bg-green-hover text-white font-semibold text-sm rounded-full transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Apply Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white hover:text-green transition-colors p-1"
          aria-label="Toggle menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-surface/97 backdrop-blur-xl border-t border-border nav-shadow animate-fade-in">
          <div className="px-6 py-4 flex flex-col gap-1">
            {links.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-white hover:text-green transition-colors text-sm font-medium py-3 border-b border-border/70"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/apply"
              onClick={() => setMenuOpen(false)}
              className="mt-3 px-5 py-3 bg-green hover:bg-green-hover text-white font-semibold text-sm rounded-full text-center"
            >
              Apply Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
