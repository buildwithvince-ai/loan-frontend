import { Link } from 'react-router-dom'

const products = [
  {
    title: 'Personal Loan',
    description: 'Quick cash for medical bills, education, home improvement, or emergencies.',
    range: '₱10,000 – ₱30,000',
    terms: '3, 6, or 12 months',
    route: '/apply/personal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'SME Loan',
    description: 'Working capital, equipment, inventory, or expansion funding for your business.',
    range: '₱50,000 – ₱100,000',
    terms: '3, 6, 12, or 24 months',
    route: '/apply/sme',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3 0h.008v.008H18V7.5Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'AKAP Loan',
    description: 'Micro-financing for small entrepreneurs and market vendors — low requirements, fast release.',
    range: '₱5,000 – ₱40,000',
    terms: '3, 4, 5, or 6 months',
    route: '/apply/akap',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function SelectProduct() {
  return (
    <div className="min-h-screen pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <Link to="/" className="text-muted hover:text-white text-sm transition-colors inline-flex items-center gap-1 mb-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" /></svg>
            Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-green">Choose Your Loan Product</h1>
          <p className="text-muted text-sm mt-2">Select the loan type that fits your needs to start your application.</p>
        </div>

        <div className="space-y-4">
          {products.map((product) => (
            <Link
              key={product.title}
              to={product.route}
              className="group flex items-center gap-6 bg-surface/60 border border-border rounded-2xl p-6 hover:border-green/30 hover:shadow-xl hover:shadow-green/5 transition-all duration-300"
            >
              <div className="w-16 h-16 shrink-0 rounded-xl bg-surface-alt border border-border flex items-center justify-center text-blue group-hover:bg-blue/10 group-hover:border-blue/30 transition-all">
                {product.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-green group-hover:text-green-hover transition-colors">{product.title}</h2>
                <p className="text-muted text-sm mt-0.5">{product.description}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-blue text-xs font-medium">{product.range}</span>
                  <span className="text-muted text-xs">{product.terms}</span>
                </div>
              </div>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-muted group-hover:text-green shrink-0 transition-colors">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
