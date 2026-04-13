import { useState } from 'react'
import ReportProblemModal from './ReportProblemModal'

export default function ReportProblemButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-full text-sm text-muted hover:text-white hover:border-amber-500/30 shadow-lg shadow-black/40 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-amber-400/70">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
        </svg>
        Report a Problem
      </button>
      {open && <ReportProblemModal onClose={() => setOpen(false)} />}
    </>
  )
}
