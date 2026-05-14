import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { registerLogoutHandler } from '../utils/apiFetch'

const TOKEN_KEY = 'moviesbox_token'
const API_BASE = 'https://moviesboxbackend.onrender.com/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)

  const forceLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    // Clear any pending watch progress entries on logout
    Object.keys(localStorage)
      .filter(key => key.startsWith('watch_progress_'))
      .forEach(key => localStorage.removeItem(key))
    setUser(null)
  }, [])

  // Global 401 handler register karo
  useEffect(() => {
    registerLogoutHandler(forceLogout)
  }, [forceLogout])

  // Sirf page open/refresh pe check karo
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setUser(null); return }
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.status === 401) { forceLogout(); return null }
        return res.json()
      })
      .then(data => { if (data) setUser(data.user || null) })
      .catch(() => forceLogout())
  }, [forceLogout])

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    } catch (_) {}
    forceLogout()
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, forceLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
