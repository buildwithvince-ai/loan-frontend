import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/gr8logo.png" alt="GR8 Lending" className="h-12 w-auto object-contain" />
            </Link>
            <p className="text-muted text-sm leading-relaxed">
              GR8 Lending Corporation<br />
              Your trusted local lending partner in Bulacan.
            </p>
          </div>

          {/* Loan Products */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Loan Products</h4>
            <ul className="space-y-3">
              <li><Link to="/apply/personal" className="text-muted hover:text-green text-sm transition-colors">Personal Loan</Link></li>
              <li><Link to="/apply/sme" className="text-muted hover:text-green text-sm transition-colors">SME Loan</Link></li>
              <li><Link to="/apply/akap" className="text-muted hover:text-green text-sm transition-colors">AKAP Loan</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#calculator" className="text-muted hover:text-green text-sm transition-colors">Loan Calculator</a></li>
              <li><a href="#how-it-works" className="text-muted hover:text-green text-sm transition-colors">How It Works</a></li>
              <li><a href="#products" className="text-muted hover:text-green text-sm transition-colors">Compare Products</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-3 text-muted text-sm">
              <li className="flex items-start gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 mt-0.5 shrink-0 text-blue/60">
                  <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Malolos, Bulacan, Philippines
              </li>
              <li className="flex items-start gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 mt-0.5 shrink-0 text-blue/60">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <a href="mailto:info@gr8lendingcorporation.com" className="hover:text-green transition-colors">info@gr8lendingcorporation.com</a>
              </li>
              <li className="flex items-start gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 mt-0.5 shrink-0 text-blue/60">
                  <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <a href="tel:09541804946" className="hover:text-green transition-colors">(0954) 180 4946</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted text-xs">
            &copy; {new Date().getFullYear()} GR8 Lending Corporation. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/termsandconditions" className="text-muted hover:text-green text-xs transition-colors">Terms &amp; Conditions</Link>
            <p className="text-muted/50 text-xs">
              Malolos, Bulacan, Philippines
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
