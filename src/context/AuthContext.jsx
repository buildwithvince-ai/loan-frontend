import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://loan-backend-production-cd45.up.railway.app'

// Priority order for redirect after login — first match wins
const ROLE_PRIORITY = [
  'super_admin', 'admin', 'approver', 'verifier',
  'ci_officer', 'loan_processing_officer', 'sales_officer',
]

function normalizeRoles(userData) {
  if (Array.isArray(userData.roles) && userData.roles.length) return userData.roles
  if (userData.role) return [userData.role]
  return []
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [roles, setRoles] = useState([])
  const [fullName, setFullName] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, try to restore session from a stored refresh token if available
  useEffect(() => {
    // No persistent session — JWT is memory-only
    // If user refreshes the page, they must login again
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Login failed')
    }
    const userRoles = normalizeRoles(data.user)
    setToken(data.token)
    setUser(data.user)
    setRoles(userRoles)
    setFullName(data.user.full_name)
    return { ...data.user, roles: userRoles }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch {
      // Logout even if API call fails
    }
    setToken(null)
    setUser(null)
    setRoles([])
    setFullName(null)
  }, [token])

  const getToken = useCallback(() => token, [token])

  // Convenience: primary role = highest priority role the user holds
  const primaryRole = ROLE_PRIORITY.find((r) => roles.includes(r)) || roles[0] || null

  const value = {
    user,
    roles,
    primaryRole,
    hasRole: (r) => roles.includes(r),
    hasAnyRole: (list) => list.some((r) => roles.includes(r)),
    fullName,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    getToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
