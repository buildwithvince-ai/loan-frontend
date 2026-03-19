import { useState, useMemo } from 'react'

const PRODUCTS = [
  { name: 'Personal Loan', min: 10000, max: 30000, terms: [3, 6, 12], rate: 0.035 },
  { name: 'SME Loan', min: 50000, max: 300000, terms: [3, 6, 12, 24], rate: 0.03 },
  { name: 'AKAP Loan', min: 5000, max: 40000, terms: [3, 4, 5, 6], rate: 0.04 },
  { name: 'SBL', min: 5000, max: 100000, terms: [3, 6, 12], rate: 0.05 },
  { name: 'Group Loan', min: 10000, max: 50000, terms: [3, 6, 12], rate: 0.05 },
]

export default function LoanCalculator() {
  const [productIndex, setProductIndex] = useState(0)
  const product = PRODUCTS[productIndex]
  const [amount, setAmount] = useState(product.min)
  const [term, setTerm] = useState(product.terms[0])
  const [inputValue, setInputValue] = useState(String(product.min))

  const handleProductChange = (idx) => {
    setProductIndex(idx)
    const p = PRODUCTS[idx]
    setAmount(p.min)
    setInputValue(String(p.min))
    setTerm(p.terms[0])
  }

  const handleSliderChange = (val) => {
    setAmount(val)
    setInputValue(String(val))
  }

  const handleInputChange = (raw) => {
    setInputValue(raw)
    const num = parseInt(raw.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(num)) {
      const clamped = Math.min(Math.max(num, product.min), product.max)
      setAmount(clamped)
    }
  }

  const handleInputBlur = () => {
    const clamped = Math.min(Math.max(amount, product.min), product.max)
    setAmount(clamped)
    setInputValue(String(clamped))
  }

  const monthlyPayment = useMemo(() => {
    const r = product.rate
    if (r === 0) return amount / term
    return (amount * r) / (1 - Math.pow(1 + r, -term))
  }, [amount, term, product.rate])

  const totalPayment = monthlyPayment * term
  const totalInterest = totalPayment - amount

  const formatPeso = (n) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const amountPercent = ((amount - product.min) / (product.max - product.min)) * 100

  return (
    <section id="calculator" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-blue text-xs font-semibold tracking-[0.2em] uppercase">Loan Calculator</span>
          <h2 className="text-3xl md:text-5xl text-green mt-3 font-bold">Estimate Your Monthly Payment</h2>
          <p className="text-muted mt-4 max-w-lg mx-auto">Choose your loan type, set your desired amount, and see your estimated monthly payment instantly.</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-surface/60 backdrop-blur-sm border border-border rounded-2xl p-8 md:p-10 shadow-2xl shadow-canvas/50">
            {/* Product tabs */}
            <div className="flex flex-wrap gap-2 mb-10 bg-surface-alt/50 rounded-xl p-1.5">
              {PRODUCTS.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => handleProductChange(i)}
                  className={`flex-1 min-w-[100px] py-3 px-3 rounded-lg text-sm font-medium transition-all ${
                    i === productIndex
                      ? 'bg-green text-white shadow-lg shadow-green/20'
                      : 'text-muted hover:text-white hover:bg-surface-alt/50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Amount slider + input */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-white text-sm font-medium">Loan Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green font-bold text-lg">₱</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={handleInputBlur}
                    className="w-40 pl-8 pr-3 py-2 rounded-xl bg-surface-alt border border-border text-green text-right text-xl font-bold focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/30 transition-colors"
                  />
                </div>
              </div>
              <input
                type="range"
                min={product.min}
                max={product.max}
                step={1000}
                value={amount}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #5CB85C 0%, #5CB85C ${amountPercent}%, #1A2235 ${amountPercent}%, #1A2235 100%)`
                }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-muted text-xs">{formatPeso(product.min)}</span>
                <span className="text-muted text-xs">{formatPeso(product.max)}</span>
              </div>
            </div>

            {/* Term selector */}
            <div className="mb-10">
              <label className="text-white text-sm font-medium block mb-4">Payment Term</label>
              <div className="flex gap-3">
                {product.terms.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTerm(t)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                      t === term
                        ? 'border-green bg-green/10 text-green shadow-inner'
                        : 'border-border text-muted hover:border-muted/30 hover:text-white'
                    }`}
                  >
                    {t} mo
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-8" />

            {/* Results — Monthly Payment center and prominent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
              <div className="bg-surface-alt/40 rounded-xl p-5 text-center order-2 sm:order-1">
                <div className="text-muted text-xs uppercase tracking-wider mb-2">Total Interest</div>
                <div className="text-muted text-xl font-medium">{formatPeso(totalInterest)}</div>
              </div>
              <div className="bg-surface-alt/40 rounded-xl p-6 text-center border border-green/20 order-1 sm:order-2 overflow-hidden min-w-0">
                <div className="text-muted text-xs uppercase tracking-wider mb-2">Monthly Payment</div>
                <div className="text-green text-2xl md:text-4xl font-bold">{formatPeso(monthlyPayment)}</div>
              </div>
              <div className="bg-surface-alt/40 rounded-xl p-5 text-center order-3">
                <div className="text-muted text-xs uppercase tracking-wider mb-2">Total Payment</div>
                <div className="text-muted text-xl font-medium">{formatPeso(totalPayment)}</div>
              </div>
            </div>

            <p className="text-muted text-xs text-center mt-6">
              * This is an estimate only. Actual rates and terms may vary upon review.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
