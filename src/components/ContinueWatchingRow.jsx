import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/apiFetch'

function ContinueWatchingCard({ item }) {
  const navigate = useNavigate()
  const img = item.backdropPath || item.posterPath || null
  const isTV = item.mediaType === 'tv'

  const fromWatchSeconds =
    typeof item.watchSeconds === 'number' && Number.isFinite(item.watchSeconds)
      ? Math.min(95, Math.max(10, (item.watchSeconds / 3600) * 100))
      : null
  const progress = Math.min(100, Math.max(0, fromWatchSeconds ?? 35))

  const handleClick = () => {
    if (isTV) navigate(`/tv/${item.tmdbId}`)
    else navigate(`/movie/${item.tmdbId}`)
  }

  return (
    <div onClick={handleClick} className="group cursor-pointer shrink-0 w-[200px] md:w-[240px]">
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-yellow-400/40 transition-all duration-300">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); item?.onHide?.(item.tmdbId) }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
          aria-label="Remove from continue watching"
        >
          ×
        </button>

        {/* TV badge */}
        {isTV && (
          <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-yellow-400/90 text-black text-[8px] font-black uppercase tracking-widest">
            TV
          </div>
        )}

        {img ? (
          <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
        )}

        {/* Season/Episode badge for TV */}
        {isTV && item.season && item.episode && (
          <div className="absolute bottom-3 left-2 z-10 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-black uppercase tracking-widest">
            S{String(item.season).padStart(2,'0')} E{String(item.episode).padStart(2,'0')}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-red-600" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-[10px] uppercase tracking-wider font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
        {item.title}
      </p>
    </div>
  )
}

export default function ContinueWatchingRow({ title, endpoint }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const hideItem = async (tmdbId) => {
    const id = Number(tmdbId)
    if (!id || Number.isNaN(id)) return
    try {
      await apiFetch('continue-watching/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId: id }),
      })
    } finally {
      setItems(prev => prev.filter(m => Number(m.tmdbId) !== id))
    }
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiFetch(endpoint)
      .then(r => r?.json())
      .then(d => {
        if (mounted) {
          const rows = Array.isArray(d?.results) ? d.results : []
          setItems(rows.map(m => ({ ...m, onHide: hideItem })))
        }
      })
      .catch(() => { if (mounted) setItems([]) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [endpoint])

  if (!loading && items.length === 0) return null

  return (
    <div className="mb-2">
      <div className="px-6 md:px-12 mb-2">
        <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-white/90">{title}</h2>
      </div>
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto px-6 md:px-12 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[200px] md:w-[240px] aspect-[16/9] rounded-lg bg-white/5 animate-pulse" />
              ))
            : items.map(m => <ContinueWatchingCard key={m.tmdbId} item={m} />)
          }
        </div>
      </div>
    </div>
  )
}
