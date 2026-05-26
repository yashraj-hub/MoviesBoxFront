import { useNavigate } from 'react-router-dom'
import { Play, Star } from 'lucide-react'

export default function UniverseMediaCard({ item }) {
  const navigate = useNavigate()
  const poster = item.posterPath || item.posterUrl || null
  const isMovie = item.mediaType === 'movie'
  const id = item.tmdbId || (typeof item.id === 'number' ? item.id : null)
  const title = item.title || item.name || 'Untitled'
  const year = (item.releaseDate || item.firstAirDate || '').toString().slice(0, 4) || null
  const rating = typeof item.voteAverage === 'number' ? item.voteAverage.toFixed(1) : null
  const animated = Boolean(item.isAnimated)
  const typeLabel = animated ? 'Animated' : (isMovie ? 'Movie' : 'Series')
  const tags = Array.isArray(item.sourceLabels) ? item.sourceLabels.slice(0, 2) : []
  const comingSoon = item.unresolved || (!year && !poster)
  const featured = Boolean(item.featured)

  const go = () => {
    if (!id) return
    navigate(isMovie ? `/movie/${id}` : `/tv/${id}`)
  }

  return (
    <button
      type="button"
      onClick={go}
      className={`group relative select-none text-left transition-transform duration-300 ${id ? 'hover:-translate-y-1' : ''}`}
    >
      <div className={`relative overflow-hidden rounded-2xl border bg-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${
        featured ? 'border-yellow-400/30 group-hover:border-yellow-400/50' : 'border-white/10 group-hover:border-white/20'
      }`}>
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center bg-white/5 text-[10px] text-gray-600">
            No image
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm">
          <Play className="h-3 w-3 text-yellow-400" />
          {typeLabel}
        </div>

        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm">
          <Star className="h-3 w-3 text-yellow-400" />
          {rating || '0.0'}
        </div>

        <div className="absolute left-2 bottom-14 z-10 flex items-center gap-2">
          {featured ? (
            <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-yellow-300 backdrop-blur-sm">
              Featured
            </span>
          ) : null}
          {comingSoon ? (
            <span className="rounded-full border border-white/10 bg-black/65 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              Coming soon
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="line-clamp-2 text-[11px] font-black uppercase tracking-[0.14em] text-white">
                {title}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {year ? (
                  <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-gray-200">
                    {year}
                  </span>
                ) : null}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
