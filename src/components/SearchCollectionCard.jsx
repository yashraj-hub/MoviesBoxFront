import { useNavigate } from 'react-router-dom'

export default function SearchCollectionCard({ movie, partNumber }) {
  const navigate = useNavigate()
  const poster = movie.posterPath || movie.posterUrl || null
  const id = movie.tmdbId || movie.id
  const year = (movie.releaseDate || '').trim().slice(0, 4) || null
  const type = (movie.mediaType || 'movie').toLowerCase()

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/movie/${id}`) }}
      onClick={() => navigate(`/movie/${id}`)}
      className="w-[118px] sm:w-[132px] md:w-[142px] shrink-0 snap-start cursor-pointer group select-none"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg transition-all duration-300 group-hover:border-yellow-400/50">
        {partNumber != null && (
          <span className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-black text-black shadow-md ring-2 ring-black/40">
            {partNumber}
          </span>
        )}
        <span className="absolute right-2 top-2 z-10 rounded border border-white/15 bg-black/65 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/90 backdrop-blur-sm">
          {type}
        </span>
        {poster ? (
          <img
            src={poster}
            alt={movie.title || ''}
            className="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center bg-white/5 text-[10px] text-gray-600">No image</div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-[10px] font-semibold leading-snug text-gray-100 group-hover:text-white sm:text-[11px]">
        {movie.title}
      </p>
      {year && <p className="text-[10px] text-gray-500">{year}</p>}
    </div>
  )
}
