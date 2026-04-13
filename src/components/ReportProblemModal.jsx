import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function ReportProblemModal({ onClose }) {
  const { getToken } = useAuth()
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef(null)
  const page = window.location.pathname

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  // Auto-close on success
  useEffect(() => {
    if (!success) return
    const t = setTimeout(onClose, 2000)
    return () => clearTimeout(t)
  }, [success, onClose])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    setFileError(null)
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File exceeds 5MB limit')
      e.target.value = ''
      return
    }
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setScreenshot(null)
    setPreview(null)
    setFileError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('page', page)
      fd.append('description', description.trim())
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
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const valid = description.trim().length >= 10

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/7 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4.5 h-4.5 text-amber-400/70">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-base">Report a Problem</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green/12 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-green/60">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-white font-medium">Report submitted.</p>
              <p className="text-muted text-sm mt-1">Thank you — we'll look into this.</p>
            </div>
          ) : (
            <>
              {/* Page */}
              <div>
                <label className="text-muted text-xs block mb-1.5">Page</label>
                <div className="bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-sm text-muted font-mono">
                  {page}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-muted text-xs block mb-1.5">
                  Description <span className="text-red-400/70">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted resize-none focus:border-green/50 focus:ring-1 focus:ring-green/30 outline-none"
                />
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${description.trim().length < 10 ? 'text-muted' : 'text-green/60'}`}>
                    {description.trim().length < 10 ? `${10 - description.trim().length} more characters needed` : 'Looks good'}
                  </span>
                  <span className="text-xs text-muted">{description.length}</span>
                </div>
              </div>

              {/* Screenshot */}
              <div>
                <label className="text-muted text-xs block mb-1.5">Screenshot (optional)</label>
                {!screenshot ? (
                  <div>
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
                      className="w-full border border-dashed border-border rounded-lg px-4 py-4 text-sm text-muted hover:border-muted hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                      Attach screenshot
                    </button>
                    {fileError && (
                      <p className="text-red-400/70 text-xs mt-1.5">{fileError}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-surface-alt border border-border rounded-lg p-3 flex items-center gap-3">
                    <img src={preview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{screenshot.name}</p>
                      <p className="text-muted text-xs">{(screenshot.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-muted hover:text-red-400/70 transition-colors shrink-0"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/7 border border-red-500/21 rounded-lg p-3">
                  <p className="text-red-400/70 text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm text-muted hover:text-white border border-border rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!valid || submitting}
                  className="px-5 py-2.5 bg-green hover:bg-green-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Submit Report
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
