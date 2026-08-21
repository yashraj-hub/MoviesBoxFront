import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, Tv, ChevronRight as ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiFetch } from '../utils/apiFetch'

// ── Card ──────────────────────────────────────────────────────────────────────
function AnimCard({ item, index }) {
  const navigate = useNavigate()
  const isTV = item.mediaType === 'tv'
  const id = item.tmdbId ?? item.id
  const poster = item.posterUrl
  const title = item.title ?? item.name
  const year = (item.releaseDate ?? item.firstAirDate ?? '').slice(0, 4)
  const rating = item.voteAverage

  const go = () => navigate(isTV ? `/tv/${id}` : `/movie/${id}`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      onClick={go}
      className="group flex-none w-[42vw] sm:w-[30vw] md:w-[200px] lg:w-[180px] xl:w-[190px] cursor-pointer snap-start"
    >
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-yellow-400/50 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Poster */}
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-gray-700 text-xs">
            No image
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* TV badge */}
        {isTV && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 border border-white/10 rounded-full px-1.5 py-0.5">
            <Tv className="w-2.5 h-2.5 text-yellow-400" />
            <span className="text-[8px] font-black uppercase tracking-widest text-yellow-400">TV</span>
          </div>
        )}

        {/* Rating */}
        {typeof rating === 'number' && rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 border border-white/10 rounded-full px-1.5 py-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            <span className="text-[9px] font-black text-white">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-[10px] font-black uppercase tracking-wide text-white line-clamp-2 leading-snug">
            {title}
          </p>
          {year && (
            <p className="text-[9px] text-gray-400 mt-0.5">{year}</p>
          )}
        </div>
      </div>

      {/* Title below card */}
      <p className="mt-1.5 text-[10px] font-semibold text-gray-400 group-hover:text-white transition-colors line-clamp-1 leading-snug px-0.5">
        {title}
      </p>
    </motion.div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function RailSkeleton() {
  return (
    <div className="flex gap-3 md:gap-4 px-4 md:px-12 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex-none w-[42vw] sm:w-[30vw] md:w-[200px] lg:w-[180px]"
        >
          <div className="w-full aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          <div className="mt-2 h-2.5 w-3/4 rounded bg-white/5 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// ── Rail ──────────────────────────────────────────────────────────────────────
export default function AnimationRail({ sectionKey, label, emoji, description, accentColor = 'yellow', id }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const scrollerRef = useRef(null)
  const loaderRef = useRef(null)

  const accent = {
    yellow: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    red: 'text-red-400 border-red-400/30 bg-red-400/10',
    blue: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    purple: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    green: 'text-green-400 border-green-400/30 bg-green-400/10',
    pink: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
    orange: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  }[accentColor] || 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'

  const accentDot = {
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    green: 'bg-green-400',
    pink: 'bg-pink-400',
    orange: 'bg-orange-400',
  }[accentColor] || 'bg-yellow-400'

  const fetchPage = useCallback(async (p) => {
    try {
      const r = await apiFetch(`animation/section/${sectionKey}?page=${p}&limit=20`)
      const d = await r?.json()
      const results = d?.results || []
      return { results, hasMore: results.length === 20 }
    } catch {
      return { results: [], hasMore: false }
    }
  }, [sectionKey])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setItems([])
    setPage(1)
    setHasMore(true)

    fetchPage(1).then(({ results, hasMore: more }) => {
      if (cancelled) return
      setItems(results)
      setHasMore(more)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [sectionKey, fetchPage])

  // Infinite scroll at end of rail
  useEffect(() => {
    const el = loaderRef.current
    if (!el || !hasMore) return

    const obs = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || loadingMore || !hasMore) return
      setLoadingMore(true)
      const next = page + 1
      const { results, hasMore: more } = await fetchPage(next)
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.tmdbId ?? i.id))
        const fresh = results.filter(r => !existingIds.has(r.tmdbId ?? r.id))
        return [...prev, ...fresh]
      })
      setPage(next)
      setHasMore(more)
      setLoadingMore(false)
    }, { threshold: 0.1 })

    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, fetchPage])

  const scroll = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector('[data-anim-card]')
    const w = (card?.getBoundingClientRect().width || 180) + 16
    el.scrollBy({ left: dir * w * 3, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <section id={id} className="mb-12 md:mb-16">
        <div className="px-4 md:px-12 mb-4 flex items-center gap-3">
          <div className="h-6 w-48 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <RailSkeleton />
      </section>
    )
  }

  if (!loading && items.length === 0) return null

  return (
    <section id={id} className="mb-12 md:mb-16">
      {/* Header */}
      <div className="px-4 md:px-12 mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(`/animation-category?key=${sectionKey}&label=${encodeURIComponent(label)}`)}
            className="group/title flex items-center gap-2.5 mb-1 text-left"
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${accentDot}`} />
            <h2 className="text-base md:text-xl font-black uppercase tracking-tight text-white group-hover/title:text-yellow-400 transition-colors duration-200">
              {label}
            </h2>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover/title:text-yellow-400 group-hover/title:translate-x-0.5 transition-all duration-200 shrink-0" />
          </button>
          {description && (
            <p className="text-[10px] md:text-[11px] text-gray-500 font-medium ml-5 tracking-wide">
              {description}
            </p>
          )}
        </div>

        {/* Scroll arrows — desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white transition flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white transition flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scroll rail */}
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex gap-3 md:gap-4 px-4 md:px-12 overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1"
        >
          {items.map((item, i) => (
            <div key={`${item.tmdbId ?? item.id}-${i}`} data-anim-card>
              <AnimCard item={item} index={i} />
            </div>
          ))}

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={loaderRef} className="flex-none w-12 flex items-center justify-center">
              {loadingMore && (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
