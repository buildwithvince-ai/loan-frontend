import { Link } from 'react-router-dom'

const products = [
  {
    title: 'Personal Loan',
    description:
      'Quick cash for your personal needs, medical bills, education, home improvement, or emergencies.',
    range: '₱10,000 - ₱200,000',
    terms: '3, 6, or 12 months',
    repayment: 'Bimonthly',
    minIncome: '₱15,000/month',
    route: '/apply/personal',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-7 h-7"
      >
        <path
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'SME Loan',
    description:
      'Fuel your business growth, working capital, equipment, inventory, or expansion funding.',
    range: '₱50,000 - ₱300,000',
    terms: '3, 6, 12, or 24 months',
    repayment: 'Monthly with PDCs',
    minIncome: '₱30,000/month',
    route: '/apply/sme',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-7 h-7"
      >
        <path
          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3 0h.008v.008H18V7.5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'AKAP Loan',
    description:
      'Accessible micro-financing for small entrepreneurs and market vendors, low requirements, fast release.',
    range: '₱5,000 - ₱40,000',
    terms: '3, 4, 5, or 6 months',
    repayment: 'Weekly',
    minIncome: '₱10,000/month',
    route: '/apply/akap',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-7 h-7"
      >
        <path
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'SBL (Sangguniang Barangay Loan)',
    description:
      'For elected or appointed Barangay Officials, salary-deduction repayment with low monthly rates.',
    range: '₱5,000 - ₱100,000',
    terms: '3, 6, or 12 months',
    repayment: 'Monthly',
    minIncome: '₱2,000/month',
    route: '/apply/sbl',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-7 h-7"
      >
        <path
          d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Group Loan',
    description:
      'Community-based lending for groups, shared accountability with bimonthly repayment schedules.',
    range: '₱10,000 - ₱50,000 per member',
    terms: '3, 6, or 12 months',
    repayment: 'Bimonthly',
    minIncome: '₱5,000/month',
    route: '/apply/group',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-7 h-7"
      >
        <path
          d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export default function LoanProducts() {
  return (
    <section id="products" className="relative py-24 md:py-28">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
        <div className="max-w-2xl mb-14">
          <span className="text-green text-xs font-semibold tracking-[0.18em] uppercase">
            Our Products
          </span>
          <h2 className="text-white text-3xl md:text-5xl font-bold mt-3 tracking-tight">
            Choose the right loan for you
          </h2>
          <p className="text-muted mt-4 text-lg leading-relaxed">
            Five products built for different needs, from everyday expenses to growing a business.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(product => (
            <div
              key={product.title}
              className="group flex flex-col bg-surface border border-border rounded-2xl p-7 card-soft card-soft-hover transition-all duration-300 hover:-translate-y-1 hover:border-green/30"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green/12 to-sky/10 text-green flex items-center justify-center mb-6">
                {product.icon}
              </div>

              <h3 className="text-white text-xl font-bold mb-2">{product.title}</h3>
              <p className="text-muted text-sm leading-relaxed mb-6">{product.description}</p>

              <dl className="space-y-2.5 mb-7 text-sm">
                <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border">
                  <dt className="text-muted text-xs uppercase tracking-wider">Amount</dt>
                  <dd className="text-green font-semibold text-right">{product.range}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border">
                  <dt className="text-muted text-xs uppercase tracking-wider">Terms</dt>
                  <dd className="text-white text-right">{product.terms}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border">
                  <dt className="text-muted text-xs uppercase tracking-wider">Repayment</dt>
                  <dd className="text-white text-right">{product.repayment}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <dt className="text-muted text-xs uppercase tracking-wider">Min income</dt>
                  <dd className="text-white text-right">{product.minIncome}</dd>
                </div>
              </dl>

              <Link
                to={product.route}
                className="mt-auto inline-flex items-center justify-center gap-1.5 w-full py-3 rounded-full bg-surface-alt text-white font-semibold text-sm transition-all group-hover:bg-green group-hover:text-white"
              >
                Apply now
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
