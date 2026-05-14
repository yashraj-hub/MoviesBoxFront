import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '../components/Loader'
import { Minus, Plus, Trash2 } from 'lucide-react'

const TOKEN_KEY = 'moviesbox_token'
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

function sessionBrowserLabel(s) {
  const ua = (s && s.userAgent) || ''
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/OPR\/|Opera/i.test(ua)) return 'Opera'
  if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) return 'Chrome'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari'
  if (s?.platform) return s.platform
  return 'Browser'
}

function DbBar({ label, db }) {
  if (!db) return <div className="flex-1 min-w-0 h-16 rounded-xl bg-white/5 animate-pulse" />
  const pct = Math.min(100, (db.storageMB / db.limitMB) * 100).toFixed(1)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-400'
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</span>
        <span className={`text-[10px] font-black tracking-widest ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-yellow-400' : 'text-green-400'}`}>
          {db.storageMB} MB / {db.limitMB} MB · {pct}%
        </span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-4 mt-2">
        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{db.collections} collections</span>
        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
          {db.objects?.toLocaleString()} documents
        </span>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone = 'default', onClick, pressed }) {
  const cls =
    tone === 'red'
      ? 'bg-red-400/10 border-red-400/20 text-red-200'
      : tone === 'green'
        ? 'bg-green-400/10 border-green-400/20 text-green-200'
        : tone === 'yellow'
          ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-200'
          : tone === 'blue'
            ? 'bg-blue-400/10 border-blue-400/20 text-blue-200'
            : 'bg-white/[0.03] border-white/10 text-white'
  const ring = pressed && onClick ? 'ring-2 ring-blue-400/40 ring-offset-2 ring-offset-[#0a0a0a]' : ''
  const base = `rounded-xl border ${cls} p-4 ${onClick ? `cursor-pointer text-left transition hover:brightness-110 ${ring}` : ''}`
  const body = (
    <>
      <p className="text-[9px] uppercase tracking-widest text-gray-300 font-bold">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      {onClick && <p className="mt-2 text-[9px] text-gray-500 font-bold uppercase tracking-widest">Tap for details</p>}
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {body}
      </button>
    )
  }
  return <div className={base}>{body}</div>
}

