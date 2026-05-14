import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiFetch, registerLogoutHandler } from '../utils/apiFetch'

const TOKEN_KEY = 'moviesbox_token'

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
    apiFetch('auth/me')
      .then(res => (res?.ok ? res.text() : null))
      .then(text => {
        if (!text) return
        const data = JSON.parse(text)
        setUser(data.user || null)
      })
      .catch(() => forceLogout())
  }, [forceLogout])

  const logout = async () => {
    try {
      await apiFetch('auth/logout', { method: 'POST' })
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
