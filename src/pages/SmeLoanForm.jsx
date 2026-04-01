import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useSalesOfficers from '../hooks/useSalesOfficers'

const TOTAL_STEPS = 10

const PURPOSES = ['Working Capital', 'Equipment Purchase', 'Inventory', 'Business Expansion', 'Other']
const BUSINESS_TYPES = ['Sole Proprietorship', 'Partnership', 'Corporation']
const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated']
const EMPLOYMENT_STATUSES = [
  { value: 'Employee', label: 'Employee' },
  { value: 'Government Employee', label: 'Government Employee' },
  { value: 'Private Sector Employee', label: 'Private Sector Employee' },
  { value: 'Owner', label: 'Business Owner / Self-Employed' },
  { value: 'Overseas Worker', label: 'Overseas Worker (OFW)' },
  { value: 'Student', label: 'Student' },
  { value: 'Pensioner', label: 'Pensioner' },
  { value: 'Unemployed', label: 'Unemployed' },
]
const TERMS = [3, 6, 12, 24]

const REQUIRED_DOCS = [
  { key: 'dtiSecRegistration', label: 'DTI / SEC Registration' },
  { key: 'businessPermitBarangay', label: 'Business Permit — Barangay' },
  { key: 'businessPermitCity', label: 'Business Permit — City / Municipality' },
  { key: 'barangayClearance', label: 'Barangay Clearance' },
  { key: 'validIdFront', label: 'Valid Government ID — Front' },
  { key: 'validIdBack', label: 'Valid Government ID — Back' },
  { key: 'proofOfBilling', label: 'Proof of Billing' },
  { key: 'bankStatement', label: '3 Months Bank Statement' },
  { key: 'itr', label: 'ITR — Income Tax Return' },
  { key: 'afs', label: 'AFS — Audited Financial Statement' },
]

const OPTIONAL_DOCS = [
  { key: 'gis', label: 'GIS — General Information Sheet (if corporation)' },
]

const ALL_DOCS = [...REQUIRED_DOCS, ...OPTIONAL_DOCS]

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024

const initialForm = {
  // Step 1
  salesOfficerId: '',
  loanAmount: 50000,
  paymentTerm: 3,
  purpose: '',
  // Step 2
  businessName: '',
  businessType: '',
  dtiSecNumber: '',
  dateEstablished: '',
  businessStreet: '',
  businessBarangay: '',
  businessCity: '',
  businessProvince: '',
  businessZip: '',
  monthlyGrossRevenue: '',
  // Step 3
  supplier1Name: '', supplier1Contact: '', supplier1Number: '',
  supplier2Name: '', supplier2Contact: '', supplier2Number: '',
  supplier3Name: '', supplier3Contact: '', supplier3Number: '',
  // Step 4
  customer1Name: '', customer1Contact: '', customer1Number: '',
  customer2Name: '', customer2Contact: '', customer2Number: '',
  customer3Name: '', customer3Contact: '', customer3Number: '',
  // Step 5
  firstName: '', middleName: '', lastName: '',
  dateOfBirth: '', civilStatus: '',
  mobile: '', email: '', tin: '',
  // Step 6
  presentHouseStreet: '', presentBarangay: '', presentCity: '',
  presentProvince: '', presentZip: '', presentLengthOfStay: '',
  // Step 7
  sameAsPresent: false,
  permanentHouseStreet: '', permanentBarangay: '', permanentCity: '',
  permanentProvince: '', permanentZip: '', permanentLengthOfStay: '',
  // Step 8
  addSpouse: false,
  spouseFirstName: '', spouseLastName: '', spouseMobile: '',
  spouseEmployer: '', spouseIncome: '',
  // Step 10
  confirmAccurate: false,
}

