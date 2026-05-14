import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { Component, useEffect, useCallback } from 'react'
import CustomCursor from './components/CustomCursor'
import Navbar from './components/Navbar'
import Loader from './components/Loader'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import BollywoodPage from './pages/BollywoodPage'
import HollywoodPage from './pages/HollywoodPage'
import AnimationPage from './pages/AnimationPage'
import SearchPage from './pages/SearchPage'
import AdminUsersPage from './pages/AdminUsersPage'
import MovieDetailPage from './pages/MovieDetailPage'
import ProductionHousePage from './pages/ProductionHousePage'
import GenrePage from './pages/GenrePage'
import PersonMoviesPage from './pages/PersonMoviesPage'
import CompanyMoviesPage from './pages/CompanyMoviesPage'
import MyListPage from './pages/MyListPage'
import ProfilePage from './pages/ProfilePage'
import { markSearchOpened } from './searchFocusFlags'
import SiteActiveTracker from './components/SiteActiveTracker'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e) { console.error('[ErrorBoundary]', e) }
  render() {
    if (this.state.error) return <div style={{ color: 'red', padding: 20 }}>{this.state.error.message}</div>
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CustomCursor />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Navigate to="/bollywood" replace />} />
                <Route path="/bollywood" element={<BollywoodPage />} />
                <Route path="/hollywood" element={<HollywoodPage />} />
                <Route path="/animation" element={<AnimationPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/admin" element={<AdminUsersPage />} />
                <Route path="/movie/:tmdbId" element={<MovieDetailPage />} />
                <Route path="/production-house/:category/:companyId" element={<ProductionHousePage />} />
                <Route path="/genre" element={<GenrePage />} />
                <Route path="/person" element={<PersonMoviesPage />} />
                <Route path="/company" element={<CompanyMoviesPage />} />
                <Route path="/my-list" element={<MyListPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/bollywood" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

function ProtectedRoute() {
  const { user } = useAuth()
  if (user === undefined) return <Loader />
  if (user === null) return <Navigate to="/auth" replace />
  return <Outlet />
}

function isTypingInField(el) {
  if (!el || !(el instanceof Element)) return false
  if (el.isContentEditable) return true
  const field = el.closest('input, textarea, select, [contenteditable="true"]')
  if (!field) return false
  if (field instanceof HTMLInputElement) {
    const t = field.type?.toLowerCase()
    if (t === 'checkbox' || t === 'radio' || t === 'button' || t === 'submit' || t === 'reset' || t === 'file') return false
  }
  return true
}

function isVideoPlaying() {
  const v = document.querySelector('video')
  return Boolean(v && !v.paused && v.readyState > 2)
}

function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const goToSearch = useCallback((seed = '') => {
    markSearchOpened(seed)
    navigate('/search', { state: { focusSearch: true, t: Date.now() } })
  }, [navigate])

  /** `/`, Ctrl/Cmd+K, or a letter key → search + focus (capture). Skip when typing in fields or video playing. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.defaultPrevented) return
      if (isVideoPlaying()) return

      const el = document.activeElement
      if (isTypingInField(el)) return

      const isModK = (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k'
      const isSlash =
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.repeat &&
        (e.key === '/' || e.code === 'Slash' || e.code === 'NumpadDivide')
      const isLetter =
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.repeat &&
        e.key.length === 1 &&
        /[a-zA-Z]/.test(e.key)

      if (isModK || isSlash) {
        e.preventDefault()
        e.stopPropagation()
        goToSearch('')
        return
      }
      if (isLetter) {
        e.preventDefault()
        e.stopPropagation()
        goToSearch(e.key)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [goToSearch])

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteActiveTracker user={user} />
      <Navbar user={user} onLogout={handleLogout} />
      <main><Outlet /></main>
    </div>
  )
}

export default App
