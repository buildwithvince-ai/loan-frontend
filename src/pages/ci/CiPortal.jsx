import { useState, useCallback, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CiApplicationsList from './CiApplicationsList'
import CiAssessmentForm from './CiAssessmentForm'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'
const CI_API = `${API_BASE}/api/ci`

const ToastContext = createContext()
export const useCiToast = () => useContext(ToastContext)

// CI API helper — uses JWT token for auth
let _getToken = () => null

export function ciFetch(path, options = {}) {
  const token = _getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(`${CI_API}${path}`, { ...options, headers })
}

function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in-up flex items-center gap-2 max-w-sm ${
            t.type === 'success' ? 'bg-green/90 text-white'
            : t.type === 'error' ? 'bg-red-500/90 text-white'
            : 'bg-surface-alt text-white'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="text-white/70 hover:text-white">✕</button>
        </div>
      ))}
    </div>
  )
}

export default function CiPortal() {
  const { logout, getToken, fullName } = useAuth()
  const navigate = useNavigate()

  // Wire up module-level _getToken so ciFetch can access JWT
  _getToken = getToken

  const [view, setView] = useState('list')
  const [selectedApp, setSelectedApp] = useState(null)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const openForm = (app) => {
    setSelectedApp(app)
    setView('form')
  }

  const backToList = () => {
    setView('list')
    setSelectedApp(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <ToastContext.Provider value={addToast}>
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-canvas">
        <header className="bg-surface border-b border-border sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/gr8logo.png" alt="GR8" className="w-8 h-8 opacity-80" />
              <div className="hidden sm:block">
                <span className="text-white font-bold text-sm">GR8 Lending</span>
                <span className="text-green text-xs font-medium ml-2">CI Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {fullName && (
                <span className="text-sm text-muted hidden sm:inline">{fullName}</span>
              )}
              <button onClick={handleLogout} className="text-sm text-muted hover:text-red-400 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {view === 'list' ? (
            <CiApplicationsList onStartAssessment={openForm} />
          ) : (
            <CiAssessmentForm app={selectedApp} onBack={backToList} />
          )}
        </main>
      </div>
    </ToastContext.Provider>
  )
}
