import { Link } from 'react-router-dom'
import { useEffect } from 'react'

const SECTIONS = [
  { id: 'acceptance', num: 1, title: 'Acceptance of Terms' },
  { id: 'eligibility', num: 2, title: 'Eligibility' },
  { id: 'process', num: 3, title: 'Loan Application Process' },
  { id: 'data-privacy-consent', num: 4, title: 'Data Privacy and Third-Party Consent' },
  { id: 'data-privacy-act', num: 5, title: 'Data Privacy Act Compliance' },
  { id: 'documents', num: 6, title: 'Document Submission' },
  { id: 'credit-investigation', num: 7, title: 'Credit Investigation' },
  { id: 'liability', num: 8, title: 'Limitation of Liability' },
  { id: 'changes', num: 9, title: 'Changes to Terms' },
  { id: 'contact', num: 10, title: 'Contact Us' },
]

function SectionHeading({ id, num, title }) {
  return (
    <h2 id={id} className="text-xl font-semibold text-white mb-4 scroll-mt-28">
      <span className="text-green mr-2">Section {num}.</span>{title}
    </h2>
  )
}

export default function TermsAndConditions() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms and Conditions</h1>
          <p className="text-green font-semibold text-lg mb-1">GR8 Lending Corporation</p>
          <p className="text-muted text-sm mb-6">Last updated: March 2026</p>
          <p className="text-muted text-sm leading-relaxed max-w-xl mx-auto">
            Please read these terms carefully before submitting a loan application through our website.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-10">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Table of Contents</h3>
          <ol className="space-y-2">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={e => {
                    e.preventDefault()
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="text-blue hover:text-green text-sm transition-colors"
                >
                  {s.num}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-10 text-muted text-sm leading-relaxed">
          {/* Section 1 */}
          <section>
            <SectionHeading id="acceptance" num={1} title="Acceptance of Terms" />
            <p>
              By accessing gr8lendingcorporation.com and submitting a loan application, you agree to be bound by these
              Terms and Conditions. If you do not agree, please do not use this website.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <SectionHeading id="eligibility" num={2} title="Eligibility" />
            <p className="mb-3">To apply for a loan through this website, you must:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Be a Filipino citizen or permanent resident</li>
              <li>Be between 21 and 65 years of age</li>
              <li>Have a valid government-issued ID</li>
              <li>Meet the minimum income requirements for your chosen loan product</li>
              <li>Have a registered Philippine mobile number</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <SectionHeading id="process" num={3} title="Loan Application Process" />
            <p>
              Submitting an application does not guarantee loan approval. All applications are subject to credit
              evaluation, document verification, and the sole discretion of GR8 Lending Corporation. We reserve the
              right to approve, decline, or adjust loan amounts and terms based on our credit assessment.
            </p>
          </section>

          {/* Section 4 — FinScore consent block */}
          <section>
            <SectionHeading id="data-privacy-consent" num={4} title="Data Privacy and Third-Party Consent" />
            <div className="bg-surface border-2 border-green/30 rounded-2xl p-6 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-green shrink-0">
                  <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-green font-semibold text-sm uppercase tracking-wider">Required Consent — FinScore Data Privacy</span>
              </div>
              <div className="text-muted text-sm leading-relaxed space-y-4">
                <p>
                  &ldquo;The Applicant agrees that GR8 LENDING CORPORATION, directly or through its Partners, may
                  collect, retrieve, process, use and store his/her personal data such as name, age, photographs,
                  fingerprints, other biometric data (e.g., facial recognition and voice recognition), e-mail address,
                  mobile number/s, mobile phone usage data (including but not limited to statistics about outgoing calls,
                  outgoing SMSs, consumed Mobile data, top-up patterns, purchase of packages, SIM-related metrics like
                  activation date and subscription type and statistics about the contacts the applicant may communicate
                  to), employment details, income, financial data, financial profile, credit standing, loan payment
                  history, and other information required in the application form for the purpose of reviewing and
                  processing the Applicant&rsquo;s loan application.
                </p>
                <p>
                  The Applicant consents to the collection of his/her personal data from the Applicant her/himself, or
                  from other personal information controllers such as, but not limited to, telecommunications companies,
                  private and public credit bureaus and credit information providers, for credit scoring purposes. The
                  Applicant&rsquo;s personal data such as mobile number, email address, TIN, SSS, GSIS, identity
                  documentation and address, will be shared to a credit scoring service provider for credit
                  investigation, credit scoring, data analytics, and data profiling, which includes the regular updating
                  of the Applicant&rsquo;s credit score. The personal data secured may also be used for direct marketing
                  of products and services of Partners.
                </p>
                <p>
                  Throughout the processing of the Applicant&rsquo;s personal data, his/her rights under the Data
                  Privacy Act of 2012, such as the (1) right to be informed, (2) right to object, (3) right to access,
                  (4) right to rectification, (5) right to erasure or blocking, and (6) right to damages, shall be
                  upheld. Entities to whom we share your data will also respect the same rights.&rdquo;
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <SectionHeading id="data-privacy-act" num={5} title="Data Privacy Act Compliance" />
            <p>
              GR8 Lending Corporation is committed to protecting your personal information in accordance with Republic
              Act 10173, also known as the Data Privacy Act of 2012. Your personal data is collected solely for the
              purpose of processing your loan application and will not be sold to third parties outside of credit scoring
              and verification purposes.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <SectionHeading id="documents" num={6} title="Document Submission" />
            <p>
              All documents submitted through this website must be authentic and accurate. Submission of falsified or
              fraudulent documents is a violation of Philippine law and will result in automatic disqualification and may
              be subject to legal action.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <SectionHeading id="credit-investigation" num={7} title="Credit Investigation" />
            <p>
              By submitting an application, you authorize GR8 Lending Corporation and its accredited credit
              investigators to conduct a field credit investigation, verify your submitted information, and contact your
              provided personal references.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <SectionHeading id="liability" num={8} title="Limitation of Liability" />
            <p>
              GR8 Lending Corporation shall not be liable for any damages arising from the use of this website,
              including but not limited to technical errors, service interruptions, or unauthorized access beyond our
              reasonable control.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <SectionHeading id="changes" num={9} title="Changes to Terms" />
            <p>
              GR8 Lending Corporation reserves the right to update these Terms and Conditions at any time. Continued use
              of the website after changes are posted constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <SectionHeading id="contact" num={10} title="Contact Us" />
            <p className="mb-4">
              For questions or concerns regarding these Terms and Conditions or your personal data:
            </p>
            <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
              <p className="text-white font-semibold">GR8 Lending Corporation</p>
              <p>Website: <a href="https://gr8lendingcorporation.com" className="text-blue hover:text-green transition-colors">gr8lendingcorporation.com</a></p>
              <p>Email: <a href="mailto:info@gr8lendingcorporation.com" className="text-blue hover:text-green transition-colors">info@gr8lendingcorporation.com</a></p>
              <p>Phone: <a href="tel:09541804946" className="text-blue hover:text-green transition-colors">(0954) 180 4946</a></p>
              <p>Address: Malolos, Bulacan, Philippines</p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-green hover:bg-green-hover text-white font-semibold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-green/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
