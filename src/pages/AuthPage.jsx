import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import fallbackBackdropUrl from '../assets/hero.png'

const TOKEN_KEY = 'moviesbox_token'
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
const AUTH_BG_CACHE_KEY = 'moviesbox_auth_backgrounds'
const FALLBACK_AUTH_BACKDROP = { id: 'fallback', backdrop_path: fallbackBackdropUrl, title: 'MoviesBox' }

const readCachedAuthBackgrounds = () => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(AUTH_BG_CACHE_KEY) || 'null')
    return Array.isArray(cached) && cached.length ? cached : null
  } catch {
    return null
  }
}

const cacheAuthBackgrounds = (results) => {
  try {
    sessionStorage.setItem(AUTH_BG_CACHE_KEY, JSON.stringify(results.slice(0, 10)))
  } catch {}
}

const preloadImage = (src) => new Promise((resolve, reject) => {
  if (!src) return reject(new Error('Missing image source'))
  const img = new Image()
  img.onload = resolve
  img.onerror = reject
  img.src = src
})

const collectSignupContext = () => {
  const nav = navigator
  const win = window
  const scr = win.screen
  const ua = nav.userAgent || ''
  let platform = ''
  if (/Windows/i.test(ua)) platform = 'Windows'
  else if (/Android/i.test(ua)) platform = 'Android'
  else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS'
  else if (/Mac/i.test(ua)) platform = 'macOS'
  else if (/Linux/i.test(ua)) platform = 'Linux'
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection
  const connectionStr = conn
    ? [conn.effectiveType, conn.downlink != null ? `downlink:${conn.downlink}` : ''].filter(Boolean).join(' ')
    : ''
  return {
    client: {
      userAgent: ua,
      platform,
      language: nav.language || '',
      languages: nav.languages ? [...nav.languages] : [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      screen: `${scr.width}x${scr.height}`,
      screenDetail: scr.availWidth && scr.availHeight ? `${scr.availWidth}x${scr.availHeight}` : '',
      deviceMemory: nav.deviceMemory != null ? String(nav.deviceMemory) : '',
      hardwareConcurrency: nav.hardwareConcurrency ?? null,
      touchPoints: nav.maxTouchPoints ?? null,
      vendor: nav.vendor || '',
      cookieEnabled: typeof nav.cookieEnabled === 'boolean' ? nav.cookieEnabled : null,
      online: nav.onLine ?? null,
      colorScheme: (() => {
        try {
          const m = win.matchMedia?.('(prefers-color-scheme: dark)')
          if (!m) return ''
          return m.matches ? 'dark' : 'light'
        } catch {
          return ''
        }
      })(),
      connection: connectionStr,
      referrer: document.referrer || '',
      pageUrl: win.location.href || '',
    },
    server: { ip: '', forwardedFor: '' },
  }
}

// Silently wake up the backend (Render cold start fix)
const warmUpBackend = async () => {
  try {
    await fetch(`${API_BASE}/health`, { method: 'GET', cache: 'no-store' })
  } catch {}
}

export default function AuthPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ fullName: '', identifier: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [serverReady, setServerReady] = useState(false)
  const [bgPosters, setBgPosters] = useState(() => readCachedAuthBackgrounds() || [FALLBACK_AUTH_BACKDROP])
  const [bgIndex, setBgIndex] = useState(0)

  // Wake up backend immediately on page load
  useEffect(() => {
    let alive = true
    const ping = async (attempt = 0) => {
      try {
        const controller = new AbortController()
        const t = window.setTimeout(() => controller.abort(), 8000)
        const res = await fetch(`${API_BASE}/health`, { method: 'GET', cache: 'no-store', signal: controller.signal })
        window.clearTimeout(t)
        if (alive && res.ok) setServerReady(true)
      } catch {
        if (alive && attempt < 5) {
          window.setTimeout(() => ping(attempt + 1), 3000)
        }
      }
    }
    ping()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let alive = true
    let retryTimer = null

    const loadBackgrounds = async (attempt = 0) => {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), attempt === 0 ? 15000 : 20000)

      try {
        const res = await fetch(`${API_BASE}/public/auth-backgrounds`, {
          signal: controller.signal,
          cache: 'default',
        })
        if (!res.ok) throw new Error('Background request failed')
        const data = await res.json()
        const results = Array.isArray(data.results)
          ? data.results.filter(item => item?.backdrop_path)
          : []

        if (!results.length || !alive) return

        setBgPosters(results)
        setBgIndex(0)
        cacheAuthBackgrounds(results)

        results.slice(0, 5).forEach(item => {
          preloadImage(item.backdrop_path).catch(() => {})
        })
      } catch (err) {
        if (alive && attempt < 3) {
          const delay = attempt === 0 ? 2000 : 5000
          retryTimer = window.setTimeout(() => loadBackgrounds(attempt + 1), delay)
        }
      } finally {
        window.clearTimeout(timeout)
      }
    }

    loadBackgrounds()

    return () => {
      alive = false
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    if (bgPosters.length <= 1) return
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgPosters.length)
    }, 6000) // Slightly faster rotation
    return () => clearInterval(interval)
  }, [bgPosters])

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('') // Clear error on change for better UX
  }

  const doAuthRequest = async (attempt = 0) => {
    const controller = new AbortController()
    // 30s timeout — enough for Render cold start + DB connect
    const timeout = window.setTimeout(() => controller.abort(), 30000)

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup'
      const signupContext = collectSignupContext()
      const payload =
        mode === 'login'
          ? { identifier: form.identifier.trim(), password: form.password, signupContext }
          : { fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, signupContext }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      const text = await res.text()
      let data = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error('Server responded with an invalid format')
      }

      if (!res.ok) throw new Error(data.message || 'Authentication failed')

      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(data.user)
      navigate('/', { replace: true })
    } catch (err) {
      if (err.name === 'AbortError') {
        // Auto-retry once on timeout (backend was waking up)
        if (attempt < 1) {
          setError('Server is waking up, retrying...')
          await warmUpBackend()
          window.clearTimeout(timeout)
          return doAuthRequest(attempt + 1)
        }
        setError('Server is taking too long. Please try again in a moment.')
      } else {
        setError(err.message || 'An unexpected error occurred')
      }
    } finally {
      window.clearTimeout(timeout)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    await doAuthRequest()
    setLoading(false)
  }

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-[#070708] text-white selection:bg-white selection:text-black font-sans overflow-hidden">
      
      {/* Cinematic Background - Full Screen Slideshow */}
      <div className="absolute inset-0 z-0">
        {/* Permanent static fallback to prevent black screen */}
        <img
          src={fallbackBackdropUrl}
          className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale"
          alt=""
        />
        <AnimatePresence mode="sync">
          <motion.div
            key={bgIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 h-full w-full"
          >
            <img
              src={bgPosters[bgIndex]?.backdrop_path || fallbackBackdropUrl}
              className="h-full w-full object-cover"
              alt=""
              onError={(e) => {
                if (!e.currentTarget.dataset.fallbackApplied) {
                  e.currentTarget.dataset.fallbackApplied = 'true'
                  e.currentTarget.src = fallbackBackdropUrl
                }
              }}
            />
            {/* Subtle overlay for the image itself */}
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        </AnimatePresence>

        {/* Improved Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      {/* Main Container - Centered UI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-[480px] px-6 flex flex-col items-center justify-center h-full"
      >
        <div className="relative w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden group">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            {/* Logo inside card */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center justify-center group cursor-pointer w-full"
            >
              <div className="flex flex-col items-center gap-0 leading-[0.7] text-center">
                <span className="block text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-[0.7]">MOVIES</span>
                <span className="block text-3xl md:text-4xl font-black uppercase tracking-tighter text-yellow-400 leading-[0.7] -mt-1">BOX</span>
              </div>
            </motion.div>

            {/* Mode Toggle Switch */}
            <div className="flex p-1 bg-white/[0.05] border border-white/5 rounded-2xl mb-8 relative">
              <motion.div
                className="absolute inset-1 rounded-[12px] bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                initial={false}
                animate={{ x: mode === 'login' ? '0%' : '100%' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ width: 'calc(50% - 4px)' }}
              />
              <button 
                onClick={() => { setMode('login'); setError('') }}
                className={`flex-1 h-10 text-[10px] font-black uppercase tracking-[0.2em] relative z-10 transition-colors duration-300 ${mode === 'login' ? 'text-black' : 'text-gray-400'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setMode('signup'); setError('') }}
                className={`flex-1 h-10 text-[10px] font-black uppercase tracking-[0.2em] relative z-10 transition-colors duration-300 ${mode === 'signup' ? 'text-black' : 'text-gray-400'}`}
              >
                Sign Up
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <AnimatePresence mode="wait" initial={false}>
                {mode === 'signup' && (
                  <motion.div
                    key="signup-name"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-yellow-400/80" />
                      Full Name
                    </label>
                    <input
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-600"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-yellow-400/80" />
                  {mode === 'login' ? 'Email or User ID' : 'Email Address'}
                </label>
                <input
                  name={mode === 'login' ? 'identifier' : 'email'}
                  type="text"
                  placeholder={mode === 'login' ? "your@email.com" : "your@email.com"}
                  value={mode === 'login' ? form.identifier : form.email}
                  onChange={handleChange}
                  required
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                  className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-yellow-400/80" />
                    Password
                  </label>
                  {mode === 'login' && (
                    <button type="button" className="text-[10px] font-black text-yellow-400/40 hover:text-yellow-400 transition-colors uppercase tracking-widest">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-5 pr-12 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-yellow-400 transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-2xl text-center"
                >
                  {error}
                </motion.div>
              )}

              {!serverReady && !loading && (
                <p className="text-[9px] text-yellow-400/40 text-center tracking-widest uppercase">
                  Connecting to server...
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 mt-4 bg-yellow-400 text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-yellow-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Sign Up'}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Modern Footer */}
      <div className="absolute bottom-8 left-0 w-full px-8 md:px-12 z-20 pointer-events-none opacity-20 flex justify-between items-center">
        <p className="text-[9px] font-black tracking-[0.5em]">
          © 2026 MOVIESBOX MEDIA GROUP
        </p>
        <div className="flex gap-12">
          <span className="text-[9px] font-black tracking-[0.5em] hover:opacity-100 cursor-pointer pointer-events-auto transition-opacity">PRIVACY</span>
          <span className="text-[9px] font-black tracking-[0.5em] hover:opacity-100 cursor-pointer pointer-events-auto transition-opacity">TERMS</span>
        </div>
      </div>
    </div>
  )
}
