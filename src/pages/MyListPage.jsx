import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Trash2, ChevronLeft } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'

export default function MyListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    apiFetch('my-list')
      .then((r) => (r ? r.json() : null))
      .then((d) => setItems(Array.isArray(d?.items) ? d.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (tmdbId, mediaType = 'movie') => {
    const r = await apiFetch(`my-list/${tmdbId}?mediaType=${encodeURIComponent(mediaType)}`, { method: 'DELETE' })
    if (r?.ok) setItems((prev) => prev.filter((x) => !(x.tmdbId === tmdbId && (x.mediaType || 'movie') === mediaType)))
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-12">
      <div className="mb-8 md:mb-10 flex flex-wrap items-center gap-x-3 gap-y-2 md:gap-x-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          title="Go back"
          aria-label="Go back"
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:border-yellow-400/40 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="min-w-0 flex-1 font-heading text-3xl md:text-4xl leading-none text-yellow-400 uppercase tracking-tight m-0">
          My list
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center max-w-lg mx-auto">
          <Bookmark className="w-12 h-12 text-yellow-400/40 mx-auto mb-4" />
          <p className="text-gray-400 text-sm leading-relaxed">
            Nothing here yet. Open any title and tap <span className="text-yellow-400 font-semibold">Save to my list</span> to build your collection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {items.map((m) => (
            <div key={m.tmdbId} className="group relative">
              <button
                type="button"
                onClick={() => remove(m.tmdbId, m.mediaType || 'movie')}
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 border border-white/15 text-gray-300 hover:text-red-400 hover:border-red-400/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove from list"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate((m.mediaType || 'movie') === 'tv' ? `/tv/${m.tmdbId}` : `/movie/${m.tmdbId}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate((m.mediaType || 'movie') === 'tv' ? `/tv/${m.tmdbId}` : `/movie/${m.tmdbId}`)
                }}
                className="cursor-pointer"
              >
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-yellow-400/40 transition-all duration-300">
                  {m.posterUrl ? (
                    <img src={m.posterUrl} alt={m.title} className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-gray-600 text-xs font-bold text-center px-2">{m.title}</div>
                  )}
                </div>
                <p className="mt-2 text-[12px] font-bold text-white truncate px-0.5">{m.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
