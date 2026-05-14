import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TOKEN_KEY = 'moviesbox_token'
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

function ContinueWatchingCard({ movie }) {
  const navigate = useNavigate()
  const img = movie.backdropPath || movie.posterPath || null
  const id = movie.tmdbId

  const fromWatchSeconds =
    typeof movie.watchSeconds === 'number' && Number.isFinite(movie.watchSeconds)
      ? Math.min(95, Math.max(10, (movie.watchSeconds / 3600) * 100))
      : null
  const progressRaw = typeof movie.progress === 'number' ? movie.progress : null
  const progress = Math.min(100, Math.max(0, fromWatchSeconds ?? progressRaw ?? 35))

  return (
    <div
      onClick={() => navigate(`/movie/${id}`)}
      className="group cursor-pointer shrink-0 w-[200px] md:w-[240px]"
    >
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-yellow-400/40 transition-all duration-300">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            movie?.onHide?.(id)
          }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
          aria-label="Remove from continue watching"
        >
          ×
        </button>
        {img ? (
          <img
            src={img}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
            No Image
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className="h-full bg-red-600" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
      
      <p className="mt-2 line-clamp-1 text-[10px] uppercase tracking-wider font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
        {movie.title}
      </p>
    </div>
  )
}

export default function ContinueWatchingRow({ title, endpoint }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem(TOKEN_KEY)

  const hideMovie = async (tmdbId) => {
    const id = Number(tmdbId)
    if (!id || Number.isNaN(id)) return
    try {
      await fetch(`${API_BASE}/continue-watching/hide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tmdbId: id }),
      })
    } finally {
      setMovies((prev) => prev.filter((m) => Number(m.tmdbId) !== id))
    }
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`${API_BASE}/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (mounted) {
          const rows = Array.isArray(d?.results) ? d.results : []
          setMovies(rows.map((m) => ({ ...m, onHide: hideMovie })))
        }
      })
      .catch(() => {
        if (mounted) setMovies([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [endpoint, token])

  if (!loading && movies.length === 0) return null

  return (
    <div className="mb-2">
      <div className="px-6 md:px-12 mb-2">
        <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-white/90">
          {title}
        </h2>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto px-6 md:px-12 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[200px] md:w-[240px] aspect-[16/9] rounded-lg bg-white/5 animate-pulse" />
            ))
          ) : (
            movies.map((m) => <ContinueWatchingCard key={m.tmdbId} movie={m} />)
          )}
        </div>
      </div>
    </div>
  )
}
