import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TOKEN_KEY = 'moviesbox_token'
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

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

export default function AuthPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ fullName: '', identifier: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bgPosters, setBgPosters] = useState([])
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    fetch(`${API_BASE}/public/auth-backgrounds`)
      .then(r => r.json())
      .then(d => {
        if (d.results && d.results.length > 0) {
          setBgPosters(d.results)
        } else {
          setBgPosters([{ id: 1, backdrop_path: '/assets/hero.png', title: 'MoviesBox' }])
        }
      })
      .catch(() => {
        setBgPosters([{ id: 1, backdrop_path: '/assets/hero.png', title: 'MoviesBox' }])
      })
  }, [])

  useEffect(() => {
    if (!bgPosters.length) return
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgPosters.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [bgPosters])

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
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
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.message || 'Authentication failed')
      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(data.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-[#070708] text-white selection:bg-white selection:text-black font-sans overflow-hidden">
      
      {/* Cinematic Background - Brighter Overlays */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={bgIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 h-full w-full"
          >
            <img
              src={bgPosters[bgIndex]?.backdrop_path}
              className="h-full w-full object-cover"
              alt=""
              onError={(e) => { e.target.src = '/assets/hero.png' }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Improved Gradient Overlays - Reduced darkness */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
      </div>

      {/* Main Container - Simple & Clean UI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-[480px] px-6 flex flex-col items-center justify-center h-full"
      >
        <div className="relative w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex items-center justify-center group cursor-pointer w-full"
          >
            <div className="flex flex-col items-center gap-0 leading-[0.7] text-center">
              <span className="block text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-[0.7]">MOVIES</span>
              <span className="block text-3xl md:text-4xl font-black uppercase tracking-tighter text-yellow-400 leading-[0.7] -mt-1">BOX</span>
            </div>
          </motion.div>

          {/* Simple Toggle Switch */}
          <div className="pb-6">
            <div className="flex p-1.5 bg-[#111] border border-white/10 rounded-full mb-8 relative">
              <motion.div
                className="absolute inset-1.5 rounded-full border border-yellow-400 bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                initial={false}
                animate={{ x: mode === 'login' ? '0%' : '100%' }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                style={{ width: 'calc(50% - 3px)' }}
              />
              <button 
                onClick={() => { setMode('login'); setError('') }}
                className={`flex-1 h-[40px] text-[10px] font-black uppercase tracking-[0.2em] relative z-10 transition-colors duration-300 ${mode === 'login' ? 'text-black' : 'text-gray-500'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setMode('signup'); setError('') }}
                className={`flex-1 h-[40px] text-[10px] font-black uppercase tracking-[0.2em] relative z-10 transition-colors duration-300 ${mode === 'signup' ? 'text-black' : 'text-gray-500'}`}
              >
                Sign Up
              </button>
            </div>
            
          </div>

          {/* Simple Form Content */}
          <div className="pb-6">
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <AnimatePresence mode="wait" initial={false}>
                {mode === 'signup' && (
                  <motion.div
                    key="signup-name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-yellow-400" />
                      Full Name
                    </label>
                    <div className="relative group">
                      <input
                        name="fullName"
                        type="text"
                        placeholder="Your full name"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        autoComplete="off"
                        className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-5 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-500"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-yellow-400" />
                  {mode === 'login' ? 'Email or User ID' : 'Email Address'}
                </label>
                <div className="relative group">
                  <input
                    name={mode === 'login' ? 'identifier' : 'email'}
                    type="text"
                    placeholder={mode === 'login' ? "Enter your email or user ID" : "Enter your email"}
                    value={mode === 'login' ? form.identifier : form.email}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-5 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-yellow-400" />
                    Password
                  </label>
                  {mode === 'login' && (
                    <button type="button" className="text-[10px] font-black text-yellow-400/60 hover:text-yellow-400 transition-colors uppercase tracking-widest">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-5 pr-12 text-sm text-white outline-none focus:border-yellow-400/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-500"
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
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-xl text-center"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 mt-4 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-yellow-300 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Sign Up'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Modern Footer */}
      <div className="absolute bottom-8 left-0 w-full px-8 md:px-12 z-20 pointer-events-none opacity-20">
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
