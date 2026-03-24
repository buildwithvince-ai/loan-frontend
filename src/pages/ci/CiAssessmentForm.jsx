import { useState, useEffect } from 'react'
import { ciFetch, useCiToast } from './CiPortal'

const INTERVIEWERS = [
  'Angelo Bradly Danganan',
  'Jowell Fajardo',
  'Ronald Allan Mendez',
  'Jerry Liquido',
  'Arnel Estrella',
  'Rafael Roque',
  'Anaceto DC Carreon',
]

const STANDARD_Q1 = [
  { label: '₱25,000 and above', pts: 20 },
  { label: '₱18,000 – ₱24,999', pts: 15 },
  { label: '₱10,000 – ₱17,999', pts: 10 },
  { label: '₱3,000 – ₱9,999', pts: 5 },
  { label: '₱0 – ₱2,999', pts: 0 },
]
const SME_Q1 = [
  { label: '₱130,000 and above', pts: 20 },
  { label: '₱100,000 – ₱129,999', pts: 15 },
  { label: '₱60,000 – ₱99,999', pts: 10 },
  { label: '₱20,000 – ₱59,999', pts: 5 },
  { label: '₱0 – ₱19,999', pts: 0 },
]
const STANDARD_Q2 = [
  { label: '₱25,000 and above', pts: 10 },
  { label: '₱18,000 – ₱24,999', pts: 8 },
  { label: '₱10,000 – ₱17,999', pts: 5 },
  { label: '₱3,000 – ₱9,999', pts: 3 },
  { label: "₱0 – ₱2,999 or can't verify", pts: 0 },
]
const SME_Q2 = [
  { label: '₱130,000 and above', pts: 10 },
  { label: '₱100,000 – ₱129,999', pts: 8 },
  { label: '₱60,000 – ₱99,999', pts: 5 },
  { label: '₱20,000 – ₱59,999', pts: 3 },
  { label: "₱0 – ₱19,999 or can't verify", pts: 0 },
]
const Q3_OPTIONS = [
  { label: 'More than 3 years (stable)', pts: 10 },
  { label: '1–2 years', pts: 7 },
  { label: 'Less than 1 year', pts: 3 },
  { label: 'Contractual employee / newly opened', pts: 0 },
]
const Q4_OPTIONS = [
  { label: 'Owned, same address more than 5 years', pts: 10 },
  { label: 'Living with parents/relatives, stable address', pts: 7 },
  { label: 'Renting but more than 3 years in same location', pts: 5 },
  { label: 'Transferring often or less than 1 year', pts: 3 },
  { label: 'Cannot verify address', pts: 0 },
]
const RENEWAL_BONUS = [
  { label: 'Excellent health meter on Loandisk', pts: 10 },
  { label: 'Good health meter on Loandisk', pts: 8 },
  { label: 'Average health meter on Loandisk', pts: 5 },
  { label: 'Not applicable / first-time borrower', pts: 0 },
]
const RENEWAL_DEDUCTIONS = [
  { label: 'With past due history', pts: -10 },
  { label: 'Refused visit to business or residence', pts: -7 },
  { label: 'Inconsistent answers during CI', pts: -5 },
  { label: 'Previous broken promise to pay / rushing loan release', pts: -3 },
]

