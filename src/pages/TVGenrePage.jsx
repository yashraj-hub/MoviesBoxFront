import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/apiFetch'
import TVShowCard from '../components/TVShowCard'

export default function TVGenrePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const genreId = searchParams.get('id')
  const genreName = searchParams.get('name') || 'TV Genre'

  const [shows, setShows] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [bgIndex, setBgIndex] = useState(0)
  const loaderRef = useRef(null)
  const bgTimer = useRef(null)
  const fetchingRef = useRef(false)
  const pageRef = useRef(1)
  const totalPagesRef = useRef(1)

  const fetchShows = useCallback(
    async (p) => apiFetch(`tv/genre/${genreId}/shows?page=${p}&limit=20`).then((r) => r?.json()),
    [genreId],
  )

  useEffect(() => {
    if (!genreId) return
    setShows([])
    setPage(1)
    setBgIndex(0)
    setLoading(true)
    pageRef.current = 1
    totalPagesRef.current = 1
    fetchingRef.current = false
    window.scrollTo(0, 0)
    fetchShows(1)
      .then((data) => {
        setShows(data?.results || [])
        setTotalPages(data?.totalPages ?? 1)
        totalPagesRef.current = data?.totalPages ?? 1
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [genreId, fetchShows])

  const bgShows = shows.filter((show) => show.backdropUrl || show.posterUrl)

  useEffect(() => {
    clearInterval(bgTimer.current)
    if (bgShows.length < 2) return
    bgTimer.current = setInterval(() => setBgIndex((i) => (i + 1) % bgShows.length), 4000)
    return () => clearInterval(bgTimer.current)
  }, [bgShows.length])

  const bgUrl = bgShows[bgIndex]?.backdropUrl || bgShows[bgIndex]?.posterUrl || null

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        if (fetchingRef.current) return
        if (pageRef.current >= totalPagesRef.current) return

        const next = pageRef.current + 1
        fetchingRef.current = true
        setFetching(true)
        fetchShows(next)
          .then((data) => {
            setShows((prev) => [...prev, ...(data?.results || [])])
            pageRef.current = next
            totalPagesRef.current = data?.totalPages ?? totalPagesRef.current
            setPage(next)
            setTotalPages(data?.totalPages ?? totalPagesRef.current)
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
  }, [fetchShows])

  if (!genreId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 pt-24">
        Missing TV genre
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
              className="absolute inset-0 w-full h-full object-cover object-center"
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
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-12 z-20 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="absolute inset-0 flex items-end justify-center z-10 px-4 sm:px-8 pb-10 sm:pb-14 md:pb-16">
          <h1 className="font-heading w-full max-w-4xl text-center text-white uppercase tracking-tight drop-shadow-2xl leading-[0.95] break-words text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl">
            {genreName}
          </h1>
        </div>
      </div>

      <div className="px-4 md:px-12 mt-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[2/3]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
            {shows.map((show) => (
              <TVShowCard key={show.id} show={show} />
            ))}
          </div>
        )}

        <div ref={loaderRef} className="h-10 mt-8 flex items-center justify-center">
          {fetching && <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
        </div>
      </div>
    </div>
  )
}
