import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookmarkCheck, BookmarkPlus, Star } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'
import { useAuth } from '../context/AuthContext'

const savedCache = new Map()

export default function TVShowCard({ show, titleClassName = 'text-white', showSaveButton = true }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const poster = show.posterUrl || show.backdropUrl || null
  const id = show.id
  const year = (show.firstAirDate || '').slice(0, 4) || null
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pulse, setPulse] = useState(false)
  const pulseTimerRef = useRef(null)

  const triggerPulse = useCallback(() => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    setPulse(true)
    pulseTimerRef.current = setTimeout(() => setPulse(false), 1200)
  }, [])

  useEffect(() => {
    setSaved(false)
    setSaving(false)
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    }
  }, [id])

  useEffect(() => {
    if (!showSaveButton) {
      setSaved(false)
      setSaving(false)
      return undefined
    }

    if (!user?.id || !id) {
      setSaved(false)
      return undefined
    }

    const cacheKey = `${user.id}:${id}`
    const cached = savedCache.get(cacheKey)
    if (typeof cached === 'boolean') setSaved(cached)

    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch(`my-list/check/${id}?mediaType=tv`)
        const data = await res?.json()
        const inList = Boolean(data?.inList)
        savedCache.set(cacheKey, inList)
        if (!cancelled) setSaved(inList)
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
    }
  }, [showSaveButton, user?.id, id])

  const saveToMyList = async (e) => {
    e.stopPropagation()
    if (!showSaveButton || !user || !id || saving || saved) return
    setSaving(true)
    try {
      const res = await apiFetch('my-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: Number(id),
          mediaType: 'tv',
          title: show.name || '',
          posterUrl: poster || '',
        }),
      })
      if (res?.ok) {
        const cacheKey = user?.id ? `${user.id}:${id}` : null
        if (cacheKey) savedCache.set(cacheKey, true)
        setSaved(true)
        triggerPulse()
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/tv/${id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tv/${id}`) }}
      className="group relative cursor-pointer text-left select-none"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:border-yellow-400/50 group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
        {showSaveButton && user ? (
          <button
            type="button"
            onClick={saveToMyList}
            disabled={saving || saved}
            className={`absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-all ${
              saved
                ? 'border-yellow-400/40 bg-yellow-400/15 text-yellow-400'
                : 'border-white/15 bg-black/60 text-gray-200 hover:border-yellow-400/40 hover:text-white'
            } ${saving ? 'cursor-not-allowed opacity-60' : ''}`}
            aria-label={saved ? 'Saved to my list' : 'Save to my list'}
            title={saved ? 'Saved' : 'Save'}
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
          </button>
        ) : null}

        {pulse ? <div className="pointer-events-none absolute inset-0 ring-4 ring-yellow-400/20 rounded-2xl" /> : null}

        {poster ? (
          <img
            src={poster}
            alt={show.name || ''}
            className="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center bg-white/5 text-[10px] text-gray-600">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-90" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`line-clamp-2 text-[11px] font-black uppercase tracking-[0.14em] ${titleClassName}`}>
                {show.name}
              </p>
              {year ? (
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-gray-400">
                  {year}
                </p>
              ) : null}
            </div>
            {typeof show.voteAverage === 'number' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                <Star className="h-3 w-3 text-yellow-400" />
                {show.voteAverage.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
