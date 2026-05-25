import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookmarkCheck, BookmarkPlus, Clock, Star } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'
import { useAuth } from '../context/AuthContext'

const savedCache = new Map()

export default function MovieCard({ movie, showTitle }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const poster = movie.posterPath || movie.posterUrl || null
  const id = movie.tmdbId || movie.id
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extra, setExtra] = useState(null)
  const [pulse, setPulse] = useState(false)
  const prefetchRef = useRef(null)
  const pulseTimerRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => {
    setSaved(false)
    setSaving(false)
    setExtra(null)
    setPulse(false)
  }, [id])

  const triggerPulse = useCallback(() => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    setPulse(true)
    pulseTimerRef.current = setTimeout(() => setPulse(false), 1200)
  }, [])

  useEffect(() => {
    if (!user?.id || !id) {
      setSaved(false)
      return
    }

    const cacheKey = `${user.id}:${id}`
    const cached = savedCache.get(cacheKey)
    if (typeof cached === 'boolean') setSaved(cached)

    let cancelled = false
    ;(async () => {
      try {
        const r = await apiFetch(`my-list/check/${id}?mediaType=movie`)
        const d = await r?.json()
        const inList = Boolean(d?.inList)
        savedCache.set(cacheKey, inList)
        if (!cancelled) setSaved(inList)
      } catch (_) {}
    })()

    return () => { cancelled = true }
  }, [user?.id, id])

  useEffect(() => {
    if (!saved) return
    const el = cardRef.current
    if (!el) return

    let fired = false
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting || fired) return
        fired = true
        triggerPulse()
        obs.disconnect()
      },
      { threshold: 0.35 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [saved, triggerPulse])

  const year =
    (extra?.releaseDate || movie.releaseDate || movie.releaseYear || null)?.toString().slice(0, 4) || null

  const ratingRaw = extra?.voteAverage ?? movie.voteAverage ?? null
  const rating = typeof ratingRaw === 'number' && Number.isFinite(ratingRaw) ? ratingRaw.toFixed(1) : null

  const runtimeRaw = extra?.runtime ?? movie.runtime ?? null
  const runtimeLabel = (() => {
    const n = Number(runtimeRaw)
    if (!Number.isFinite(n) || n <= 0) return null
    const mins = n >= 600 ? Math.round(n / 60) : Math.round(n)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (!h) return `${mins}m`
    return m ? `${h}h ${m}m` : `${h}h`
  })()

  const schedulePrefetch = () => {
    if (!id || extra) return
    if (prefetchRef.current) clearTimeout(prefetchRef.current)
    prefetchRef.current = setTimeout(async () => {
      try {
        const r = await apiFetch(`movies/${id}`)
        const d = await r?.json()
        if (d) setExtra({ runtime: d.runtime, voteAverage: d.voteAverage, releaseDate: d.releaseDate })
      } catch (_) {}
    }, 250)
  }

  const cancelPrefetch = () => {
    if (prefetchRef.current) clearTimeout(prefetchRef.current)
    prefetchRef.current = null
  }

  const saveToMyList = async (e) => {
    e.stopPropagation()
    if (!user || !id || saving || saved) return
    setSaving(true)
    try {
      const r = await apiFetch('my-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: Number(id),
          mediaType: 'movie',
          title: movie.title || '',
          posterUrl: poster || '',
        }),
      })
      if (r?.ok) {
        const cacheKey = user?.id ? `${user.id}:${id}` : null
        if (cacheKey) savedCache.set(cacheKey, true)
        setSaved(true)
        triggerPulse()
      }
    } catch (_) {}
    finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={() => navigate(`/movie/${id}`)}
      onMouseEnter={() => schedulePrefetch()}
      onMouseLeave={() => {
        cancelPrefetch()
      }}
      className="group cursor-pointer"
    >
      <div
        ref={cardRef}
        className={`relative rounded-xl overflow-hidden bg-white/5 transition-all duration-300 ${
          saved ? 'border-[5px] border-yellow-400 hover:border-yellow-300' : 'border border-white/10 hover:border-yellow-400/40'
        } ${pulse ? 'ring-[6px] ring-yellow-400/25' : ''}`}
      >
        {user ? (
          <button
            type="button"
            onClick={saveToMyList}
            disabled={saving || saved}
            className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full border backdrop-blur-sm transition-all flex items-center justify-center ${
              saved
                ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400'
                : 'bg-black/60 border-white/15 text-gray-200 hover:text-white hover:border-yellow-400/40'
            } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
            aria-label={saved ? 'Saved to my list' : 'Save to my list'}
            title={saved ? 'Saved' : 'Save'}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
          </button>
        ) : null}

        {poster
          ? <img src={poster} alt={movie.title} className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-gray-600 text-xs">No Image</div>
        }

        <div className="absolute inset-0 pointer-events-none transition-opacity duration-200 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {rating ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/55 border border-white/10 px-2 py-1 text-[10px] font-black tracking-widest text-white">
                  <Star className="w-3 h-3 text-yellow-400" />
                  {rating}
                </span>
              ) : null}
              {runtimeLabel ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/55 border border-white/10 px-2 py-1 text-[10px] font-black tracking-widest text-white">
                  <Clock className="w-3 h-3 text-gray-200" />
                  {runtimeLabel}
                </span>
              ) : null}
            </div>
            {year ? (
              <span className="inline-flex items-center rounded-full bg-black/55 border border-white/10 px-2 py-1 text-[10px] font-black tracking-widest text-white">
                {year}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {showTitle && movie.title && (
        <p className="mt-1.5 line-clamp-2 text-[10px] sm:text-[11px] font-semibold text-gray-400 group-hover:text-gray-200 leading-snug tracking-tight">
          {movie.title}
        </p>
      )}
    </div>
  )
}
