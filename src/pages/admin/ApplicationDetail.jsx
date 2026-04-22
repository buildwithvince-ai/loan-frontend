import { useState, useEffect, useMemo } from 'react'
import { adminFetch, pipelineFetch, useToast } from './AdminDashboard'
import { normalizeFinScore, computeFinalFromCiTotal, getTier, getNextTierHint, TIER_CONFIG } from './scoring'
import CiScoringForm, { CiFormReadOnly } from './CiScoringForm'
import { useAuth } from '../../context/AuthContext'
import useSalesOfficers from '../../hooks/useSalesOfficers'

// --- Shared UI components ---

function Section({ title, children, collapsible = false, defaultOpen = true, rightContent }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div
        onClick={() => collapsible && setOpen(!open)}
        className={`w-full px-5 py-4 flex items-center justify-between text-left ${
          collapsible ? 'cursor-pointer hover:bg-surface-alt/50' : ''
        }`}
      >
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        <div className="flex items-center gap-3">
          {rightContent}
          {collapsible && <span className="text-muted text-xs">{open ? '▲' : '▼'}</span>}
        </div>
      </div>
      {open && <div className="px-5 pb-5 border-t border-border/50">{children}</div>}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <span className="text-muted text-xs block mb-0.5">{label}</span>
      <span className="text-white text-sm">{value || '—'}</span>
    </div>
  )
}

function FieldCard({ label, value }) {
  return (
    <div className="bg-surface-alt rounded-lg px-3 py-2">
      <span className="text-muted text-xs block">{label}</span>
      <span className="text-white text-sm break-all">{value || '—'}</span>
    </div>
  )
}

function Badge({ label, colorClass }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {label}
    </span>
  )
}

