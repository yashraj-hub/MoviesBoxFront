import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, Tv, BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/apiFetch'
import { useAuth } from '../context/AuthContext'
import SaveToListModal from '../components/SaveToListModal'

// ── Card ──────────────────────────────────────────────────────────────────────
function AnimGridCard({ item }) {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const isTV      = item.mediaType === 'tv'
  const id        = item.tmdbId ?? item.id
  const poster    = item.posterUrl
  const title     = item.title ?? item.name
  const year      = (item.releaseDate ?? item.firstAirDate ?? '').slice(0, 4)
  const rating    = item.voteAverage
  const mediaType = isTV ? 'tv' : 'movie'

  const [saved, setSaved]             = useState(false)
  const [saveModalOpen, setSaveModal] = useState(false)

  useEffect(() => {
    if (!user?.id || !id) return
    let cancelled = false
    apiFetch(`my-list/check/${id}?mediaType=${mediaType}`)
      .then(r => r?.json())
      .then(d => { if (!cancelled) setSaved(Boolean(d?.inList)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user?.id, id, mediaType])

  const handleSaveClick = (e) => {
    e.stopPropagation()
    if (!user) return
    setSaveModal(true)
  }

  return (
    <>
      <div
        onClick={() => navigate(isTV ? `/tv/${id}` : `/movie/${id}`)}
        className="group cursor-pointer"
      >
        <div className={`relative rounded-xl overflow-hidden bg-white/5 transition-all duration-300
          group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
          ${saved ? 'border-[3px] border-yellow-400' : 'border border-white/10 group-hover:border-yellow-400/50'}`}
        >
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

          {/* TV badge */}
          {isTV && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 border border-white/10 rounded-full px-1.5 py-0.5">
              <Tv className="w-2.5 h-2.5 text-yellow-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-yellow-400">TV</span>
            </div>
          )}

          {/* Save btn */}
          {user && (
            <button
              type="button"
              onClick={handleSaveClick}
              className={`absolute top-2 right-2 w-7 h-7 rounded-full border backdrop-blur-sm flex items-center justify-center transition-all
                ${saved
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                  : 'bg-black/60 border-white/15 text-gray-300 hover:border-yellow-400/50 hover:text-yellow-400'
                }`}
              aria-label={saved ? 'Saved' : 'Save to list'}
            >
              {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Rating */}
          {typeof rating === 'number' && rating > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 border border-white/10 rounded-full px-1.5 py-0.5">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
              <span className="text-[9px] font-black text-white">{rating.toFixed(1)}</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        <p className="mt-1.5 text-[10px] font-semibold text-gray-400 group-hover:text-white transition-colors line-clamp-1 leading-snug px-0.5">
          {title}{year ? ` (${year})` : ''}
        </p>
      </div>

      <SaveToListModal
        open={saveModalOpen}
        item={{ tmdbId: Number(id), mediaType, title: title || '', posterUrl: poster || '' }}
        onClose={() => setSaveModal(false)}
        onSaved={() => setSaved(true)}
      />
    </>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[2/3]" />
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnimationCategoryPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const sectionKey = searchParams.get('key')   || ''
  const label      = searchParams.get('label') || 'Animation'

  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [fetching,setFetching]= useState(false)
  const [bgIndex, setBgIndex] = useState(0)

  const loaderRef     = useRef(null)
  const bgTimer       = useRef(null)
  const fetchingRef   = useRef(false)
  const pageRef       = useRef(1)
  const hasMoreRef    = useRef(true)

  // ── fetch one page from backend ─────────────────────────────────────────────
  const fetchPage = useCallback(async (p) => {
    const r = await apiFetch(`animation/section/${sectionKey}?page=${p}&limit=24`)
    const d = await r?.json()
    const results = d?.results || []
    const hasMore = typeof d?.hasMore === 'boolean' ? d.hasMore : results.length === 24
    return { results, hasMore }
  }, [sectionKey])

  // ── initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sectionKey) return
    setItems([])
    setLoading(true)
    setBgIndex(0)
    pageRef.current     = 1
    hasMoreRef.current  = true
    fetchingRef.current = false
    window.scrollTo(0, 0)

    fetchPage(1)
      .then(({ results, hasMore }) => {
        setItems(results)
        hasMoreRef.current = hasMore
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sectionKey, fetchPage])

  // ── BG slideshow ────────────────────────────────────────────────────────────
  const bgItems = items.filter(i => i.backdropUrl || i.posterUrl)
  useEffect(() => {
    clearInterval(bgTimer.current)
    if (bgItems.length < 2) return
    bgTimer.current = setInterval(() => setBgIndex(i => (i + 1) % bgItems.length), 4000)
    return () => clearInterval(bgTimer.current)
  }, [bgItems.length])
  const bgUrl = bgItems[bgIndex]?.backdropUrl || bgItems[bgIndex]?.posterUrl || null

  // ── infinite scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return

    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return
      if (fetchingRef.current || !hasMoreRef.current) return

      const next = pageRef.current + 1
      fetchingRef.current = true
      setFetching(true)

      fetchPage(next)
        .then(({ results, hasMore }) => {
          setItems(prev => {
            const seen = new Set(prev.map(i => i.tmdbId ?? i.id))
            return [...prev, ...results.filter(r => !seen.has(r.tmdbId ?? r.id))]
          })
          pageRef.current    = next
          hasMoreRef.current = hasMore
        })
        .catch(() => {})
        .finally(() => {
          fetchingRef.current = false
          setFetching(false)
        })
    }, { threshold: 0.1 })

    obs.observe(el)
    return () => obs.disconnect()
  }, [fetchPage])

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24">

      {/* Hero */}
      <div className="relative h-[50vh] w-full overflow-hidden bg-black">
        <AnimatePresence mode="sync">
          {bgUrl && (
            <motion.img
              key={bgIndex}
              src={bgUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-black/30" />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-12 z-20 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="absolute inset-0 flex items-end justify-center z-10 px-4 sm:px-8 pb-10 md:pb-14">
          <h1 className="font-heading w-full max-w-4xl text-center text-white uppercase tracking-tight drop-shadow-2xl leading-[0.95] break-words text-3xl sm:text-5xl md:text-7xl lg:text-8xl">
            {label}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-12 mt-8">
        {loading ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <p className="text-gray-600 text-sm text-center pt-12">No titles found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
            {items.map((item, i) => (
              <AnimGridCard key={`${item.tmdbId ?? item.id}-${i}`} item={item} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} className="h-16 mt-6 flex items-center justify-center">
          {fetching && (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          )}
          {!loading && !fetching && !hasMoreRef.current && items.length > 0 && (
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">All caught up</p>
          )}
        </div>
      </div>
    </div>
  )
}
