import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/apiFetch'
import MovieCard from '../components/MovieCard'

export default function GenrePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const genreId = searchParams.get('id')
  const slug = searchParams.get('slug')
  const genreName = searchParams.get('name') || 'Genre'
  const zone = searchParams.get('zone') || 'hollywood'

  const [movies, setMovies] = useState([])
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

  const fetchMovies = useCallback(async (p) => {
    const url = slug
      ? `categories/${slug}/movies?page=${p}`
      : `genre/${genreId}/movies?page=${p}&zone=${zone}`
    return apiFetch(url).then(r => r?.json())
  }, [genreId, slug, zone])

  useEffect(() => {
    if (!genreId && !slug) return
    setMovies([])
    setPage(1)
    setBgIndex(0)
    setLoading(true)
    pageRef.current = 1
    totalPagesRef.current = 1
    fetchingRef.current = false
    window.scrollTo(0, 0)
    fetchMovies(1).then(d => {
      setMovies(d.results || [])
      setTotalPages(d.totalPages ?? 1)
      totalPagesRef.current = d.totalPages ?? 1
    }).catch(() => {}).finally(() => setLoading(false))
  }, [genreId, slug, zone, fetchMovies])

  // BG slideshow
  const bgMovies = movies.filter(m => m.backdropPath || m.posterPath)
  useEffect(() => {
    clearInterval(bgTimer.current)
    if (bgMovies.length < 2) return
    bgTimer.current = setInterval(() => setBgIndex(i => (i + 1) % bgMovies.length), 4000)
    return () => clearInterval(bgTimer.current)
  }, [bgMovies.length])

  const bgUrl = bgMovies[bgIndex]?.backdropPath || bgMovies[bgIndex]?.posterPath || null

  // Infinite scroll — refs use karo taaki observer baar baar reconnect na ho
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return
      if (fetchingRef.current) return
      if (pageRef.current >= totalPagesRef.current) return

      const next = pageRef.current + 1
      fetchingRef.current = true
      setFetching(true)
      fetchMovies(next).then(d => {
        setMovies(prev => [...prev, ...(d.results || [])])
        pageRef.current = next
        totalPagesRef.current = d.totalPages ?? totalPagesRef.current
        setPage(next)
        setTotalPages(d.totalPages ?? totalPagesRef.current)
      }).catch(() => {}).finally(() => {
        fetchingRef.current = false
        setFetching(false)
      })
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [fetchMovies])

  return (
    <div className="min-h-screen pb-24">

      {/* Hero header with bg slideshow */}
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
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-black/40" />

        {/* Back btn */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-12 z-20 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Centered title — mobile pe readable size + wrap */}
        <div className="absolute inset-0 flex items-end justify-center z-10 px-4 sm:px-8 pb-10 sm:pb-14 md:pb-16">
          <h1 className="font-heading w-full max-w-4xl text-center text-white uppercase tracking-tight drop-shadow-2xl leading-[0.95] break-words text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl">
            {genreName}
          </h1>
        </div>
      </div>

      {/* Movies grid */}
      <div className="px-4 md:px-12 mt-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[2/3]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
            {movies.map(m => (
              <MovieCard key={m.tmdbId || m.id} movie={m} />
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
