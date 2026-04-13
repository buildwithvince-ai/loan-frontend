import { useState, useCallback, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import CiApplicationsList from './CiApplicationsList'
import CiAssessmentForm from './CiAssessmentForm'
import ReportProblemButton from '../../components/ReportProblemButton'

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
  const { isDark, toggleTheme } = useTheme()
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
      <div className={`min-h-screen bg-canvas ${isDark ? '' : 'light-mode'}`}>
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
              <button
                onClick={toggleTheme}
                className="text-muted hover:text-white transition-colors p-1"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
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
      <ReportProblemButton />
    </ToastContext.Provider>
  )
}