function getAge(dob) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}
function validMobile(v) { return /^09\d{9}$/.test(v) }
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
function formatPeso(n) { return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium text-white mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function Input({ value, onChange, ...props }) {
  return (
    <input value={value} onChange={onChange}
      className="w-full px-4 py-3 rounded-xl bg-surface-alt border border-border text-white text-sm placeholder:text-muted/50 focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/30 transition-colors"
      {...props} />
  )
}

function Select({ value, onChange, options, placeholder, ...props }) {
  return (
    <select value={value} onChange={onChange}
      className="w-full px-4 py-3 rounded-xl bg-surface-alt border border-border text-white text-sm focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/30 transition-colors appearance-none"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394A3B8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
      {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  )
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="text-red-400 text-xs mt-1">{message}</p>
}

export default function SmeLoanForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const { officers, loading: soLoading, error: soError, retry: soRetry } = useSalesOfficers()
  const [docs, setDocs] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const topRef = useRef(null)

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  useEffect(() => {
    if (form.sameAsPresent) {
      setForm(prev => ({
        ...prev,
        permanentHouseStreet: prev.presentHouseStreet,
        permanentBarangay: prev.presentBarangay,
        permanentCity: prev.presentCity,
        permanentProvince: prev.presentProvince,
        permanentZip: prev.presentZip,
        permanentLengthOfStay: prev.presentLengthOfStay,
      }))
    }
  }, [form.sameAsPresent, form.presentHouseStreet, form.presentBarangay, form.presentCity, form.presentProvince, form.presentZip, form.presentLengthOfStay])

  const handleFile = (key, file) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) { setErrors(prev => ({ ...prev, [key]: 'Only JPG, PNG, or PDF files allowed' })); return }
    if (file.size > MAX_FILE_SIZE) { setErrors(prev => ({ ...prev, [key]: 'File must be under 10MB' })); return }
    setDocs(prev => ({ ...prev, [key]: file }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const removeFile = (key) => { setDocs(prev => { const next = { ...prev }; delete next[key]; return next }) }

  const req = (field) => !String(form[field]).trim()

  const validate = () => {
    const e = {}

    if (step === 1) {
      if (!form.salesOfficerId) e.salesOfficerId = 'Please select your Sales Officer'
      if (form.loanAmount < 50000 || form.loanAmount > 300000) e.loanAmount = 'Amount must be between ₱50,000 and ₱300,000'
      else if (form.loanAmount % 10000 !== 0) e.loanAmount = 'Amount must be in ₱10,000 increments'
      if (!form.purpose) e.purpose = 'Purpose is required'
    }

    if (step === 2) {
      if (req('businessName')) e.businessName = 'Required'
      if (!form.businessType) e.businessType = 'Required'
      if (req('dtiSecNumber')) e.dtiSecNumber = 'Required'
      if (!form.dateEstablished) e.dateEstablished = 'Required'
      if (req('businessStreet')) e.businessStreet = 'Required'
      if (req('businessBarangay')) e.businessBarangay = 'Required'
      if (req('businessCity')) e.businessCity = 'Required'
      if (req('businessProvince')) e.businessProvince = 'Required'
      if (req('businessZip')) e.businessZip = 'Required'
      if (!form.monthlyGrossRevenue) {
        e.monthlyGrossRevenue = 'Required'
      } else if (Number(form.monthlyGrossRevenue) < 30000) {
        e.monthlyGrossRevenue = 'Minimum gross revenue is ₱30,000/month'
      }
    }

    if (step === 3) {
      ;[1, 2, 3].forEach(n => {
        if (req(`supplier${n}Name`)) e[`supplier${n}Name`] = 'Required'
        if (req(`supplier${n}Contact`)) e[`supplier${n}Contact`] = 'Required'
        if (req(`supplier${n}Number`)) e[`supplier${n}Number`] = 'Required'
      })
    }

    if (step === 4) {
      ;[1, 2, 3].forEach(n => {
        if (req(`customer${n}Name`)) e[`customer${n}Name`] = 'Required'
        if (req(`customer${n}Contact`)) e[`customer${n}Contact`] = 'Required'
        if (req(`customer${n}Number`)) e[`customer${n}Number`] = 'Required'
      })
    }

    if (step === 5) {
      if (req('firstName')) e.firstName = 'Required'
      if (req('lastName')) e.lastName = 'Required'
      if (!form.dateOfBirth) { e.dateOfBirth = 'Required' }
      else { const age = getAge(form.dateOfBirth); if (age < 21) e.dateOfBirth = 'Must be at least 21 years old'; if (age > 65) e.dateOfBirth = 'Must be 65 years old or younger' }
      if (!form.civilStatus) e.civilStatus = 'Required'
      if (req('mobile')) { e.mobile = 'Required' } else if (!validMobile(form.mobile)) { e.mobile = 'Use format 09XXXXXXXXX' }
      if (req('email')) { e.email = 'Required' } else if (!validEmail(form.email)) { e.email = 'Invalid email' }
    }

    if (step === 6) {
      if (req('presentHouseStreet')) e.presentHouseStreet = 'Required'
      if (req('presentBarangay')) e.presentBarangay = 'Required'
      if (req('presentCity')) e.presentCity = 'Required'
      if (req('presentProvince')) e.presentProvince = 'Required'
      if (req('presentZip')) e.presentZip = 'Required'
      if (req('presentLengthOfStay')) e.presentLengthOfStay = 'Required'
    }

    if (step === 7 && !form.sameAsPresent) {
      if (req('permanentHouseStreet')) e.permanentHouseStreet = 'Required'
      if (req('permanentBarangay')) e.permanentBarangay = 'Required'
      if (req('permanentCity')) e.permanentCity = 'Required'
      if (req('permanentProvince')) e.permanentProvince = 'Required'
      if (req('permanentZip')) e.permanentZip = 'Required'
      if (req('permanentLengthOfStay')) e.permanentLengthOfStay = 'Required'
    }

    if (step === 8 && form.addSpouse) {
      if (req('spouseFirstName')) e.spouseFirstName = 'Required'
      if (req('spouseLastName')) e.spouseLastName = 'Required'
      if (req('spouseMobile')) { e.spouseMobile = 'Required' } else if (!validMobile(form.spouseMobile)) { e.spouseMobile = 'Use format 09XXXXXXXXX' }
    }

    if (step === 9) {
      REQUIRED_DOCS.forEach(d => { if (!docs[d.key]) e[d.key] = 'This document is required' })
    }

    if (step === 10) {
      if (!form.confirmAccurate) e.confirmAccurate = 'You must confirm before submitting'
      if (!form.agreeTerms) e.agreeTerms = 'You must agree to the Terms and Conditions'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, TOTAL_STEPS)) }
  const back = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('loanType', 'sme')
      const keyMap = { presentBarangay: 'barangay', monthlyGrossRevenue: 'monthlyIncome', salesOfficerId: 'sales_officer_id' }
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'confirmAccurate' && k !== 'agreeTerms' && k !== 'sameAsPresent' && k !== 'addSpouse') fd.append(keyMap[k] || k, v)
      })
      Object.entries(docs).forEach(([k, file]) => fd.append(k, file, file.name))
      const res = await fetch('https://loan-backend-production-cd45.up.railway.app/api/application/submit', { method: 'POST', body: fd })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ status: 'error', message: 'Something went wrong. Please try again.' })
    } finally { setSubmitting(false) }
  }

  // ── Result screens ──
  if (result) {
    if (result.status === 'success') {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
          <div className="max-w-lg w-full text-center">
            <div className="w-20 h-20 rounded-full bg-green/10 border border-green/30 flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-green"><path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-green mb-4">Application Received</h2>
            <p className="text-white text-lg mb-2">Reference ID: <span className="text-green font-bold">{result.referenceId}</span></p>
            <p className="text-muted mb-8">Your application has been received. Our team will review it within 2–3 business days.</p>
            <Link to="/" className="inline-block px-8 py-3 bg-green hover:bg-green-hover text-white font-semibold rounded-xl transition-all">Back to Home</Link>
          </div>
        </div>
      )
    }
    if (result.status === 'declined') {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
          <div className="max-w-lg w-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-red-400"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-red-400 mb-4">Application Declined</h2>
            <ul className="text-left bg-surface border border-border rounded-xl p-6 mb-8 space-y-2">
              {(result.reasons || []).map((r, i) => (<li key={i} className="text-muted text-sm flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> {r}</li>))}
            </ul>
            <Link to="/" className="inline-block px-8 py-3 bg-green hover:bg-green-hover text-white font-semibold rounded-xl transition-all">Back to Home</Link>
          </div>
        </div>
      )
    }
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-yellow-400"><path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">Something Went Wrong</h2>
          <p className="text-muted mb-8">{result.message || 'An unexpected error occurred.'}</p>
          <button onClick={() => setResult(null)} className="inline-block px-8 py-3 bg-green hover:bg-green-hover text-white font-semibold rounded-xl transition-all">Try Again</button>
        </div>
      </div>
    )
  }

  const progress = (step / TOTAL_STEPS) * 100
  const stepLabels = [
    'Loan Details', 'Business Info', 'Suppliers', 'Customers',
    'Personal Info', 'Present Address', 'Permanent Address',
    'Spouse', 'Documents', 'Review'
  ]

  return (
    <div ref={topRef} className="min-h-screen pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-muted hover:text-white text-sm transition-colors inline-flex items-center gap-1 mb-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" /></svg>
            Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-green">SME Loan Application</h1>
          <p className="text-muted text-sm mt-1">Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}</p>
        </div>

        <div className="w-full h-1.5 bg-surface-alt rounded-full mb-10 overflow-hidden">
          <div className="h-full bg-green rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-surface/60 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-8">
          {step === 1 && <Step1 form={form} set={set} errors={errors} officers={officers} soLoading={soLoading} soError={soError} soRetry={soRetry} />}
          {step === 2 && <Step2 form={form} set={set} errors={errors} />}
          {step === 3 && <Step3 form={form} set={set} errors={errors} />}
          {step === 4 && <Step4 form={form} set={set} errors={errors} />}
          {step === 5 && <Step5 form={form} set={set} errors={errors} />}
          {step === 6 && <AddressStep form={form} set={set} errors={errors} prefix="present" title="Present Address" subtitle="Where do you currently live?" />}
          {step === 7 && <Step7 form={form} set={set} errors={errors} />}
          {step === 8 && <Step8 form={form} set={set} errors={errors} />}
          {step === 9 && <Step9 docs={docs} errors={errors} handleFile={handleFile} removeFile={removeFile} />}
          {step === 10 && <Step10 form={form} set={set} docs={docs} errors={errors} />}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <button onClick={back} className="px-6 py-3 border border-border text-muted hover:text-white hover:border-muted/50 font-medium text-sm rounded-xl transition-all">Back</button>
            ) : <div />}
            {step < TOTAL_STEPS ? (
              <button onClick={next} className="px-8 py-3 bg-green hover:bg-green-hover text-white font-semibold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-green/20">Continue</button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="px-8 py-3 bg-green hover:bg-green-hover text-white font-semibold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-green/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// STEPS
// ══════════════════════════════════════

function Step1({ form, set, errors, officers, soLoading, soError, soRetry }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-green mb-1">Loan Details</h2>
      <p className="text-muted text-sm mb-4">How much funding does your business need?</p>

      {/* Sales Officer Selection */}
      <div className="mb-6">
        <label className="block text-sm text-muted mb-2">
          Your Sales Officer <span className="text-red-400">*</span>
        </label>
        {soError ? (
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm flex-1">Unable to load officers, please refresh</p>
            <button
              type="button"
              onClick={soRetry}
              className="text-green text-sm hover:text-green-hover transition-colors whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        ) : (
          <select
            value={form.salesOfficerId}
            onChange={e => set('salesOfficerId', e.target.value)}
            disabled={soLoading}
            className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-white focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none disabled:opacity-50 appearance-none"
          >
            <option value="">
              {soLoading ? 'Loading sales officers…' : 'Select your Sales Officer'}
            </option>
            {officers.map(o => (
              <option key={o.id} value={o.id}>{o.full_name}</option>
            ))}
          </select>
        )}
        {errors.salesOfficerId && (
          <p className="text-red-400 text-xs mt-1">{errors.salesOfficerId}</p>
        )}
      </div>

      <div>
        <Label required>Loan Amount</Label>
        <p className="text-muted text-xs mb-2">₱50,000 – ₱300,000 (in ₱10,000 increments)</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green font-bold text-lg">₱</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.loanAmount.toLocaleString('en-PH')}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9]/g, '')
              const num = parseInt(raw, 10)
              if (raw === '') { set('loanAmount', 0); return }
              if (!isNaN(num)) set('loanAmount', num)
            }}
            onBlur={() => {
              const clamped = Math.min(Math.max(form.loanAmount, 50000), 300000)
              const rounded = Math.round(clamped / 10000) * 10000
              set('loanAmount', rounded)
            }}
            className="w-full pl-8 pr-3 py-3 rounded-xl bg-surface-alt border border-border text-green text-right text-xl font-bold focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/30 transition-colors"
          />
        </div>
        <FieldError message={errors.loanAmount} />
      </div>

      <div>
        <Label required>Payment Term</Label>
        <div className="flex gap-3 mt-1">
          {TERMS.map(t => (
            <button key={t} type="button" onClick={() => set('paymentTerm', t)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${form.paymentTerm === t ? 'border-green bg-green/10 text-green' : 'border-border text-muted hover:border-muted/30 hover:text-white'}`}>
              {t} months
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label required>Purpose of Loan</Label>
        <Select value={form.purpose} onChange={e => set('purpose', e.target.value)} options={PURPOSES} placeholder="Select purpose" />
        <FieldError message={errors.purpose} />
      </div>
    </div>
  )
}

function Step2({ form, set, errors }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-green mb-1">Business Information</h2>
      <p className="text-muted text-sm mb-4">Tell us about your business.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>Business Name</Label>
          <Input value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="Business name" />
          <FieldError message={errors.businessName} />
        </div>
        <div>
          <Label required>Business Type</Label>
          <Select value={form.businessType} onChange={e => set('businessType', e.target.value)} options={BUSINESS_TYPES} placeholder="Select type" />
          <FieldError message={errors.businessType} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>DTI / SEC Registration No.</Label>
          <Input value={form.dtiSecNumber} onChange={e => set('dtiSecNumber', e.target.value)} placeholder="Registration number" />
          <FieldError message={errors.dtiSecNumber} />
        </div>
        <div>
          <Label required>Date Established</Label>
          <Input type="date" value={form.dateEstablished} onChange={e => set('dateEstablished', e.target.value)} />
          <FieldError message={errors.dateEstablished} />
        </div>
      </div>

      <div className="border-t border-border pt-5 mt-5">
        <p className="text-blue text-xs font-semibold uppercase tracking-wider mb-4">Business Address</p>
        <div className="space-y-4">
          <div>
            <Label required>Street</Label>
            <Input value={form.businessStreet} onChange={e => set('businessStreet', e.target.value)} placeholder="123 Commercial St." />
            <FieldError message={errors.businessStreet} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Barangay</Label>
              <Input value={form.businessBarangay} onChange={e => set('businessBarangay', e.target.value)} placeholder="Brgy. San Pablo" />
              <FieldError message={errors.businessBarangay} />
            </div>
            <div>
              <Label required>City / Municipality</Label>
              <Input value={form.businessCity} onChange={e => set('businessCity', e.target.value)} placeholder="Malolos" />
              <FieldError message={errors.businessCity} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Province</Label>
              <Input value={form.businessProvince} onChange={e => set('businessProvince', e.target.value)} placeholder="Bulacan" />
              <FieldError message={errors.businessProvince} />
            </div>
            <div>
              <Label required>ZIP Code</Label>
              <Input value={form.businessZip} onChange={e => set('businessZip', e.target.value)} placeholder="3000" maxLength={4} />
              <FieldError message={errors.businessZip} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label required>Monthly Gross Revenue (₱)</Label>
        <Input type="number" value={form.monthlyGrossRevenue} onChange={e => set('monthlyGrossRevenue', e.target.value)} placeholder="30000" min={0} />
        <FieldError message={errors.monthlyGrossRevenue} />
      </div>
    </div>
  )
}

function EntityListStep({ form, set, errors, prefix, entityLabel, title, subtitle }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-green mb-1">{title}</h2>
      <p className="text-muted text-sm mb-4">{subtitle}</p>
      {[1, 2, 3].map(n => (
        <div key={n} className="bg-surface-alt/20 border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-blue text-sm font-semibold uppercase tracking-wider">{entityLabel} {n}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label required>{entityLabel} Name</Label>
              <Input value={form[`${prefix}${n}Name`]} onChange={e => set(`${prefix}${n}Name`, e.target.value)} placeholder="Name" />
              <FieldError message={errors[`${prefix}${n}Name`]} />
            </div>
            <div>
              <Label required>Contact Person</Label>
              <Input value={form[`${prefix}${n}Contact`]} onChange={e => set(`${prefix}${n}Contact`, e.target.value)} placeholder="Contact person" />
              <FieldError message={errors[`${prefix}${n}Contact`]} />
            </div>
            <div>
              <Label required>Contact Number</Label>
              <Input value={form[`${prefix}${n}Number`]} onChange={e => set(`${prefix}${n}Number`, e.target.value)} placeholder="09XXXXXXXXX" maxLength={11} />
              <FieldError message={errors[`${prefix}${n}Number`]} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Step3({ form, set, errors }) {
  return <EntityListStep form={form} set={set} errors={errors} prefix="supplier" entityLabel="Supplier" title="Major Suppliers" subtitle="Provide your 3 major suppliers." />
}

function Step4({ form, set, errors }) {
  return <EntityListStep form={form} set={set} errors={errors} prefix="customer" entityLabel="Customer" title="Major Customers" subtitle="Provide your 3 major customers." />
}

function Step5({ form, set, errors }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-green mb-1">Personal Information</h2>
      <p className="text-muted text-sm mb-4">Tell us about yourself.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label required>First Name</Label>
          <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Juan" />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <Label>Middle Name</Label>
          <Input value={form.middleName} onChange={e => set('middleName', e.target.value)} placeholder="Santos" />
        </div>
        <div>
          <Label required>Last Name</Label>
          <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Dela Cruz" />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>Date of Birth</Label>
          <Input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
          <FieldError message={errors.dateOfBirth} />
        </div>
        <div>
          <Label required>Civil Status</Label>
          <Select value={form.civilStatus} onChange={e => set('civilStatus', e.target.value)} options={CIVIL_STATUSES} placeholder="Select status" />
          <FieldError message={errors.civilStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>Mobile Number</Label>
          <Input value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="09XXXXXXXXX" maxLength={11} />
          <FieldError message={errors.mobile} />
        </div>
        <div>
          <Label required>Email Address</Label>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" />
          <FieldError message={errors.email} />
        </div>
      </div>

      <div className="max-w-xs">
        <Label>TIN (optional)</Label>
        <Input value={form.tin} onChange={e => set('tin', e.target.value)} placeholder="000-000-000-000" />
      </div>
    </div>
  )
}

function AddressStep({ form, set, errors, prefix, title, subtitle }) {
  const f = (field) => `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}`
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-green mb-1">{title}</h2>
      <p className="text-muted text-sm mb-4">{subtitle}</p>

      <div>
        <Label required>House No. / Street</Label>
        <Input value={form[f('houseStreet')]} onChange={e => set(f('houseStreet'), e.target.value)} placeholder="123 Rizal St." />
        <FieldError message={errors[f('houseStreet')]} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>Barangay</Label>
          <Input value={form[f('barangay')]} onChange={e => set(f('barangay'), e.target.value)} placeholder="Brgy. San Pablo" />
          <FieldError message={errors[f('barangay')]} />
        </div>
        <div>
          <Label required>City / Municipality</Label>
          <Input value={form[f('city')]} onChange={e => set(f('city'), e.target.value)} placeholder="Malolos" />
          <FieldError message={errors[f('city')]} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label required>Province</Label>
          <Input value={form[f('province')]} onChange={e => set(f('province'), e.target.value)} placeholder="Bulacan" />
          <FieldError message={errors[f('province')]} />
        </div>
        <div>
          <Label required>ZIP Code</Label>
          <Input value={form[f('zip')]} onChange={e => set(f('zip'), e.target.value)} placeholder="3000" maxLength={4} />
          <FieldError message={errors[f('zip')]} />
        </div>
        <div>
          <Label required>Length of Stay</Label>
          <Input value={form[f('lengthOfStay')]} onChange={e => set(f('lengthOfStay'), e.target.value)} placeholder="e.g. 5 years" />
          <FieldError message={errors[f('lengthOfStay')]} />
        </div>
      </div>
    </div>
  )
}

function Step7({ form, set, errors }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-green mb-1">Permanent Address</h2>
      <label className="flex items-center gap-3 cursor-pointer group">
        <input type="checkbox" checked={form.sameAsPresent} onChange={e => set('sameAsPresent', e.target.checked)}
          className="w-5 h-5 rounded border-border bg-surface-alt text-green focus:ring-green/30 accent-green" />
        <span className="text-white text-sm font-medium group-hover:text-green transition-colors">Same as present address</span>
      </label>
      {form.sameAsPresent ? (
        <div className="bg-surface-alt/30 border border-border rounded-xl p-5">
          <p className="text-muted text-sm">Permanent address will use the same details as your present address.</p>
        </div>
      ) : (
        <AddressStep form={form} set={set} errors={errors} prefix="permanent" title="Permanent Address" subtitle="Enter your permanent address." />
      )}
    </div>
  )
}

function Step8({ form, set, errors }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-green mb-1">Spouse / Co-Borrower Information</h2>
      <p className="text-muted text-sm mb-4">This section is optional.</p>

      <label className="flex items-center gap-3 cursor-pointer group">
        <input type="checkbox" checked={form.addSpouse} onChange={e => set('addSpouse', e.target.checked)}
          className="w-5 h-5 rounded border-border bg-surface-alt text-green focus:ring-green/30 accent-green" />
        <span className="text-white text-sm font-medium group-hover:text-green transition-colors">Add spouse / co-borrower information</span>
      </label>

      {form.addSpouse ? (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>First Name</Label>
              <Input value={form.spouseFirstName} onChange={e => set('spouseFirstName', e.target.value)} placeholder="First name" />
              <FieldError message={errors.spouseFirstName} />
            </div>
            <div>
              <Label required>Last Name</Label>
              <Input value={form.spouseLastName} onChange={e => set('spouseLastName', e.target.value)} placeholder="Last name" />
              <FieldError message={errors.spouseLastName} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Mobile Number</Label>
              <Input value={form.spouseMobile} onChange={e => set('spouseMobile', e.target.value)} placeholder="09XXXXXXXXX" maxLength={11} />
              <FieldError message={errors.spouseMobile} />
            </div>
            <div>
              <Label>Employer</Label>
              <Input value={form.spouseEmployer} onChange={e => set('spouseEmployer', e.target.value)} placeholder="Company name" />
            </div>
          </div>
          <div className="max-w-xs">
            <Label>Monthly Income (₱)</Label>
            <Input type="number" value={form.spouseIncome} onChange={e => set('spouseIncome', e.target.value)} placeholder="0" min={0} />
          </div>
        </div>
      ) : (
        <div className="bg-surface-alt/30 border border-border rounded-xl p-5">
          <p className="text-muted text-sm">You can skip this step if not applicable.</p>
        </div>
      )}
    </div>
  )
}

function Step9({ docs, errors, handleFile, removeFile }) {
  const fileInputRefs = useRef({})
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-green mb-1">Document Upload</h2>
      <p className="text-muted text-sm mb-4">Upload clear photos or scanned copies. JPG, PNG, or PDF only. Max 10MB per file.</p>

      <div className="space-y-3">
        {ALL_DOCS.map(doc => {
          const isRequired = REQUIRED_DOCS.some(d => d.key === doc.key)
          const file = docs[doc.key]
          return (
            <div key={doc.key} className="bg-surface-alt/20 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">
                  {doc.label}{isRequired && <span className="text-red-400 ml-1">*</span>}
                </div>
                {file ? (
                  <div className="flex items-center gap-2 mt-1">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                    <span className="text-muted text-xs truncate">{file.name}</span>
                    <button onClick={() => removeFile(doc.key)} className="text-red-400 hover:text-red-300 text-xs shrink-0 ml-1">Remove</button>
                  </div>
                ) : <FieldError message={errors[doc.key]} />}
              </div>
              <div className="shrink-0">
                <input ref={el => fileInputRefs.current[doc.key] = el} type="file" accept=".jpg,.jpeg,.png,.pdf"
                  onChange={e => { handleFile(doc.key, e.target.files[0]); e.target.value = '' }} className="hidden" />
                <button onClick={() => fileInputRefs.current[doc.key]?.click()}
                  className="px-4 py-2 border border-blue/30 text-blue text-xs font-medium rounded-lg hover:bg-blue/10 transition-all">
                  {file ? 'Replace' : 'Choose File'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Step10({ form, set, docs, errors }) {
  const sections = [
    {
      title: 'Loan Details',
      items: [
        ['Amount', formatPeso(form.loanAmount)],
        ['Term', `${form.paymentTerm} months`],
        ['Purpose', form.purpose],
      ],
    },
    {
      title: 'Business Information',
      items: [
        ['Business Name', form.businessName],
        ['Type', form.businessType],
        ['DTI/SEC No.', form.dtiSecNumber],
        ['Date Established', form.dateEstablished],
        ['Address', `${form.businessStreet}, Brgy. ${form.businessBarangay}, ${form.businessCity}, ${form.businessProvince} ${form.businessZip}`],
        ['Monthly Gross Revenue', formatPeso(form.monthlyGrossRevenue)],
      ],
    },
    {
      title: 'Major Suppliers',
      items: [1, 2, 3].map(n => [`Supplier ${n}`, `${form[`supplier${n}Name`]} — ${form[`supplier${n}Contact`]} (${form[`supplier${n}Number`]})`]),
    },
    {
      title: 'Major Customers',
      items: [1, 2, 3].map(n => [`Customer ${n}`, `${form[`customer${n}Name`]} — ${form[`customer${n}Contact`]} (${form[`customer${n}Number`]})`]),
    },
    {
      title: 'Personal Information',
      items: [
        ['Name', [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')],
        ['Date of Birth', form.dateOfBirth],
        ['Civil Status', form.civilStatus],
        ['Mobile', form.mobile],
        ['Email', form.email],
        ...(form.tin ? [['TIN', form.tin]] : []),
      ],
    },
    {
      title: 'Present Address',
      items: [
        ['Address', `${form.presentHouseStreet}, Brgy. ${form.presentBarangay}, ${form.presentCity}, ${form.presentProvince} ${form.presentZip}`],
        ['Length of Stay', form.presentLengthOfStay],
      ],
    },
    {
      title: 'Permanent Address',
      items: form.sameAsPresent
        ? [['', 'Same as present address']]
        : [
            ['Address', `${form.permanentHouseStreet}, Brgy. ${form.permanentBarangay}, ${form.permanentCity}, ${form.permanentProvince} ${form.permanentZip}`],
            ['Length of Stay', form.permanentLengthOfStay],
          ],
    },
    ...(form.addSpouse ? [{
      title: 'Spouse / Co-Borrower',
      items: [
        ['Name', `${form.spouseFirstName} ${form.spouseLastName}`],
        ['Mobile', form.spouseMobile],
        ...(form.spouseEmployer ? [['Employer', form.spouseEmployer]] : []),
        ...(form.spouseIncome ? [['Income', formatPeso(form.spouseIncome)]] : []),
      ],
    }] : []),
    {
      title: 'Documents',
      items: ALL_DOCS.filter(d => docs[d.key]).map(d => [d.label, docs[d.key].name]),
    },
  ]

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-green mb-1">Review Your Application</h2>
      <p className="text-muted text-sm mb-4">Please review all information before submitting.</p>

      {sections.map(section => (
        <div key={section.title} className="bg-surface-alt/20 border border-border rounded-xl p-5">
          <h3 className="text-blue text-xs font-semibold uppercase tracking-wider mb-3">{section.title}</h3>
          <div className="space-y-2">
            {section.items.map(([label, value], i) => (
              <div key={i} className="flex justify-between gap-4 text-sm">
                {label && <span className="text-muted shrink-0">{label}</span>}
                <span className="text-white text-right break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <label className="flex items-start gap-3 cursor-pointer group pt-2">
        <input type="checkbox" checked={form.confirmAccurate} onChange={e => set('confirmAccurate', e.target.checked)}
          className="w-5 h-5 rounded border-border bg-surface-alt text-green focus:ring-green/30 accent-green mt-0.5" />
        <span className="text-white text-sm leading-relaxed group-hover:text-green transition-colors">
          I confirm that all information provided is true and accurate to the best of my knowledge.
        </span>
      </label>
      <FieldError message={errors.confirmAccurate} />

      <label className="flex items-start gap-3 cursor-pointer group pt-2">
        <input type="checkbox" checked={form.agreeTerms || false} onChange={e => set('agreeTerms', e.target.checked)}
          className="w-5 h-5 rounded border-border bg-surface-alt text-green focus:ring-green/30 accent-green mt-0.5" />
        <span className="text-white text-sm leading-relaxed group-hover:text-green transition-colors">
          I have read and agree to the{' '}
          <a href="/termsandconditions" target="_blank" rel="noopener noreferrer" className="text-green underline hover:text-green-hover">Terms and Conditions</a>
          {' '}and Data Privacy Policy of GR8 Lending Corporation.
        </span>
      </label>
      <FieldError message={errors.agreeTerms} />
    </div>
  )
}
