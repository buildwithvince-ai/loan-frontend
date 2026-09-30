import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MIN_CHARS = 10

// Chat-style problem reporter docked bottom-right (large, never full page).
// Each sent message is one report: POST /api/reports/problem { page, description, screenshot? }.
export default function ReportProblemChat({ onClose }) {
  const { getToken, fullName } = useAuth()
  const [draft, setDraft] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // Thread of { from: 'staff' | 'system', text, image?, tone? }
  const [thread, setThread] = useState([])
  const fileRef = useRef(null)
  // Preview URLs stay alive while the thread shows them; all revoked on close.
  const previewUrls = useRef([])
  const inputRef = useRef(null)
  const endRef = useRef(null)
  const page = window.location.pathname
  const firstName = (fullName || '').trim().split(/\s+/)[0]

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const urls = previewUrls.current
    return () => urls.forEach(u => URL.revokeObjectURL(u))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [thread, submitting])

  const handleFile = e => {
    const file = e.target.files?.[0]
    setFileError(null)
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setFileError('Screenshot exceeds the 5MB limit')
      e.target.value = ''
      return
    }
    const url = URL.createObjectURL(file)
    previewUrls.current.push(url)
    setScreenshot(file)
    setPreview(url)
  }

  const clearFile = () => {
    setScreenshot(null)
    setPreview(null)
    setFileError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const text = draft.trim()
  const canSend = text.length >= MIN_CHARS && !submitting

  const handleSend = async e => {
    e?.preventDefault()
    if (!canSend) return
    setSubmitting(true)
    const sent = { from: 'staff', text, image: preview }
    setThread(t => [...t, sent])
    try {
      const fd = new FormData()
      fd.append('page', page)
      fd.append('description', text)
      if (screenshot) fd.append('screenshot', screenshot)

      const token = getToken()
      const res = await fetch(`${API_BASE}/api/reports/problem`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || 'Failed to submit report')
      }
      // Sent: clear the composer so the same report can't be re-sent by accident.
      setDraft('')
      clearFile()
      setThread(t => [
        ...t,
        { from: 'system', text: "Report received. Thank you, we'll look into it." },
      ])
    } catch (err) {
      // Not sent: keep the draft + screenshot so the user can retry.
      setThread(t => [
        ...t.slice(0, -1),
        { ...sent, failed: true },
        { from: 'system', tone: 'error', text: `${err.message}. Your message is still below.` },
      ])
    } finally {
      setSubmitting(false)
    }
  }

  const onComposerKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend(e)
  }

  return (
    <section
      role="dialog"
      aria-label="Report a Problem"
      className="report-chat fixed z-[70] flex flex-col bg-surface border border-border shadow-2xl shadow-black/40 overflow-hidden
        inset-x-3 bottom-3 top-16 rounded-2xl
        sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[440px] sm:h-[min(640px,calc(100dvh-48px))]"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
        <div className="w-9 h-9 rounded-full bg-amber-500/12 flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-4.5 h-4.5 text-amber-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-white font-medium text-[15px] leading-tight">Report a Problem</h2>
          <p className="text-muted text-xs truncate">
            Page <span className="font-mono">{page}</span> is attached automatically
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-muted hover:text-white hover:bg-surface-alt transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3" aria-live="polite">
        <Bubble from="system">
          {firstName ? `Hi ${firstName}. ` : 'Hi. '}What went wrong? Tell us what you were doing and
          what you expected to happen. A screenshot helps.
        </Bubble>
        {thread.map((m, i) => (
          <Bubble key={i} from={m.from} tone={m.tone} failed={m.failed}>
            {m.image && (
              <img
                src={m.image}
                alt="Attached screenshot"
                className="mb-2 max-h-40 rounded-lg object-cover"
              />
            )}
            {m.text}
          </Bubble>
        ))}
        {submitting && (
          <Bubble from="system">
            <span className="inline-flex gap-1" aria-label="Sending">
              <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:240ms]" />
            </span>
          </Bubble>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="border-t border-border p-3 shrink-0">
        {screenshot && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-surface-alt p-2 pr-3">
            <img src={preview} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm truncate">{screenshot.name}</p>
              <p className="text-muted text-xs">{(screenshot.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              onClick={() => clearFile()}
              aria-label="Remove screenshot"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
        {fileError && <p className="mb-2 px-1 text-red-400 text-xs">{fileError}</p>}

        <div className="flex items-end gap-2 rounded-2xl bg-surface-alt border border-border focus-within:border-muted/60 transition-colors p-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach screenshot"
            title="Attach screenshot (max 5MB)"
            className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-muted hover:text-white hover:bg-surface transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
              />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={onComposerKey}
            rows={3}
            placeholder="Describe the issue…"
            aria-label="Describe the issue"
            className="flex-1 min-w-0 max-h-40 resize-none bg-transparent py-2 text-sm text-white placeholder-muted outline-none"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send report"
            className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-green text-[#0A0F1E] hover:bg-green-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12h15m0 0-6.75-6.75M19.5 12l-6.75 6.75"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted">
          {text.length < MIN_CHARS
            ? `${MIN_CHARS - text.length} more characters needed`
            : 'Enter to send · Shift+Enter for a new line'}
        </p>
      </form>
    </section>
  )
}

function Bubble({ from, tone, failed, children }) {
  const mine = from === 'staff'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
          mine
            ? `bg-green/15 text-white rounded-br-md ${failed ? 'opacity-60' : ''}`
            : tone === 'error'
              ? 'bg-red-500/10 text-red-400 rounded-bl-md'
              : 'bg-surface-alt text-white rounded-bl-md'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