function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading, loadingLabel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={loading ? undefined : onCancel} />
      <div className="relative bg-surface border border-border rounded-xl p-6 max-w-md w-full">
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-muted hover:text-white border border-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${confirmClass}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {loadingLabel || 'Processing…'}
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatCurrency(amount) {
  return '₱' + Number(amount || 0).toLocaleString()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

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

// Helper to get a value from app data, checking both top-level and form_data
function getField(app, ...keys) {
  const fd = app.form_data || {}
  for (const k of keys) {
    if (app[k] != null && app[k] !== '') return app[k]
    if (fd[k] != null && fd[k] !== '') return fd[k]
  }
  return null
}

// --- Section 1: Application Summary ---

function SoAssigner({ app, appId, onAssigned }) {
  const { hasAnyRole } = useAuth()
  const canAssign = hasAnyRole(['admin', 'super_admin'])
  const { officers } = useSalesOfficers()
  const [assigning, setAssigning] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const addToast = useToast()

  const soId = app.assigned_sales_officer
  const soName = app.assigned_sales_officer_name
    || (soId && officers.find(o => o.id === soId)?.full_name)
    || null

  const handleAssign = async (officerId) => {
    setAssigning(true)
    try {
      const res = await pipelineFetch(`/${appId}/assign-sales-officer`, {
        method: 'PATCH',
        body: JSON.stringify({ sales_officer_id: officerId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to assign SO')
      }
      addToast('Sales Officer assigned')
      setShowPicker(false)
      await onAssigned()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setAssigning(false)
    }
  }

  if (!canAssign) {
    return soName ? (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/12 text-teal-400/60">
        SO: {soName}
      </span>
    ) : (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
        No SO Assigned
      </span>
    )
  }

  if (showPicker) {
    return (
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <select
          defaultValue=""
          onChange={e => e.target.value && handleAssign(e.target.value)}
          disabled={assigning}
          className="bg-surface-alt border border-border rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-green/50"
        >
          <option value="" disabled>Select SO...</option>
          {officers.map(o => (
            <option key={o.id} value={o.id}>{o.full_name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowPicker(false)}
          className="text-muted hover:text-white text-xs transition-colors"
        >
          Cancel
        </button>
        {assigning && <div className="w-3.5 h-3.5 border-2 border-green border-t-transparent rounded-full animate-spin" />}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        soName ? 'bg-teal-500/12 text-teal-400/60' : 'bg-gray-500/20 text-gray-400'
      }`}>
        {soName ? `SO: ${soName}` : 'No SO Assigned'}
      </span>
      <button
        onClick={e => { e.stopPropagation(); setShowPicker(true) }}
        className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue/12 text-blue/60 hover:bg-blue/18 hover:text-blue transition-colors"
      >
        {soName ? 'Change' : 'Assign'}
      </button>
    </div>
  )
}

function ApplicationSummary({ app, appId, onViewDocuments, onRefresh }) {
  const fd = app.form_data || {}
  const data = { ...fd, ...app } // app fields override form_data
  const age = calcAge(data.date_of_birth || data.dob || data.birthdate || data.dateOfBirth)
  const loanType = app.loan_type || ''
  const isGroup = loanType === 'group'
  const members = app.members || app.group_members || fd.members || fd.group_members || []
  const fileMetadata = app.file_metadata || fd.file_metadata || app.files || fd.files || []

  // Build address strings
  const presentAddr = [
    getField(app, 'presentStreet', 'present_street', 'street'),
    getField(app, 'presentBarangay', 'present_barangay', 'barangay'),
    getField(app, 'presentCity', 'present_city', 'city'),
    getField(app, 'presentProvince', 'present_province', 'province'),
    getField(app, 'presentZip', 'present_zip', 'zip'),
  ].filter(Boolean).join(', ') || getField(app, 'present_address', 'address') || '—'

  const permanentAddr = [
    getField(app, 'permanentStreet', 'permanent_street'),
    getField(app, 'permanentBarangay', 'permanent_barangay'),
    getField(app, 'permanentCity', 'permanent_city'),
    getField(app, 'permanentProvince', 'permanent_province'),
    getField(app, 'permanentZip', 'permanent_zip'),
  ].filter(Boolean).join(', ') || getField(app, 'permanent_address') || 'Same as present'

  // Personal references
  const refs = []
  for (const suffix of ['A', 'B', 'C', '1', '2', '3']) {
    const name = getField(app, `reference${suffix}Name`, `reference_${suffix.toLowerCase()}_name`, `ref${suffix}Name`)
    if (name) {
      refs.push({
        name,
        relationship: getField(app, `reference${suffix}Relationship`, `reference_${suffix.toLowerCase()}_relationship`, `ref${suffix}Relationship`),
        contact: getField(app, `reference${suffix}Contact`, `reference_${suffix.toLowerCase()}_contact`, `ref${suffix}Contact`, `reference${suffix}Phone`),
      })
    }
  }

  // Spouse / co-borrower
  const spouseName = getField(app, 'spouseName', 'spouse_name', 'spouseFirstName', 'coBorrowerName', 'co_borrower_name')

  return (
    <Section
      title="Section 1 — Application Summary"
      rightContent={<SoAssigner app={app} appId={appId} onAssigned={onRefresh} />}
    >
      <div className="pt-4 space-y-5">
        {/* Personal Information */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <FieldCard label="Full Name" value={[getField(app, 'firstName', 'first_name'), getField(app, 'lastName', 'last_name')].filter(Boolean).join(' ') || null} />
            <FieldCard label="Age" value={age != null ? `${age} years old` : null} />
            <FieldCard label="Date of Birth" value={getField(app, 'date_of_birth', 'dob', 'birthdate', 'dateOfBirth')} />
            <FieldCard label="Civil Status" value={getField(app, 'civil_status', 'civilStatus')} />
            <FieldCard label="Mobile" value={app.mobile || app.phone} />
            <FieldCard label="Email" value={app.email} />
            <FieldCard label="TIN" value={getField(app, 'tin', 'TIN')} />
          </div>
        </div>

        {/* Address */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Address</p>
          <div className="grid grid-cols-1 gap-2">
            <FieldCard label="Present Address" value={presentAddr} />
            <FieldCard label="Permanent Address" value={permanentAddr} />
          </div>
        </div>

        {/* Employment / Financial */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Employment / Financial</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <FieldCard label="Employment Status" value={getField(app, 'employmentStatus', 'employment_status')} />
            <FieldCard label="Employer / Business Name" value={getField(app, 'employer', 'employerName', 'employer_name', 'businessName', 'business_name', 'borrower_business_name')} />
            <FieldCard label="Monthly Income" value={getField(app, 'monthlyIncome', 'monthly_income', 'income') ? formatCurrency(getField(app, 'monthlyIncome', 'monthly_income', 'income')) : null} />
            <FieldCard label="Length of Employment" value={getField(app, 'lengthOfEmployment', 'length_of_employment', 'yearsEmployed', 'years_employed')} />
            <FieldCard label="Position" value={getField(app, 'position', 'jobTitle', 'job_title')} />
          </div>
        </div>

        {/* Spouse / Co-borrower */}
        {spouseName && (
          <div>
            <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Spouse / Co-borrower</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <FieldCard label="Name" value={spouseName} />
              <FieldCard label="Mobile" value={getField(app, 'spouseMobile', 'spouse_mobile', 'coBorrowerMobile', 'co_borrower_mobile')} />
              <FieldCard label="Employer" value={getField(app, 'spouseEmployer', 'spouse_employer', 'coBorrowerEmployer', 'co_borrower_employer')} />
              <FieldCard label="Income" value={getField(app, 'spouseIncome', 'spouse_income', 'coBorrowerIncome', 'co_borrower_income') ? formatCurrency(getField(app, 'spouseIncome', 'spouse_income', 'coBorrowerIncome', 'co_borrower_income')) : null} />
            </div>
          </div>
        )}

        {/* Personal References */}
        {refs.length > 0 && (
          <div>
            <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Personal References</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {refs.map((ref, i) => (
                <FieldCard
                  key={i}
                  label={`Reference ${String.fromCharCode(65 + i)}`}
                  value={`${ref.name}${ref.relationship ? ` (${ref.relationship})` : ''}${ref.contact ? ` — ${ref.contact}` : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loan Details */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Loan Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <FieldCard label="Loan Type" value={loanType.toUpperCase()} />
            <FieldCard label="Amount" value={formatCurrency(app.loan_amount || app.amount)} />
            <FieldCard label="Term" value={getField(app, 'term', 'loan_term') ? `${getField(app, 'term', 'loan_term')} months` : null} />
            <FieldCard label="Purpose" value={getField(app, 'loan_purpose', 'loanPurpose', 'purpose')} />
          </div>
        </div>

        {/* Group members */}
        {isGroup && members.length > 0 && (
          <div>
            <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Group Members ({members.length})</p>
            <div className="space-y-2">
              {members.map((member, idx) => (
                <Section
                  key={idx}
                  title={`Member ${idx + 1}: ${member.first_name || member.firstName || ''} ${member.last_name || member.lastName || ''}`}
                  collapsible
                  defaultOpen={false}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-4">
                    {Object.entries(member).map(([k, v]) => (
                      <FieldCard key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()} value={String(v || '—')} />
                    ))}
                  </div>
                </Section>
              ))}
            </div>
          </div>
        )}

        {/* View Documents Button */}
        <div>
          <button
            onClick={() => onViewDocuments?.()}
            className="flex items-center gap-2 text-sm text-blue/60 hover:text-blue transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            View Documents
          </button>
        </div>
      </div>
    </Section>
  )
}

// --- File Viewer Modal ---

function FileViewerModal({ appId, onClose }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchFiles = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await adminFetch(`/applications/${appId}/files`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || data.error || 'Failed to load files')
        if (cancelled) return
        const list = Array.isArray(data) ? data : data.files || data.data || []
        setFiles(list)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchFiles()
    return () => { cancelled = true }
  }, [appId])

  const isImage = (url, name) => {
    const str = (name || url || '').toLowerCase()
    return /\.(jpg|jpeg|png|gif|webp)/.test(str) || /image\//.test(str)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-white font-bold text-lg">Documents</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-green border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/7 border border-red-500/21 rounded-lg">
              <p className="text-red-400/70 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <p className="text-muted text-sm text-center py-8">No documents found for this application.</p>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="space-y-4">
              {files.map((f, i) => {
                const rawField = f.field || f.fieldName || f.field_name || f.label || ''
                const FIELD_LABELS = {
                  validIdFront: 'Valid ID — Front', validIdBack: 'Valid ID — Back',
                  validId: 'Valid Government ID',
                  barangayClearance: 'Barangay Clearance',
                  payslip: 'Payslip', coe: 'Certificate of Employment (COE)',
                  payslipCoe: 'Payslip + COE',
                  proofOfBilling: 'Proof of Billing',
                  proofOfIncome: 'Proof of Income',
                  businessPermitBarangay: 'Business Permit — Barangay',
                  businessPermit: 'Business Permit', dtiPermit: 'DTI Permit',
                  dtiRegistration: 'DTI Registration',
                  suppliersCustomersList: 'List of 3 Suppliers / Customers',
                  certificateOfNoClaim: 'Certificate of No Claim',
                  sblApplicationForm: 'SBL Application Form',
                  proofOfResidency: 'Proof of Residency',
                  latestItr: 'Latest ITR', bankStatement: 'Bank Statement',
                  prcId: 'PRC ID', companyId: 'Company ID',
                }
                const label = FIELD_LABELS[rawField]
                  || (rawField.startsWith('member_') ? rawField.replace(/member_(\d+)_file_(\d+)/, 'Member $1 — File $2') : null)
                  || rawField
                  || `File ${i + 1}`
                const name = f.filename || f.originalname || f.name || ''
                const url = f.url || f.signed_url || f.signedUrl || ''

                return (
                  <div key={i} className="bg-surface-alt border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-muted text-xs">{label}</p>
                        <p className="text-white text-sm">{name || 'Document'}</p>
                      </div>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue/60 hover:text-blue transition-colors shrink-0 ml-3"
                        >
                          Open in new tab ↗
                        </a>
                      )}
                    </div>
                    {url && isImage(url, name) && (
                      <div className="px-4 pb-4">
                        <img
                          src={url}
                          alt={name || label}
                          className="max-w-full max-h-96 rounded-lg border border-border object-contain mx-auto"
                        />
                      </div>
                    )}
                    {url && !isImage(url, name) && (
                      <div className="px-4 pb-4">
                        <iframe
                          src={url}
                          title={name || label}
                          className="w-full h-96 rounded-lg border border-border bg-white"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Section 2: FinScore Result ---

function FinScoreSection({ finscoreRaw, finscoreNorm }) {
  const unavailable = !finscoreRaw || finscoreRaw <= 0

  return (
    <Section title="Section 2 — FinScore Result">
      <div className="pt-4">
        {unavailable ? (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Raw Score" value="Not Available" />
              <Field label="Normalized" value="0 / 100" />
            </div>
            <div className="bg-amber-500/7 border border-amber-500/21 rounded-lg p-3 flex items-center gap-2">
              <span className="text-amber-400/70 text-lg">⚠</span>
              <span className="text-amber-400/70 text-sm">FinScore unavailable — CI carries full weight on 50pts max</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <Field label="Raw Score" value={finscoreRaw} />
              <Field label="Normalized" value={`${finscoreNorm} / 100`} />
              <Field label="Contributes" value={`${Math.round(finscoreNorm * 0.5 * 10) / 10} / 50 pts to final`} />
            </div>
            <div className="bg-surface-alt rounded-lg p-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted">FinScore Normalized</span>
                <span className="text-blue/60">{finscoreNorm} / 100</span>
              </div>
              <div className="h-3 bg-canvas rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue rounded-full transition-all duration-300"
                  style={{ width: `${finscoreNorm}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// --- Section 4: Decision ---

function DecisionSection({ app, id, effectiveTier, effectiveFinal, tierConfig, onRefresh }) {
  const [adjustedAmount, setAdjustedAmount] = useState(String(app.loan_amount || app.amount || ''))
  const [adjustedTerm, setAdjustedTerm] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const addToast = useToast()
  const fullName = `${app.firstName || app.first_name || ''} ${app.lastName || app.last_name || ''}`.trim()
  const isDecided = app.status !== 'pending'

  const executeAction = async (endpoint, body = {}) => {
    if (actionLoading) return
    setActionLoading(true)
    const isApprove = endpoint === 'approve'
    let keepLoading = false
    try {
      const res = await adminFetch(`/applications/${id}/${endpoint}`, {
        method: 'PATCH',
        body: JSON.stringify({ reviewed_by: app.reviewed_by || undefined, ...body }),
        timeoutMs: isApprove ? 60000 : undefined,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || `Failed to ${endpoint}`)
      if (isApprove) {
        const borrowerId = data.borrowerId || data.borrower_id || data.application?.borrower_id || data.application?.loandisk_borrower_id
        addToast(borrowerId ? `Application approved · Borrower #${borrowerId}` : 'Application approved')
      } else {
        addToast(`Application ${endpoint}d`)
      }
      await onRefresh()
    } catch (err) {
      if (isApprove && err.name === 'AbortError') {
        keepLoading = true
        addToast('Approval is taking longer than expected. Refreshing status…', 'info')
        setTimeout(async () => {
          try {
            const latest = await onRefresh()
            const bid = latest?.borrower_id || latest?.loandisk_borrower_id
            if (latest?.status === 'approved' && bid) {
              addToast(`Application approved · Borrower #${bid}`)
            } else {
              addToast('Status unchanged. Retrying may create a duplicate borrower — verify in Loandisk before retrying.', 'error')
            }
          } finally {
            setActionLoading(false)
          }
        }, 5000)
        return
      }
      addToast(err.message || `Failed to ${endpoint}`, 'error')
    } finally {
      if (!keepLoading) setActionLoading(false)
    }
  }

  const confirmAction = (title, message, label, cls, action, loadingLabel) => {
    setConfirmModal({ title, message, confirmLabel: label, confirmClass: cls, action, loadingLabel })
  }

  const executeConfirm = async () => {
    if (confirmModal?.action) await confirmModal.action()
    setConfirmModal(null)
  }

  const inputCls = 'w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none'

  return (
    <Section title="Section 4 — Decision">
      <div className="pt-4">
        {confirmModal && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            confirmLabel={confirmModal.confirmLabel}
            confirmClass={confirmModal.confirmClass}
            loading={actionLoading}
            loadingLabel={confirmModal.loadingLabel}
            onConfirm={executeConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}

        {/* Already decided */}
        {isDecided ? (
          <div className="space-y-4">
            <div className={`border rounded-lg p-4 ${
              app.status === 'approved' ? 'bg-green/6 border-green/18' : 'bg-red-500/7 border-red-500/21'
            }`}>
              <p className={`text-lg font-bold ${app.status === 'approved' ? 'text-green/60' : 'text-red-400/70'}`}>
                {app.status === 'approved' ? 'APPROVED' : 'DECLINED'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Final Score" value={effectiveFinal != null ? `${effectiveFinal} / 100` : '—'} />
              <Field label="Tier" value={<Badge label={tierConfig.label} colorClass={tierConfig.badgeClass} />} />
              <Field label="Status" value={<Badge label={app.status} colorClass={app.status === 'approved' ? 'bg-green/12 text-green/60' : 'bg-red-500/14 text-red-400/70'} />} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {app.reviewed_by && <Field label="Reviewed By" value={app.reviewed_by} />}
              {app.reviewed_at && <Field label="Reviewed At" value={formatDate(app.reviewed_at)} />}
              {app.borrower_id && <Field label="Loandisk Borrower ID" value={app.borrower_id} />}
            </div>
          </div>
        ) : (
          <div>
            {/* Recommendation banner */}
            <div className={`border rounded-lg p-4 mb-5 ${tierConfig.bgClass}`}>
              <p className={`text-sm font-medium ${tierConfig.textClass}`}>{tierConfig.recommendation}</p>
            </div>

            {/* Tier-specific actions */}
            {effectiveTier === 'approved' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => confirmAction('Approve Application', `Are you sure you want to approve this application for ${fullName}?`, 'Approve', 'bg-green hover:bg-green-hover text-white', () => executeAction('approve'), 'Approving… up to a minute')}
                  disabled={actionLoading}
                  className="bg-green hover:bg-green-hover text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >{actionLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Approving…
                  </span>
                ) : 'Approve'}</button>
                <button
                  onClick={() => confirmAction('Decline Application', `Are you sure you want to decline this application for ${fullName}?`, 'Decline', 'bg-red-500 hover:bg-red-600 text-white', () => executeAction('decline'))}
                  disabled={actionLoading}
                  className="border border-red-500 text-red-400 hover:bg-red-500/10 font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >Decline</button>
              </div>
            )}

            {effectiveTier === 'tier_b' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted text-xs block mb-1.5">Adjusted Amount (₱)</label>
                    <input type="number" value={adjustedAmount} onChange={(e) => setAdjustedAmount(e.target.value)} className={inputCls} placeholder="e.g. 20000" />
                  </div>
                  <div>
                    <label className="text-muted text-xs block mb-1.5">Adjusted Term (months)</label>
                    <input type="number" value={adjustedTerm} onChange={(e) => setAdjustedTerm(e.target.value)} className={inputCls} placeholder="e.g. 6" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (!adjustedAmount && !adjustedTerm) { addToast('Enter adjusted amount or term', 'error'); return }
                      confirmAction(
                        'Approve with Adjustments',
                        `Approve with adjusted terms for ${fullName}? ${adjustedAmount ? 'Amount: ₱' + Number(adjustedAmount).toLocaleString() : ''} ${adjustedTerm ? 'Term: ' + adjustedTerm + ' months' : ''}`,
                        'Approve with Adjustments', 'bg-amber-500 hover:bg-amber-600 text-white',
                        () => executeAction('approve', { adjusted_amount: adjustedAmount ? Number(adjustedAmount) : undefined, adjusted_term: adjustedTerm ? Number(adjustedTerm) : undefined }),
                        'Approving… up to a minute'
                      )
                    }}
                    disabled={actionLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >Approve with Adjustments</button>
                  <button
                    onClick={() => confirmAction('Decline Application', `Are you sure you want to decline this application for ${fullName}?`, 'Decline', 'bg-red-500 hover:bg-red-600 text-white', () => executeAction('decline'))}
                    disabled={actionLoading}
                    className="border border-red-500 text-red-400 hover:bg-red-500/10 font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >Decline</button>
                </div>
              </div>
            )}

            {effectiveTier === 'declined' && (
              <div className="flex flex-wrap gap-3 items-start">
                <button
                  onClick={() => confirmAction('Decline Application', `Are you sure you want to decline this application for ${fullName}?`, 'Decline', 'bg-red-500 hover:bg-red-600 text-white', () => executeAction('decline'))}
                  disabled={actionLoading}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >Decline</button>
                <div className="flex flex-col items-start gap-1">
                  <button
                    onClick={() => confirmAction('Override: Approve', `Override approval for ${fullName}? This requires supervisor approval.`, 'Override Approve', 'bg-gray-500 hover:bg-gray-600 text-white', () => executeAction('approve', { override: true }), 'Approving… up to a minute')}
                    disabled={actionLoading}
                    className="border border-gray-500 text-gray-400 hover:bg-gray-500/10 font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >Override Approve</button>
                  <span className="text-xs text-amber-400/70">Override requires supervisor approval</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  )
}

// --- Activity Log ---

function ActivityLog({ app, finscoreRaw, finscoreNorm, effectiveFinal, effectiveTier }) {
  return (
    <Section title="Activity Log">
      <div className="pt-4">
        <div className="space-y-3">
          {(app.submitted_at || app.created_at) && (
            <LogEntry color="bg-blue/60" text="Application received" date={formatDate(app.submitted_at || app.created_at)} />
          )}
          {finscoreRaw > 0 && (
            <LogEntry color="bg-blue/60" text={`FinScore calculated: ${finscoreRaw} (normalized: ${finscoreNorm})`} />
          )}
          {app.ci_score != null && (
            <LogEntry
              color="bg-green/60"
              text={`CI submitted: ${app.ci_score}/50${app.reviewed_by ? ` by ${app.reviewed_by}` : ''}`}
              date={app.reviewed_at ? formatDate(app.reviewed_at) : null}
              note={app.notes || app.ci_notes}
            />
          )}
          {app.ci_score != null && effectiveFinal != null && (
            <LogEntry
              color={effectiveTier === 'approved' ? 'bg-green/60' : effectiveTier === 'tier_b' ? 'bg-amber-500/70' : 'bg-red-500/70'}
              text={`Final Score: ${effectiveFinal} → Tier: ${TIER_CONFIG[effectiveTier]?.label || effectiveTier}`}
            />
          )}
          {app.status !== 'pending' && (
            <LogEntry
              color={app.status === 'approved' ? 'bg-green/60' : 'bg-red-500/70'}
              text={`Application ${app.status}${app.reviewed_by ? ` by ${app.reviewed_by}` : ''}`}
              date={app.reviewed_at ? formatDate(app.reviewed_at) : null}
            />
          )}
        </div>
      </div>
    </Section>
  )
}

function LogEntry({ color, text, date, note }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full ${color} mt-1.5 shrink-0`} />
      <div>
        <p className="text-white text-sm">{text}</p>
        {date && <p className="text-muted text-xs">{date}</p>}
        {note && <p className="text-muted text-xs mt-0.5">Notes: {note}</p>}
      </div>
    </div>
  )
}

// --- Main Component ---

export default function ApplicationDetail({ id, onBack }) {
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFileViewer, setShowFileViewer] = useState(false)
  const addToast = useToast()
  const { hasRole } = useAuth()
  const isCiRole = hasRole('ci_officer')

  const fetchApp = async () => {
    try {
      setLoading(true)
      const [adminRes, pipelineRes] = await Promise.all([
        adminFetch(`/applications/${id}`),
        pipelineFetch(`/${id}`).catch(() => null),
      ])
      if (!adminRes.ok) throw new Error('Failed to fetch application')
      const adminData = await adminRes.json()
      const appData = adminData.application || adminData

      // Merge SO fields from pipeline endpoint if admin endpoint doesn't have them
      if (pipelineRes?.ok) {
        const pipelineData = await pipelineRes.json().catch(() => ({}))
        const pd = pipelineData.application || pipelineData
        if (!appData.assigned_sales_officer_name && pd.assigned_sales_officer_name) {
          appData.assigned_sales_officer_name = pd.assigned_sales_officer_name
        }
        if (!appData.assigned_sales_officer && pd.assigned_sales_officer) {
          appData.assigned_sales_officer = pd.assigned_sales_officer
        }
      }

      setApp(appData)
      setError(null)
      return appData
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApp() }, [id])

  const finscoreRaw = app ? Number(app.finscore_raw || app.finscore || 0) : 0
  const finscoreNorm = useMemo(() => normalizeFinScore(finscoreRaw), [finscoreRaw])

  const storedFinal = app?.ci_score != null ? computeFinalFromCiTotal(finscoreNorm, app.ci_score) : null
  const storedTier = storedFinal != null ? getTier(storedFinal) : null
  const effectiveTier = app?.tier || storedTier
  const effectiveFinal = app?.final_score != null ? app.final_score : storedFinal
  const tierConfig = TIER_CONFIG[effectiveTier] || TIER_CONFIG.declined

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchApp} className="text-green hover:text-green-hover text-sm">Retry</button>
      </div>
    )
  }

  if (!app) return null

  const isPending = app.status === 'pending'
  const hasCiScore = app.ci_score != null
  const showCiForm = isPending && !hasCiScore

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-muted hover:text-white text-sm mb-6 transition-colors">
        ← Back to Applications
      </button>

      <div className="flex flex-col gap-5">
        {/* SECTION 1 — Application Summary */}
        <ApplicationSummary app={app} appId={id} onViewDocuments={() => setShowFileViewer(true)} onRefresh={fetchApp} />

        {/* SECTION 2 — FinScore Result */}
        <FinScoreSection finscoreRaw={finscoreRaw} finscoreNorm={finscoreNorm} />

        {/* SECTION 3 — CI Assessment Form */}
        {showCiForm && (
          <Section title="Section 3 — CI Assessment Form" collapsible defaultOpen={isCiRole}>
            <div className="pt-4">
              <CiScoringForm
                app={app}
                appId={id}
                finscoreRaw={finscoreRaw}
                finscoreNorm={finscoreNorm}
                onSubmitSuccess={fetchApp}
              />
            </div>
          </Section>
        )}

        {/* CI Form Read-Only (after submission) */}
        {hasCiScore && (app.ci_form_data || app.ci_form) && (
          <Section title="Section 3 — CI Assessment (Submitted)" collapsible defaultOpen={false}>
            <div className="pt-4">
              <CiFormReadOnly ciFormData={app.ci_form_data || app.ci_form} />
            </div>
          </Section>
        )}

        {/* SO Confirmation section — only in approver stage */}
        {app.stage === 'approver' && (
          <Section title="Sales Officer Confirmation" collapsible defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {app.so_confirmation_sent_at && (
                <FieldCard
                  label="Confirmation Sent"
                  value={formatDate(app.so_confirmation_sent_at)}
                />
              )}
              {app.so_decision && (
                <>
                  <FieldCard
                    label="SO Decision"
                    value={app.so_decision === 'confirm' ? 'Confirmed' : 'Declined'}
                  />
                  {app.so_decision_at && (
                    <FieldCard
                      label="Decision Date"
                      value={formatDate(app.so_decision_at)}
                    />
                  )}
                </>
              )}
              {!app.so_confirmation_sent_at && (
                <div className="col-span-full">
                  <p className="text-muted text-sm">No confirmation request sent yet.</p>
                </div>
              )}
              {app.so_confirmation_sent_at && !app.so_decision && (
                <div className="col-span-full">
                  <span className="text-yellow-400/70 text-sm animate-pulse">Awaiting sales officer response…</span>
                </div>
              )}
              {app.returned_count > 0 && (
                <FieldCard
                  label="Times Returned"
                  value={String(app.returned_count)}
                />
              )}
            </div>
          </Section>
        )}

        {/* SECTION 4 — Decision */}
        {hasCiScore ? (
          <DecisionSection
            app={app}
            id={id}
            effectiveTier={effectiveTier}
            effectiveFinal={effectiveFinal}
            tierConfig={tierConfig}
            onRefresh={fetchApp}
          />
        ) : (
          <Section title="Section 4 — Decision">
            <div className="pt-4">
              <div className="bg-surface-alt rounded-lg p-6 text-center">
                <p className="text-muted text-sm">Awaiting CI Assessment</p>
                <p className="text-muted/60 text-xs mt-1">Complete the CI form above to unlock the decision panel</p>
              </div>
            </div>
          </Section>
        )}

        {/* Activity Log */}
        <ActivityLog
          app={app}
          finscoreRaw={finscoreRaw}
          finscoreNorm={finscoreNorm}
          effectiveFinal={effectiveFinal}
          effectiveTier={effectiveTier}
        />
      </div>

      {/* File Viewer Modal — fetches fresh signed URLs each time */}
      {showFileViewer && (
        <FileViewerModal appId={id} onClose={() => setShowFileViewer(false)} />
      )}
    </div>
  )
}