function Badge({ children, tone = 'gray' }) {
  const cls =
    tone === 'green'
      ? 'bg-green-400/20 text-green-400'
      : tone === 'red'
        ? 'bg-red-400/20 text-red-400'
        : tone === 'blue'
          ? 'bg-blue-400/20 text-blue-300'
          : tone === 'yellow'
            ? 'bg-yellow-400/20 text-yellow-400'
            : 'bg-white/10 text-gray-400'
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${cls}`}>
      {children}
    </span>
  )
}

function UserCard({ user, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(user.id)}
      className={`w-full text-left rounded-2xl border px-5 py-4 md:px-6 md:py-5 transition flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6 ${
        selected ? 'border-yellow-400/40 bg-yellow-400/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-white font-black uppercase tracking-widest truncate text-sm md:text-base">{user.fullName}</div>
        <div className="text-gray-500 text-xs md:text-sm mt-1 truncate">{user.email}</div>
        <div className="text-gray-600 text-[10px] md:text-xs font-mono mt-0.5 truncate">{user.userId}</div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0 md:justify-end">
        <Badge tone={user.isActive ? 'green' : 'red'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
        <Badge tone={user.trackingEnabled !== false ? 'blue' : 'gray'}>{user.trackingEnabled !== false ? 'Tracking ON' : 'Tracking OFF'}</Badge>
        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-gray-400">
          Sessions {user.sessions?.length || 0}
        </span>
      </div>
    </button>
  )
}

/** Standard container for sections that should match the main app layout. */
function AdminContainer({ children, className = "", id }) {
  return (
    <div
      id={id}
      className={`px-4 md:px-12 max-w-7xl mx-auto w-full ${className}`}
    >
      {children}
    </div>
  )
}

function LiveOnlinePanel({ items, users, minutes, onClose, onRowClick }) {
  const enriched = useMemo(() => {
    const list = Array.isArray(items) ? items : []
    return list.map((w) => ({
      ...w,
      full: users.find((u) => u.userId === w.userId) || null,
    }))
  }, [items, users])

  return (
    <AdminContainer className="mb-8">
      <div className="border border-blue-400/20 bg-blue-400/[0.06] rounded-2xl py-6 px-6 md:px-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-heading text-xl md:text-2xl text-white">Online on site (last {minutes} min)</h2>
            <p className="text-gray-500 text-xs mt-1">
              Users with a recent activity ping. Click a row to open full profile.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-white text-3xl font-light leading-none transition-colors"
            aria-label="Close live panel"
          >
            ×
          </button>
        </div>
        {enriched.length === 0 ? (
          <p className="text-gray-500 text-sm">No one online in this window.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="p-3 pl-4">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Sessions</th>
                  <th className="p-3 pr-4">Last ping</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((row) => {
                  const name = (row.fullName && String(row.fullName).trim()) || row.email || row.userId || '—'
                  const canOpen = Boolean(row.full?.id)
                  return (
                    <tr
                      key={`${row.userId}-${row.lastSiteActiveAt}`}
                      onClick={() => canOpen && onRowClick?.(row.full.id)}
                      className={`border-b border-white/5 last:border-0 ${canOpen ? 'cursor-pointer hover:bg-white/[0.06]' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="p-3 pl-4 font-bold text-white">{name}</td>
                      <td className="p-3 text-gray-400 truncate max-w-[200px]">{row.email || row.full?.email || '—'}</td>
                      <td className="p-3 font-mono text-xs text-gray-500">{row.userId}</td>
                      <td className="p-3 text-gray-400">{row.full?.sessions?.length ?? '—'}</td>
                      <td className="p-3 pr-4 text-gray-400 text-xs whitespace-nowrap">
                        {row.lastSiteActiveAt ? new Date(row.lastSiteActiveAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminContainer>
  )
}

function UserDetailPanel({ user: initialUser, onClose, onForceLogout, onUpdateStatus, onUpdateTracking, onDelete }) {
  const [user, setUser] = useState(initialUser)
  const [myList, setMyList] = useState([])
  const [myListLoading, setMyListLoading] = useState(false)
  const [userAnalytics, setUserAnalytics] = useState(null)
  const [uaLoading, setUaLoading] = useState(false)
  const [selectedDayKey, setSelectedDayKey] = useState('')
  const [dayDetails, setDayDetails] = useState(null)
  const [dayLoading, setDayLoading] = useState(false)
  const [deviceOpen, setDeviceOpen] = useState(true)
  const token = localStorage.getItem(TOKEN_KEY)

  const deleteWatchHistory = async ({ dayKey } = {}) => {
    if (!user?.id) return
    const qs = dayKey ? `?dayKey=${encodeURIComponent(dayKey)}` : ''
    await fetch(`${API_BASE}/admin/analytics/users/${user.id}/watch-history${qs}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
    if (dayKey && selectedDayKey === dayKey) {
      setDayDetails((prev) => (prev ? { ...prev, movies: [], totalWatchSeconds: 0, watchHours: 0 } : prev))
    } else {
      setDayDetails(null)
    }
  }

  // Fix: Prevent background scrolling when overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    if (!initialUser) return
    let cancelled = false

    const loadLatestUser = async () => {
      try {
        const data = await fetch(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
        const latest = data.find(u => u.id === initialUser.id)
        if (!cancelled && latest) setUser(latest)
      } catch {}
    }

    const loadMyList = async () => {
      setMyListLoading(true)
      try {
        const data = await fetch(`${API_BASE}/admin/users/${initialUser.id}/my-list`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
        if (!cancelled) setMyList(data?.items || [])
      } catch {
        if (!cancelled) setMyList([])
      } finally {
        if (!cancelled) setMyListLoading(false)
      }
    }

    const loadUserAnalytics = async () => {
      setUaLoading(true)
      try {
        const data = await fetch(`${API_BASE}/admin/analytics/users/${initialUser.id}?days=90`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
        if (!cancelled) setUserAnalytics(data)
      } catch {
        if (!cancelled) setUserAnalytics(null)
      } finally {
        if (!cancelled) setUaLoading(false)
      }
    }

    loadLatestUser()
    loadMyList()
    loadUserAnalytics()
    return () => { cancelled = true }
  }, [initialUser, token])

  useEffect(() => {
    if (!userAnalytics?.timeline?.length) return
    const last = userAnalytics.timeline[userAnalytics.timeline.length - 1]
    if (!last?.dayKey) return
    setSelectedDayKey(last.dayKey)
  }, [userAnalytics])

  useEffect(() => {
    if (!user || !selectedDayKey) return
    let cancelled = false
    const loadDayDetails = async () => {
      setDayLoading(true)
      try {
        const data = await fetch(`${API_BASE}/admin/analytics/users/${user.id}/day/${encodeURIComponent(selectedDayKey)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
        if (!cancelled) setDayDetails(data)
      } catch {
        if (!cancelled) setDayDetails(null)
      } finally {
        if (!cancelled) setDayLoading(false)
      }
    }
    loadDayDetails()
    return () => { cancelled = true }
  }, [user, selectedDayKey, token])

  const timeline = userAnalytics?.timeline || []
  const IST_OFFSET_MINUTES = 330
  const todayDayKey = useMemo(() => {
    const t = new Date()
    const shifted = new Date(t.getTime() + IST_OFFSET_MINUTES * 60 * 1000)
    const y = shifted.getUTCFullYear()
    const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
    const d = String(shifted.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [])

  const timeline30 = useMemo(() => {
    const map = new Map((Array.isArray(timeline) ? timeline : []).map((d) => [d.dayKey, d]))
    const t = new Date()
    const shifted = new Date(t.getTime() + IST_OFFSET_MINUTES * 60 * 1000)
    const baseUtcMs =
      Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) -
      IST_OFFSET_MINUTES * 60 * 1000

    const out = []
    for (let i = -15; i <= 14; i += 1) {
      const dayStartAt = new Date(baseUtcMs + i * 24 * 60 * 60 * 1000)
      const shiftedDay = new Date(dayStartAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000)
      const y = shiftedDay.getUTCFullYear()
      const m = String(shiftedDay.getUTCMonth() + 1).padStart(2, '0')
      const d = String(shiftedDay.getUTCDate()).padStart(2, '0')
      const dayKey = `${y}-${m}-${d}`
      const row = map.get(dayKey)
      out.push({
        dayKey,
        loginCount: Number(row?.loginCount || 0),
        siteActiveHours: Number(row?.siteActiveHours || 0),
      })
    }
    return out
  }, [timeline])

  const maxSiteHours = useMemo(() => {
    const values = timeline30
      .map((d) => Number(d.siteActiveHours || 0))
      .filter((n) => Number.isFinite(n))
    return values.length ? Math.max(...values) : 0
  }, [timeline30])

  useEffect(() => {
    if (!timeline30.length) return
    if (timeline30.some((d) => d.dayKey === todayDayKey)) {
      setSelectedDayKey(todayDayKey)
      return
    }
    const last = timeline30[timeline30.length - 1]
    if (last?.dayKey) setSelectedDayKey(last.dayKey)
  }, [timeline30, todayDayKey])

  const signupClient = user?.signupContext?.client || {}
  const signupServer = user?.signupContext?.server || {}
  const deviceRowsClient = [
    ['User Agent', signupClient.userAgent],
    ['Platform', signupClient.platform],
    ['Language', signupClient.language],
    ['Languages', Array.isArray(signupClient.languages) ? signupClient.languages.filter(Boolean).join(', ') : null],
    ['Timezone', signupClient.timezone],
    ['Screen', signupClient.screen],
    ['Screen Detail', signupClient.screenDetail],
    ['Device Memory', signupClient.deviceMemory ? `${signupClient.deviceMemory} GB` : null],
    ['CPU Cores', signupClient.hardwareConcurrency ?? null],
    ['Touch Points', signupClient.touchPoints ?? null],
    ['Vendor', signupClient.vendor],
    ['Cookie Enabled', typeof signupClient.cookieEnabled === 'boolean' ? String(signupClient.cookieEnabled) : null],
    ['Online', typeof signupClient.online === 'boolean' ? String(signupClient.online) : null],
    ['Color Scheme', signupClient.colorScheme],
    ['Connection', signupClient.connection],
    ['Referrer', signupClient.referrer],
    ['Page URL', signupClient.pageUrl],
  ]
  const deviceRowsServer = [
    ['IP', signupServer.ip],
    ['Forwarded For', signupServer.forwardedFor],
    ['Recorded At', user?.signupContext?.recordedAt ? new Date(user.signupContext.recordedAt).toLocaleString() : null],
  ]
  const deviceRowsAll = [...deviceRowsServer, ...deviceRowsClient]
  const deviceMid = Math.ceil(deviceRowsAll.length / 2)
  const deviceRowsLeft = deviceRowsAll.slice(0, deviceMid)
  const deviceRowsRight = deviceRowsAll.slice(deviceMid)

  const formatDuration = (seconds) => {
    const s = Math.max(0, Math.round(Number(seconds) || 0))
    const mins = Math.round(s / 60)
    if (mins < 120) return `${mins} min`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 top-20 z-[100] bg-black/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="h-full overflow-y-auto pb-20">
        <div className="sticky top-0 z-[110] bg-black/80 backdrop-blur-md border-b border-white/10 px-4 md:px-12 py-4">
          <div className="flex items-start justify-between gap-4 max-w-7xl mx-auto">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="font-heading text-2xl md:text-3xl text-white truncate">{user.fullName}</h2>
                {user.isActive ? (
                   <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" title="Active Account" />
                ) : null}
              </div>
              <p className="text-gray-500 text-xs md:text-sm truncate font-medium mt-1">
                {user.email} <span className="mx-2 text-gray-700">|</span> {user.userId}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-gray-400 hover:text-white text-3xl font-light leading-none p-2 transition-all hover:rotate-90"
              aria-label="Close user details"
            >
              ×
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-12 py-10 space-y-10">
          <div className="flex items-center justify-end gap-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Active</span>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(user.isActive)}
                onClick={() => onUpdateStatus(user.id, !user.isActive)}
                className={`relative w-11 h-6 rounded-full border transition-all ${
                  user.isActive ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/15 border-red-500/25'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/80 transition-transform ${
                    user.isActive ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Tracking</span>
              <button
                type="button"
                role="switch"
                aria-checked={user.trackingEnabled !== false}
                onClick={() => onUpdateTracking(user.id, user.trackingEnabled === false)}
                className={`relative w-11 h-6 rounded-full border transition-all ${
                  user.trackingEnabled !== false ? 'bg-blue-500/20 border-blue-500/30' : 'bg-yellow-500/15 border-yellow-500/25'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/80 transition-transform ${
                    user.trackingEnabled !== false ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${user.fullName}?`)) onDelete(user.id)
              }}
              className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center justify-center"
              aria-label="Delete user"
              title="Delete user"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-yellow-400 font-black">Signup / Device Info</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {user.signupContext?.client?.platform || 'n/a'} <span className="mx-2 text-gray-700">·</span>{' '}
                  {user.signupContext?.client?.timezone || 'n/a'} <span className="mx-2 text-gray-700">·</span>{' '}
                  {user.signupContext?.server?.ip || 'n/a'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeviceOpen((v) => !v)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                aria-label={deviceOpen ? 'Collapse device info' : 'Expand device info'}
                title={deviceOpen ? 'Collapse' : 'Expand'}
              >
                {deviceOpen ? <Minus size={18} /> : <Plus size={18} />}
              </button>
            </div>

            {deviceOpen ? (
              <div className="mt-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  {deviceRowsLeft.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[140px_1fr] gap-3">
                      <div className="text-[10px] uppercase tracking-widest text-gray-600 font-black">{k}</div>
                      <div className="text-[12px] text-gray-200 break-words">{v ?? 'n/a'}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {deviceRowsRight.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[140px_1fr] gap-3">
                      <div className="text-[10px] uppercase tracking-widest text-gray-600 font-black">{k}</div>
                      <div className="text-[12px] text-gray-200 break-words">{v ?? 'n/a'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-widest text-yellow-400 font-black mb-3">
              Active Sessions ({user.sessions?.length || 0})
            </p>
            {user.sessions?.length ? (
              <div className="space-y-2">
                {user.sessions.map((s) => (
                  <div key={s.tokenId} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.03]">
                    <div>
                      <div className="text-gray-200 text-xs font-bold">{sessionBrowserLabel(s)} · {s.ip || 'n/a'}</div>
                      <div className="text-gray-500 text-[10px] font-black">{s.loggedInAt ? new Date(s.loggedInAt).toLocaleString() : ''}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onForceLogout(user.id, s.tokenId)}
                      className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400"
                    >
                      Force Logout
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active sessions</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="font-heading text-xl text-white mb-3">Saved list</h3>
            {myListLoading ? (
              <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ) : myList.length ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {myList.slice(0, 12).map((m) => (
                  <div key={m.tmdbId} className="rounded-lg overflow-hidden border border-white/10 bg-white/5">
                    {m.posterUrl ? (
                      <img src={m.posterUrl} alt={m.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-white/5" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Empty</p>
            )}
          </div>

          {/* Analytics Timeline */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <h3 className="font-heading text-2xl text-white mb-1">User Activity Timeline</h3>
                <p className="text-gray-500 text-sm">Visual breakdown of engagement over the last 90 days</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Site Active</div>
              </div>
            </div>

            {uaLoading ? (
              <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            ) : timeline30.length ? (
              <div className="space-y-12">
                {/* Visual Bar Chart */}
                <div className="relative h-40 flex items-end gap-1.5 overflow-x-auto pb-4 px-2 scrollbar-hide">
                  {timeline30.map((d) => {
                    const activeH = Number(d.siteActiveHours || 0)
                    const denom = maxSiteHours > 0 ? maxSiteHours : 1
                    const displayActiveH = Math.max(0.05, activeH)
                    const barHeightPx = Math.max(8, (displayActiveH / denom) * 120)
                    const isActive = d.dayKey === selectedDayKey
                    const activeMin = Math.max(0, Math.round(activeH * 60))
                    const isToday = d.dayKey === todayDayKey
                    const isFuture = d.dayKey > todayDayKey
                    const baseOpacity = isFuture ? 'opacity-20' : isToday ? 'opacity-100' : 'opacity-60'
                    const barColor = isToday ? 'bg-yellow-400' : isFuture ? 'bg-white/10' : 'bg-yellow-400/70'

                    return (
                      <button
                        key={d.dayKey}
                        type="button"
                        onClick={() => !isFuture && setSelectedDayKey(d.dayKey)}
                        disabled={isFuture}
                        className={`group relative h-full flex flex-col items-center justify-end gap-2 transition-all duration-300 ${
                          isActive ? 'scale-110 z-10' : `${baseOpacity} hover:opacity-100`
                        } ${isFuture ? 'cursor-not-allowed' : ''}`}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[9px] py-1 px-2 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {activeMin > 0 && <div>Site: {activeMin} min</div>}
                        </div>

                        <div 
                          className="w-3 md:w-4 rounded-full overflow-hidden flex flex-col-reverse bg-white/5" 
                          style={{ height: `${barHeightPx}px` }}
                        >
                          <div className={`${barColor} w-full`} style={{ height: '100%' }} />
                        </div>
                        <span className={`text-[8px] font-black tracking-tighter transition-colors ${isActive ? 'text-yellow-400' : 'text-gray-600'}`}>
                          {d.dayKey.split('-').slice(1).join('/')}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Day Detail Card */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500">
                  {dayLoading ? (
                    <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
                  ) : dayDetails ? (
                    <div>
                      <div>
                        <div className="flex items-center justify-end gap-2 mb-6">
                          <div className="px-3 py-1 rounded-lg bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest">
                            {dayDetails.dayKey}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete watch history for ${dayDetails.dayKey}?`)) {
                                deleteWatchHistory({ dayKey: dayDetails.dayKey })
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                          >
                            Delete Day
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete ALL watch history for this user?')) {
                                deleteWatchHistory()
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                          >
                            Delete All
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Active</p>
                            <p className="text-xl font-black text-white">{formatDuration(dayDetails.siteActiveSeconds)}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Logins</p>
                            <p className="text-xl font-black text-white">{dayDetails.loginCount || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Continue Watching (This Day)</h4>
                        {dayDetails.movies?.length ? (
                          <div className="relative">
                            <div className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              {dayDetails.movies.slice(0, 20).map((m) => {
                                const img = m.posterUrl || null
                                const watchSeconds = Math.max(0, Math.round(Number(m.watchSeconds) || 0))
                                const progress = Math.min(95, Math.max(10, (watchSeconds / 3600) * 100))
                                return (
                                  <div key={m.tmdbId} className="group cursor-pointer shrink-0 w-[200px] md:w-[240px]">
                                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-yellow-400/40 transition-all duration-300">
                                      {img ? (
                                        <img
                                          src={img}
                                          alt={m.title}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                                          No Image
                                        </div>
                                      )}
                                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                        <div className="h-full bg-red-600" style={{ width: `${progress}%` }} />
                                      </div>
                                    </div>
                                    <p className="mt-2 line-clamp-1 text-[10px] uppercase tracking-wider font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
                                      {m.title}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 flex items-center justify-center rounded-2xl border border-dashed border-white/10 text-gray-600 text-xs italic">
                            No movies recorded for this day
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-600 italic">
                      Select a bar above to see daily details
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 text-gray-600">
                <p className="text-sm italic">No activity data recorded yet</p>
                <p className="text-[10px] mt-2 uppercase tracking-widest font-black opacity-50">Timeline will appear once tracking begins</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [dbStats, setDbStats] = useState(null)
  const [overview, setOverview] = useState(null)
  const [liveWatchers, setLiveWatchers] = useState({ items: [], minutes: 12 })
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [liveOnlineOpen, setLiveOnlineOpen] = useState(false)
  const token = localStorage.getItem(TOKEN_KEY)

  const loadData = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true)
    try {
      const authHdr = { Authorization: `Bearer ${token}` }

      const loadSafe = async (url, fallback) => {
        try {
          const r = await fetch(url, { headers: authHdr })
          const data = await r.json().catch(() => null)
          if (!r.ok) return fallback
          return data ?? fallback
        } catch {
          return fallback
        }
      }

      const [usersRes, statsRes, ovRes, liveRes] = await Promise.all([
        loadSafe(`${API_BASE}/admin/users`, []),
        loadSafe(`${API_BASE}/admin/db-stats`, null),
        loadSafe(`${API_BASE}/admin/analytics/overview?days=30`, null),
        loadSafe(`${API_BASE}/admin/analytics/live-watchers?minutes=12&limit=30`, { items: [], minutes: 12 }),
      ])

      setUsers(Array.isArray(usersRes) ? usersRes : [])
      setDbStats(statsRes)
      setOverview(ovRes)
      const liveItems = Array.isArray(liveRes?.items) ? liveRes.items : []
      const liveMin = typeof liveRes?.minutes === 'number' ? liveRes.minutes : 12
      setLiveWatchers({ items: liveItems, minutes: liveMin })
    } catch (err) {
      setError(err.message)
    } finally {
      if (!isAutoRefresh) setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        const me = await meRes.json().catch(() => ({}))
        if (!meRes.ok || me?.user?.role !== 'admin') {
          navigate('/', { replace: true })
          return
        }
        await loadData()
      } catch {}
    }
    init()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadData(true), 30_000)
    return () => clearInterval(interval)
  }, [navigate, token])

  const updateStatus = async (id, isActive) => {
    const data = await fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    }).then((r) => r.json())
    setUsers((u) => u.map((x) => (x.id === id ? data.user : x)))
  }

  const updateTracking = async (id, trackingEnabled) => {
    const data = await fetch(`${API_BASE}/admin/users/${id}/tracking`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingEnabled }),
    }).then((r) => r.json())
    setUsers((u) => u.map((x) => (x.id === id ? data.user : x)))
  }

  const forceLogout = async (userId, tokenId) => {
    const data = await fetch(`${API_BASE}/admin/users/${userId}/sessions/${tokenId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json())
    setUsers((u) => u.map((x) => (x.id === userId ? data.user : x)))
  }

  const deleteUser = async (id) => {
    await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setUsers((u) => u.filter((x) => x.id !== id))
    if (selectedUserId === id) setSelectedUserId(null)
  }

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) || null, [users, selectedUserId])

  const counts = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.isActive).length
    const inactive = total - active
    const trackingOn = users.filter((u) => u.trackingEnabled !== false).length
    return { total, active, inactive, trackingOn }
  }, [users])

  if (loading) return <Loader />

  const openLiveDetails = () => setLiveOnlineOpen((v) => !v)

  const selectUserAndScroll = (id) => {
    setSelectedUserId(id)
    setLiveOnlineOpen(false)
  }

  return (
    <div className="pt-24 pb-20">
      <AdminContainer>
        {/* DB Stats on Top (Full Width) */}
        <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl border border-white/10 bg-white/[0.02] mb-6">
          <DbBar label="Main Database" db={dbStats?.main} />
          <div className="hidden md:block w-px bg-white/10" />
          <DbBar label="Analytics Database" db={dbStats?.analytics} />
        </div>

        {/* 4 Cards Below (Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={counts.total} />
          <StatCard label="Tracking ON" value={counts.trackingOn} tone="yellow" />
          <StatCard label="Active" value={counts.active} tone="green" />
          <StatCard
            label={`Live (${liveWatchers.minutes}m)`}
            value={liveWatchers?.items?.length || 0}
            tone="blue"
            onClick={openLiveDetails}
            pressed={liveOnlineOpen}
          />
        </div>
      </AdminContainer>

      {liveOnlineOpen && (
        <LiveOnlinePanel
          items={liveWatchers.items}
          users={users}
          minutes={liveWatchers.minutes}
          onClose={() => setLiveOnlineOpen(false)}
          onRowClick={selectUserAndScroll}
        />
      )}

      {overview && (
        <AdminContainer className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">30d Active Users</p>
              <p className="text-xl font-black text-white">{overview?.summary?.activeUsers ?? overview?.totalActiveUsers ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">30d Logins</p>
              <p className="text-xl font-black text-white">{overview?.summary?.totalLoginCount ?? overview?.totalLogins ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Avg Site Hours</p>
              <p className="text-xl font-black text-white">
                {Number(
                  (overview?.avgSiteActiveHours ?? (
                    Number(overview?.summary?.totalSiteActiveHours || 0) / Math.max(1, Number(overview?.days || 30))
                  )) || 0,
                ).toFixed(1)}h
              </p>
            </div>
          </div>
        </AdminContainer>
      )}

      <AdminContainer className="mt-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-4xl text-white">Users Management</h1>
          <Badge tone="gray">{users.length} total</Badge>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="flex flex-col gap-4 max-w-none">
          {users.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              selected={u.id === selectedUserId}
              onClick={(id) => selectUserAndScroll(id)}
            />
          ))}
        </div>
      </AdminContainer>

      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUserId(null)}
          onForceLogout={forceLogout}
          onUpdateStatus={updateStatus}
          onUpdateTracking={updateTracking}
          onDelete={deleteUser}
        />
      )}
    </div>
  )
}
