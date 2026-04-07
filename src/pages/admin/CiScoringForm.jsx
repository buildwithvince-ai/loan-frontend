import { useState, useMemo } from 'react'
import { adminFetch, useToast } from './AdminDashboard'
import { normalizeFinScore, computeFinalFromCiTotal, getTier, getNextTierHint, TIER_CONFIG } from './scoring'

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

// Shared input styling
const inputCls = 'w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none'
const labelCls = 'text-muted text-xs block mb-1.5'

function RadioGroup({ name, options, value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
            value === opt.pts
              ? 'bg-surface-alt border-green/40'
              : 'border-border/50 hover:border-border'
          } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input
            type="radio"
            name={name}
            checked={value === opt.pts}
            onChange={() => onChange(opt.pts)}
            disabled={disabled}
            className="accent-green w-4 h-4 shrink-0"
          />
          <span className="text-sm text-white flex-1">{opt.label}</span>
          <span className={`text-xs font-mono shrink-0 ${
            value === opt.pts ? 'text-green' : 'text-muted'
          }`}>
            {opt.pts >= 0 ? `${opt.pts} pts` : `${opt.pts} pts`}
          </span>
        </label>
      ))}
    </div>
  )
}

function CheckboxGroup({ options, values, onChange, disabled }) {
  const toggle = (pts) => {
    if (values.includes(pts)) {
      onChange(values.filter((v) => v !== pts))
    } else {
      onChange([...values, pts])
    }
  }
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
            values.includes(opt.pts)
              ? 'bg-red-500/5 border-red-500/40'
              : 'border-border/50 hover:border-border'
          } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input
            type="checkbox"
            checked={values.includes(opt.pts)}
            onChange={() => toggle(opt.pts)}
            disabled={disabled}
            className="accent-red-500 w-4 h-4 shrink-0"
          />
          <span className="text-sm text-white flex-1">{opt.label}</span>
          <span className={`text-xs font-mono shrink-0 ${
            values.includes(opt.pts) ? 'text-red-400' : 'text-muted'
          }`}>
            {opt.pts} pts
          </span>
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
          <span className={currentPts != null ? 'text-white' : ''}>{currentPts ?? '—'}</span>
          {' / '}{maxPts} pts
        </span>
      )}
    </div>
  )
}

