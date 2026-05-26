import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ListFilter, Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiFetch } from '../utils/apiFetch'
import TVShowCard from '../components/TVShowCard'
import { TV_CHANNELS } from '../config/tvChannels'
import { TV_SHELVES } from '../config/tvShelves'

const LIMIT = 20
const SEARCH_DEBOUNCE_MS = 350
const SORT_OPTIONS = [
  { key: 'topRated', label: 'Top Rated' },
  { key: 'latest', label: 'Latest' },
  { key: 'mostReviewed', label: 'Most Reviewed' },
]

export default function TVShelfPage() {
  const { shelfKey } = useParams()
  const navigate = useNavigate()
  const shelf = useMemo(() => TV_SHELVES.find((item) => item.key === shelfKey) || null, [shelfKey])
  const channel = useMemo(() => TV_CHANNELS.find((item) => item.key === shelfKey) || null, [shelfKey])

  const [shows, setShows] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [bgIndex, setBgIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sortKey, setSortKey] = useState('topRated')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const loaderRef = useRef(null)
  const bgTimer = useRef(null)
  const fetchingRef = useRef(false)
  const pageRef = useRef(1)
  const totalPagesRef = useRef(1)
  const activeShelfRef = useRef(null)
  const isSearching = debouncedSearch.trim().length >= 2

  const fetchShelf = useCallback(
    async (p) => {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(LIMIT),
        sort: sortKey,
      })
      const q = debouncedSearch.trim()
      if (q.length >= 2) params.set('q', q)
      return apiFetch(`tv/discover/${shelfKey}?${params.toString()}`).then((r) => r?.json())
    },
    [shelfKey, sortKey, debouncedSearch],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!shelf) return
    setShows([])
    setPage(1)
    setBgIndex(0)
    setHasMore(true)
    setLoading(true)
    pageRef.current = 1
    totalPagesRef.current = 1
    fetchingRef.current = false
    if (activeShelfRef.current !== shelfKey) {
      window.scrollTo(0, 0)
      activeShelfRef.current = shelfKey
    }

    fetchShelf(1)
      .then((data) => {
        setShows(Array.isArray(data?.results) ? data.results : [])
        setTotalPages(data?.totalPages ?? 1)
        totalPagesRef.current = data?.totalPages ?? 1
        setHasMore(data?.hasMore !== false)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fetchShelf, shelf])

  const bgShows = shows.filter((show) => show.backdropUrl || show.posterUrl)

  useEffect(() => {
    clearInterval(bgTimer.current)
    if (bgShows.length < 2) return
    bgTimer.current = setInterval(() => setBgIndex((current) => (current + 1) % bgShows.length), 4000)
    return () => clearInterval(bgTimer.current)
  }, [bgShows.length])

  const bgUrl = bgShows[bgIndex]?.backdropUrl || bgShows[bgIndex]?.posterUrl || null
  const currentTitle = shelf?.label || 'TV Shelf'

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        if (fetchingRef.current) return
        if (!hasMore) return
        if (pageRef.current >= 500) return

        const next = pageRef.current + 1
        fetchingRef.current = true
        setFetching(true)

        fetchShelf(next)
          .then((data) => {
            setShows((prev) => [...prev, ...(Array.isArray(data?.results) ? data.results : [])])
            pageRef.current = next
            totalPagesRef.current = data?.totalPages ?? totalPagesRef.current
            setPage(next)
            setTotalPages(data?.totalPages ?? totalPagesRef.current)
            setHasMore(data?.hasMore !== false)
          })
          .catch(() => {})
          .finally(() => {
            fetchingRef.current = false
            setFetching(false)
          })
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [fetchShelf, hasMore])

  if (!shelf) {
    return (
      <div className="min-h-screen pt-24 px-4 md:px-12 flex flex-col items-center justify-center text-center gap-4">
        <p className="text-gray-400 uppercase tracking-[0.3em] text-[10px] font-black">TMDB / TV</p>
        <h1 className="font-heading text-4xl md:text-6xl uppercase text-white">Unknown shelf</h1>
        <button
          type="button"
          onClick={() => navigate('/tv-shows')}
          className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-black transition hover:bg-yellow-300"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to TV Shows
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="relative h-[55vh] w-full overflow-hidden bg-black">
        <AnimatePresence mode="sync">
          {bgUrl && (
            <motion.img
              key={bgIndex}
              src={bgUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-black/40" />

        <button
          type="button"
          onClick={() => navigate('/tv-shows')}
          className="absolute top-20 left-4 md:left-12 z-20 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 backdrop-blur-sm transition-colors hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
          {channel ? (
            <img
              src={channel.logoSrc}
              alt={channel.label}
              className={`w-[min(52vw,300px)] max-h-[18vh] object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.72)] ${channel.logoClassName || ''}`}
              loading="eager"
            />
          ) : (
            <div className="w-full max-w-5xl text-center">
              <h1 className="mt-3 break-words font-heading text-3xl uppercase leading-[0.95] tracking-tight text-white drop-shadow-2xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl">
                {currentTitle}
              </h1>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-12 mt-8">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setDebouncedSearch(searchQuery.trim())
            }}
            className="relative w-full lg:max-w-md"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search ${currentTitle}`}
              className="h-12 w-full rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-11 text-sm font-semibold text-white outline-none backdrop-blur-md placeholder:text-gray-500 focus:border-yellow-400/60"
              autoComplete="off"
              spellCheck={false}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setDebouncedSearch('')
                }}
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Clear channel search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </form>

          <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-300 backdrop-blur-md">
            <ListFilter className="h-3.5 w-3.5 text-yellow-400" />
            <span>Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="max-w-[150px] bg-transparent text-[10px] font-black uppercase tracking-[0.18em] text-white outline-none"
              aria-label="Sort TV shows"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key} className="bg-[#111] text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isSearching ? (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.04] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-200/80">
              Searching {currentTitle}: <span className="text-white">"{debouncedSearch.trim()}"</span>
            </p>
            {!loading ? (
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                {shows.length} shown
              </span>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : shows.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
            {shows.map((show) => (
              <TVShowCard key={show.id} show={show} />
            ))}
          </div>
        ) : isSearching ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-yellow-400/70">
                No channel match
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
                No shows in {currentTitle} match "{debouncedSearch.trim()}". Try another title from this channel.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
            <p className="text-sm text-gray-500">No shows available for this channel.</p>
          </div>
        )}

        <div ref={loaderRef} className="mt-8 flex h-10 items-center justify-center">
          {fetching && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          )}
        </div>
      </div>
    </div>
  )
}