function calcAge(dob) {
  if (!dob) return null
  const birth = new Date(dob)
  if (isNaN(birth)) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const inputCls = 'w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none'
const labelCls = 'text-muted text-xs block mb-1.5'

function RadioGroup({ name, options, value, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
            value === opt.pts ? 'bg-surface-alt border-green/40' : 'border-border/50 hover:border-border'
          }`}
        >
          <input type="radio" name={name} checked={value === opt.pts} onChange={() => onChange(opt.pts)} className="accent-green w-4 h-4 shrink-0" />
          <span className="text-sm text-white flex-1">{opt.label}</span>
          <span className={`text-xs font-mono shrink-0 ${value === opt.pts ? 'text-green' : 'text-muted'}`}>
            {opt.pts >= 0 ? `${opt.pts} pts` : `${opt.pts} pts`}
          </span>
        </label>
      ))}
    </div>
  )
}

function CheckboxGroup({ options, values, onChange }) {
  const toggle = (pts) => {
    onChange(values.includes(pts) ? values.filter((v) => v !== pts) : [...values, pts])
  }
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
            values.includes(opt.pts) ? 'bg-red-500/5 border-red-500/40' : 'border-border/50 hover:border-border'
          }`}
        >
          <input type="checkbox" checked={values.includes(opt.pts)} onChange={() => toggle(opt.pts)} className="accent-red-500 w-4 h-4 shrink-0" />
          <span className="text-sm text-white flex-1">{opt.label}</span>
          <span className={`text-xs font-mono shrink-0 ${values.includes(opt.pts) ? 'text-red-400' : 'text-muted'}`}>{opt.pts} pts</span>
        </label>
      ))}
    </div>
  )
}

function SectionHeader({ number, title, maxPts, currentPts }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-white font-semibold text-sm">
        {number && <span className="text-green mr-1.5">Q{number}.</span>}
        {title}
      </h4>
      {maxPts != null && (
        <span className="text-xs font-mono text-muted">
          <span className={currentPts != null ? 'text-white' : ''}>{currentPts ?? '—'}</span> / {maxPts} pts
        </span>
      )}
    </div>
  )
}

