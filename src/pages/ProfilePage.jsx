import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  User,
  Mail,
  Calendar,
  Bookmark,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Check,
  Pencil,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/apiFetch'
import { AVATARS } from '../config/avatars'

function formatJoined(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', day: 'numeric' }).format(d)
  } catch {
    return '—'
  }
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, setUser, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [listItems, setListItems] = useState([])
  const [listLoading, setListLoading] = useState(true)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')

  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const loadMyList = useCallback(() => {
    setListLoading(true)
    apiFetch('my-list')
      .then((r) => (r ? r.json() : null))
      .then((d) => setListItems(Array.isArray(d?.items) ? d.items : []))
      .catch(() => setListItems([]))
      .finally(() => setListLoading(false))
  }, [])

  useEffect(() => {
    apiFetch('auth/me')
      .then((r) => (r?.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setProfile(d.user)
          setUser(d.user)
          setSelectedAvatar(d.user.avatar || '')
          setPickerOpen(!d.user.avatar)
        } else setLoadError('Could not load profile')
      })
      .catch(() => setLoadError('Could not load profile'))
  }, [setUser])

  useEffect(() => {
    loadMyList()
  }, [loadMyList])

  const display = profile || user

  const saveAvatar = async (url) => {
    setSelectedAvatar(url)
    setAvatarBusy(true)
    try {
      const r = await apiFetch('auth/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: url }),
      })
      const data = r ? await r.json().catch(() => ({})) : {}
      if (r?.ok && data.user) {
        setProfile(data.user)
        setUser(data.user)
        setPickerOpen(false)
      }
    } catch {}
    finally { setAvatarBusy(false) }
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    setPwErr('')
    setPwMsg('')
    if (newPassword.length < 8) {
      setPwErr('New password must be at least 8 characters')
      return
    }
    setPwBusy(true)
    try {
      const r = await apiFetch('auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = r ? await r.json().catch(() => ({})) : {}
      if (!r?.ok) throw new Error(data.message || 'Could not update password')
      setPwMsg(data.message || 'Password updated')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPwErr(err.message || 'Something went wrong')
    } finally {
      setPwBusy(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-12 max-w-6xl mx-auto">
      <div className="mb-8 md:mb-10 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/70 hover:border-yellow-400/40 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-heading min-w-0 text-3xl md:text-4xl text-yellow-400 uppercase tracking-tight">
            Profile
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-red-500/60 bg-red-600/90 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm hover:bg-red-500 hover:border-red-400 transition-colors md:px-4 md:py-2.5 md:text-[11px]"
        >
          <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Log out
        </button>
      </div>

      {loadError && !display && (
        <p className="text-sm text-red-400/90 mb-6">{loadError}</p>
      )}

      {display && (
        <div className="space-y-10 md:space-y-12">

          {/* ── Avatar Picker ── */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setPickerOpen(v => !v)}
                className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400/50 bg-white/5 flex items-center justify-center shadow-[0_0_24px_rgba(250,204,21,0.15)] hover:border-yellow-400 hover:shadow-[0_0_32px_rgba(250,204,21,0.3)] transition-all"
              >
                {selectedAvatar
                  ? <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-9 h-9 text-gray-500" />}
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(v => !v)}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg hover:bg-yellow-300 transition-colors"
                title="Change avatar"
              >
                <Pencil className="w-3.5 h-3.5 text-black" />
              </button>
            </div>

            {pickerOpen && (
              <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-11 gap-2.5 w-full">
                {AVATARS.map((av) => {
                  const active = selectedAvatar === av.url
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => saveAvatar(av.url)}
                      disabled={avatarBusy}
                      title={av.id}
                      className={`relative rounded-full overflow-hidden border-2 transition-all duration-200 aspect-square ${
                        active
                          ? 'border-yellow-400 scale-110 shadow-[0_0_14px_rgba(250,204,21,0.5)]'
                          : 'border-white/10 hover:border-white/40 hover:scale-105'
                      }`}
                    >
                      <img src={av.url} alt={av.id} className="w-full h-full object-cover" loading="lazy" />
                      {active && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Check className="w-3 h-3 text-yellow-400" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Account + Password ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
              <h2 className="text-sm md:text-base font-black uppercase tracking-[0.18em] text-yellow-400 mb-5">
                Account
              </h2>
              <dl className="space-y-4">
                <div className="flex gap-3">
                  <User className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-[9px] font-black uppercase tracking-widest text-gray-500">Name</dt>
                    <dd className="text-sm font-bold text-white mt-0.5">{display.fullName}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-[9px] font-black uppercase tracking-widest text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-200 mt-0.5 break-all">{display.email}</dd>
                  </div>
                </div>
                {display.userId && (
                  <div className="flex gap-3">
                    <span className="w-4 h-4 shrink-0 mt-0.5 text-[10px] font-black text-gray-500 text-center leading-4">
                      ID
                    </span>
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-widest text-gray-500">Member ID</dt>
                      <dd className="text-sm font-mono text-gray-300 mt-0.5">{display.userId}</dd>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-[9px] font-black uppercase tracking-widest text-gray-500">Member since</dt>
                    <dd className="text-sm text-gray-200 mt-0.5">{formatJoined(display.createdAt)}</dd>
                  </div>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 h-full">
              <h2 className="text-sm md:text-base font-black uppercase tracking-[0.18em] text-yellow-400 mb-5 flex items-center gap-2.5">
                <Lock className="w-4 h-4 md:w-[18px] md:h-[18px] shrink-0" />
                Change password
              </h2>
              <form onSubmit={submitPassword} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
                    Current password
                  </label>
                  <div className="relative">
                    <input
                      type={showCur ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-gray-600 focus:border-yellow-400/50 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCur((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white"
                      aria-label={showCur ? 'Hide password' : 'Show password'}
                    >
                      {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-gray-600 focus:border-yellow-400/50 focus:outline-none"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white"
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {pwErr && <p className="text-xs text-red-400/90">{pwErr}</p>}
                {pwMsg && <p className="text-xs text-green-400/90">{pwMsg}</p>}
                <button
                  type="submit"
                  disabled={pwBusy}
                  className="w-full rounded-xl bg-yellow-400 py-3 text-[11px] font-black uppercase tracking-widest text-black hover:bg-yellow-300 transition-colors disabled:opacity-50"
                >
                  {pwBusy ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </section>
          </div>

          {/* ── My List ── */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4 md:mb-5">
              <h2 className="text-sm md:text-base font-black uppercase tracking-[0.18em] text-yellow-400 flex items-center gap-2.5 m-0">
                <Bookmark className="w-4 h-4 md:w-[18px] md:h-[18px] shrink-0" />
                My list
              </h2>
              <Link
                to="/my-list"
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-yellow-400 transition-colors"
              >
                Full page →
              </Link>
            </div>

            {listLoading ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-white/5 animate-pulse aspect-[2/3]" />
                ))}
              </div>
            ) : listItems.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-10 text-center">
                <p className="text-gray-500 text-xs leading-relaxed max-w-sm mx-auto">
                  Nothing saved yet. Save any title from a movie or TV page to see it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2.5">
                {listItems.map((m) => (
                  <button
                    key={m.tmdbId}
                    type="button"
                    onClick={() => navigate((m.mediaType || 'movie') === 'tv' ? `/tv/${m.tmdbId}` : `/movie/${m.tmdbId}`)}
                    className="group text-left w-full p-0 border-0 bg-transparent cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400/60"
                  >
                    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5 group-hover:border-yellow-400/35 transition-all duration-300">
                      {m.posterUrl ? (
                        <img
                          src={m.posterUrl}
                          alt=""
                          className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-[9px] font-bold text-gray-500 text-center px-1 leading-tight line-clamp-3">
                          {m.title}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-[9px] sm:text-[10px] font-semibold text-gray-400 group-hover:text-gray-200 truncate leading-tight">
                      {m.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