export default function CiScoringForm({ app, appId, finscoreRaw, finscoreNorm, onSubmitSuccess }) {
  const isSme = app.loan_type === 'sme'
  const isSbl = app.loan_type === 'sbl'
  const age = calcAge(app.date_of_birth || app.dob || app.birthdate)
  const fullName = `${app.first_name || ''} ${app.last_name || ''}`.trim()
  const address = [app.present_address, app.presentBarangay || app.barangay, app.present_city, app.present_province]
    .filter(Boolean).join(', ') || app.address || ''

  // Header fields
  const [clientName, setClientName] = useState(fullName)
  const [completeAddress, setCompleteAddress] = useState(address)
  const [contactNumber, setContactNumber] = useState(app.mobile || app.phone || '')
  const [contactStatus, setContactStatus] = useState(null)
  const [civilStatus, setCivilStatus] = useState(app.civil_status || app.civilStatus || '')
  const [loanPurpose, setLoanPurpose] = useState(app.loan_purpose || app.purpose || '')
  const [relativeAtGr8, setRelativeAtGr8] = useState(null)
  const [relativeWho, setRelativeWho] = useState('')
  const [interviewer, setInterviewer] = useState('')

  // Scoring fields
  const [q1, setQ1] = useState(null)
  const [q2, setQ2] = useState(null)
  const [q3, setQ3] = useState(null)
  const [q4, setQ4] = useState(null)
  const [renewalBonus, setRenewalBonus] = useState(null)
  const [deductions, setDeductions] = useState([])

  // References (not for SBL)
  const [ref1Name, setRef1Name] = useState('')
  const [ref1Phone, setRef1Phone] = useState('')
  const [ref2Name, setRef2Name] = useState('')
  const [ref2Phone, setRef2Phone] = useState('')
  const [ref3Name, setRef3Name] = useState('')
  const [ref3Phone, setRef3Phone] = useState('')

  // SBL-only
  const [brgyChairman, setBrgyChairman] = useState(null)
  const [brgyTreasurer, setBrgyTreasurer] = useState(null)

  // Recommendation
  const [ciRecommendation, setCiRecommendation] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [recommendedAmount, setRecommendedAmount] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const addToast = useToast()

  // Live score calculation
  const baseScore = (q1 ?? 0) + (q2 ?? 0) + (q3 ?? 0) + (q4 ?? 0)
  const bonus = renewalBonus ?? 0
  const totalDeductions = deductions.reduce((s, d) => s + d, 0)
  const ciTotal = Math.max(0, Math.min(50, baseScore + bonus + totalDeductions))

  const anyScored = q1 != null || q2 != null || q3 != null || q4 != null

  const finalScore = useMemo(
    () => computeFinalFromCiTotal(finscoreNorm, ciTotal),
    [finscoreNorm, ciTotal]
  )
  const tier = getTier(finalScore)
  const tierConfig = TIER_CONFIG[tier]
  const hint = getNextTierHint(finalScore)

  const finscoreContrib = Math.round(finscoreNorm * 0.5 * 10) / 10
  const ciContrib = Math.round(ciTotal * 2 * 0.5 * 10) / 10

  const ageOver65 = age != null && age > 65

  const q1Options = isSme ? SME_Q1 : STANDARD_Q1
  const q2Options = isSme ? SME_Q2 : STANDARD_Q2

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

  const handleSubmit = async () => {
    if (!validate()) return
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

      const res = await adminFetch(`/applications/${appId}/ci-score`, {
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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || errData.message || 'Failed to submit CI score')
      }
      addToast('CI Investigation submitted successfully')
      onSubmitSuccess()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="lg:flex lg:gap-5">
      {/* Main form */}
      <div className="flex-1 space-y-6">
        {/* Age warning */}
        {ageOver65 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm font-medium">
              Automatic decline — applicant exceeds maximum age (65). Age: {age}
            </p>
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
                    <input type="radio" name="contactStatus" checked={contactStatus === v} onChange={() => setContactStatus(v)} className="accent-green w-4 h-4" />
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
                    <input type="radio" name="relativeGr8" checked={relativeAtGr8 === v} onChange={() => setRelativeAtGr8(v)} className="accent-green w-4 h-4" />
                    <span className="text-sm text-white capitalize">{v}</span>
                  </label>
                ))}
              </div>
              {relativeAtGr8 === 'yes' && (
                <div className="mt-3 space-y-2">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-amber-400 text-xs font-medium">Immediately call the office</p>
                  </div>
                  <input
                    type="text"
                    value={relativeWho}
                    onChange={(e) => setRelativeWho(e.target.value)}
                    className={inputCls}
                    placeholder="Please specify who"
                  />
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Interviewer *</label>
              <select value={interviewer} onChange={(e) => setInterviewer(e.target.value)} className={inputCls}>
                <option value="">Select interviewer</option>
                {INTERVIEWERS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Q1 */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <SectionHeader number="1" title="Capacity to Pay — Declared Net Income" maxPts={20} currentPts={q1} />
          <p className="text-muted text-xs mb-3">{isSme ? 'SME brackets' : 'Standard brackets'}</p>
          <RadioGroup name="q1" options={q1Options} value={q1} onChange={setQ1} />
        </div>

        {/* Q2 */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <SectionHeader number="2" title="Capacity to Pay — Verified Net Income" maxPts={10} currentPts={q2} />
          <p className="text-muted text-xs mb-3">{isSme ? 'SME brackets' : 'Standard brackets'}</p>
          <RadioGroup name="q2" options={q2Options} value={q2} onChange={setQ2} />
        </div>

        {/* Q3 */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <SectionHeader number="3" title="Work / Business Stability" maxPts={10} currentPts={q3} />
          <RadioGroup name="q3" options={Q3_OPTIONS} value={q3} onChange={setQ3} />
        </div>

        {/* Q4 */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <SectionHeader number="4" title="Residency" maxPts={10} currentPts={q4} />
          <RadioGroup name="q4" options={Q4_OPTIONS} value={q4} onChange={setQ4} />
        </div>

        {/* Renewal Bonus */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <SectionHeader title="Additional Points for Renewal (optional)" />
          <RadioGroup name="renewalBonus" options={RENEWAL_BONUS} value={renewalBonus} onChange={setRenewalBonus} />
        </div>

        {/* Renewal Deductions */}
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

        {/* SBL-only fields */}
        {isSbl && (
          <div className="bg-surface border border-border rounded-xl p-5">
            <h4 className="text-white font-semibold text-sm mb-4">SBL Approvals</h4>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Barangay Chairman Approval</label>
                <div className="flex gap-3 mt-1">
                  {['yes', 'no'].map((v) => (
                    <label key={v} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      brgyChairman === v ? 'bg-surface-alt border-green/40' : 'border-border/50'
                    }`}>
                      <input type="radio" name="brgyChairman" checked={brgyChairman === v} onChange={() => setBrgyChairman(v)} className="accent-green w-4 h-4" />
                      <span className="text-sm text-white capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Barangay Treasurer Approval</label>
                <div className="flex gap-3 mt-1">
                  {['yes', 'no'].map((v) => (
                    <label key={v} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      brgyTreasurer === v ? 'bg-surface-alt border-green/40' : 'border-border/50'
                    }`}>
                      <input type="radio" name="brgyTreasurer" checked={brgyTreasurer === v} onChange={() => setBrgyTreasurer(v)} className="accent-green w-4 h-4" />
                      <span className="text-sm text-white capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CI Recommendation + Remarks */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h4 className="text-white font-semibold text-sm">CI Recommendation</h4>
          <div className="flex gap-3">
            {['approved', 'disapproved'].map((v) => (
              <label key={v} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                ciRecommendation === v
                  ? (v === 'approved' ? 'bg-green/10 border-green/40' : 'bg-red-500/10 border-red-500/40')
                  : 'border-border/50 hover:border-border'
              }`}>
                <input type="radio" name="ciRecommendation" checked={ciRecommendation === v} onChange={() => setCiRecommendation(v)} className="accent-green w-4 h-4" />
                <span className="text-sm text-white capitalize">{v}</span>
              </label>
            ))}
          </div>

          <div>
            <label className={labelCls}>Overall Assessment / Remarks *</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className={`${inputCls} resize-none`}
              placeholder="Required — provide assessment details..."
            />
          </div>

          {ciRecommendation === 'approved' && (
            <div>
              <label className={labelCls}>Recommended Loan Amount (₱)</label>
              <input
                type="number"
                value={recommendedAmount}
                onChange={(e) => setRecommendedAmount(e.target.value)}
                className={inputCls}
                placeholder="e.g. 25000"
              />
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-green hover:bg-green-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting CI Investigation...' : 'Submit CI Investigation'}
        </button>
      </div>

      {/* Sticky score panel */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-20">
          <ScorePanel
            q1={q1} q2={q2} q3={q3} q4={q4}
            bonus={bonus} totalDeductions={totalDeductions}
            baseScore={baseScore} ciTotal={ciTotal}
            finscoreRaw={finscoreRaw} finscoreNorm={finscoreNorm}
            finscoreContrib={finscoreContrib} ciContrib={ciContrib}
            finalScore={finalScore} tier={tier} tierConfig={tierConfig}
            hint={hint} anyScored={anyScored}
          />
        </div>
      </div>

      {/* Mobile score panel — fixed bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border p-3">
        <MobileScoreBar
          ciTotal={ciTotal} finalScore={finalScore} tier={tier} tierConfig={tierConfig} anyScored={anyScored}
        />
      </div>
    </div>
  )
}

function ScorePanel({ q1, q2, q3, q4, bonus, totalDeductions, baseScore, ciTotal, finscoreRaw, finscoreNorm, finscoreContrib, ciContrib, finalScore, tier, tierConfig, hint, anyScored }) {
  const finUnavailable = !finscoreRaw || Number(finscoreRaw) <= 0
  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      <h4 className="text-white font-semibold text-sm">CI Score Breakdown</h4>

      <div className="space-y-1.5 text-xs">
        <ScoreLine label="Q1 Declared Income" value={q1} max={20} />
        <ScoreLine label="Q2 Verified Income" value={q2} max={10} />
        <ScoreLine label="Q3 Work Stability" value={q3} max={10} />
        <ScoreLine label="Q4 Residency" value={q4} max={10} />
        {bonus > 0 && (
          <div className="flex justify-between text-green">
            <span>Renewal Bonus</span>
            <span>+{bonus}</span>
          </div>
        )}
        {totalDeductions < 0 && (
          <div className="flex justify-between text-red-400">
            <span>Renewal Deduction</span>
            <span>{totalDeductions}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border/50 pt-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">CI Total</span>
          <span className="text-white font-bold">{anyScored ? ciTotal : '—'} <span className="text-muted font-normal">/ 50</span></span>
        </div>
      </div>

      <div className="border-t border-border/50 pt-2 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted">FinScore (50%)</span>
          <span className={finUnavailable ? 'text-amber-400' : 'text-blue'}>
            {finUnavailable ? 'N/A' : `${finscoreContrib} / 50`}
          </span>
        </div>
        {finUnavailable && (
          <p className="text-amber-400 text-[10px]">FinScore unavailable — max 50 pts from CI</p>
        )}
        <div className="flex justify-between">
          <span className="text-muted">CI Score (50%)</span>
          <span className="text-green">{anyScored ? `${ciContrib} / 50` : '— / 50'}</span>
        </div>
      </div>

      <div className="border-t border-border/50 pt-3">
        <div className="flex items-end justify-between">
          <span className="text-muted text-xs">Final Score</span>
          <span className="text-2xl font-bold text-white">
            {anyScored ? finalScore : '—'}
            <span className="text-sm text-muted font-normal ml-1">/ 100</span>
          </span>
        </div>
        {anyScored && (
          <div className="mt-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierConfig.badgeClass}`}>
              {tierConfig.label} — {tierConfig.description}
            </span>
          </div>
        )}
        {anyScored && hint && (
          <p className="text-amber-400 text-xs mt-2">{hint}</p>
        )}
      </div>
    </div>
  )
}

function ScoreLine({ label, value, max }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={value != null ? 'text-white' : 'text-muted/50'}>
        {value != null ? value : '—'} / {max}
      </span>
    </div>
  )
}

function MobileScoreBar({ ciTotal, finalScore, tier, tierConfig, anyScored }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <span className="text-muted text-[10px] block">CI</span>
          <span className="text-white text-sm font-bold">{anyScored ? `${ciTotal}/50` : '—'}</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div>
          <span className="text-muted text-[10px] block">Final</span>
          <span className="text-white text-sm font-bold">{anyScored ? `${finalScore}/100` : '—'}</span>
        </div>
      </div>
      {anyScored && (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierConfig.badgeClass}`}>
          {tierConfig.label}
        </span>
      )}
    </div>
  )
}

// Read-only view of submitted CI form data
export function CiFormReadOnly({ ciFormData }) {
  if (!ciFormData) return null

  const q1Options = ciFormData.loan_product === 'sme' ? SME_Q1 : STANDARD_Q1
  const q2Options = ciFormData.loan_product === 'sme' ? SME_Q2 : STANDARD_Q2

  const findLabel = (options, pts) => {
    const opt = options.find((o) => o.pts === pts)
    return opt ? `${opt.label} (${pts} pts)` : `${pts} pts`
  }

  const deductionLabels = (ciFormData.renewal_deductions || []).map((pts) => {
    const opt = RENEWAL_DEDUCTIONS.find((o) => o.pts === pts)
    return opt ? `${opt.label} (${pts})` : `${pts} pts`
  })

  const fields = [
    ['Client Name', ciFormData.client_name],
    ['Age', ciFormData.age],
    ['Address', ciFormData.complete_address],
    ['Contact', ciFormData.contact_number],
    ['Contact Status', ciFormData.contact_status],
    ['Loan Product', ciFormData.loan_product?.toUpperCase()],
    ['Civil Status', ciFormData.civil_status],
    ['Loan Purpose', ciFormData.loan_purpose],
    ['Relative at GR8', ciFormData.relative_at_gr8 === 'yes' ? `Yes — ${ciFormData.relative_who}` : 'No'],
    ['Interviewer', ciFormData.interviewer],
    null, // divider
    ['Q1: Declared Income', findLabel(q1Options, ciFormData.q1_declared_income)],
    ['Q2: Verified Income', findLabel(q2Options, ciFormData.q2_verified_income)],
    ['Q3: Work Stability', findLabel(Q3_OPTIONS, ciFormData.q3_work_stability)],
    ['Q4: Residency', findLabel(Q4_OPTIONS, ciFormData.q4_residency)],
    ['Renewal Bonus', ciFormData.renewal_bonus ? findLabel(RENEWAL_BONUS, ciFormData.renewal_bonus) : 'None'],
    ['Renewal Deductions', deductionLabels.length > 0 ? deductionLabels.join('; ') : 'None'],
    null,
    ['Base Score', `${ciFormData.base_score} / 50`],
    ['CI Total', `${ciFormData.ci_total} / 50`],
    null,
    ['CI Recommendation', ciFormData.ci_recommendation?.toUpperCase()],
    ['Remarks', ciFormData.remarks],
    ciFormData.recommended_amount ? ['Recommended Amount', `₱${Number(ciFormData.recommended_amount).toLocaleString()}`] : null,
  ].filter((f) => f !== null && f !== undefined)

  // References
  const refs = ciFormData.references?.filter((r) => r.name) || []
  const isSbl = ciFormData.loan_product === 'sbl'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields.map((field, i) => {
          if (field === null) return <div key={i} className="sm:col-span-2 border-t border-border/30 my-1" />
          const [label, value] = field
          return (
            <div key={i} className="bg-surface-alt rounded-lg px-3 py-2">
              <span className="text-muted text-xs block">{label}</span>
              <span className="text-white text-sm break-all">{value || '—'}</span>
            </div>
          )
        })}
      </div>
      {refs.length > 0 && (
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-2">References</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {refs.map((ref, i) => (
              <div key={i} className="bg-surface-alt rounded-lg px-3 py-2">
                <span className="text-muted text-xs block">Reference {i + 1}</span>
                <span className="text-white text-sm">{ref.name} — {ref.phone || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {isSbl && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-alt rounded-lg px-3 py-2">
            <span className="text-muted text-xs block">Brgy Chairman Approval</span>
            <span className="text-white text-sm capitalize">{ciFormData.sbl_brgy_chairman || '—'}</span>
          </div>
          <div className="bg-surface-alt rounded-lg px-3 py-2">
            <span className="text-muted text-xs block">Brgy Treasurer Approval</span>
            <span className="text-white text-sm capitalize">{ciFormData.sbl_brgy_treasurer || '—'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