function formatCurrency(amount) {
  return '₱' + Number(amount || 0).toLocaleString()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CiAssessmentForm({ app, onBack }) {
  const isSme = app.loan_type === 'sme'
  const isSbl = app.loan_type === 'sbl'
  const fullName = `${app.first_name || ''} ${app.last_name || ''}`.trim()
  const age = calcAge(app.date_of_birth || app.dob || app.birthdate || app.dateOfBirth || (app.form_data && (app.form_data.date_of_birth || app.form_data.dob || app.form_data.dateOfBirth)))
  const address = [app.present_address, app.presentBarangay || app.barangay, app.present_city, app.present_province]
    .filter(Boolean).join(', ') || app.address || ''
  const addToast = useCiToast()

  // Form state
  const [clientName, setClientName] = useState(fullName)
  const [completeAddress, setCompleteAddress] = useState(address)
  const [contactNumber, setContactNumber] = useState(app.mobile || app.phone || '')
  const [contactStatus, setContactStatus] = useState(null)
  const [civilStatus, setCivilStatus] = useState(app.civil_status || app.civilStatus || '')
  const [loanPurpose, setLoanPurpose] = useState(app.loan_purpose || app.purpose || '')
  const [relativeAtGr8, setRelativeAtGr8] = useState(null)
  const [relativeWho, setRelativeWho] = useState('')
  const [interviewer, setInterviewer] = useState('')

  const [q1, setQ1] = useState(null)
  const [q2, setQ2] = useState(null)
  const [q3, setQ3] = useState(null)
  const [q4, setQ4] = useState(null)
  const [renewalBonus, setRenewalBonus] = useState(null)
  const [deductions, setDeductions] = useState([])

  const [ref1Name, setRef1Name] = useState('')
  const [ref1Phone, setRef1Phone] = useState('')
  const [ref2Name, setRef2Name] = useState('')
  const [ref2Phone, setRef2Phone] = useState('')
  const [ref3Name, setRef3Name] = useState('')
  const [ref3Phone, setRef3Phone] = useState('')

  const [brgyChairman, setBrgyChairman] = useState(null)
  const [brgyTreasurer, setBrgyTreasurer] = useState(null)

  const [ciRecommendation, setCiRecommendation] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [recommendedAmount, setRecommendedAmount] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formDirty, setFormDirty] = useState(false)

  // Track dirty state
  useEffect(() => {
    if (q1 != null || q2 != null || q3 != null || q4 != null || remarks || interviewer) {
      setFormDirty(true)
    }
  }, [q1, q2, q3, q4, remarks, interviewer])

  // Score calculation
  const baseScore = (q1 ?? 0) + (q2 ?? 0) + (q3 ?? 0) + (q4 ?? 0)
  const bonus = renewalBonus ?? 0
  const totalDeductions = deductions.reduce((s, d) => s + d, 0)
  const ciTotal = Math.max(0, Math.min(50, baseScore + bonus + totalDeductions))
  const anyScored = q1 != null || q2 != null || q3 != null || q4 != null

  const q1Options = isSme ? SME_Q1 : STANDARD_Q1
  const q2Options = isSme ? SME_Q2 : STANDARD_Q2

  const handleBack = () => {
    if (formDirty && !submitted) {
      if (!window.confirm('You have unsaved changes. Leave without submitting?')) return
    }
    onBack()
  }

  const validate = () => {
    if (!interviewer) { addToast('Select an interviewer', 'error'); return false }
    if (contactStatus == null) { addToast('Select contact status', 'error'); return false }
    if (q1 == null) { addToast('Answer Q1: Declared Net Income', 'error'); return false }
    if (q2 == null) { addToast('Answer Q2: Verified Net Income', 'error'); return false }
    if (q3 == null) { addToast('Answer Q3: Work/Business Stability', 'error'); return false }
    if (q4 == null) { addToast('Answer Q4: Residency', 'error'); return false }
    if (ciRecommendation == null) { addToast('Select CI recommendation', 'error'); return false }
    if (!remarks.trim()) { addToast('Remarks are required', 'error'); return false }
    return true
  }

  const handleSubmitClick = () => {
    if (!validate()) return
    setShowConfirm(true)
  }

  const handleConfirmSubmit = async () => {
    setShowConfirm(false)
    setSubmitting(true)
    try {
      const ciFormData = {
        client_name: clientName,
        age,
        complete_address: completeAddress,
        contact_number: contactNumber,
        contact_status: contactStatus,
        loan_product: app.loan_type,
        civil_status: civilStatus,
        loan_purpose: loanPurpose,
        relative_at_gr8: relativeAtGr8,
        relative_who: relativeAtGr8 === 'yes' ? relativeWho : null,
        interviewer,
        q1_declared_income: q1,
        q2_verified_income: q2,
        q3_work_stability: q3,
        q4_residency: q4,
        renewal_bonus: bonus,
        renewal_deductions: deductions,
        total_deductions: totalDeductions,
        base_score: baseScore,
        ci_total: ciTotal,
        references: isSbl ? null : [
          { name: ref1Name, phone: ref1Phone },
          { name: ref2Name, phone: ref2Phone },
          { name: ref3Name, phone: ref3Phone },
        ],
        sbl_brgy_chairman: isSbl ? brgyChairman : null,
        sbl_brgy_treasurer: isSbl ? brgyTreasurer : null,
        ci_recommendation: ciRecommendation,
        remarks,
        recommended_amount: ciRecommendation === 'approved' ? recommendedAmount : null,
      }

      const res = await ciFetch(`/applications/${app.id || app.reference_id}/ci-score`, {
        method: 'PATCH',
        body: JSON.stringify({
          ci_score: ciTotal,
          ci_form_data: ciFormData,
          interviewer,
          ci_recommendation: ciRecommendation,
          ci_remarks: remarks,
          ci_recommended_amount: ciRecommendation === 'approved' ? recommendedAmount : null,
          reviewed_by: interviewer,
          notes: remarks,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit CI assessment')
      setSubmitted(true)
      setFormDirty(false)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (submitted) {
    return (
      <div>
        <div className="bg-surface border border-border rounded-xl p-8 text-center max-w-lg mx-auto mt-8">
          <div className="w-16 h-16 bg-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green text-3xl">✓</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">CI Assessment Submitted</h2>
          <p className="text-muted text-sm mb-6">
            Assessment submitted for <span className="text-white font-medium">{fullName}</span>
          </p>
          <div className="bg-surface-alt rounded-lg p-4 space-y-2 text-sm text-left mb-6">
            <div className="flex justify-between">
              <span className="text-muted">Reference ID</span>
              <span className="text-blue font-mono">{app.reference_id || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Interviewer</span>
              <span className="text-white">{interviewer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">CI Score</span>
              <span className="text-white font-bold">{ciTotal} / 50</span>
            </div>
          </div>
          <p className="text-muted text-xs mb-6">This application will now be reviewed by the supervisor.</p>
          <button
            onClick={onBack}
            className="w-full bg-green hover:bg-green-hover text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Back to Applications
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-surface border border-border rounded-xl p-6 max-w-md w-full">
            <h3 className="text-white font-bold text-lg mb-2">Submit CI Assessment</h3>
            <p className="text-muted text-sm mb-6">
              Submit CI assessment for <span className="text-white">{fullName}</span>? This cannot be edited after submission.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm text-muted hover:text-white border border-border rounded-lg transition-colors">Cancel</button>
              <button onClick={handleConfirmSubmit} className="px-4 py-2 text-sm font-medium bg-green hover:bg-green-hover text-white rounded-lg transition-colors">
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <button onClick={handleBack} className="flex items-center gap-2 text-muted hover:text-white text-sm mb-6 transition-colors">
        ← Back to Applications
      </button>

      {/* Application summary */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">Application Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          <div>
            <span className="text-muted text-xs block">Name</span>
            <span className="text-white">{fullName}</span>
          </div>
          <div>
            <span className="text-muted text-xs block">Phone</span>
            <span className="text-white">{app.mobile || app.phone || '—'}</span>
          </div>
          <div>
            <span className="text-muted text-xs block">Loan Type</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              { personal: 'bg-blue/20 text-blue', sme: 'bg-purple-500/20 text-purple-400', akap: 'bg-amber-500/20 text-amber-400', group: 'bg-teal-500/20 text-teal-400', sbl: 'bg-pink-500/20 text-pink-400' }[app.loan_type] || 'bg-gray-500/20 text-gray-400'
            }`}>{app.loan_type || '—'}</span>
          </div>
          <div>
            <span className="text-muted text-xs block">Amount</span>
            <span className="text-white">{formatCurrency(app.loan_amount || app.amount)}</span>
          </div>
          <div>
            <span className="text-muted text-xs block">Term</span>
            <span className="text-white">{app.term || app.loan_term ? `${app.term || app.loan_term} months` : '—'}</span>
          </div>
          <div>
            <span className="text-muted text-xs block">Submitted</span>
            <span className="text-white">{formatDate(app.submitted_at || app.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="lg:flex lg:gap-5">
        {/* Form */}
        <div className="flex-1 space-y-6">
          {/* Age warning */}
          {age != null && age > 65 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm font-medium">Automatic decline — applicant exceeds maximum age (65). Age: {age}</p>
            </div>
          )}

          {/* Header fields */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <h4 className="text-white font-semibold text-sm mb-3">Investigation Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Client Name</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Age {age != null && <span className="text-white ml-1">({age} years old)</span>}</label>
                <input type="text" value={age ?? 'N/A'} readOnly className={`${inputCls} opacity-60`} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Complete Address</label>
                <input type="text" value={completeAddress} onChange={(e) => setCompleteAddress(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact Number</label>
                <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact Status *</label>
                <div className="flex gap-3 mt-1">
                  {['contacted', 'uncontacted'].map((v) => (
                    <label key={v} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      contactStatus === v ? 'bg-surface-alt border-green/40' : 'border-border/50 hover:border-border'
                    }`}>
                      <input type="radio" name="ciContactStatus" checked={contactStatus === v} onChange={() => setContactStatus(v)} className="accent-green w-4 h-4" />
                      <span className="text-sm text-white capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Loan Product</label>
                <input type="text" value={(app.loan_type || '').toUpperCase()} readOnly className={`${inputCls} opacity-60`} />
              </div>
              <div>
                <label className={labelCls}>Civil Status</label>
                <input type="text" value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Loan Purpose</label>
                <input type="text" value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value)} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Relative working at GR8 Lending?</label>
                <div className="flex gap-3 mt-1">
                  {['no', 'yes'].map((v) => (
                    <label key={v} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      relativeAtGr8 === v ? (v === 'yes' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-surface-alt border-green/40') : 'border-border/50 hover:border-border'
                    }`}>
                      <input type="radio" name="ciRelGr8" checked={relativeAtGr8 === v} onChange={() => setRelativeAtGr8(v)} className="accent-green w-4 h-4" />
                      <span className="text-sm text-white capitalize">{v}</span>
                    </label>
                  ))}
                </div>
                {relativeAtGr8 === 'yes' && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-xs font-medium">Call the office immediately</p>
                    </div>
                    <input type="text" value={relativeWho} onChange={(e) => setRelativeWho(e.target.value)} className={inputCls} placeholder="Please specify who" />
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Interviewer *</label>
                <select value={interviewer} onChange={(e) => setInterviewer(e.target.value)} className={inputCls}>
                  <option value="">Select interviewer</option>
                  {INTERVIEWERS.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Q1 */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <SectionHeader number="1" title="Capacity to Pay — Declared Net Income" maxPts={20} currentPts={q1} />
            <p className="text-muted text-xs mb-3">{isSme ? 'SME brackets' : 'Standard brackets'}</p>
            <RadioGroup name="ciQ1" options={q1Options} value={q1} onChange={setQ1} />
          </div>

          {/* Q2 */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <SectionHeader number="2" title="Capacity to Pay — Verified Net Income" maxPts={10} currentPts={q2} />
            <p className="text-muted text-xs mb-3">{isSme ? 'SME brackets' : 'Standard brackets'}</p>
            <RadioGroup name="ciQ2" options={q2Options} value={q2} onChange={setQ2} />
          </div>

          {/* Q3 */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <SectionHeader number="3" title="Work / Business Stability" maxPts={10} currentPts={q3} />
            <RadioGroup name="ciQ3" options={Q3_OPTIONS} value={q3} onChange={setQ3} />
          </div>

          {/* Q4 */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <SectionHeader number="4" title="Residency" maxPts={10} currentPts={q4} />
            <RadioGroup name="ciQ4" options={Q4_OPTIONS} value={q4} onChange={setQ4} />
          </div>

          {/* Renewal Bonus */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <SectionHeader title="Additional Points for Renewal (optional)" />
            <RadioGroup name="ciRenewalBonus" options={RENEWAL_BONUS} value={renewalBonus} onChange={setRenewalBonus} />
          </div>

          {/* Deductions */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <SectionHeader title="Points Deduction for Renewal (optional)" />
            <CheckboxGroup options={RENEWAL_DEDUCTIONS} values={deductions} onChange={setDeductions} />
          </div>

          {/* Character References (not SBL) */}
          {!isSbl && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="text-white font-semibold text-sm mb-4">Character / Trade References</h4>
              {[
                { n: 1, name: ref1Name, setName: setRef1Name, phone: ref1Phone, setPhone: setRef1Phone },
                { n: 2, name: ref2Name, setName: setRef2Name, phone: ref2Phone, setPhone: setRef2Phone },
                { n: 3, name: ref3Name, setName: setRef3Name, phone: ref3Phone, setPhone: setRef3Phone },
              ].map(({ n, name, setName, phone, setPhone }) => (
                <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelCls}>Reference {n} — Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Reference {n} — Contact</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="09XXXXXXXXX" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SBL fields */}
          {isSbl && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="text-white font-semibold text-sm mb-4">SBL Approvals</h4>
              <div className="space-y-4">
                {[
                  { label: 'Barangay Chairman Approval', value: brgyChairman, set: setBrgyChairman, name: 'ciBrgyChairman' },
                  { label: 'Barangay Treasurer Approval', value: brgyTreasurer, set: setBrgyTreasurer, name: 'ciBrgyTreasurer' },
                ].map(({ label, value, set, name }) => (
                  <div key={name}>
                    <label className={labelCls}>{label}</label>
                    <div className="flex gap-3 mt-1">
                      {['yes', 'no'].map((v) => (
                        <label key={v} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                          value === v ? 'bg-surface-alt border-green/40' : 'border-border/50'
                        }`}>
                          <input type="radio" name={name} checked={value === v} onChange={() => set(v)} className="accent-green w-4 h-4" />
                          <span className="text-sm text-white capitalize">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <h4 className="text-white font-semibold text-sm">CI Recommendation</h4>
            <div className="flex gap-3">
              {['approved', 'disapproved'].map((v) => (
                <label key={v} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  ciRecommendation === v
                    ? (v === 'approved' ? 'bg-green/10 border-green/40' : 'bg-red-500/10 border-red-500/40')
                    : 'border-border/50 hover:border-border'
                }`}>
                  <input type="radio" name="ciRec" checked={ciRecommendation === v} onChange={() => setCiRecommendation(v)} className="accent-green w-4 h-4" />
                  <span className="text-sm text-white capitalize">{v}</span>
                </label>
              ))}
            </div>
            <div>
              <label className={labelCls}>Overall Assessment / Remarks *</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={4} className={`${inputCls} resize-none`} placeholder="Required — provide assessment details..." />
            </div>
            {ciRecommendation === 'approved' && (
              <div>
                <label className={labelCls}>Recommended Loan Amount (₱)</label>
                <input type="number" value={recommendedAmount} onChange={(e) => setRecommendedAmount(e.target.value)} className={inputCls} placeholder="e.g. 25000" />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmitClick}
            disabled={submitting}
            className="w-full bg-green hover:bg-green-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 mb-16 lg:mb-0"
          >
            {submitting ? 'Submitting...' : 'Submit CI Assessment'}
          </button>
        </div>

        {/* Sticky CI-only score panel (desktop) */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <h4 className="text-white font-semibold text-sm">CI Score Breakdown</h4>
              <div className="space-y-1.5 text-xs">
                <ScoreLine label="Q1 Declared Income" value={q1} max={20} />
                <ScoreLine label="Q2 Verified Income" value={q2} max={10} />
                <ScoreLine label="Q3 Work Stability" value={q3} max={10} />
                <ScoreLine label="Q4 Residency" value={q4} max={10} />
                {bonus > 0 && (
                  <div className="flex justify-between text-green"><span>Renewal Bonus</span><span>+{bonus}</span></div>
                )}
                {totalDeductions < 0 && (
                  <div className="flex justify-between text-red-400"><span>Renewal Deduction</span><span>{totalDeductions}</span></div>
                )}
              </div>
              <div className="border-t border-border/50 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">CI Total</span>
                  <span className="text-white font-bold">{anyScored ? ciTotal : '—'} <span className="text-muted font-normal">/ 50</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile score bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border p-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <span className="text-muted text-[10px] block">CI Total</span>
              <span className="text-white text-sm font-bold">{anyScored ? `${ciTotal} / 50` : '— / 50'}</span>
            </div>
            <button
              onClick={handleSubmitClick}
              disabled={submitting}
              className="bg-green hover:bg-green-hover text-white font-medium text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreLine({ label, value, max }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={value != null ? 'text-white' : 'text-muted/50'}>{value ?? '—'} / {max}</span>
    </div>
  )
}
